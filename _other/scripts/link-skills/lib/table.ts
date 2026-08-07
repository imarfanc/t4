/** Minimal bordered table for terminal output (replaces @cliffy/table). */

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

function visibleLength(text: string): number {
  return text.replace(ANSI, "").length;
}

function padCell(text: string, width: number): string {
  const pad = width - visibleLength(text);
  return pad > 0 ? text + " ".repeat(pad) : text;
}

export function formatTable(options: {
  headers: string[];
  rows: string[][];
  indent?: number;
  padding?: number;
  maxWidth?: number;
}): string {
  const indent = " ".repeat(options.indent ?? 0);
  const gap = " ".repeat(options.padding ?? 2);
  const headers = options.headers;
  const rows = options.rows;
  const colCount = headers.length;

  const widths = headers.map((header, col) => {
    const cells = [header, ...rows.map((row) => row[col] ?? "")];
    return Math.max(...cells.map((cell) => visibleLength(cell)));
  });

  if (options.maxWidth) {
    const totalGap = gap.length * (colCount - 1);
    const maxPerCol = Math.floor((options.maxWidth - totalGap) / colCount);
    for (let i = 0; i < widths.length; i++) {
      widths[i] = Math.min(widths[i], maxPerCol);
    }
  }

  const line = (cells: string[]) =>
    indent + "│ " + cells.map((cell, i) => padCell(cell, widths[i])).join(gap + "│ ") + " │";

  const border =
    indent + "┌" + widths.map((w) => "─".repeat(w + 2)).join(gap.replace(/ /g, "─")) + "┐";

  const mid =
    indent + "├" + widths.map((w) => "─".repeat(w + 2)).join(gap.replace(/ /g, "─")) + "┤";

  const bottom =
    indent + "└" + widths.map((w) => "─".repeat(w + 2)).join(gap.replace(/ /g, "─")) + "┘";

  return [border, line(headers), mid, ...rows.map((row) => line(row)), bottom].join("\n");
}
