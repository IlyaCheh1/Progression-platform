"""Generate docs/accounts.md from infra/local/seed/students.json."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "infra" / "local" / "seed" / "students.json"
OUT = ROOT / "docs" / "accounts.md"


def main() -> None:
    data = json.loads(SEED.read_text(encoding="utf-8"))
    source_hash = (data.get("sourceHash") or "")[:12]
    lines = [
        "# School accounts (production roster)\n",
        f"\nSource: `{data.get('source', '')}` hash `{source_hash}` "
        f"as-of `{data.get('asOf', '')}` sheet `{data.get('sheet', '')}`\n",
        "\nInitial passwords — change after first login in production.\n",
        "\n| Name | Role | Login | Password |\n|---|---|---|---|\n",
    ]
    for account in data["accounts"]:
        roles = account.get("roles") or ([account["role"]] if account.get("role") else ["student"])
        role = ", ".join(roles)
        lines.append(
            f"| {account['name']} | {role} | `{account['login']}` | `{account['password']}` |\n"
        )
    OUT.write_text("".join(lines), encoding="utf-8")
    print(f"wrote {OUT} ({len(data['accounts'])} accounts)")


if __name__ == "__main__":
    main()
