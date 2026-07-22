import { expect, test, type Page } from "@playwright/test";

test.describe("review auth gate", () => {
  test("offers passkey before the magic-link recovery path", async ({ page }) => {
    await page.goto("/login?callbackUrl=%2Freview");

    await expect(page.getByRole("button", { name: /Fingerabdruck oder Geraetecode anmelden/i })).toBeVisible();
    await expect(page.getByText(/Falls dein Passkey nicht verfuegbar ist/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Magic-Link als Rueckweg senden/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("redirects unauthenticated profile users to login without mobile overflow", async ({ page }) => {
    await page.goto("/profil");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Anmelden/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("redirects unauthenticated review users to login without mobile overflow", async ({ page }) => {
    await page.goto("/review");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Anmelden/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("magic-link confirm page", () => {
  test("renders the confirm button when token and email are present", async ({ page }) => {
    await page.goto("/login/confirm?token=x&email=test%40example.com");

    await expect(page.getByRole("heading", { name: /Anmeldung bestätigen/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Anmeldung bestätigen/i })).toBeVisible();
  });

  test("renders the invalid-link notice and no confirm button without params", async ({ page }) => {
    await page.goto("/login/confirm");

    await expect(page.getByRole("heading", { name: /Link ungültig/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Anmeldung bestätigen/i })).toHaveCount(0);
  });
});

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth,
  }));

  expect(overflow.body, "body horizontal overflow").toBeLessThanOrEqual(1);
  expect(overflow.document, "document horizontal overflow").toBeLessThanOrEqual(1);
}
