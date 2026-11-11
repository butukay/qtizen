# Update or remove qtizen

Start with [Build and install](../README.md#build-and-install) if this is your first install.
qtizen currently ships source only. Activate its Python environment and use `qtizen`
instead of `./qtizen` below. Until binary releases are published, update your source,
rebuild and run `qtizen --tv TV_IP install ./dist/launcher` with the same signing profile.

The release commands below describe future standalone builds. Run them from the
extracted CLI folder. The examples use macOS and Linux
syntax. In Windows PowerShell, use `.\qtizen.exe` in place of `./qtizen`.
Replace `TV_IP` with the TV's IP address.

Check the CLI version with `./qtizen --version`. In launcher 2.7.0, open
**Settings → About** to see the installed version and available updates.

## Update the launcher on the TV

```sh
./qtizen --tv TV_IP update launcher --check
./qtizen --tv TV_IP update launcher
```

The check shows the installed version, latest stable launcher, and minimum CLI
version. The update uses the saved signing certificates and keeps launcher settings.
It leaves current and newer versions in place.

If the TV omits the installed version, the update stops. To install the latest stable
launcher without a version comparison, run `./qtizen --tv TV_IP install launcher`.
This can replace a newer development build. To choose a release, add `--version X.Y.Z`
and replace `X.Y.Z` with its version.

## Update the CLI on your computer

```sh
./qtizen update cli --check
./qtizen update cli
./qtizen --version
```

These commands work without a TV connection. The updater verifies the download
and keeps a backup of the old executable. On Windows, wait for the completion
message after the original process exits. If you installed the CLI with Python,
the updater prints a package installer command.

See [release and update details](releases.md#assets-and-installation) for archive
checks, version requirements and Windows update recovery.

## Remove the launcher

If you enabled Native Home, [restore the original Home settings](home-pc-flow.md#restore-and-transfer-to-another-pc)
and power-cycle the TV first. Then run:

```sh
./qtizen --tv TV_IP uninstall launcher
```

The CLI asks for confirmation. Uninstall removes qtizen's settings from the TV.
Keep your PC signing certificates and the complete Home backup folder.

## List or remove other TV apps

Run `./qtizen --tv TV_IP apps` to list apps. Run `./qtizen --tv TV_IP debloat`
to select packages and review the list before confirming removal. See
[TV limits](tv-compatibility.md#tv-limits) for Samsung's restrictions.

## Other installation methods

- Add the extracted folder to `PATH` to run `qtizen` from any directory.
- With Python 3.10 or newer, you can install the CLI from the repository with
  `pip install git+https://github.com/butukay/qtizen`. This follows `main`.
  See [development setup](../CONTRIBUTING.md#development-setup) for the native helpers.
- To install a local widget, run `./qtizen --tv TV_IP install ./app.wgt`.

## Test a local build

Use the CLI and launcher from the same `main` checkout. Follow the
[development setup](../CONTRIBUTING.md#development-setup) to install the CLI and
build its native helpers. Run `npm run build` in that checkout, then install the
local launcher with the CLI from your development environment:

```sh
qtizen --tv TV_IP install ./dist/launcher
```

Use the explicit path for release testing. `install launcher` selects the latest
published stable launcher from GitHub. Before publication, builds from `main` can
show the previous release version. Record the commit or build ID for your test.
