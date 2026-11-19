// Integração com a Meta (Instagram Graph API via Facebook Login).
// Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing

import { validatePost } from "./formats";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v27.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export const META_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

export function metaRedirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback`;
}

export function metaAuthUrl(state) {
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", process.env.META_APP_ID);
  url.searchParams.set("redirect_uri", metaRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("scope", META_SCOPES);
  url.searchParams.set("response_type", "code");
  // Pede de novo permissões negadas ou novas (ex.: instagram_manage_insights ao reconectar)
  url.searchParams.set("auth_type", "rerequest");
  return url.toString();
}

export class MetaError extends Error {
  constructor(message, { retryable = false } = {}) {
    super(message);
    this.retryable = retryable;
  }
}

async function graph(path, { method = "GET", params = {} } = {}) {
  const url = new URL(`${GRAPH}/${path.replace(/^\//, "")}`);
  const init = { method };
  if (method === "GET") {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  } else {
    init.body = new URLSearchParams(params);
  }
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const err = json.error || {};
    // Códigos transitórios da Graph API: 1, 2, 4, 17, 341, 9007 (mídia não pronta)
    const retryable = [1, 2, 4, 17, 341, 9007].includes(err.code) || res.status >= 500;
    throw new MetaError(err.error_user_msg || err.message || `Erro ${res.status} na API da Meta`, { retryable });
  }
  return json;
}

// ── OAuth ────────────────────────────────────────────────────

export async function exchangeCodeForLongLivedToken(code) {
  const short = await graph("oauth/access_token", {
    params: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: metaRedirectUri(),
      code,
    },
  });
  const long = await graph("oauth/access_token", {
    params: {
      grant_type: "fb_exchange_token",
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: short.access_token,
    },
  });
  return long.access_token;
}

// Páginas do usuário que têm conta profissional do Instagram vinculada.
// O token de Página obtido a partir de um token de usuário de longa duração não expira.
export async function listInstagramAccounts(userToken) {
  const res = await graph("me/accounts", {
    params: {
      fields: "id,name,access_token,instagram_business_account{id,username}",
      limit: "100",
      access_token: userToken,
    },
  });
  return (res.data || [])
    .filter((p) => p.instagram_business_account)
    .map((p) => ({
      page_id: p.id,
      page_name: p.name,
      page_token: p.access_token,
      ig_user_id: p.instagram_business_account.id,
      username: p.instagram_business_account.username,
    }));
}

// ── Publicação ───────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitUntilReady(containerId, token, timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { status_code } = await graph(containerId, { params: { fields: "status_code", access_token: token } });
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new MetaError("O Instagram não conseguiu processar a mídia (formato, tamanho ou duração inválidos).");
    }
    await sleep(3000);
  }
  const e = new MetaError("O Instagram ainda está processando o vídeo. A publicação continua no próximo minuto.", { retryable: true });
  e.processing = true;
  throw e;
}

function mediaParams(item, extra = {}) {
  return item.type === "video" ? { video_url: item.url, ...extra } : { image_url: item.url, ...extra };
}

