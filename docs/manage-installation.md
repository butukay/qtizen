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

## Migrate an existing AeroTizen installation

Keep the original CLI checkout and its private profile until migration is complete.
The helper's package ID changes from `org.aerotizen.roothelper` to
`org.qtizen.roothelper`, so it must be replaced rather than upgraded in place.

1. With the original AeroTizen CLI and original private root receipt, run
   `aerotizen --tv TV_IP root remove --yes`. Finish any requested Developer Mode
   and restart steps before continuing. This removes the helper's own startup
   registration and pairing; it preserves Home assignments.
2. Install the new qtizen CLI and build its native helpers. The first command
   automatically copies certificates and Home backups from `~/.config/aerotizen`
   into `~/.config/qtizen` when the new profile does not exist. The original profile
   stays available for recovery. Old root pairing is not copied into the new helper.
3. Install the local launcher with the same signing certificates. The `DclHome001`
   package ID stays stable so the TV updates the existing launcher and preserves
   its Home assignments. Saved interface settings are copied to `qtizen.*` keys.
4. If you use root features, follow [root setup](root-cli.md#user-flow) to install
   `org.qtizen.roothelper` and pair it with the new CLI. Complete the restart check
   before treating automatic root acquisition as verified.

The Python package, CLI, runtime assemblies, private root directory and protocol
names now use qtizen. Remaining AeroTizen names are migration inputs, historical
records and credits. Do not run both root helpers together: they share a bridge port.

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
