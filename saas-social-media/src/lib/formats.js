// Regras de cada formato do Instagram (usadas no editor e na publicação)

export const FORMAT_RULES = {
  feed: "1 imagem (JPG/PNG). Ideal 1080×1350 (4:5).",
  carousel: "De 2 a 10 imagens ou vídeos, na ordem em que aparecem.",
  reels: "1 vídeo MP4/MOV vertical 9:16 (1080×1920). Até 15 min; recomendado até 90 s.",
  story: "1 imagem ou vídeo vertical 9:16 (1080×1920). Vídeo até 60 s.",
};

const hashtagCount = (t) => (t.match(/#[\p{L}\d_]+/gu) || []).length;

// Lista de problemas: { level: "error" | "warn", msg }
export function validatePost(post) {
  const media = post.media || [];
  const videos = media.filter((m) => m.type === "video").length;
  const caption = post.caption || "";
  const out = [];
  const err = (msg) => out.push({ level: "error", msg });
  const warn = (msg) => out.push({ level: "warn", msg });

  if (!media.length) err("Adicione a mídia antes de agendar — o Instagram exige imagem ou vídeo.");

  if (post.format === "reels") {
    if (media.length && videos === 0) err("Reels precisa de um vídeo. Envie um MP4 ou MOV.");
    if (media.length > 1) err("Reels aceita só 1 vídeo. Remova as outras mídias.");
  } else if (post.format === "story") {
    if (media.length > 1) err("Story publica 1 mídia por vez. Crie um Story para cada imagem ou vídeo.");
    if (caption.trim()) warn("Stories não têm legenda no Instagram — o texto da legenda não aparece. Coloque o texto na arte.");
    warn("Links, enquetes e figurinhas não podem ser adicionados pela publicação automática.");
  } else if (post.format === "carousel") {
    if (media.length === 1) err("Carrossel precisa de pelo menos 2 mídias.");
    if (media.length > 10) err("Carrossel aceita no máximo 10 mídias.");
  } else {
    if (media.length > 1) warn("Com mais de uma mídia o post vira carrossel.");
    if (videos && media.length === 1) warn("Vídeo no feed é publicado como Reels. Considere escolher o formato Reels.");
  }

  if (post.format !== "story") {
    if (caption.length > 2200) err("A legenda passa de 2.200 caracteres.");
    if (hashtagCount(caption) > 30) err("O Instagram aceita no máximo 30 hashtags.");
  }
  return out;
}
