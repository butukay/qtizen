# Default interface

This personal fork has one **Default** interface. There is no appearance switch.
The old Classic, Glass and optional Nord interfaces are no longer shipped.

![Default interface with sample apps and inputs](screenshots/default.png)

_Browser preview with sample apps and inputs, not a capture from a TV._

The screen uses true black, flat blue-grey cards, a thin cyan focus outline and
Inter typography. The header contains only Settings at the top right. Time and
date sit beside a quiet Solar System. Favorites and Inputs share a label and
thin separator; neither shows an item count. The television source reads TV
with a muted Live subtitle. At 1920×1080 the Solar System occupies 760×355 pixels;
app cards are 184, 170 or 156 pixels tall for three, four or five columns.

Favorites are managed in Settings → Applications or with the long-press app menu.
Grid and horizontal scrolling, app sizes, HDMI names, time/date visibility,
language and numerals remain configurable. Existing favorites and input names
survive migration. Old theme and clock-layout preferences are discarded once;
old theme profiles start on black without weather photos. New wallpaper choices
continue to use the shared wallpaper service.

The Solar System has a small Sun, eight muted planet dots, fine orbital lines and
one Saturn ring. Sizes, distances and phases are composed for legibility rather
than physical scale or current sky positions. The moving artwork is a bundled,
silent 600×280 H.264 video, scaled by its component and looping after 120 seconds.
It pauses while Home is inactive, in Performance mode and with reduced motion.
An SVG fallback stays visible until playback starts and returns if decoding fails.
No remote video, texture download or JavaScript render loop runs on the TV.
Regenerate the asset with `node tools/render-solar-loop.mjs`; this optional offline
tool requires FFmpeg and the project's Playwright Chromium.

The launcher has no inactivity dimming and does not consume a wake key. While
visible it requests `SCREEN_SAVER_OFF` through Samsung's
[AppCommon API](https://developer.samsung.com/smarttv/develop/guides/fundamentals/setting-screensaver.html).
Playback-start events repeat the request after the media pipeline is ready.
Hiding or disposing the app restores `SCREEN_SAVER_ON`. The local SDK loads only
inside the Tizen widget. Pixel Shift, logo brightness and Pixel Refresh are unchanged.
On the QE65S95FAUXCE with firmware 1301, the API alone did not suppress the OLED
dot saver. Playing the solar video kept Home visible beyond four minutes, confirmed
by its owner. Browser tests do not establish that behavior on other televisions.

Run `npm run dev` and open `http://localhost:8019/` for a browser preview.
Fonts and their SIL Open Font Licenses are bundled in `launcher/assets/fonts/`.
Install updates with the existing signing profile and keep the `DclHome001.Home`
identity so the TV's Home and startup assignments remain valid.

Settings uses this order: Appearance, Backgrounds, Applications, Weather, Inputs,
Language and About. Appearance includes app layout, six accent colours, time/date
controls and Performance mode. Background choices start with Solid colors and end
with Weather photos. Applications and Continue Watching providers use full-width
rows with compact logos and inline selection marks. The sidebar footer has no
remote-button help. Existing app IDs, saved favorites and input names are unchanged.
