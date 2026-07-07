import { expect, test, type Page } from "@playwright/test";

test.describe("review auth gate", () => {
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

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth,
  }));

  expect(overflow.body, "body horizontal overflow").toBeLessThanOrEqual(1);
  expect(overflow.document, "document horizontal overflow").toBeLessThanOrEqual(1);
}
