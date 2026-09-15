// Recriação em CSS/SVG da marca Contattos+ (texto laranja em degradê, itálico e
// condensado, com o raio vermelho no lugar do "N" e o "+" vermelho ao final) —
// não depende de um arquivo de imagem, então escala bem em qualquer tamanho.
const SIZES = {
  sm: { text: "text-base", bolt: "h-4", plus: "text-lg" },
  md: { text: "text-2xl", bolt: "h-6", plus: "text-2xl" },
  lg: { text: "text-4xl", bolt: "h-10", plus: "text-4xl" },
};

const gradientStyle = {
  backgroundImage: "linear-gradient(160deg, #FBAE17 0%, #F7941D 45%, #ED1C24 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export default function ContattosLogo({ size = "md", className = "" }) {
  const s = SIZES[size] || SIZES.md;

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className={`font-black italic tracking-tighter ${s.text}`} style={gradientStyle}>
        CO
      </span>
      <svg viewBox="0 0 22 40" className={`${s.bolt} w-auto -mx-[2px]`} aria-hidden="true">
        <polygon points="17,0 3,22 11,22 1,40 21,15 12,15" fill="#ED1C24" />
      </svg>
      <span className={`font-black italic tracking-tighter ${s.text}`} style={gradientStyle}>
        TATTOS
      </span>
      <span className={`font-black ${s.plus} text-brand-red`}>+</span>
    </div>
  );
}
