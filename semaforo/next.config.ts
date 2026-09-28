import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // imagem pequena e sem node_modules completo, para auto-hospedagem
  output: 'standalone',
  /* config options here */
};

export default nextConfig;
