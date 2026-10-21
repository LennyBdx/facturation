// Captures réelles du prototype pour le site vitrine — `pnpm screenshots`.
// Utilise le serveur indiqué par BASE_URL s'il répond, sinon démarre `next dev`
// sur un port dédié le temps des captures. Sortie : public/screenshots/*.png
// (next/image les sert ensuite en AVIF/WebP).
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const OUT = path.resolve("public/screenshots");
const PORT = 3210;
let base = process.env.BASE_URL ?? `http://localhost:${PORT}`;

async function reachable(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await reachable(`${base}/connexion`)) return null;
  base = `http://localhost:${PORT}`;
  console.log(`Démarrage de next dev sur le port ${PORT}…`);
  const child = spawn("corepack", ["pnpm", "exec", "next", "dev", "--port", String(PORT)], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  for (let i = 0; i < 90; i++) {
    if (await reachable(`${base}/connexion`)) return child;
    await new Promise((r) => setTimeout(r, 1000));
  }
  child.kill();
  throw new Error("Le serveur de développement n'a pas démarré.");
}

/** Masque l'indicateur de développement Next.js et fige le thème clair. */
async function prepare(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("theme", "light");
    } catch {}
  });
}

async function clean(page) {
  await page.addStyleTag({
    content: "nextjs-portal, [data-nextjs-toast], [data-sonner-toaster] { display: none !important; } *, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }",
  });
  await page.waitForTimeout(400);
}

async function shoot(context, { name, url, find, wait, act }) {
  const page = await context.newPage();
  await prepare(page);
  let target = url;
  if (find) {
    await page.goto(`${base}${find.from}`, { waitUntil: "networkidle" });
    target = await page.locator(find.selector).first().getAttribute("href");
    if (!target) throw new Error(`Lien introuvable pour ${name}`);
    if (find.suffix) target += find.suffix;
  }
  await page.goto(`${base}${target}`, { waitUntil: "networkidle" });
  if (wait) await page.locator(wait).first().waitFor({ timeout: 15000 });
  if (act) await act(page);
  await clean(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`ok  ${name}.png  ←  ${target}`);
  await page.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await ensureServer();
  const browser = await chromium.launch();
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: "fr-FR" });
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      locale: "fr-FR",
    });

    await shoot(desktop, { name: "dashboard", url: "/app/tableau-de-bord", wait: "h1" });
    await shoot(desktop, {
      name: "quote-editor",
      find: { from: "/app/devis?filtre=draft", selector: 'main tbody a[href^="/app/devis/"]', suffix: "/modifier" },
      wait: "textarea",
    });
    await shoot(desktop, { name: "worksite", url: "/app/chantiers/ws-terrasses", wait: "h1" });
    await shoot(desktop, {
      name: "invoice-lifecycle",
      find: { from: "/app/chantiers/ws-terrasses", selector: 'main table a[href^="/app/factures/"]' },
      wait: 'ol[aria-label="Historique du cycle de vie"]',
    });
    await shoot(desktop, { name: "received-inbox", url: "/app/factures-recues", wait: "h1" });
    await shoot(mobile, {
      name: "situation-mobile",
      find: { from: "/app/chantiers/ws-terrasses", selector: 'a[href^="/app/factures/situation/nouvelle"]' },
      wait: "h1",
      // Saisie d'un avancement de 90 % sur le lot « Logements », puis cadrage sur ce lot.
      act: async (page) => {
        const lot = page.locator("section").filter({ hasText: "Logements" }).first();
        const input = lot.locator('input[id^="lot-"]');
        await input.fill("90");
        await input.press("Enter");
        await lot.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 64));
      },
    });
    await shoot(mobile, { name: "dashboard-mobile", url: "/app/tableau-de-bord", wait: "h1" });
  } finally {
    await browser.close();
    if (server) server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
