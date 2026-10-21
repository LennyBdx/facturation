// Captures de référence (inspiration design) — relancer avec `pnpm references`.
// Les images servent uniquement à l'analyse interne (docs/references/analyse.md),
// elles ne doivent jamais être réutilisées dans le produit.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("docs/references");

const TARGETS = [
  { slug: "facturenet", url: "https://www.facture.net/" },
  { slug: "tiime-factures", url: "https://www.tiime.fr/factures" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false },
  { name: "mobile", width: 390, height: 844, isMobile: true },
];

// Libellés usuels des boutons de bandeaux cookies (refus en priorité).
const COOKIE_BUTTONS = [
  /tout refuser/i,
  /refuser/i,
  /continuer sans accepter/i,
  /reject all/i,
  /decline/i,
  /fermer/i,
];

async function dismissCookies(page) {
  for (const label of COOKIE_BUTTONS) {
    for (const frame of page.frames()) {
      const btn = frame.getByRole("button", { name: label }).first();
      try {
        if (await btn.isVisible({ timeout: 500 })) {
          await btn.click({ timeout: 2000 });
          await page.waitForTimeout(600);
          return true;
        }
      } catch {
        /* bouton absent dans ce frame */
      }
    }
  }
  return false;
}

// Fait défiler la page pour déclencher le lazy-loading des images.
async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = 600;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

async function saveTiimeImages(page) {
  // Récupère les captures produit (images de l'application) présentes sur la page.
  const urls = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.naturalWidth >= 400 && img.naturalHeight >= 300)
      .map((img) => img.currentSrc || img.src)
      .filter((src) => src.startsWith("http")),
  );
  // On ne garde que les maquettes d'application, dédoublonnées par nom de fichier.
  const byName = new Map();
  for (const url of urls) {
    const pathname = decodeURIComponent(new URL(url).pathname);
    if (!/mockup/i.test(pathname)) continue;
    const base = path
      .basename(pathname)
      .replace(/^tiime-mockup-/, "")
      .replace(/\.\w+$/, "");
    if (!byName.has(base)) byName.set(base, url);
  }
  for (const [base, url] of byName) {
    try {
      const res = await page.request.get(url);
      if (!res.ok()) continue;
      const type = res.headers()["content-type"] ?? "";
      const ext = type.includes("webp") ? "webp" : type.includes("jpeg") ? "jpg" : "png";
      const name = `tiime-app-${base}.${ext}`;
      await writeFile(path.join(OUT, name), await res.body());
      console.log(`  image  ${name}  ←  ${url}`);
    } catch (err) {
      console.warn(`  échec image ${url}: ${err.message}`);
    }
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const failures = [];

  for (const target of TARGETS) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
        deviceScaleFactor: 1,
        locale: "fr-FR",
      });
      const page = await context.newPage();
      const file = path.join(OUT, `${target.slug}-${vp.name}.png`);
      try {
        await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1500);
        await dismissCookies(page);
        await autoScroll(page);
        await dismissCookies(page);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`ok     ${path.basename(file)}`);
        if (target.slug === "tiime-factures" && vp.name === "desktop") {
          await saveTiimeImages(page);
        }
      } catch (err) {
        failures.push(`${target.slug}-${vp.name}: ${err.message}`);
        console.error(`ÉCHEC  ${path.basename(file)} — ${err.message}`);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  if (failures.length) {
    console.error("\nCaptures en échec (à déposer manuellement dans docs/references/) :");
    for (const f of failures) console.error(` - ${f}`);
  }
}

main();
