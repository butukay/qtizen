const { expect } = require("@playwright/test");

// Reveal Settings with the same remote navigation used on TV.
async function openSettings(page) {
  if (await page.locator("#editor").isVisible()) return;
  const gear = page.locator("#gear");
  for (let step = 0; step < 50; step++) {
    if (await gear.evaluate((node) => node.dataset.focused === "true")) break;
    await page.keyboard.press("ArrowUp");
  }
  await expect(gear).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#editor")).toBeVisible();
}

// Use the real category controls; no private state or hidden-control activation.
async function openCategory(page, category) {
  await page.locator(`[data-key="section:${category}"]`).click();
  await expect(page.locator(`[data-section-pane="${category}"]`)).toBeVisible();
}
async function closeSettings(page) {
  if ((await page.locator("[data-settings-drawer=frame]").getAttribute("data-expanded")) === "true") {
    await page.keyboard.press("Escape");
  }
  await page.keyboard.press("Escape");
  await expect(page.locator("#editor")).toBeHidden();
}
module.exports = { openSettings, openCategory, closeSettings };
