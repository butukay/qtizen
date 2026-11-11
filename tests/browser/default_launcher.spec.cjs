const { test, expect } = require("@playwright/test");
const { openSettings, openCategory, closeSettings } = require("./drawer_helpers.cjs");

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
  await openSettings(page);
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
  for (const title of ["Applications", "Sources"]) {
    const heading = page.getByRole("heading", { name: title, exact: true });
    await expect(heading).toBeVisible();
    await expect(heading.locator('[aria-hidden="true"]')).toHaveCount(1);
  }
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

test("smaller Scroll sizes lower the app row while Inputs keeps its bottom clearance", async ({ page }) => {
  await prepare(page);
  const geometry = () =>
    page.evaluate(() => {
      const app = document.querySelector("#grid > [data-id]").getBoundingClientRect();
      const inputs = document.querySelector('[data-home-section="inputs"]').getBoundingClientRect();
      const viewport = document.querySelector("[data-home-viewport]").getBoundingClientRect();
      const overview = document.querySelector("[data-home-overview]").getBoundingClientRect();
      return {
        overviewTop: overview.top,
        appTop: app.top,
        appGap: inputs.top - app.bottom,
        bottomGap: viewport.bottom - inputs.bottom,
      };
    });
  const large = await geometry();

  for (const { columns, reduction } of [
    { columns: 4, reduction: 28 },
    { columns: 5, reduction: 56 },
  ]) {
    await openSettings(page);
    await openCategory(page, "appearance");
    await page.locator(`[data-key="home-card-columns:${columns}"]`).click();
    await closeSettings(page);
    const smaller = await geometry();
    expect(smaller.overviewTop).toBeGreaterThan(large.overviewTop);
    expect(smaller.appTop).toBeGreaterThan(large.appTop);
    expect(smaller.appGap).toBe(large.appGap - reduction);
    expect(smaller.bottomGap).toBe(large.bottomGap);

    await page.keyboard.press("ArrowDown");
    await expect(page.locator('#inputs > [data-focused="true"]')).toHaveCount(1);
    expect((await geometry()).bottomGap).toBe(large.bottomGap);
    await page.keyboard.press("ArrowUp");
  }
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
  await openSettings(page);
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

test("Widgets switches the Home decoration and remembers Off after reload", async ({ page }) => {
  await prepare(page);
  await expect(page.locator("[data-solar-system]")).toBeVisible();
  await expect(page.locator("[data-solar-planet]")).toHaveCount(8);
  await expect(page.locator("[data-screen-awake-video]")).toHaveCount(0);
  const mercury = page.locator('[data-solar-planet="mercury"]');
  await expect(mercury).toHaveCSS("animation-play-state", "paused");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(mercury).toHaveCSS("animation-play-state", "running");
  const transform = await mercury.evaluate((node) => getComputedStyle(node).transform);
  await expect.poll(() => mercury.evaluate((node) => getComputedStyle(node).transform)).not.toBe(transform);
  await page.evaluate(() => AeroTizen.settings.update({ performanceMode: true }));
  await expect(mercury).toHaveCSS("animation-play-state", "paused");
  await page.evaluate(() => AeroTizen.settings.update({ performanceMode: false }));
  await expect(mercury).toHaveCSS("animation-play-state", "running");

  await openSettings(page);
  await expect(mercury).toHaveCSS("animation-play-state", "paused");
  await openCategory(page, "widgets");
  await expect(page.getByRole("button", { name: "Solar System", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Moon phase", exact: true })).toHaveAttribute("aria-pressed", "true");
  await closeSettings(page);
  await expect(page.locator("[data-moon-phase]")).toBeVisible();
  await expect(page.locator("[data-solar-system]")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("[data-moon-phase]")).toBeVisible();

  await openSettings(page);
  await openCategory(page, "widgets");
  await page.getByRole("button", { name: "Off", exact: true }).click();
  await closeSettings(page);
  await page.reload();
  await expect(page.locator("[data-home-widget]")).toHaveCount(0);
  await expect(page.locator('[data-clock-part="time"]')).toBeVisible();
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

test("Settings stays hidden until Up and returns to the last favorite after closing", async ({ page }) => {
  await prepare(page);
  const gear = page.locator("#gear");
  await expect(gear).toHaveCSS("opacity", "0");
  await expect(gear).toHaveCSS("pointer-events", "none");
  await page.keyboard.press("ArrowRight");
  const favorite = await page.locator('#grid > [data-focused="true"]').getAttribute("data-id");
  await page.keyboard.press("ArrowUp");
  await expect(gear).toBeFocused();
  await expect(gear).toHaveCSS("opacity", "1");
  await expect(gear).toHaveCSS("pointer-events", "auto");
  await page.keyboard.press("ArrowDown");
  await expect(gear).toHaveCSS("opacity", "0");
  // Pick a favorite again, then enter and leave Settings using the remote.
  await page.keyboard.press("ArrowRight");
  await openSettings(page);
  await closeSettings(page);
  await expect(page.locator('#grid > [data-id="' + favorite + '"]')).toBeFocused();
  await expect(gear).toHaveCSS("opacity", "0");
  await expect(gear).toHaveCSS("pointer-events", "none");
});

test("Appearance transition choices support the remote and survive a reload", async ({ page }) => {
  await prepare(page);
  await openSettings(page);
  await openCategory(page, "appearance");
  const none = page.locator('[data-key="app-transition:none"]');
  const fade = page.locator('[data-key="app-transition:fade"]');
  const standard = page.locator('[data-key="app-transition:standard"]');
  await expect(none).toHaveAttribute("aria-pressed", "true");
  await fade.click();
  expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().appTransition)).toBe("fade");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(standard).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await openSettings(page);
  await openCategory(page, "appearance");
  await expect(standard).toHaveAttribute("aria-pressed", "true");
  await none.click();
  expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().appTransition)).toBe("none");
});
