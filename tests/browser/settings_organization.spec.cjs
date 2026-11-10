const { test, expect } = require("@playwright/test");
const { openCategory, closeSettings } = require("./drawer_helpers.cjs");

for (const [build, url] of [
  ["compiled", "http://127.0.0.1:8171/"],
  ["development", "http://127.0.0.1:8172/"],
]) {
  test.describe(build, () => {
    test.beforeEach(async ({ page }) => {
      await page.route("https://**/*", (route) => route.fulfill({ body: "{}" }));
      await page.route("http://127.0.0.1:47790/**", (route) => route.fulfill({ body: "{}" }));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(() => {
        if (!localStorage.getItem("aerotizen.settings.v1"))
          localStorage.setItem("aerotizen.settings.v1", JSON.stringify({ home: ["demo0"], language: "en" }));
      });
      await page.goto(url);
      await page.waitForFunction(() => AeroTizen.apps.getSnapshot().ready);
      await page.locator("#gear").click();
    });

    test("category order and wallpaper buttons match the new menu; footer help is removed", async ({ page }) => {
      await expect(page.locator('[data-settings-drawer="menu"] [data-key^="section:"]')).toHaveText([
        /Appearance/,
        /Backgrounds/,
        /Applications/,
        /Weather/,
        /Inputs/,
        /Language/,
        /About/,
      ]);
      await expect(page.locator('[data-key="section:status"], [data-settings-help]')).toHaveCount(0);
      await openCategory(page, "wallpaper");

      expect(
        await page
          .locator("#wallpaper-categories [data-key]")
          .evaluateAll((nodes) => nodes.map((node) => node.dataset.key)),
      ).toEqual([
        "wallpaper-categories:solid",
        "wallpaper-categories:gradient",
        "wallpaper-categories:animated",
        "wallpaper-categories:photo",
      ]);
      await expect(page.getByRole("button", { name: "Solid colors", exact: true })).toBeVisible();
    });

    test("Appearance contains the clock controls and applies and persists accent colours", async ({ page }) => {
      await openCategory(page, "appearance");
      await expect(page.locator('[data-section-pane="appearance"] #time-formats')).toHaveCount(1);
      await expect(page.locator('[data-section-pane="appearance"] #date-formats')).toHaveCount(1);
      await expect(page.locator('#accent-colours [role="button"]')).toHaveCount(6);
      await page.locator('[data-key="accent:violet"]').click();
      await expect(page.locator('[data-key="accent:violet"]')).toHaveAttribute("aria-pressed", "true");
      expect(await page.locator("html").evaluate((n) => getComputedStyle(n).getPropertyValue("--focus").trim())).toBe(
        "#b6a0df",
      );
      await page.locator('[data-key="time:none"]').click();
      await page.locator('[data-key="date:none"]').click();
      await closeSettings(page);
      await expect(page.locator('[data-clock-part="time"]')).toBeHidden();
      await expect(page.locator('[data-clock-part="date"]')).toBeHidden();
      await page.reload();
      expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().accentColour)).toBe("violet");
      await page.locator("#gear").click();
      await openCategory(page, "appearance");
      await expect(page.locator('[data-key="accent:violet"]')).toHaveAttribute("aria-pressed", "true");
    });

    test("Applications uses one column of readable rows with remote favorite toggles", async ({ page }) => {
      await openCategory(page, "apps");
      const rows = page.locator("#all-apps > [data-application-row]");
      expect(await rows.count()).toBeGreaterThan(4);
      const boxes = await rows.evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }),
      );
      for (let i = 0; i < boxes.length; i++) {
        expect(boxes[i].height).toBe(76);
        expect(boxes[i].width).toBeGreaterThan(600);
        expect(boxes[i].x).toBe(boxes[0].x);
        if (i) expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].y + 76);
      }
      await page.locator('[data-key="app:demo1"]').focus();
      await page.keyboard.press("Enter");
      await expect(page.locator('[data-key="app:demo1"]')).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator('[data-key="app:demo1"] [data-selection-indicator]')).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator('#all-apps [data-key="app:demo1"] + [data-application-row]')).toBeFocused();
      await closeSettings(page);
      await expect(page.locator('#grid [data-id="demo1"]')).toBeVisible();
      await page.reload();
      expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().home)).toContain("demo1");
    });
  });
}
