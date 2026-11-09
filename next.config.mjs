/** @type {import('next').NextConfig} */
const nextConfig = {
  // Módulo Verbas: página estática gerada por scripts/build-verbas.mjs.
  // O middleware continua exigindo login e aprovação antes de servi-la.
  async rewrites() {
    return [{ source: "/verbas", destination: "/verbas.html" }];
  },
};

export default nextConfig;
