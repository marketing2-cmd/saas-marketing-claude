// O Cloud Storage do Firebase passou a exigir o plano pago (Blaze) mesmo para
// uso dentro da cota gratuita. Para manter o projeto 100% no plano gratuito
// (Spark), a foto da nota fiscal é comprimida no navegador e guardada como
// base64 dentro do próprio documento no Firestore (que tem limite de ~1MiB
// por documento).
const LIMITE_BYTES = 700_000;

function carregarImagem(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function desenharEmCanvas(img, maxLado) {
  const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
  const width = Math.round(img.width * escala);
  const height = Math.round(img.height * escala);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  return canvas;
}

export async function comprimirImagemParaBase64(file) {
  const img = await carregarImagem(file);

  for (const [maxLado, qualidade] of [
    [1280, 0.7],
    [1024, 0.55],
    [800, 0.4],
    [640, 0.3],
  ]) {
    const canvas = desenharEmCanvas(img, maxLado);
    const dataUrl = canvas.toDataURL('image/jpeg', qualidade);
    if (dataUrl.length <= LIMITE_BYTES) return dataUrl;
  }

  throw new Error('A foto ficou grande demais mesmo comprimida. Tente uma foto mais simples da nota fiscal.');
}
