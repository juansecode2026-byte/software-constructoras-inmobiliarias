import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // El bucket admite archivos de hasta 5 MB; el limite aplica al body crudo
      // (multipart agrega unos KB de overhead), por eso se deja margen.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
