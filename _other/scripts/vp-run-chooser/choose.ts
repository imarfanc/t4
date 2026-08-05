// Grouped fuzzy-search picker for package.json scripts — run via `vp run choose`.

import { search, Separator } from "@inquirer/prompts";
import { spawnSync } from "node:child_process";
import readline from "node:readline";
import tty from "node:tty";
import pc from "picocolors";

import { findRepoRoot, loadTaskCatalog, type TaskEntry } from "./lib/catalog.ts";
import {
  brandTitle,
  groupHeading,
  iconForTask,
  mutedPath,
  pickerPrompt,
  TASK_INDENT,
} from "./lib/icons.ts";

const { bold, dim, red } = pc;

function printHelp(): void {
  console.log(`${bold("choose")} — grouped task picker for this repo

${bold("Usage")}
  vp run choose            Open the grouped picker (default menu)
  vp run <name>            Run one task directly

Groups and descriptions live in ${bold("_other/scripts/vp-run-chooser/tasks.yaml")}.
Built-in quality tools are outside the menu: vp fmt, vp lint, vp check.
`);
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

const repoRoot = findRepoRoot();
let catalog: TaskEntry[];

try {
  catalog = loadTaskCatalog(repoRoot);
} catch (error) {
  console.error(`${red("error")} ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

if (catalog.length === 0) {
  console.error(`${red("error")} No tasks to show — add scripts to package.json`);
  process.exit(1);
}

const groupOrder = [...new Set(catalog.map((entry) => entry.group))];

function matches(entry: TaskEntry, needle: string): boolean {
  if (!needle) return true;
  const hay = `${entry.name} ${entry.description} ${entry.group}`.toLowerCase();
  return hay.includes(needle);
}

function choicesForInput(input = ""): Array<{ name: string; value: string } | Separator> {
  const needle = input.trim().toLowerCase();
  const visible = catalog.filter((entry) => matches(entry, needle));
  const choices: Array<{ name: string; value: string } | Separator> = [];
  const nameWidth = Math.max(0, ...visible.map((entry) => entry.name.length));
  const headingWidth = nameWidth + 34;

  let first = true;
  for (const groupId of groupOrder) {
    const inGroup = visible.filter((entry) => entry.group === groupId);
    if (inGroup.length === 0) continue;

    if (!first) choices.push(new Separator(" "));
    first = false;

    choices.push(new Separator(groupHeading(groupId, headingWidth)));
    for (const entry of inGroup) {
      const mark = iconForTask(entry.name, entry.group);
      const padded = bold(entry.name) + " ".repeat(nameWidth - entry.name.length);
      const label = entry.description
        ? `${TASK_INDENT}${mark}  ${padded}  ${dim("·")}  ${dim(entry.description)}`
        : `${TASK_INDENT}${mark}  ${padded}`;
      choices.push({ name: label, value: entry.name });
    }
  }

  return choices;
}

function banner(): void {
  const home = process.env.HOME;
  const shownPath =
    home && repoRoot.startsWith(home) ? `~${repoRoot.slice(home.length)}` : repoRoot;

  console.log();
  console.log(`  ${brandTitle("repo-template")}   ${dim("type to filter")}`);
  console.log(`  ${mutedPath(shownPath)}`);
  console.log(`  ${dim("↑↓ move · enter runs · esc / ctrl+c / ctrl+d exits")}`);
  console.log();
}

if (!tty.isatty(0) || !tty.isatty(1)) {
  console.error(`${red("error")} Not a terminal — run a task directly: vp run <name>`);
  process.exit(1);
}

/** Restore the terminal, say goodbye once, and leave with a clean status. */
function cancel(reason: string, code = 0): never {
  if (process.stdin.isTTY && process.stdin.isRaw) process.stdin.setRawMode(false);
  process.stdout.write(`\n  ${dim(`${reason} — nothing ran.`)}\n\n`);
  process.stdout.write(SHOW_CURSOR);
  process.exit(code);
}

const SHOW_CURSOR = "\x1b[?25h";

// Esc is not a cancel key in @inquirer/prompts, so watch for it and abort.
const escape = new AbortController();
readline.emitKeypressEvents(process.stdin);

function onKeypress(_chunk: string, key: { name?: string } | undefined): void {
  if (key?.name === "escape") escape.abort();
}

process.stdin.on("keypress", onKeypress);
process.on("SIGINT", () => cancel("Interrupted", 130));
process.on("SIGTERM", () => cancel("Terminated", 143));

banner();

let taskName: string | undefined;

try {
  taskName = await search(
    {
      message: pickerPrompt(),
      pageSize: 16,
      source: async (input) => {
        const choices = choicesForInput(input);
        if (choices.length === 0) {
          return [{ name: dim("No matches"), value: "", disabled: true }];
        }
        return choices;
      },
    },
    // `signal` lives on the prompt context, not the config — passing it in the
    // config object is silently ignored.
    { signal: escape.signal },
  );
} catch (error) {
  // Ctrl+C and Ctrl+D surface as ExitPromptError; Esc as AbortPromptError.
  const name = error instanceof Error ? error.name : "";
  if (name === "AbortPromptError") cancel("Cancelled");
  if (name === "ExitPromptError") cancel("Cancelled", 130);
  throw error;
} finally {
  process.stdin.off("keypress", onKeypress);
}

if (!taskName) cancel("Cancelled");

// Hand the terminal back to the task: it owns Ctrl+C from here on.
process.removeAllListeners("SIGINT");
process.removeAllListeners("SIGTERM");

console.log();

const result = spawnSync("vp", ["run", taskName], {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
