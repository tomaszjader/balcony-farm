#!/usr/bin/env python3
"""Assemble the same dependency-free static site for GitHub Pages and Netlify."""
import argparse
import hashlib
import html
import os
from pathlib import Path, PurePosixPath
import shutil
import tempfile
import time
import urllib.parse
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ASSET_URL = "https://d2ol7oe51mr4n9.cloudfront.net/user_3MFcklXc9tO2EDGTrsecdDL9AMo/9380216e-f14d-467e-a530-bdacfc604c17.zip"
ASSET_SHA256 = "7607bea796dffdf58e589c1d9beb65fda555aaf131923f69a127f558b443df7c"
SOURCE_URL = "https://tomaszjader.github.io/balcony-farm"

def site_url():
    context = os.environ.get("CONTEXT", "")
    inferred = os.environ.get("URL") if context == "production" else (os.environ.get("DEPLOY_PRIME_URL") or os.environ.get("URL"))
    value = (os.environ.get("SITE_URL") or inferred or SOURCE_URL).rstrip("/")
    parsed = urllib.parse.urlsplit(value)
    if parsed.scheme not in ("https", "http") or not parsed.netloc or parsed.username or parsed.password or parsed.query or parsed.fragment or any(c.isspace() for c in value):
        raise ValueError("SITE_URL must be an absolute HTTP(S) URL without credentials, query or fragment")
    return value

def checked_archive(path):
    if hashlib.sha256(path.read_bytes()).hexdigest() != ASSET_SHA256:
        raise ValueError("Media checksum mismatch")
    with zipfile.ZipFile(path) as bundle:
        for entry in bundle.infolist():
            name = PurePosixPath(entry.filename)
            if name.is_absolute() or ".." in name.parts or not name.parts or "\\" in entry.filename:
                raise ValueError("Unsafe media archive path")
            if name.parts[0] != "assets" and not (len(name.parts) == 1 and name.suffix in (".png", ".ico")):
                raise ValueError("Unexpected media archive file")
            if (entry.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError("Media archive must not contain symlinks")

def download(path):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(ASSET_URL, timeout=60) as response, path.open("wb") as output:
                shutil.copyfileobj(response, output)
            checked_archive(path)
            return
        except (OSError, ValueError):
            if attempt == 2:
                raise
            time.sleep(2)

def build(archive=None):
    # Prepare and validate everything before replacing an earlier successful build.
    origin = site_url()
    with tempfile.TemporaryDirectory(prefix="balconyfarm-") as directory:
        temporary = Path(directory)
        media = Path(archive).resolve() if archive else temporary / "media.zip"
        if archive:
            checked_archive(media)
        else:
            download(media)
        stage = temporary / "site"
        stage.mkdir()
        for name in ("index.html", "styles.css", "main.js", ".nojekyll", "site.webmanifest", "robots.txt", "sitemap.xml"):
            shutil.copy2(ROOT / name, stage / name)
        shutil.copytree(ROOT / "en", stage / "en")
        with zipfile.ZipFile(media) as bundle:
            bundle.extractall(stage)
        for name in ("index.html", "en/index.html", "sitemap.xml"):
            path = stage / name
            path.write_text(path.read_text(encoding="utf-8").replace(SOURCE_URL, html.escape(origin, quote=True)), encoding="utf-8")
        path = stage / "robots.txt"
        path.write_text(path.read_text(encoding="utf-8").replace(SOURCE_URL, origin), encoding="utf-8")
        for name in ("index.html", "en/index.html", "assets/world/scene-01.mp4", "assets/world/scene-01-mobile.mp4"):
            if not (stage / name).is_file():
                raise ValueError("Missing deployment file: " + name)
        output = ROOT / "_site"
        if output.exists():
            shutil.rmtree(output)
        shutil.copytree(stage, output)
    print("Static site ready in _site (Polish: /, English: /en/).")
    print("Canonical site URL: " + origin)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets-archive", help="Use a local copy of the exact checksum-pinned media bundle")
    build(parser.parse_args().assets_archive)
