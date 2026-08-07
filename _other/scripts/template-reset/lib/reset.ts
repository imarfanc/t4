/**
 * Logic for template-reset. Returns plain data and writes files; all rendering
 * lives in template-reset.ts, so the behaviour is testable without a terminal.
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

import { unlinkSkill } from "../../link-skills/lib/skills.ts";

/** Marks where kept structure ends and shipped sample content begins. */
export const SAMPLE_MARKER = "<!-- template:sample -->";

export const CONFIG_RELATIVE_PATH = path.join(
  "_other",
  "scripts",
  "template-reset",
  "data",
  "template.yaml",
);

export interface TruncateRule {
  path: string;
  placeholder: string;
}

export interface DeleteRule {
  path: string;
  why: string;
}

export interface TemplateConfig {
  truncate: TruncateRule[];
  delete: DeleteRule[];
  skillsConfig: string | null;
  followups: string[];
}

export type PlanAction = "truncate" | "delete" | "already-clean" | "missing" | "error";

export interface PlanItem {
  path: string;
  action: PlanAction;
  /** Human-readable detail: why, or what went wrong. */
  detail: string;
}

export interface Plan {
  items: PlanItem[];
  /** skills.yaml keys left dangling by the deletions in this plan. */
  orphanedSkillKeys: string[];
  followups: string[];
}

function fail(message: string): never {
  throw new Error(`template.yaml: ${message}`);
}

function parseRuleList<T>(
  raw: unknown,
  key: string,
  build: (entry: Record<string, unknown>, where: string) => T,
): T[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) fail(`\`${key}\` must be a list`);

  return raw.map((entry, index) => {
    const where = `${key}[${index}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      fail(`${where} must be a mapping`);
    }
    return build(entry as Record<string, unknown>, where);
  });
}

function requireString(entry: Record<string, unknown>, key: string, where: string): string {
  const value = entry[key];
  if (typeof value !== "string" || value.length === 0) {
    fail(`${where} needs a non-empty string \`${key}\``);
  }
  return value;
}

export function loadConfig(repoRoot: string): TemplateConfig {
  const filePath = path.join(repoRoot, CONFIG_RELATIVE_PATH);

  let document: unknown;
  try {
    document = parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (isENOENT(error)) fail(`not found at ${CONFIG_RELATIVE_PATH}`);
    fail(error instanceof Error ? error.message : String(error));
  }

  if (typeof document !== "object" || document === null || Array.isArray(document)) {
    fail("expected a mapping at the top level");
  }

  const doc = document as Record<string, unknown>;

  const truncate = parseRuleList<TruncateRule>(doc.truncate, "truncate", (entry, where) => ({
    path: requireString(entry, "path", where),
    placeholder: requireString(entry, "placeholder", where),
  }));

  const toDelete = parseRuleList<DeleteRule>(doc.delete, "delete", (entry, where) => ({
    path: requireString(entry, "path", where),
    why: typeof entry.why === "string" ? entry.why : "",
  }));

  const followups = Array.isArray(doc.followups)
    ? doc.followups.filter((f): f is string => typeof f === "string")
    : [];

  return {
    truncate,
    delete: toDelete,
    skillsConfig: typeof doc.skills_config === "string" ? doc.skills_config : null,
    followups,
  };
}

function isENOENT(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "ENOENT"
  );
}

/** The file contents a truncate rule would produce, or null when already clean. */
export function truncatedContent(text: string, placeholder: string): string | null {
  const index = text.indexOf(SAMPLE_MARKER);
  if (index === -1) return null;
  return `${text.slice(0, index).trimEnd()}\n\n${placeholder}\n`;
}

/**
 * Work out what a reset would do, touching nothing. The CLI renders this and,
 * only on --apply, hands it back to `apply`.
 */
