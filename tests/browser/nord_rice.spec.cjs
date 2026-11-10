const { test, expect } = require("@playwright/test");
const { openCategory, closeSettings } = require("./drawer_helpers.cjs");

async function prepare(page, settings = {}) {
  await page.route("https://**/*", (route) => route.fulfill({ body: "{}" }));
  await page.route("http://127.0.0.1:47790/**", (route) => route.fulfill({ body: "{}" }));
  await page.addInitScript((settings) => {
    if (!localStorage.getItem("aerotizen.settings.v1")) {
      localStorage.setItem(
        "aerotizen.settings.v1",
        JSON.stringify({
          home: ["demo0", "demo1", "demo2", "demo3", "demo4", "__fire"],
          homeCardColumns: 5,
          homeAppLayout: "scroll",
          showWeather: false,
          background: "aurora",
          glassSettings: true,
          ...settings,
        }),
      );
    }
  }, settings);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForFunction(() => AeroTizen.apps.getSnapshot().ready);
  await page.evaluate(() => document.fonts.ready);
}

test("Nord can be selected with settings, persists and preserves the saved wallpaper and favourites", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await prepare(page);
  const saved = await page.evaluate(() => AeroTizen.settings.getSnapshot().home);
  await page.locator("#gear").click();
  await openCategory(page, "appearance");
  await page.locator('[data-key="settings-appearance:nord"]').click();
  await closeSettings(page);
  await expect(page.locator("body")).toHaveClass(/nord-ui/);
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(36, 41, 51)");
  await expect(page.locator("[data-nord-time]")).toBeVisible();
  await expect(page.locator("#grid [data-app-artwork]")).toHaveCount(0);
  expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().background)).toBe("aurora");
  expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().home)).toEqual(saved);
  await page.reload();
  await expect(page.locator("body")).toHaveClass(/nord-ui/);
  await page.locator("#gear").click();
  await openCategory(page, "appearance");
  await page.locator('[data-key="settings-appearance:false"]').click();
  await closeSettings(page);
  await expect(page.locator("body")).not.toHaveClass(/nord-ui/);
  expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().background)).toBe("aurora");
  expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().home)).toEqual(saved);
  expect(errors).toEqual([]);
});

test("Nord remote navigation reaches every app and input and follows the visible workspace order", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await prepare(page, { nordRice: true });
  await page.locator("#home-tab").click();
  for (const id of ["apps-tab", "samsung-home-shortcut", "gear"]) {
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#" + id)).toBeFocused();
  }
  await page.locator("#home-tab").click();
  await page.keyboard.press("ArrowDown");
  const apps = page.locator("#grid > [data-id]");
  const appCount = await apps.count();
  expect(appCount).toBeGreaterThan(1);
  for (let index = 0; index < appCount; index++) {
    if (index) await page.keyboard.press("ArrowRight");
    await expect(apps.nth(index)).toBeFocused();
    const rect = await apps.nth(index).boundingBox();
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(1920);
    expect(rect.y + rect.height).toBeLessThan(1000);
  }
  await page.keyboard.press("ArrowDown");
  const inputs = page.locator("#inputs > [data-input-card]");
  await expect(inputs.first()).toBeVisible();
  await expect(page.locator("#inputs > [data-focused=true]")).toHaveCount(1);
  const selected = await page.locator("#inputs > [data-focused=true]").boundingBox();
  expect(selected.y + selected.height).toBeLessThanOrEqual(1000);
  await page.keyboard.press("ArrowUp");
  await expect(page.locator("#grid > [data-focused=true]")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("Nord grid sizes reveal focused rows and retain the independent time and date preferences", async ({ page }) => {
  await prepare(page, { nordRice: true, homeAppLayout: "grid" });
  for (const columns of [3, 4, 5]) {
    await page.evaluate((homeCardColumns) => AeroTizen.settings.update({ homeCardColumns }), columns);
    await page.locator("#home-tab").click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const focused = page.locator("#grid > [data-focused=true]");
    await expect(focused).toHaveCount(1);
    const rect = await focused.boundingBox();
    expect(rect.y).toBeGreaterThanOrEqual(128);
    expect(rect.y + rect.height).toBeLessThanOrEqual(1000);
  }
  await page.evaluate(() => AeroTizen.settings.update({ showTime: false, dateFormat: "none" }));
  await expect(page.locator("[data-nord-time]")).toBeHidden();
  await expect(page.locator("[data-nord-date]")).toBeHidden();
  await page.reload();
  await expect(page.locator("[data-nord-time]")).toBeHidden();
  await expect(page.locator("[data-nord-date]")).toBeHidden();
});
