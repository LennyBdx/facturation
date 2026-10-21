import { ImageResponse } from "next/og";
import { PRODUCT_NAME } from "@/config/site";
import { hero, READY_LABEL } from "@/content/home";

/*
 * Image de partage (Open Graph). Générée hors navigateur : les variables CSS du
 * design system n'existent pas ici, les couleurs reprennent donc leurs valeurs
 * (marine #1E3A5F, orange chantier #C2410C) — exception documentée.
 */
export const alt = `${PRODUCT_NAME} — ${hero.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#1E3A5F",
        color: "#FFFFFF",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 600 }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            background: "#C2410C",
            transform: "rotate(45deg)",
            borderRadius: 3,
          }}
        />
        {PRODUCT_NAME}
      </div>
      <div
        style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000 }}
      >
        {hero.title}
      </div>
      <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>
        Devis, situations de travaux et retenue de garantie · {READY_LABEL}
      </div>
    </div>,
    size,
  );
}