export function planReset(repoRoot: string, config: TemplateConfig): Plan {
  const items: PlanItem[] = [];

  for (const rule of config.truncate) {
    const absolute = path.join(repoRoot, rule.path);

    let text: string;
    try {
      text = fs.readFileSync(absolute, "utf8");
    } catch (error) {
      items.push({
        path: rule.path,
        action: isENOENT(error) ? "missing" : "error",
        detail: isENOENT(error) ? "not found — already removed?" : String(error),
      });
      continue;
    }

    items.push(
      truncatedContent(text, rule.placeholder) === null
        ? {
          path: rule.path,
          action: "already-clean",
          detail: `no ${SAMPLE_MARKER} — nothing to strip`,
        }
        : { path: rule.path, action: "truncate", detail: "strip sample content below marker" },
    );
  }

  for (const rule of config.delete) {
    const absolute = path.join(repoRoot, rule.path);
    items.push(
      fs.existsSync(absolute)
        ? { path: rule.path, action: "delete", detail: rule.why }
        : { path: rule.path, action: "missing", detail: "not found — already removed?" },
    );
  }

  return {
    items,
    orphanedSkillKeys: orphanedSkillKeys(config, items),
    followups: config.followups,
  };
}

/**
 * Skill directories this plan deletes, whose names will be left dangling in
 * skills.yaml. Reported rather than edited — rewriting someone's YAML
 * mechanically is worse than telling them which two lines to remove.
 */
function orphanedSkillKeys(config: TemplateConfig, items: PlanItem[]): string[] {
  if (!config.skillsConfig) return [];

  const skillsDir = path.join("_other", "skills");
  return items
    .filter((item) => item.action === "delete" && item.path.startsWith(`${skillsDir}${path.sep}`))
    .map((item) => path.basename(item.path))
    .sort();
}

export interface ApplyResult extends PlanItem {
  applied: boolean;
}

/**
 * Remove the symlinks left pointing at skill directories this run deleted.
 * `unlinkSkill` refuses to touch anything that is not a symlink into
 * `_other/skills`, so this cannot reach a real file.
 *
 * The alternative — leaving them for `skills:check` to report — means every
 * fresh adaptation starts with drift warnings that the person did not cause and
 * cannot fix without understanding two tools. Whoever breaks the links mends
 * them.
 */
export function unlinkDeletedSkills(
  repoRoot: string,
  skillNames: string[],
  targetDirs: string[],
): string[] {
  const removed: string[] = [];

  for (const targetDir of targetDirs) {
    for (const name of skillNames) {
      const result = unlinkSkill(name, path.join(repoRoot, targetDir));
      if (result.action === "removed") removed.push(`${targetDir}/${name}`);
    }
  }

  return removed.sort();
}

/** Carry out a plan. Only `truncate` and `delete` items touch the disk. */
export function applyPlan(repoRoot: string, config: TemplateConfig, plan: Plan): ApplyResult[] {
  const placeholders = new Map(config.truncate.map((rule) => [rule.path, rule.placeholder]));

  return plan.items.map((item) => {
    if (item.action !== "truncate" && item.action !== "delete") {
      return { ...item, applied: false };
    }

    const absolute = path.join(repoRoot, item.path);

    try {
      if (item.action === "delete") {
        fs.rmSync(absolute, { recursive: true, force: true });
        return { ...item, applied: true };
      }

      const text = fs.readFileSync(absolute, "utf8");
      const next = truncatedContent(text, placeholders.get(item.path) ?? "");
      if (next === null) return { ...item, action: "already-clean", applied: false };

      fs.writeFileSync(absolute, next, "utf8");
      return { ...item, applied: true };
    } catch (error) {
      return {
        ...item,
        action: "error",
        detail: error instanceof Error ? error.message : String(error),
        applied: false,
      };
    }
  });
}

/**
 * Markdown files carrying the sample marker that no rule covers. Catches sample
 * content added later and never registered — the drift this tool is meant to
 * make impossible to overlook.
 */
export function unregisteredSamples(repoRoot: string, config: TemplateConfig): string[] {
  const covered = new Set([
    ...config.truncate.map((r) => r.path),
    ...config.delete.map((r) => r.path),
  ]);

  const found: string[] = [];
  const skip = new Set(["node_modules", ".git", "dist", "build"]);

  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (skip.has(entry.name)) continue;
      const absolute = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

      const relative = path.relative(repoRoot, absolute);
      if (covered.has(relative)) continue;

      try {
        if (fs.readFileSync(absolute, "utf8").includes(SAMPLE_MARKER)) found.push(relative);
      } catch {
        // unreadable — nothing to report
      }
    }
  };

  walk(repoRoot);
  return found.sort();
}
