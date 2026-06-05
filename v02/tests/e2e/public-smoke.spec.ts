import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  { path: "/", title: /globale Entwicklungen/i },
  { path: "/lagebild", title: /Deutschland in zehn Bereichen/i },
  { path: "/kosten", title: /Was teurer werden kann/i },
  { path: "/massnahmen", title: /Was ich tun kann/i },
  { path: "/quellen", title: /Quellen & Methodik/i },
];

test.describe("public WachSam smoke", () => {
  test("renders core public routes without browser errors", async ({ page }) => {
    const browserErrors: string[] = [];
    const failedResponses: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        browserErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 500) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    for (const route of publicRoutes) {
      await page.goto(route.path);
      await expect(page.getByRole("link", { name: "WachSam Startseite" })).toBeVisible();
      await expect(page.getByRole("main")).toContainText(route.title);
      await expect(page.getByRole("navigation", { name: "WachSam Hauptnavigation" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Anmelden" })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    expect(browserErrors, "browser console/page errors").toEqual([]);
    expect(failedResponses, "HTTP 5xx responses").toEqual([]);
  });

  test("keeps home call-to-action navigation usable", async ({ page }) => {
    await page.goto("/");
    await page.locator(".pfad-hub").getByRole("link", { name: /Aktuelle Lage ansehen/ }).click();
    await expect(page).toHaveURL(/\/lagebild$/);
    await expect(page.getByRole("main")).toContainText(/Deutschland in zehn Bereichen/i);
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
