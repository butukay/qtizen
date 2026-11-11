"""Copy an existing signing/Home profile into qtizen without moving recovery data."""

import os
import shutil
from pathlib import Path


def migrate(destination):
    destination = Path(destination)
    legacy = destination.with_name("aerotizen")
    if destination.exists() or not legacy.is_dir():
        return
    if legacy.is_symlink() or any(path.is_symlink() for path in legacy.rglob("*")):
        raise ValueError("Legacy profile contains links; copy the signing profile manually")
    staging = destination.with_name(".qtizen-profile-migration")
    if staging.exists():
        raise ValueError("An incomplete profile migration exists; keep it for recovery")
    # Root package identities and pairing are different. Keep old receipts in their
    # original directory so the old CLI can remove its own helper safely.
    shutil.copytree(legacy, staging, ignore=shutil.ignore_patterns("root", "root-cache", "*.lock"))
    for path in (staging, *staging.rglob("*")):
        path.chmod(0o700 if path.is_dir() else 0o600)
    os.rename(staging, destination)
