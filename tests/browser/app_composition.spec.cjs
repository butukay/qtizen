const { openSettings } = require("./drawer_helpers.cjs");
const { test, expect } = require("@playwright/test");

test("first launch selects real apps and a saved empty list preserves its view and focus", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://**/*", (route) => route.fulfill({ body: "{}" }));
  await page.route("http://127.0.0.1:47790/**", (route) => route.fulfill({ body: "{}" }));
  await page.goto("/");
  await page.waitForFunction(() => AeroTizen.apps.getSnapshot().ready);
  const defaults = await page.evaluate(() => AeroTizen.apps.defaultHome());
  expect(defaults.length).toBeGreaterThan(0);
  expect(await page.locator("#grid > [data-id]").evaluateAll((nodes) => nodes.map((node) => node.dataset.id))).toEqual(
    defaults,
  );
  await expect(page.locator("#grid > [data-id]").first()).toBeFocused();
  await page.evaluate(() => {
    AeroTizen.settings.update({ home: [] });
  });
  await page.reload();
  await page.waitForFunction(() => AeroTizen.apps.getSnapshot().ready);
  await expect(page.locator("#grid > [data-id]")).toHaveCount(0);
  await expect(page.locator("#inputs > [data-input-card]").first()).toHaveAttribute("data-focused", "true");
  await openSettings(page);
  await expect(page.locator("#editor")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#editor")).toBeHidden();
  await expect(page.locator("#grid > [data-id]")).toHaveCount(0);
  expect(errors).toEqual([]);
});
