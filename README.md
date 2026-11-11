# qtizen

[![CI](https://github.com/butukay/qtizen/actions/workflows/ci.yml/badge.svg)](https://github.com/butukay/qtizen/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A minimal home screen for Samsung Tizen TVs. Your applications, sources and a
quiet space to land — with a flat interface, dark and light palettes, and no
recommendation feed on Home.

qtizen is an independent project maintained by [butukay](https://github.com/butukay),
built on [AeroTizen](https://github.com/helalaou/AeroTizen). It includes the launcher,
computer-side installation tools and optional on-TV root services. The original
history, authorship and MIT notices are retained; see [Credits](CREDITS.md).

![qtizen Home on Samsung S95F](docs/screenshots/default.png)

Actual 1920×1080 capture from Samsung QE65S95FAUXCE, with the widget disabled.

## What is included

- One Default interface with **Applications** and **Sources**, a discreet Settings
  button, adjustable card sizes and grid or scroll layouts.
- Light and dark appearance, full-theme accents, solid colours and animated backgrounds.
- Solar System and Moon widgets, with a separate foreground video layer that
  keeps the launcher active when a widget is static or disabled.
- Clock, weather, source names, application management and Continue Watching.
- Native Home integration on compatible TVs, with a watcher fallback.
- App launches that request suppression of Samsung's loading overlay.
- Optional root services for **None / Fade / Standard** application transitions and
  HDMI-CEC wake when selecting a sleeping source, tested with Apple TV.

The OLED-oriented design uses true black and restrained decoration. It does not
change Samsung's panel-maintenance routines. Keeping Home visible is a user choice,
not a guarantee against OLED image retention.

## Status and compatibility

This is the source release of a personal project. There are no qtizen binary
releases yet: build and install the local launcher using the instructions below.
`install launcher` and the update checker now target **butukay/qtizen** releases.

The custom interface, Home, app launches, all three transition modes and Apple TV
wake were tested on **Samsung QE65S95FAUXCE**, Tizen 9, firmware **1301.0**.
Automatic root reacquisition after a full power disconnect is **not yet verified**
on this TV. See the [exact-device report](docs/devices/s95f.md) for evidence and limits.
Reports for other TVs inherited from AeroTizen are identified separately in the
[compatibility guide](docs/tv-compatibility.md).

## Build and install

You need Python 3.10+, Node.js 22.12+ (or 20.19+), the .NET 6 SDK for native helpers,
a Samsung account, and a computer on the same network as the TV.

```sh
git clone https://github.com/butukay/qtizen.git
cd qtizen
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
npm ci
python cli/tools/build_home_query.py
python cli/tools/build_home_control.py
python cli/tools/build_root_runtime.py
npm run build
```

On Windows, activate the environment with `.venv\Scripts\Activate.ps1` in PowerShell.

1. On the TV, open **Apps**, enter **12345**, enable Developer Mode and set Host PC IP
   to your computer's local IP. Disconnect TV / One Connect power for 60 seconds,
   reconnect and turn it on.
2. Replace `TV_IP` below with the TV's address. Complete Samsung sign-in when the
   certificate command opens your browser. Keep the signing profile for future updates.

```sh
qtizen --tv TV_IP status
qtizen --tv TV_IP certs
qtizen --tv TV_IP install ./dist/launcher
```

3. Open **qtizen** from the TV's Apps screen. For the remote's Home button and startup,
   follow the [Native Home backup and setup guide](docs/home-pc-flow.md).

Root is optional. Install the ordinary launcher first; advanced transition and CEC
features use the [separate root helper](docs/root-cli.md). Follow its model checks,
backup and recovery steps; do not infer support from a similar model name.

### Updating an existing AeroTizen installation

Use its original signing certificates and install the local build as above. qtizen
retains `DclHome001`, existing settings keys, the `aerotizen` Python module and the
legacy CLI alias so current Home assignments and saved settings remain compatible.
The PC profile directory remains `~/.config/aerotizen`. These are compatibility
identifiers; the public application, command and release repository are qtizen.

## Development

```sh
npm run dev -- --host 0.0.0.0
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for builds, tests and component ownership.
Please include the exact model, firmware and observed behaviour in a
[TV report or bug report](https://github.com/butukay/qtizen/issues/new/choose).

## Guides

- [Default interface](docs/default-interface.md)
- [Launcher, widgets and Continue Watching](docs/launcher.md)
- [Installation, updates and removal](docs/manage-installation.md)
- [Native Home and recovery](docs/home-pc-flow.md)
- [Optional root helper](docs/root-cli.md)
- [S95F findings and tested boundaries](docs/devices/s95f.md)
- [Diagnostics](docs/diagnostics.md)
- [Samsung privacy settings](docs/settings.md) and [optional DNS lists](dns/)

## Contributors

<!-- contributors:start -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/butukay"><img src="https://github.com/butukay.png?size=100" width="64" height="64" alt="butukay"><br><sub>butukay</sub></a></td>
  </tr>
</table>
<!-- contributors:end -->

The original AeroTizen contributors are listed in [CREDITS.md](CREDITS.md).

## Credits and license

MIT. Copyright notices for Hamza El Alaoui, Vlad Lisov and contributors are retained
in [LICENSE](LICENSE). qtizen is derived from AeroTizen; root acquisition uses the
separate [samsung-tv-root](https://github.com/chris-ritsen/samsung-tv-root) project.
See [CREDITS.md](CREDITS.md) for dependencies and original contributors.

This project is not affiliated with Samsung or Apple. Application artwork and
trademarks belong to their respective owners.
