"""Crop emblem from logo.png (no wordmark) and write Next.js favicon assets."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "media" / "logo.png"
OUT_MARK = ROOT / "public" / "media" / "logo-mark.png"
OUT_ICON = ROOT / "src" / "app" / "icon.png"
OUT_APPLE = ROOT / "src" / "app" / "apple-icon.png"


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]
    bright = (rgb.max(axis=2) > 30) & (alpha > 10)
    row_counts = bright.sum(axis=1)

    ranges: list[tuple[int, int]] = []
    start: int | None = None
    for y, count in enumerate(row_counts):
        if count > 5 and start is None:
            start = y
        elif count <= 5 and start is not None:
            ranges.append((start, y - 1))
            start = None
    if start is not None:
        ranges.append((start, len(row_counts) - 1))

    if not ranges:
        raise SystemExit("no content found in logo")

    # Largest contiguous band is the emblem; smaller band below is the wordmark.
    emblem = max(ranges, key=lambda r: r[1] - r[0])
    y0, y1 = emblem

    col_counts = bright[y0 : y1 + 1, :].sum(axis=0)
    xs = np.where(col_counts > 0)[0]
    x0, x1 = int(xs[0]), int(xs[-1])

    pad = 8
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width - 1, x1 + pad)
    y1 = min(im.height - 1, y1 + pad)

    crop = im.crop((x0, y0, x1 + 1, y1 + 1))

    # Square canvas, transparent, emblem centered.
    side = max(crop.width, crop.height)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2), crop)

    OUT_MARK.parent.mkdir(parents=True, exist_ok=True)
    OUT_ICON.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT_MARK, "PNG")
    canvas.resize((32, 32), Image.Resampling.LANCZOS).save(OUT_ICON, "PNG")
    canvas.resize((180, 180), Image.Resampling.LANCZOS).save(OUT_APPLE, "PNG")
    print(f"ranges={ranges}")
    print(f"crop=({x0},{y0})-({x1},{y1}) side={side}")
    print(f"wrote {OUT_MARK}")
    print(f"wrote {OUT_ICON}")
    print(f"wrote {OUT_APPLE}")


if __name__ == "__main__":
    main()
