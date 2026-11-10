# Nord rice

This fork adds **Nord** under **Settings → Appearance → Interface appearance**.
Classic and Glass remain available. Nord is opt-in and survives launcher updates
and restarts through the existing preference store.

![Nord rice with sample apps and inputs](screenshots/nord-rice.png)

*Browser preview with sample apps and inputs, not a capture from a TV.*

Nord uses a true-black background, flat blue-grey surfaces and a thin cyan
remote focus. Cards have small corners and no gradients or shadows. The header
has no brand label or workspace numbers. English labels use Applications,
Favorites and TV. Inter provides the main typography; JetBrains Mono stays on small
workspace and section details. The existing clock, apps and HDMI positions are
preserved. Grid and horizontal scrolling, app sizes, favourites and the app actions
menu still work. Clock and date visibility, time format, language and numerals
follow the existing preferences.

The Solar System is a quiet schematic: a small Sun, eight muted planet dots,
fine orbital lines and a single Saturn ring. There are no image textures, lighting
or glow effects. Display sizes and distances are compressed to fit the scene.
Initial phases are composed for legibility, with approximate orbital-period ratios
from [NASA Space Place](https://spaceplace.nasa.gov/years-on-other-planets/en/).
This decorative orrery uses one Earth year per 180 seconds.

CSS orbital animation pauses when Home is inactive, while the idle presentation
is dimmed or blank, in Performance mode, and with reduced motion enabled. No
render loop or texture loading runs on the TV.

For OLED idle presentation, launcher and Settings fade to 18% opacity after 90
seconds without activity and to black after 180 seconds. The first navigation key
wakes the UI and is consumed, including its repeat and release, so it does not
activate an unseen app. App-control returns also wake the UI. Hidden applications,
native input playback and the Fireplace viewer are excluded from idle handling.
TV panel-care functions retain control of hardware protection.

The saved wallpaper and weather-photo preferences are preserved. Nord temporarily
uses its own static wallpaper and suspends weather photos; switching to Classic or
Glass restores the selected wallpaper. Native HDMI playback retains a transparent
page and its video surface is outside the idle UI layers.

For a browser preview, start `npm run dev` and open
`http://localhost:8019/?appearance=nord`. This uses a separate browser-only preference
profile and does not change the normal preview profile or a TV's preferences.

Fonts are bundled in `launcher/assets/fonts/`, including their complete SIL Open
Font Licenses.

For physical testing, build the launcher and update the existing package using the
same Samsung signing profile. Keep the `DclHome001.Home` app ID so the existing Home
and startup assignments continue to point to the launcher. Select Nord in Appearance.
Native Home and the root helper are not changed by this appearance feature.
