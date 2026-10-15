#!/usr/bin/env python3
"""Build a password-gated, single-file GitHub Pages release from public game source.

Usage:
  python -m pip install cryptography
  LEVEL32_PASSWORD='your-password' python tools/build.py

By design the source is public at /game/. The password only gates the homepage.
"""
from __future__ import annotations
import argparse
import base64
import getpass
import json
import os
from pathlib import Path
import re
import secrets

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
TEMPLATE = ROOT / "tools" / "gate_template.html"
OUTPUT = ROOT / "index.html"
ITERATIONS = 250_000


def game_as_single_html() -> str:
    html = (GAME / "index.html").read_text(encoding="utf-8")
    css = (GAME / "style.css").read_text(encoding="utf-8")
    sprites = (GAME / "sprite-renderer.js").read_text(encoding="utf-8")
    js = (GAME / "game.js").read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
    html = html.replace('<script src="sprite-renderer.js" defer></script>', '<script>\n' + sprites + '\n</script>')
    html = html.replace('<script src="game.js" defer></script>', '<script>\n' + js + '\n</script>')

    def image_data(match):
        path = match.group(1)
        if not path.startswith("assets/") or ".." in path:
            raise ValueError("Unsafe asset path: " + path)
        asset = GAME / path
        if not asset.is_file():
            raise FileNotFoundError(asset)
        ext = asset.suffix.lower()
        mime = {".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml"}.get(ext)
        if not mime:
            raise ValueError("Unsupported asset: " + str(asset))
        return "data:" + mime + ";base64," + base64.b64encode(asset.read_bytes()).decode("ascii")

    # Handles all <img src="assets/..."> and JS scene URLs; leaves absolute URLs alone.
    html = re.sub(r"assets/[\w-]+\.(?:webp|png|jpg|svg)", lambda m: image_data_path(m.group(0)), html)
    return html


def image_data_path(relative_path: str) -> str:
    path = GAME / relative_path
    if not path.is_file():
        raise FileNotFoundError(path)
    suffix = path.suffix.lower()
    mime = {".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml"}[suffix]
    return "data:" + mime + ";base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def build(password: str, redirect: bool = False) -> Path:
    if len(password) < 12:
        raise ValueError("Choose a password of at least 12 characters")
    if redirect:
        # Password-gated entry to the always-current /game/ source.
        # The exported standalone page remains available without --redirect.
        source = b"LEVEL32_REDIRECT_TO_GAME"
    else:
        source = game_as_single_html().encode("utf-8")
        assert b'<script>' in source and b'<style>' in source
    salt = secrets.token_bytes(16)
    iv = secrets.token_bytes(12)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS)
    key = kdf.derive(password.encode("utf-8"))
    encrypted = AESGCM(key).encrypt(iv, source, None)
    b64 = lambda blob: base64.b64encode(blob).decode("ascii")
    payload = {"iterations": ITERATIONS, "salt": b64(salt), "iv": b64(iv), "ciphertext": b64(encrypted)}
    gate = TEMPLATE.read_text(encoding="utf-8")
    if gate.count("__PAYLOAD__") != 1:
        raise ValueError("Expected one payload token in gate template")
    OUTPUT.write_text(gate.replace("__PAYLOAD__", json.dumps(payload, separators=(",", ":"))), encoding="utf-8")
    print(f"Built {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
    return OUTPUT


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build a password-gated Level 32 homepage")
    parser.add_argument("--redirect", action="store_true", help="After password entry, open the latest public /game/ build")
    args = parser.parse_args()
    password = os.environ.get("LEVEL32_PASSWORD") or getpass.getpass("Guest password: ")
    build(password, redirect=args.redirect)