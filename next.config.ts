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
  // Las imágenes del menú viven fuera de `public/` (en `data/uploads/`) y se
  // sirven con la ruta `/uploads/[file]`, que las lee del disco. Incluimos esa
  // carpeta en el trazado de archivos para que también viaje en despliegues
  // empaquetados (standalone, Docker, serverless).
  outputFileTracingIncludes: {
    "/uploads/\\[file\\]": ["./data/uploads/**/*"],
  },
};

export default nextConfig;
