#!/usr/bin/env python3
"""Crop decorative corner spikes, resize, and convert quest/achievement PNG icons to WebP."""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICONS_ROOT = ROOT / "public/media/content-icons"
TARGET_SIZE = 512
CROP_RATIO = 0.68  # keep center 68% — trims outer corner ornaments
WEBP_QUALITY = 85


def convert_png(png_path: Path) -> Path:
    webp_path = png_path.with_suffix(".webp")
    with Image.open(png_path) as img:
        img = img.convert("RGBA")
        w, h = img.size
        margin_x = int(w * (1 - CROP_RATIO) / 2)
        margin_y = int(h * (1 - CROP_RATIO) / 2)
        cropped = img.crop((margin_x, margin_y, w - margin_x, h - margin_y))
        resized = cropped.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)
        resized.save(webp_path, "WEBP", quality=WEBP_QUALITY, method=6)
    return webp_path


def main() -> None:
    converted = 0
    total_before = 0
    total_after = 0

    for subdir in ("quests", "achievements"):
        folder = ICONS_ROOT / subdir
        if not folder.is_dir():
            continue
        for png_path in sorted(folder.glob("*.png")):
            before = png_path.stat().st_size
            webp_path = convert_png(png_path)
            after = webp_path.stat().st_size
            png_path.unlink()
            converted += 1
            total_before += before
            total_after += after
            print(f"{webp_path.relative_to(ROOT)}  {(before/1024):.0f}KB -> {(after/1024):.0f}KB")

    print(f"\nConverted {converted} icons: {(total_before/1024/1024):.1f}MB -> {(total_after/1024/1024):.1f}MB")


if __name__ == "__main__":
    main()
