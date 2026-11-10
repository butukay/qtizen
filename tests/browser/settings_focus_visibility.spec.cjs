const { test, expect } = require("@playwright/test");
const { openSettings, openCategory } = require("./drawer_helpers.cjs");

// Compare the rendered interior with and without the decorative focus layer.
// Visibility assertions alone do not catch an opaque layer painted over content.
async function expectUncovered(page, control) {
  await control.focus();
  await expect(control).toHaveAttribute("data-focused", "true");
  const indicator = page.locator('[data-settings-focus="content"]');
  await expect(indicator).toHaveAttribute("data-visible", "true");
  await expect
    .poll(() =>
      indicator.evaluate((node) => {
        const target = document.querySelector('[data-settings-drawer="scroll"] [data-focused="true"]');
        const a = node.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        return Math.max(
          Math.abs(a.x - b.x),
          Math.abs(a.y - b.y),
          Math.abs(a.width - b.width),
          Math.abs(a.height - b.height),
        );
      }),
    )
    .toBeLessThan(1);
  const rect = await control.boundingBox();
  const clip = { x: rect.x + 8, y: rect.y + 8, width: rect.width - 16, height: rect.height - 16 };
  const focused = await page.screenshot({ clip });
  await indicator.evaluate((node) => {
    node.style.visibility = "hidden";
  });
  const uncovered = await page.screenshot({ clip });
  await indicator.evaluate((node) => {
    node.style.removeProperty("visibility");
  });
  expect(focused.equals(uncovered), "The focus layer must not cover the control's text, image or selection mark").toBe(
    true,
  );
}

for (const [build, url] of [
  ["compiled", "http://127.0.0.1:8171/"],
  ["development", "http://127.0.0.1:8172/"],
]) {
  test(`${build} Settings keeps focused text, app logos and wallpaper content visible`, async ({ page }) => {
    await page.route("https://**/*", (route) => route.fulfill({ body: "{}" }));
    await page.route("http://127.0.0.1:47790/**", (route) => route.fulfill({ body: "{}" }));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("aerotizen.settings.v1", JSON.stringify({ home: ["demo0", "demo1"], language: "en" }));
    });
    await page.goto(url);
    await page.waitForFunction(() => AeroTizen.apps.getSnapshot().ready);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      const describe = AeroTizen.tiles.describe;
      AeroTizen.tiles.describe = (app) => ({ ...describe(app), logoPath: "M3 3h18v18H3Z" });
    });
    await openSettings(page);
    await openCategory(page, "appearance");
    await expectUncovered(page, page.locator('[data-key="home-card-columns:3"]'));
    await page.keyboard.press("ArrowRight");
    await expectUncovered(page, page.locator('[data-key="home-card-columns:4"]'));
    await openCategory(page, "apps");
    await expect(page.locator('#all-apps [data-key="app:demo0"] [data-app-fallback] svg')).toBeVisible();
    await expectUncovered(page, page.locator('#all-apps [data-key="app:demo0"]'));
    await expectUncovered(page, page.locator('[data-key="app:__fire"]'));
    await openCategory(page, "wallpaper");
    await expectUncovered(page, page.locator('[data-key="wallpaper-categories:solid"]'));
    await page.keyboard.press("Enter");
    await expectUncovered(page, page.locator('[data-key="bg:black"]'));
    await page.screenshot({ path: test.info().outputPath("focused-content.png") });
  });
}
