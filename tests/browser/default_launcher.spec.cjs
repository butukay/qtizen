const { test, expect } = require("@playwright/test");
const { openCategory, closeSettings } = require("./drawer_helpers.cjs");

async function prepare(page, settings = {}) {
  await page.route("https://**/*", (route) => route.fulfill({ body: "{}" }));
  await page.route("http://127.0.0.1:47790/**", (route) => route.fulfill({ body: "{}" }));
  await page.addInitScript((settings) => {
    if (!localStorage.getItem("aerotizen.settings.v1"))
      localStorage.setItem(
        "aerotizen.settings.v1",
        JSON.stringify({
          home: ["__fire", "demo0", "demo1", "demo2", "demo3", "demo4"],
          homeCardColumns: 3,
          homeAppLayout: "scroll",
          background: "black",
          showWeather: false,
          language: "en",
          ...settings,
        }),
      );
  }, settings);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForFunction(() => AeroTizen.apps.getSnapshot().ready);
  await page.evaluate(() => document.fonts.ready);
}

test("Default is the only theme, migrates previous choices, and keeps favorites after reload", async ({ page }) => {
  await prepare(page, {
    glassSettings: true,
    nordRice: false,
    clockLayout: "custom",
    aeroClockStyle: "bold",
    background: "aurora",
  });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "default");
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  const saved = await page.evaluate(() => AeroTizen.settings.getSnapshot().home);
  const values = await page.evaluate(() => AeroTizen.settings.getSnapshot());
  expect("glassSettings" in values || "nordRice" in values || "clockLayout" in values).toBe(false);
  await page.locator("#gear").click();
  await openCategory(page, "appearance");
  await expect(page.locator('[data-key^="settings-appearance:"]')).toHaveCount(0);
  await expect(page.locator("#editor")).not.toContainText(/Classic|Glass|Nord/);
  await closeSettings(page);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "default");
  expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().home)).toEqual(saved);
});

