"""Crop square talent badge PNGs to circular icons of uniform size."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path(__file__).resolve().parents[1] / "public/media/content-icons/talents"
BAK = Path(__file__).resolve().parents[3] / "tmp-higgs/talents/square-bak"
OUT_SIZE = 512


def detect_radius(rgb: Image.Image) -> int:
    arr = np.asarray(rgb.convert("L"), dtype=np.float32)
    h, w = arr.shape
    cy, cx = (h - 1) / 2.0, (w - 1) / 2.0
    max_r = int(min(cx, cy)) - 1
    angles = np.linspace(0, 2 * np.pi, 120, endpoint=False)
    corners = np.array(
        [
            rgb.getpixel((2, 2)),
            rgb.getpixel((w - 3, 2)),
            rgb.getpixel((2, h - 3)),
            rgb.getpixel((w - 3, h - 3)),
        ],
        dtype=np.float32,
    )
    bg = np.median(corners, axis=0)
    rgb_arr = np.asarray(rgb, dtype=np.float32)

    edge_scores: list[tuple[float, int]] = []
    for r in range(80, max_r - 2):
        ys = np.clip((cy + r * np.sin(angles)).astype(np.int32), 0, h - 1)
        xs = np.clip((cx + r * np.cos(angles)).astype(np.int32), 0, w - 1)
        yo = np.clip((cy + (r + 8) * np.sin(angles)).astype(np.int32), 0, h - 1)
        xo = np.clip((cx + (r + 8) * np.cos(angles)).astype(np.int32), 0, w - 1)
        ring = arr[ys, xs]
        outer = arr[yo, xo]
        contrast = float(np.mean(np.abs(ring - outer)))
        outer_rgb = rgb_arr[yo, xo]
        dist = np.linalg.norm(outer_rgb - bg, axis=1)
        white_frac = float(np.mean(np.min(outer_rgb, axis=1) > 230))
        dark_bg_frac = float(np.mean(dist < 35))
        bg_frac = max(white_frac, dark_bg_frac)
        score = contrast * (0.35 + 0.65 * bg_frac)
        score *= 0.75 + 0.25 * (r / max_r)
        edge_scores.append((score, r))

    band = [t for t in edge_scores if 0.62 * max_r <= t[1] <= 0.96 * max_r]
    if not band:
        band = edge_scores
    band.sort(key=lambda t: t[0], reverse=True)
    best = band[0]
    candidates = [t for t in band if t[0] >= best[0] * 0.78]
    r = max(t[1] for t in candidates)
    r = max(r, int(0.68 * max_r))
    return int(min(r, max_r - 2))


def to_circle(src: Path, dest: Path) -> int:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    r = detect_radius(im.convert("RGB"))
    r = int(min(r + 4, min(w, h) / 2 - 1))
    cx, cy = w // 2, h // 2
    crop = im.crop((cx - r, cy - r, cx + r, cy + r))
    d = crop.size[0]
    mask = Image.new("L", (d, d), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, d - 1, d - 1), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    out = Image.new("RGBA", (d, d), (0, 0, 0, 0))
    out.paste(crop, (0, 0))
    out.putalpha(mask)
    out = out.resize((OUT_SIZE, OUT_SIZE), Image.Resampling.LANCZOS)
    mask2 = Image.new("L", (OUT_SIZE, OUT_SIZE), 0)
    ImageDraw.Draw(mask2).ellipse((0, 0, OUT_SIZE - 1, OUT_SIZE - 1), fill=255)
    mask2 = mask2.filter(ImageFilter.GaussianBlur(0.5))
    channels = list(out.split())
    channels[3] = mask2
    Image.merge("RGBA", channels).save(dest, "PNG", optimize=True)
    return r


def main() -> None:
    if not BAK.exists():
        raise SystemExit(f"Backup folder missing: {BAK}")
    files = sorted(BAK.glob("*.png"))
    for src in files:
        r = to_circle(src, SRC / src.name)
        print(f"{src.name:35} r={r}")
    print(f"done {len(files)}")


if __name__ == "__main__":
    main()