// Publica um post no Instagram e retorna o ID da mídia publicada.
// containerId: container criado numa execução anterior que ainda estava
// processando (vídeo) — a publicação continua dele em vez de recriar.
// onContainer(id): chamado assim que o container é criado, para salvar.
export async function publishToInstagram({ igUserId, token, post, containerId = null, onContainer }) {
  const errors = validatePost(post).filter((p) => p.level === "error");
  if (errors.length) throw new MetaError(errors[0].msg);
  const media = post.media || [];
  let creationId = containerId;

  if (!creationId) {
    if (post.format === "story") {
      const res = await graph(`${igUserId}/media`, {
        method: "POST",
        params: { ...mediaParams(media[0]), media_type: "STORIES", access_token: token },
      });
      creationId = res.id;
    } else if (media.length > 1 || post.format === "carousel") {
      const children = [];
      for (const item of media) {
        const params = item.type === "video"
          ? { media_type: "VIDEO", video_url: item.url, is_carousel_item: "true", access_token: token }
          : { image_url: item.url, is_carousel_item: "true", access_token: token };
        const child = await graph(`${igUserId}/media`, { method: "POST", params });
        children.push(child.id);
      }
      for (const id of children) await waitUntilReady(id, token);
      const res = await graph(`${igUserId}/media`, {
        method: "POST",
        params: { media_type: "CAROUSEL", children: children.join(","), caption: post.caption || "", access_token: token },
      });
      creationId = res.id;
    } else if (post.format === "reels" || media[0].type === "video") {
      const params = {
        media_type: "REELS",
        video_url: media[0].url,
        caption: post.caption || "",
        share_to_feed: post.reels_share_to_feed === false ? "false" : "true",
        access_token: token,
      };
      if (post.reels_cover?.url) params.cover_url = post.reels_cover.url;
      const res = await graph(`${igUserId}/media`, { method: "POST", params });
      creationId = res.id;
    } else {
      const res = await graph(`${igUserId}/media`, {
        method: "POST",
        params: { image_url: media[0].url, caption: post.caption || "", access_token: token },
      });
      creationId = res.id;
    }
    if (onContainer) await onContainer(creationId);
  }

  await waitUntilReady(creationId, token);
  const published = await graph(`${igUserId}/media_publish`, {
    method: "POST",
    params: { creation_id: creationId, access_token: token },
  });
  return published.id;
}

// ── Relatórios (Insights) ────────────────────────────────────
// Docs: https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights

const DAY = 86400;
const MAX_WINDOW = 30 * DAY; // a API aceita no máximo 30 dias por chamada

// Métricas de conta com valor total no período (metric_type=total_value)
export const ACCOUNT_TOTAL_METRICS = [
  "reach",
  "views",
  "accounts_engaged",
  "total_interactions",
  "likes",
  "comments",
  "shares",
  "saves",
  "profile_views",
  "profile_links_taps",
];

function windows(since, until) {
  const out = [];
  for (let start = since; start < until; start += MAX_WINDOW) {
    out.push([start, Math.min(start + MAX_WINDOW, until)]);
  }
  return out;
}

async function totalFor(igUserId, token, metric, since, until) {
  let sum = 0;
  for (const [s, u] of windows(since, until)) {
    const res = await graph(`${igUserId}/insights`, {
      params: { metric, period: "day", metric_type: "total_value", since: String(s), until: String(u), access_token: token },
    });
    sum += res.data?.[0]?.total_value?.value || 0;
  }
  return sum;
}

async function followsFor(igUserId, token, since, until) {
  const out = { follows: 0, unfollows: 0 };
  for (const [s, u] of windows(since, until)) {
    const res = await graph(`${igUserId}/insights`, {
      params: {
        metric: "follows_and_unfollows",
        period: "day",
        metric_type: "total_value",
        breakdown: "follow_type",
        since: String(s),
        until: String(u),
        access_token: token,
      },
    });
    const results = res.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];
    for (const r of results) {
      if (r.dimension_values?.[0] === "FOLLOWER") out.follows += r.value || 0;
      if (r.dimension_values?.[0] === "NON_FOLLOWER") out.unfollows += r.value || 0;
    }
  }
  return out;
}

async function reachSeries(igUserId, token, since, until) {
  const points = [];
  for (const [s, u] of windows(since, until)) {
    const res = await graph(`${igUserId}/insights`, {
      params: { metric: "reach", period: "day", since: String(s), until: String(u), access_token: token },
    });
    for (const v of res.data?.[0]?.values || []) {
      // end_time marca o fim do dia → o dia medido é o anterior
      const end = new Date(v.end_time);
      const day = new Date(end.getTime() - DAY * 1000).toISOString().slice(0, 10);
      points.push({ date: day, value: v.value || 0 });
    }
  }
  return points;
}