test("the header has only Settings; section rules, Live caption and new sizes fit the screen", async ({ page }) => {
  await prepare(page);
  await expect(page.locator('[data-home-header] [role="button"]')).toHaveCount(1);
  await expect(page.locator("#home-tab, #apps-tab, #samsung-home-shortcut, [data-header-status]")).toHaveCount(0);
  await expect(page.locator("[data-home-overview]")).not.toContainText(/Home|~/);
  await expect(page.getByRole("heading", { name: "Favorites", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inputs", exact: true })).toBeVisible();
  for (const title of ["Favorites", "Inputs"])
    await expect(page.getByRole("heading", { name: title, exact: true }).locator('[aria-hidden="true"]')).toHaveCount(
      1,
    );
  const television = page.locator("#inputs").getByRole("button", { name: "TV", exact: true });
  await expect(television.locator('[data-input-part="subtitle"]')).toHaveText("Live");
  await expect(television.locator('[data-input-part="subtitle"]')).toHaveCSS("font-size", "15px");
  expect((await page.locator("#grid > [data-id]").first().boundingBox()).height).toBe(184);
  const solar = await page.locator("[data-solar-system]").boundingBox();
  expect(solar.width).toBe(760);
  expect(solar.height).toBe(355);
  expect(solar.x + solar.width).toBeLessThanOrEqual(1760);
  expect((await page.locator("#inputs").boundingBox()).y + 86).toBeLessThanOrEqual(984);
});

test("remote navigation reaches Settings, all favorites and inputs without removed controls", async ({ page }) => {
  await prepare(page);
  await page.keyboard.press("ArrowUp");
  await expect(page.locator("#gear")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#gear")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#editor")).toBeVisible();
  await closeSettings(page);
  await page.keyboard.press("ArrowDown");
  const cards = page.locator("#grid > [data-id]");
  for (let i = 0; i < (await cards.count()); i++) {
    if (i) await page.keyboard.press("ArrowRight");
    await expect(cards.nth(i)).toBeFocused();
    const rect = await cards.nth(i).boundingBox();
    expect(rect.x).toBeGreaterThanOrEqual(160);
    expect(rect.x + rect.width).toBeLessThanOrEqual(1760);
  }
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('#inputs > [data-focused="true"]')).toHaveCount(1);
});

test("favorites are managed through Settings and an empty list keeps Settings reachable", async ({ page }) => {
  await prepare(page, { home: ["demo0"] });
  await page.locator("#gear").click();
  await openCategory(page, "apps");
  await page.locator('#all-apps [data-key="app:demo1"]').click();
  await closeSettings(page);
  await expect(page.locator('#grid > [data-id="demo1"]')).toBeVisible();
  await page.evaluate(() => AeroTizen.settings.update({ home: [] }));
  await expect(page.locator("#grid > [data-id]")).toHaveCount(0);
  await page.keyboard.press("ArrowUp");
  await expect(page.locator("#gear")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#editor")).toBeVisible();
});

test("favorites can be reordered and removed with a long press", async ({ page }) => {
  await prepare(page, { home: ["demo0", "demo1", "demo2"] });
  await page.keyboard.down("Enter");
  await page.waitForTimeout(650);
  await page.keyboard.up("Enter");
  await expect(page.locator('[data-app-actions-focus="true"]')).toBeVisible();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().home)).toEqual(["demo1", "demo0", "demo2"]);
  await page.keyboard.down("Enter");
  await page.waitForTimeout(650);
  await page.keyboard.up("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().home)).toEqual(["demo1", "demo2"]);
});

for (const columns of [3, 4, 5])
  test(`Default ${columns}-column grid reveals focused rows`, async ({ page }) => {
    await prepare(page, { homeCardColumns: columns, homeAppLayout: "grid" });
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowDown");
      const focused = page.locator('[data-home-content] [data-focused="true"]');
      await expect(focused).toHaveCount(1);
      const rect = await focused.boundingBox();
      expect(rect.y).toBeGreaterThanOrEqual(96);
      expect(rect.y + rect.height).toBeLessThanOrEqual(1000);
    }
  });

test("solar video pauses for reduced motion, Performance mode, Settings and hidden app", async ({ page }) => {
  await prepare(page);
  const scene = page.locator("[data-solar-system]"),
    video = page.locator("[data-solar-video]");
  await expect.poll(() => video.evaluate((v) => v.paused)).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(scene).toHaveAttribute("data-video-active", "true");
  const before = await video.evaluate((v) => v.currentTime);
  await expect.poll(() => video.evaluate((v) => v.currentTime)).toBeGreaterThan(before);
  await page.locator("#gear").click();
  await expect.poll(() => video.evaluate((v) => v.paused)).toBe(true);
  await closeSettings(page);
  await expect(scene).toHaveAttribute("data-video-active", "true");
  await page.evaluate(() => AeroTizen.settings.update({ performanceMode: true }));
  await expect.poll(() => video.evaluate((v) => v.paused)).toBe(true);
  await page.evaluate(() => AeroTizen.settings.update({ performanceMode: false }));
  await expect(scene).toHaveAttribute("data-video-active", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => video.evaluate((v) => v.paused)).toBe(true);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(scene).toHaveAttribute("data-video-active", "true");
});

test("SVG remains as a fallback if the local video cannot load", async ({ page }) => {
  await page.route("**/assets/solar-loop.mp4", (r) => r.abort());
  await prepare(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("[data-solar-drawing]")).toBeVisible();
  await expect(page.locator("[data-solar-planet]")).toHaveCount(8);
});

test("the launcher has no inactivity dimming or swallowed wake key", async ({ page }) => {
  await page.clock.install();
  await prepare(page);
  const selected = await page.locator('#grid > [data-focused="true"]').getAttribute("data-id");
  await page.clock.fastForward(600_000);
  await expect(page.locator("#home-root")).toHaveCSS("opacity", "1");
  await page.keyboard.press("ArrowRight");
  expect(await page.locator('#grid > [data-focused="true"]').getAttribute("data-id")).not.toBe(selected);
});
