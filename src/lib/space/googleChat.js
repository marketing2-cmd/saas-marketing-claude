// Integração com o Google Chat (somente servidor).
//
//  Envio (SpaceMais → Google Chat): webhook de entrada do espaço do Google Chat.
//  Recebimento (Google Chat → SpaceMais): um "Chat app" configurado com
//  "HTTP endpoint" apontando para /api/space/google-chat/events. O Google assina
//  cada chamada com um JWT (Authorization: Bearer …), verificado aqui.

import { createRemoteJWKSet, jwtVerify } from "jose";

const CHAT_ISSUER = "chat@system.gserviceaccount.com";
// Formato "Project number" (padrão do Chat app): JWT emitido pela conta do Chat.
const chatJwks = createRemoteJWKSet(new URL(`https://www.googleapis.com/service_accounts/v1/jwk/${CHAT_ISSUER}`));
// Formato "HTTP endpoint URL": ID token OIDC do Google em nome da conta do Chat.
const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function isGoogleChatWebhookUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "chat.googleapis.com" && u.pathname.startsWith("/v1/spaces/");
  } catch {
    return false;
  }
}

export async function postToGoogleChat(webhookUrl, text) {
  if (!isGoogleChatWebhookUrl(webhookUrl)) throw new Error("URL de webhook do Google Chat inválida.");
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Google Chat respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function verifyGoogleChatRequest(request) {
  const audience = process.env.GOOGLE_CHAT_AUDIENCE;
  if (!audience) throw new Error("GOOGLE_CHAT_AUDIENCE não configurado.");
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("Requisição sem token.");

  try {
    await jwtVerify(token, chatJwks, { issuer: CHAT_ISSUER, audience });
    return;
  } catch {}
  const { payload } = await jwtVerify(token, googleJwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience,
  });
  if (payload.email !== CHAT_ISSUER || payload.email_verified === false) throw new Error("Token não é do Google Chat.");
}

// Normaliza os dois formatos de evento (Chat app clássico e Workspace add-on).
export function parseChatEvent(body) {
  const payload = body?.chat?.messagePayload;
  if (payload) {
    return { type: "MESSAGE", message: payload.message, space: payload.space || payload.message?.space, user: body.chat.user };
  }
  return { type: body?.type, message: body?.message, space: body?.space || body?.message?.space, user: body?.user };
}
