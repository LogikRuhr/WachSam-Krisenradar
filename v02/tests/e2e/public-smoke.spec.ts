import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  { path: "/", title: /Was betrifft meinen Haushalt jetzt/i },
  { path: "/radar", title: /WachSam Radar/i },
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

  test("shows the official Warnlage card on /radar even without a database", async ({ page }) => {
    await page.goto("/radar");
    const warnlageCard = page.getByRole("article", { name: /Themenkanal Akute Warnlage \(amtlich\)/i });
    await expect(warnlageCard).toBeVisible();
    await expect(warnlageCard).toContainText("Quelle: DWD (amtlich)");
    await expect(warnlageCard).toContainText(/Stand |Datenstand ausstehend/);
    await expectNoHorizontalOverflow(page);
  });

  test("keeps home call-to-action navigation usable", async ({ page }) => {
    await page.goto("/");
    await page.locator(".pfad-hub").getByRole("link", { name: /Aktuelle Lage ansehen/ }).click();
    await expect(page).toHaveURL(/\/lagebild$/);
    await expect(page.getByRole("main")).toContainText(/Deutschland in zehn Bereichen/i);
    await expectNoHorizontalOverflow(page);
  });

  test("starts home as household cockpit", async ({ page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", { name: /Was betrifft meinen Haushalt jetzt/i, level: 1 });
    const householdType = page.getByLabel("Haushaltstyp");
    const dataStatus = page.getByLabel("Datenstatus des Haushalts-Checks");
    const onboarding = page.getByLabel("In drei Schritten zum ersten WachSam-Wert");
    const results = page.locator(".household-check-results");
    const priceRadar = page.locator(".price-radar");

    await expect(heading).toBeVisible();
    await expect(householdType).toBeVisible();
    await expect(dataStatus).toBeVisible();
    await expect(onboarding).toBeVisible();
    await expect(priceRadar).toBeVisible();
    await expect(priceRadar).toContainText("Super E5");
    await expect(priceRadar).toContainText("Super E10");
    await expect(priceRadar).toContainText("Diesel");
    await expect(priceRadar).toContainText("Strom Haushalte");
    await expect(priceRadar).toContainText("Gas Haushalte");
    await expect(onboarding).toContainText("Haushalt einordnen");
    await expect(onboarding).toContainText("Wirkung verstehen");
    await expect(onboarding).toContainText("Prüfschritt mitnehmen");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(results).toContainText(/Aktueller Status|Deine erste Einordnung/);
    await expect(results).toContainText(/Nächster Prüfschritt/);
    await expect(results).toContainText(/Orientierung, keine Beratung/);
    if ((await results.getByText("Deine erste Einordnung").count()) > 0) {
      await householdType.selectOption("single");
      await expect(onboarding).toContainText("2/3 bereit");
      if ((await results.getByText("Passende Maßnahme").count()) > 0) {
        await expect(results.getByRole("link", { name: "Maßnahme einordnen" })).toBeVisible();
      }
    } else {
      await expect(results.getByText("Passende Maßnahme")).toHaveCount(0);
    }

    const viewport = page.viewportSize();
    const headingBox = await heading.boundingBox();
    const inputBox = await householdType.boundingBox();
    const resultBox = await results.boundingBox();

    expect(headingBox?.y ?? Number.POSITIVE_INFINITY, "home cockpit heading is in the first viewport").toBeLessThan(
      viewport?.height ?? 900,
    );
    expect(inputBox?.y ?? Number.POSITIVE_INFINITY, "household input starts in the first viewport").toBeLessThan(
      viewport?.height ?? 900,
    );
    expect(resultBox?.height ?? Number.POSITIVE_INFINITY, "household result stays compact before details").toBeLessThan(
      420,
    );

    const details = results.locator("details.household-result-details");
    if ((await details.count()) > 0) {
      const summary = details.locator("summary").first();
      await expect(summary).toBeVisible();
      await expect(details.first()).not.toHaveAttribute("open", "");
      await summary.click();
      await expect(details.first()).toHaveAttribute("open", "");
    }

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
