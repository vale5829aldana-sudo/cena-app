import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Usamos el modelo de renderizado clásico (dinámico por request).
  // La app es altamente dinámica (sesiones, base de datos, sondeo), por lo que
  // no adoptamos Cache Components en esta versión.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Las imágenes del menú se suben desde el panel administrativo por Server Actions.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
