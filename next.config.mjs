/** @type {import('next').NextConfig} */
const nextConfig = {
  // Módulo Verbas: página estática gerada por scripts/build-verbas.mjs.
  // O middleware continua exigindo login e aprovação antes de servi-la.
  async rewrites() {
    return [{ source: "/verbas", destination: "/verbas.html" }];
  },
  // No endereço próprio do Verbas, a raiz abre direto o módulo.
  async redirects() {
    return [
      { source: "/", has: [{ type: "host", value: "verbas-contattos.vercel.app" }], destination: "/verbas", permanent: false },
    ];
  },
};

export default nextConfig;
