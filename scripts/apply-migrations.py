"""Apply school-api SQL migrations to DATABASE_URL."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "infra" / "local" / "migrations"
FILES = [
    "001_foundation.sql",
    "002_school_ops.sql",
    "003_phase_f.sql",
    "004_row_level.sql",
]


def main() -> int:
    dsn = os.environ.get("DATABASE_URL", "").strip()
    if not dsn:
        print("DATABASE_URL is empty", file=sys.stderr)
        return 1

    print("connecting...")
    with psycopg.connect(dsn, connect_timeout=15) as conn:
        conn.execute("SELECT 1")
        print("connected")
        for name in FILES:
            path = MIGRATIONS / name
            sql = path.read_text(encoding="utf-8")
            print(f"applying {name}...")
            with conn.cursor() as cur:
                cur.execute(sql)
            conn.commit()
            print(f"ok {name}")
    print("done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
