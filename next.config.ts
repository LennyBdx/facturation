import type { NextConfig } from "next";

// Cache Components désactivé : toutes les pages de l'application dépendent de la
// session (cookie) et de données en mémoire mutables, le rendu dynamique classique
// est le choix le plus simple pour le prototype (voir README).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