async function settle(fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function mediaInRange(igUserId, token, since, until) {
  const fields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  const list = [];
  let next = null;
  for (let page = 0; page < 4; page++) {
    const res = next
      ? await fetch(next).then((r) => r.json())
      : await graph(`${igUserId}/media`, {
          params: { fields, limit: "50", since: String(since), until: String(until), access_token: token },
        });
    if (res.error) throw new MetaError(res.error.message);
    for (const m of res.data || []) {
      const ts = new Date(m.timestamp).getTime() / 1000;
      if (ts >= since && ts < until) list.push(m);
    }
    const last = res.data?.[res.data.length - 1];
    next = res.paging?.next;
    if (!next || !last || new Date(last.timestamp).getTime() / 1000 < since) break;
  }
  return list.slice(0, 60);
}

async function mediaInsights(mediaId, token) {
  const tries = ["reach,saved,shares,total_interactions,views", "reach,saved,total_interactions"];
  for (const metric of tries) {
    try {
      const res = await graph(`${mediaId}/insights`, { params: { metric, access_token: token } });
      return Object.fromEntries((res.data || []).map((d) => [d.name, d.values?.[0]?.value ?? d.total_value?.value ?? 0]));
    } catch {
      // tenta o conjunto menor de métricas
    }
  }
  return {};
}

// Relatório completo do período [since, until) — timestamps em segundos
export async function getInstagramReport({ igUserId, token, since, until }) {
  const length = until - since;
  const prevSince = since - length;

  const profile = await graph(igUserId, {
    params: { fields: "username,name,profile_picture_url,followers_count,follows_count,media_count", access_token: token },
  });

  const [current, previous, follows, prevFollows, series, media] = await Promise.all([
    Promise.all(ACCOUNT_TOTAL_METRICS.map((m) => settle(() => totalFor(igUserId, token, m, since, until)))),
    Promise.all(ACCOUNT_TOTAL_METRICS.map((m) => settle(() => totalFor(igUserId, token, m, prevSince, since)))),
    settle(() => followsFor(igUserId, token, since, until)),
    settle(() => followsFor(igUserId, token, prevSince, since)),
    settle(() => reachSeries(igUserId, token, since, until)),
    settle(() => mediaInRange(igUserId, token, since, until)),
  ]);

  const totals = {};
  const unavailable = [];
  ACCOUNT_TOTAL_METRICS.forEach((m, i) => {
    if (current[i].ok) totals[m] = { value: current[i].value, previous: previous[i].ok ? previous[i].value : null };
    else unavailable.push(m);
  });
  if (follows.ok) {
    totals.follows = { value: follows.value.follows, previous: prevFollows.ok ? prevFollows.value.follows : null };
    totals.unfollows = { value: follows.value.unfollows, previous: prevFollows.ok ? prevFollows.value.unfollows : null };
  } else {
    unavailable.push("follows");
  }

  // Sem nenhuma métrica: quase sempre falta a permissão instagram_manage_insights
  if (!Object.keys(totals).length) {
    throw new MetaError(
      `O Instagram não liberou os dados de insights (${current[0].error}). Reconecte o Instagram do cliente para conceder a permissão de relatórios.`
    );
  }

  const posts = media.ok
    ? await mapLimit(media.value, 5, async (m) => {
        const ins = await mediaInsights(m.id, token);
        return {
          id: m.id,
          caption: m.caption || "",
          type: m.media_product_type === "REELS" ? "reels" : m.media_type === "CAROUSEL_ALBUM" ? "carousel" : m.media_type === "VIDEO" ? "video" : "image",
          thumb: m.thumbnail_url || m.media_url || null,
          permalink: m.permalink,
          timestamp: m.timestamp,
          likes: m.like_count ?? 0,
          comments: m.comments_count ?? 0,
          reach: ins.reach ?? null,
          saves: ins.saved ?? null,
          shares: ins.shares ?? null,
          views: ins.views ?? null,
          interactions: ins.total_interactions ?? null,
        };
      })
    : [];

  return {
    account: {
      username: profile.username,
      name: profile.name,
      picture: profile.profile_picture_url || null,
      followers: profile.followers_count ?? null,
      following: profile.follows_count ?? null,
      mediaCount: profile.media_count ?? null,
    },
    totals,
    unavailable,
    series: { reach: series.ok ? series.value : [] },
    posts,
  };
}
