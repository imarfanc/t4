#!/usr/bin/env python3
"""Align a markdown table whose cells may contain emoji.

Emoji render 2 columns wide in monospace terminals/fonts, so padding by raw
character count breaks alignment on any row containing one. This script reads
a rough markdown table from stdin, computes each cell's display width, and
prints a properly padded version to stdout.

Usage:
    uv run --no-project align_table.py <<'EOF'
    | Area | What changed |
    | --- | --- |
    | 🔎 filter.ts | toLowerCase() applied to tag compare |
    EOF
"""

import sys
import unicodedata


def disp_width(s: str) -> int:
    w = 0
    for ch in s:
        cp = ord(ch)
        if cp in (0xFE0F, 0xFE0E, 0x200D) or unicodedata.combining(ch):
            continue
        w += 2 if (0x1F300 <= cp <= 0x1FAFF or 0x2600 <= cp <= 0x27BF) else 1
    return w


def parse_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [cell.strip() for cell in line.split("|")]


def is_separator_row(cells: list[str]) -> bool:
    return all(set(cell) <= set("-: ") and cell != "" for cell in cells)


def main() -> None:
    raw_lines = [l for l in sys.stdin.read().splitlines() if l.strip()]
    if not raw_lines:
        return

    rows = [parse_row(l) for l in raw_lines]
    # Drop any existing separator row(s); we'll regenerate it.
    content_rows = [r for r in rows if not is_separator_row(r)]

    if not content_rows:
        return

    num_cols = len(content_rows[0])
    widths = [
        max(disp_width(row[i]) for row in content_rows if i < len(row))
        for i in range(num_cols)
    ]

    def pad(cell: str, width: int) -> str:
        return cell + " " * (width - disp_width(cell))

    out_lines = []
    header, *body = content_rows
    out_lines.append(
        "| " + " | ".join(pad(c, w) for c, w in zip(header, widths)) + " |"
    )
    out_lines.append("| " + " | ".join("-" * w for w in widths) + " |")
    for row in body:
        out_lines.append(
            "| " + " | ".join(pad(c, w) for c, w in zip(row, widths)) + " |"
        )

    print("\n".join(out_lines))


if __name__ == "__main__":
    main()
