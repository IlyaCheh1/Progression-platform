"""One-shot helper: convert talent PNGs to WebP and rewrite catalog refs."""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TALENTS_DIR = ROOT / "apps/web/public/media/content-icons/talents"
STARTER = ROOT / "apps/web/public/content/starter.json"
PREVIEW = TALENTS_DIR / "preview.html"


def convert_pngs(max_size: int = 256, quality: int = 82) -> None:
    pngs = sorted(TALENTS_DIR.glob("*.png"))
    if not pngs:
        print("no PNGs to convert")
        return
    before = sum(f.stat().st_size for f in pngs)
    after = 0
    for png in pngs:
        im = Image.open(png).convert("RGBA")
        if max(im.size) > max_size:
            im = im.resize((max_size, max_size), Image.Resampling.LANCZOS)
        out = png.with_suffix(".webp")
        im.save(out, "WEBP", quality=quality, method=6)
        after += out.stat().st_size
        png.unlink()
        print(f"{png.name} -> {out.name}")
    print(f"size {before/1024/1024:.2f}MB -> {after/1024/1024:.2f}MB")


def rewrite_refs() -> None:
    text = STARTER.read_text(encoding="utf-8")
    updated = re.sub(r"(talents/[a-z0-9_.]+)\.png", r"\1.webp", text)
    STARTER.write_text(updated, encoding="utf-8")
    print("updated starter.json")

    if PREVIEW.exists():
        preview = PREVIEW.read_text(encoding="utf-8").replace(".png", ".webp")
        PREVIEW.write_text(preview, encoding="utf-8")
        print("updated preview.html")


if __name__ == "__main__":
    convert_pngs()
    rewrite_refs()
