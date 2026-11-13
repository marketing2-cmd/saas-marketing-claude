// Integração com a Meta (Instagram Graph API via Facebook Login).
// Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export const META_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
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
  throw new MetaError("O Instagram ainda está processando o vídeo. Nova tentativa no próximo ciclo.", { retryable: true });
}

function mediaParams(item, extra = {}) {
  return item.type === "video" ? { video_url: item.url, ...extra } : { image_url: item.url, ...extra };
}

// Publica um post no Instagram. Retorna o ID da mídia publicada.
export async function publishToInstagram({ igUserId, token, post }) {
  const media = post.media || [];
  if (!media.length) throw new MetaError("O post não tem imagem ou vídeo — o Instagram exige mídia.");
  if ((post.caption || "").length > 2200) throw new MetaError("A legenda passa de 2.200 caracteres.");

  let creationId;

  if (post.format === "story") {
    const item = media[0];
    const res = await graph(`${igUserId}/media`, {
      method: "POST",
      params: { ...mediaParams(item), media_type: "STORIES", access_token: token },
    });
    creationId = res.id;
  } else if (media.length > 1 || post.format === "carousel") {
    if (media.length < 2) throw new MetaError("Carrossel precisa de pelo menos 2 mídias.");
    if (media.length > 10) throw new MetaError("Carrossel aceita no máximo 10 mídias.");
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
  } else {
    const item = media[0];
    const params = item.type === "video" || post.format === "reels"
      ? { media_type: "REELS", video_url: item.url, caption: post.caption || "", access_token: token }
      : { image_url: item.url, caption: post.caption || "", access_token: token };
    const res = await graph(`${igUserId}/media`, { method: "POST", params });
    creationId = res.id;
  }

  await waitUntilReady(creationId, token);
  const published = await graph(`${igUserId}/media_publish`, {
    method: "POST",
    params: { creation_id: creationId, access_token: token },
  });
  return published.id;
}
