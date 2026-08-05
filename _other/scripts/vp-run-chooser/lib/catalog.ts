import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export const TASKS_RELATIVE_PATH = path.join("_other", "scripts", "vp-run-chooser", "tasks.yaml");

/** Entry point script — kept out of the menu it renders. */
export const PICKER_SCRIPT = "choose";

/** Walk up from `start` until a directory containing `_other/skills` is found. */
export function findRepoRoot(start = process.cwd()): string {
  let dir = path.resolve(start);

  while (true) {
    try {
      if (fs.statSync(path.join(dir, "_other", "skills")).isDirectory()) return dir;
    } catch {
      // keep walking
    }

    const parent = path.resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(
    `Could not find the repo root: no _other/skills directory found walking up from ${start}`,
  );
}

export function readPackageScripts(repoRoot: string): Record<string, string> {
  const raw = fs.readFileSync(path.join(repoRoot, "package.json"), "utf8");
  const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
  return pkg.scripts ?? {};
}

export interface TaskEntry {
  group: string;
  groupLabel: string;
  name: string;
  description: string;
}

interface TasksYaml {
  order?: string[];
  groups?: Record<string, Record<string, string>>;
}

export function loadTaskCatalog(repoRoot: string): TaskEntry[] {
  const scripts = readPackageScripts(repoRoot);
  const configPath = path.join(repoRoot, TASKS_RELATIVE_PATH);
  const document = parseTasksYaml(fs.readFileSync(configPath, "utf8"));

  const order = [...(document.order ?? Object.keys(document.groups ?? {})), "other"];
  const groups = document.groups ?? {};
  const catalog: TaskEntry[] = [];
  const assigned = new Set<string>();

  for (const groupId of order) {
    if (groupId === "other") continue;
    const tasks = groups[groupId];
    if (!tasks) continue;

    for (const [name, description] of Object.entries(tasks)) {
      if (name === PICKER_SCRIPT) continue;
      if (!scripts[name]) {
        throw new Error(`tasks.yaml: "${name}" is not a package.json script`);
      }
      catalog.push({
        group: groupId,
        groupLabel: groupId,
        name,
        description,
      });
      assigned.add(name);
    }
  }

  const other = Object.keys(scripts)
    .filter(
      (name) =>
        name !== PICKER_SCRIPT && !assigned.has(name) && !isSeparator(name, scripts[name]),
    )
    .sort();

  for (const name of other) {
    const command = scripts[name];
    const clipped = command.length > 56 ? `${command.slice(0, 53).trimEnd()}…` : command;
    catalog.push({
      group: "other",
      groupLabel: "other",
      name,
      description: clipped,
    });
  }

  return catalog;
}

/** Visual separators in package.json scripts — not runnable tasks. */
function isSeparator(name: string, command: string): boolean {
  return command === "" || name === "---";
}

function parseTasksYaml(text: string): TasksYaml {
  const document = parse(text) as TasksYaml | null;
  if (!document || typeof document !== "object") {
    throw new Error("tasks.yaml: expected a mapping at the top level");
  }
  return document;
}
