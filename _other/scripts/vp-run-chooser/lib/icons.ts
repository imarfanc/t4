import {
  getIconData,
  stringToColor,
  type IconifyIcon,
  type RGBColor,
} from "@iconify/utils";
import logos from "@iconify-json/logos/icons.json" with { type: "json" };
import mdi from "@iconify-json/mdi/icons.json" with { type: "json" };
import pc from "picocolors";

type IconSet = typeof mdi | typeof logos;

const ICON_SETS: Record<string, IconSet> = {
  mdi,
  logos,
};

export interface IconRef {
  set: string;
  name: string;
  fallback?: string;
}

const GROUP_ICONS: Record<string, IconRef> = {
  run: { set: "mdi", name: "play-circle", fallback: "#58a6ff" },
  check: { set: "mdi", name: "clipboard-check-outline", fallback: "#3fb950" },
  tools: { set: "mdi", name: "wrench-outline", fallback: "#d29922" },
  other: { set: "mdi", name: "dots-horizontal", fallback: "#8b949e" },
};

const TASK_ICONS: Record<string, IconRef> = {
  dev: { set: "logos", name: "vitejs", fallback: "#bd34fe" },
  start: { set: "mdi", name: "rocket-launch-outline", fallback: "#58a6ff" },
  browser: { set: "mdi", name: "web", fallback: "#79c0ff" },
  public: { set: "mdi", name: "earth", fallback: "#56d364" },
  "build:auth": { set: "mdi", name: "hammer-wrench", fallback: "#f0883e" },
  test: { set: "mdi", name: "test-tube", fallback: "#ff7b72" },
  "test:quick": { set: "mdi", name: "flash-outline", fallback: "#ffa657" },
  skills: { set: "mdi", name: "link-variant", fallback: "#d2a8ff" },
  "skills:all": { set: "mdi", name: "link-plus", fallback: "#bc8cff" },
  "skills:check": { set: "mdi", name: "link-check", fallback: "#3fb950" },
  "skills:prune": { set: "mdi", name: "link-off", fallback: "#f85149" },
  "skills:links": { set: "mdi", name: "format-list-bulleted", fallback: "#8b949e" },
  "skills:config": { set: "mdi", name: "cog-outline", fallback: "#8b949e" },
};

const UI_ICONS = {
  folder: { set: "mdi", name: "folder-open-outline", fallback: "#8b949e" },
  keyboard: { set: "mdi", name: "keyboard-outline", fallback: "#58a6ff" },
  logo: { set: "logos", name: "vitejs", fallback: "#bd34fe" },
} as const satisfies Record<string, IconRef>;

function loadIcon(ref: IconRef): IconifyIcon | undefined {
  const set = ICON_SETS[ref.set];
  if (!set) return undefined;
  return getIconData(set, ref.name);
}

function primaryFill(icon: IconifyIcon | undefined, fallback?: string): string {
  const body = icon?.body ?? "";
  const fills = [...body.matchAll(/fill="([^"]+)"/g)].map((match) => match[1]);
  for (const fill of fills) {
    if (fill.startsWith("#") && fill.toLowerCase() !== "#fff" && fill.toLowerCase() !== "#ffffff") {
      return fill;
    }
  }
  return fallback ?? "#8b949e";
}

function toRgb(hex: string): RGBColor | undefined {
  const color = stringToColor(hex);
  if (!color || color.type !== "rgb") return undefined;
  return color;
}

function rgb(text: string, hex: string): string {
  if (!pc.isColorSupported) return text;
  const color = toRgb(hex);
  if (!color) return text;
  return `\x1b[38;2;${color.r};${color.g};${color.b}m${text}\x1b[39m`;
}

function iconGlyph(ref: IconRef): string {
  const icon = loadIcon(ref);
  const hex = primaryFill(icon, ref.fallback);
  return rgb("◆", hex);
}

export function iconForTask(name: string, group: string): string {
  const ref = TASK_ICONS[name] ?? GROUP_ICONS[group] ?? GROUP_ICONS.other;
  return iconGlyph(ref);
}

export function groupHeading(group: string, width = 46): string {
  const ref = GROUP_ICONS[group] ?? GROUP_ICONS.other;
  const hex = primaryFill(loadIcon(ref), ref.fallback);
  const title = group.toUpperCase().split("").join(" ");
  const label = pc.bold(rgb(title, hex));
  const ruleLength = Math.max(2, width - title.length - 4);
  const rule = pc.dim("─".repeat(ruleLength));
  return `${GROUP_INDENT}${iconGlyph(ref)} ${label} ${rule}`;
}

/** Left padding for group headings and their tasks in the picker list. */
export const GROUP_INDENT = " ";
export const TASK_INDENT = "    ";

export function uiIcon(key: keyof typeof UI_ICONS): string {
  return iconGlyph(UI_ICONS[key]);
}

export function brandTitle(text: string): string {
  const vite = loadIcon(UI_ICONS.logo);
  const accent = loadIcon({ set: "mdi", name: "console-line", fallback: "#41d1ff" });
  const mid = Math.ceil(text.length / 2);
  const left = rgb(text.slice(0, mid), primaryFill(vite, "#bd34fe"));
  const right = rgb(text.slice(mid), primaryFill(accent, "#41d1ff"));
  return pc.bold(left + right);
}

export function mutedPath(path: string): string {
  return pc.dim(`${uiIcon("folder")} ${path}`);
}

export function pickerPrompt(): string {
  return `${uiIcon("keyboard")} ${pc.cyan("Select a task")}`;
}
