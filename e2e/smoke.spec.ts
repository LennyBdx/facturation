import { expect, test } from "@playwright/test";

test("la page d'accueil présente le produit", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Factobat/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("l'espace connecté exige une session puis revient à la page demandée", async ({ page }) => {
  await page.goto("/app/clients");
  await expect(page).toHaveURL(/\/connexion\?next=%2Fapp%2Fclients/);
  await page.getByRole("textbox", { name: "Mot de passe" }).fill("demo1234");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/app\/clients$/);
  await expect(page.getByRole("heading", { level: 1, name: "Clients" })).toBeVisible();
});

test("un client créé apparaît aussitôt dans la liste (cache invalidé)", async ({ page }) => {
  await page.goto("/connexion?next=/app/clients/nouveau");
  await page.getByRole("textbox", { name: "Mot de passe" }).fill("demo1234");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/app\/clients\/nouveau$/);

  const name = `Menuiserie Test ${Date.now()}`;
  await page.getByLabel("Raison sociale").fill(name);
  await page.getByLabel("SIREN").fill("732829320");
  await page.getByRole("textbox", { name: /^Adresse/ }).fill("12 rue des Artisans");
  await page.getByLabel("Code postal").fill("69003");
  await page.getByLabel("Ville").fill("Lyon");
  await page.getByRole("button", { name: "Créer le client" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
  await page.goto("/app/clients");
  await expect(page.getByRole("link", { name }).first()).toBeVisible();
});

test("la déconnexion ferme la session", async ({ page, context }) => {
  await context.addCookies([
    { name: "factobat_session", value: "usr-julien", url: "http://localhost:3230" },
  ]);
  await page.goto("/app/tableau-de-bord");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.clearCookies();
  await page.goto("/app/tableau-de-bord");
  await expect(page).toHaveURL(/\/connexion/);
});

test("la pagination des listes conserve la recherche et revient en page 1", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "factobat_session", value: "usr-julien", url: "http://localhost:3230" },
  ]);
  await page.goto("/app/factures");
  await page.getByRole("link", { name: "Page suivante" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole("navigation", { name: "Pagination" }).locator("[aria-current=page]"),
  ).toHaveText(/2/);
  await page.getByRole("searchbox").fill("FA");
  await expect(page).toHaveURL(/q=FA/);
  await expect(page).not.toHaveURL(/page=/);
});
