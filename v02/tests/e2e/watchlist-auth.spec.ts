import { expect, test, type Page } from "@playwright/test";
import {
  cleanupWatchlistTestUser,
  closeWatchlistTestDb,
  connectWatchlistTestDb,
  countWatchlistRows,
  createWatchlistTestUser,
  firstWatchlistItemId,
  insertWatchlistRow,
  setWatchlistSessionCookie,
  watchlistDatabaseUrl,
  type WatchlistTestClient,
  type WatchlistTestUser,
} from "./helpers/watchlist-auth";

test.describe("authenticated watchlist", () => {
  test.skip(!watchlistDatabaseUrl(), "smoke:watchlist braucht WATCHLIST_E2E_DATABASE_URL oder DATABASE_URL.");

  let client: WatchlistTestClient;
  let user: WatchlistTestUser;
  let otherUser: WatchlistTestUser;

  test.beforeEach(async ({ context }) => {
    client = connectWatchlistTestDb();
    user = await createWatchlistTestUser(client, "primary");
    otherUser = await createWatchlistTestUser(client, "other");
    await setWatchlistSessionCookie(context, user.sessionToken);
  });

  test.afterEach(async () => {
    if (client && otherUser) await cleanupWatchlistTestUser(client, otherUser.userId);
    if (client && user) await cleanupWatchlistTestUser(client, user.userId);
    if (client) await closeWatchlistTestDb(client);
  });

  test("adds and removes a watchlist card without duplicates", async ({ page }) => {
    const browserErrors = collectBrowserErrors(page);

    await page.goto("/profil");
    await expect(page.getByRole("heading", { name: /Dein persönlicher WachSam-Bereich/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Beobachten statt suchen/i })).toBeVisible();

    const suggestion = page.locator(".watchlist-suggestion").first();
    await expect(suggestion).toBeVisible();
    const itemTitle = (await suggestion.locator("strong").innerText()).trim();

    await suggestion.getByRole("button", { name: "Beobachten" }).dblclick();
    await expect(page.locator(".watchlist-card-list").getByText(itemTitle)).toBeVisible();
    await expect(page.getByLabel("Digest-Vorschau")).toContainText(itemTitle);

    const itemId = await firstWatchlistItemId(client, user.userId);
    expect(await countWatchlistRows(client, user.userId, itemId)).toBe(1);

    await insertWatchlistRow(client, otherUser.userId, itemId);
    const watchedCard = page.locator(".watchlist-card-list article", { hasText: itemTitle }).first();
    await watchedCard.getByRole("button", { name: "Entfernen" }).click();
    await expect(page.locator(".watchlist-card-list").getByText(itemTitle)).toHaveCount(0);
    expect(await countWatchlistRows(client, user.userId, itemId)).toBe(0);
    expect(await countWatchlistRows(client, otherUser.userId, itemId)).toBe(1);
    await expectNoHorizontalOverflow(page);
    expect(browserErrors, "browser console/page errors").toEqual([]);
  });
});

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - window.innerWidth,
    document: document.documentElement.scrollWidth - window.innerWidth,
  }));

  expect(overflow.body, "body horizontal overflow").toBeLessThanOrEqual(1);
  expect(overflow.document, "document horizontal overflow").toBeLessThanOrEqual(1);
}
