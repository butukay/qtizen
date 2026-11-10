# Nord rice

This fork adds **Nord** under **Settings → Appearance → Interface appearance**.
Classic and Glass remain available. Nord is opt-in and survives launcher updates
and restarts through the existing preference store.

![Nord rice with sample apps and inputs](screenshots/nord-rice.png)

*Browser preview with sample apps and inputs, not a capture from a TV.*

Nord uses a static graphite background, blue-grey surfaces, cyan remote focus and
bundled JetBrains Mono. The Home view has a workspace bar, clock, quiet mountain
illustration, monochrome app tiles and compact HDMI inputs. Grid and horizontal
scrolling, app sizes, favourites and the app actions menu still work. Clock and
date visibility, time format, language and numerals follow the existing preferences.

The saved wallpaper and weather-photo preferences are preserved. Nord temporarily
uses its own static wallpaper and suspends weather photos; switching to Classic or
Glass restores the selected wallpaper. Native HDMI playback retains a transparent
page and hides the decorative colour strip.

For a browser preview, start `npm run dev` and open
`http://localhost:8019/?appearance=nord`. This uses a separate browser-only preference
profile and does not change the normal preview profile or a TV's preferences.

The font is bundled in `launcher/assets/fonts/`; its complete SIL Open Font License
is included there. No font service or external wallpaper download is required.

For physical testing, build the launcher and update the existing package using the
same Samsung signing profile. Keep the `DclHome001.Home` app ID so the existing Home
and startup assignments continue to point to the launcher. Select Nord in Appearance.
Native Home and the root helper are not changed by this appearance feature.
