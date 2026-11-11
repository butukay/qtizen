const { test, expect } = require("@playwright/test");
const { openSettings, openCategory, closeSettings } = require("./drawer_helpers.cjs");

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
      await openSettings(page);
    });

    test("category order and wallpaper buttons match the new menu; footer help is removed", async ({ page }) => {
      await expect(page.locator('[data-settings-drawer="menu"] [data-key^="section:"]')).toHaveText([
        /Appearance/,
        /Backgrounds/,
        /Widgets/,
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

    test("Appearance contains the clock controls and applies and persists full colour palettes", async ({ page }) => {
      await openCategory(page, "appearance");
      await expect(page.locator('[data-section-pane="appearance"] #time-formats')).toHaveCount(1);
      await expect(page.locator('[data-section-pane="appearance"] #date-formats')).toHaveCount(1);
      await expect(page.locator('[data-key="appearance-mode:light"]')).toBeFocused();
      const accents = page.locator("#accent-colours").getByRole("button");
      await expect(accents).toHaveCount(7);
      await expect(accents.first()).toHaveAccessibleName("Default");
      await expect(accents.first()).toHaveAttribute("data-key", "accent:white");
      await expect(page.locator('[data-key="accent:black"]')).toHaveCount(0);
      await accents.first().click();
      await expect(page.locator("html")).toHaveAttribute("data-appearance", "dark");
      await expect(page.locator("html")).toHaveAttribute("data-palette", "white");
      await expect(page.locator('[data-settings-drawer="frame"]')).toHaveCSS("background-color", "rgb(23, 23, 25)");
      await page.locator('[data-key="appearance-mode:light"]').click();
      await expect(page.locator("html")).toHaveAttribute("data-appearance", "light");
      await expect(accents).toHaveCount(7);
      await expect(accents.first()).toHaveAccessibleName("Default");
      await expect(accents.first()).toHaveAttribute("data-key", "accent:black");
      await expect(page.locator('[data-key="accent:white"]')).toHaveCount(0);
      await expect(accents.first()).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator('[data-settings-drawer="frame"]')).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(page.locator('[data-settings-drawer="frame"]')).toHaveCSS("color", "rgb(33, 37, 43)");
      await expect(page.locator('[data-clock-part="time"]')).toHaveCSS("color", "rgb(243, 244, 246)");
      await page.locator('[data-key="accent:violet"]').click();
      await expect(page.locator("html")).toHaveAttribute("data-palette", "violet");
      await expect(page.locator('[data-settings-drawer="frame"]')).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await page.locator('[data-key="appearance-mode:dark"]').click();
      await expect(page.locator('[data-key="accent:white"]')).toBeVisible();
      await expect(page.locator('[data-key="accent:black"]')).toHaveCount(0);
      await expect(page.locator('[data-settings-drawer="frame"]')).toHaveCSS("background-color", "rgb(32, 22, 45)");
      await expect(page.locator('[data-settings-drawer="main"]')).toHaveCSS("background-color", "rgb(25, 15, 38)");
      await expect(page.locator('[data-key="home-card-columns:5"]')).toHaveCSS("color", "rgb(234, 223, 248)");
      await expect(page.locator('[data-key="accent:violet"]')).toHaveAttribute("aria-pressed", "true");
      expect(await page.locator("html").evaluate((n) => getComputedStyle(n).getPropertyValue("--focus").trim())).toBe(
        "#b6a0df",
      );
      await page.locator('[data-key="time:none"]').click();
      await page.locator('[data-key="date:none"]').click();
      await closeSettings(page);
      await expect(page.locator('#grid > [data-id="demo0"]')).toHaveCSS("background-color", "rgb(52, 36, 71)");
      await expect(page.locator("#inputs > [data-input-card]").first()).toHaveCSS(
        "background-color",
        "rgb(25, 15, 38)",
      );
      await expect(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 0)");
      await expect(page.locator('[data-clock-part="time"]')).toBeHidden();
      await expect(page.locator('[data-clock-part="date"]')).toBeHidden();
      await page.reload();
      expect(await page.evaluate(() => AeroTizen.settings.getSnapshot().accentColour)).toBe("violet");
      await expect(page.locator("html")).toHaveAttribute("data-palette", "violet");
      await openSettings(page);
      await openCategory(page, "appearance");
      await expect(page.locator('[data-key="accent:violet"]')).toHaveAttribute("aria-pressed", "true");
    });

    for (const { language, inward, outward } of [
      { language: "en", inward: "ArrowRight", outward: "ArrowLeft" },
      { language: "ar", inward: "ArrowLeft", outward: "ArrowRight" },
    ]) {
      test(`Weather exits towards the sidebar from offset controls (${language})`, async ({ page }) => {
        await page.evaluate((language) => AeroTizen.settings.update({ language }), language);
        await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
        await openCategory(page, "weather");
        const first = page.locator('[data-key="weather-display:true"]');
        const second = page.locator('[data-key="weather-display:false"]');
        const sidebar = page.locator('[data-key="section:weather"]');
        await first.focus();
        await page.keyboard.press(inward);
        await expect(second).toBeFocused();
        await page.keyboard.press(outward);
        await expect(first).toBeFocused();
        await page.keyboard.press(outward);
        await expect(sidebar).toBeFocused();
        await openCategory(page, "weather");
        await page.locator('[data-key="weather:change"]').focus();
        await page.keyboard.press(outward);
        await expect(sidebar).toBeFocused();
      });
    }

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
