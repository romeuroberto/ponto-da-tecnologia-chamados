import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portal do Cliente · Ponto da Tecnologia",
    short_name: "Portal Cliente",
    description: "Acompanhe chamados, financeiro, vendas e documentos em uma experiência de app.",
    start_url: "/portal-app-login?callbackUrl=/portal-app&portal_view=app",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    orientation: "portrait",
    lang: "pt-BR",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
