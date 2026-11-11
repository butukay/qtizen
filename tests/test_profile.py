"""Signing keys and recovery backups survive the project rename."""

import pytest

from qtizen.profile import migrate


def test_profile_copies_certificates_and_home_backups_without_old_root_pairing(tmp_path):
    legacy = tmp_path / "aerotizen"
    for name in ("certs/device/author.p12", "home/device/backup.json", "root/device/receipt.json"):
        path = legacy / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"private original")
    destination = tmp_path / "qtizen"
    migrate(destination)
    assert (destination / "certs/device/author.p12").read_bytes() == b"private original"
    assert (destination / "home/device/backup.json").read_bytes() == b"private original"
    assert not (destination / "root").exists()
    assert (legacy / "root/device/receipt.json").read_bytes() == b"private original"
    migrate(destination)
    assert (destination / "certs/device/author.p12").read_bytes() == b"private original"


def test_existing_profile_is_never_overwritten(tmp_path):
    destination = tmp_path / "qtizen"
    destination.mkdir()
    (destination / "signing").write_text("new profile")
    migrate(destination)
    assert (destination / "signing").read_text() == "new profile"


def test_linked_profile_is_refused(tmp_path):
    source = tmp_path / "source"
    source.mkdir()
    (tmp_path / "aerotizen").symlink_to(source, target_is_directory=True)
    with pytest.raises(ValueError, match="links"):
        migrate(tmp_path / "qtizen")
    assert not (tmp_path / "qtizen").exists()
