import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

import { type Skill, type Target, UNGROUPED } from "./skills.ts";

/** Which targets a skill should be linked into. */
export type SkillToggle = boolean | string[];

export interface SkillEntry {
  /** Grouping label, for display only — it never affects paths. */
  group: string;
  /** One-line summary, so pruning decisions can be made from this file alone. */
  description: string;
  /** Which targets to link into. */
  targets: SkillToggle;
}

export interface Config {
  targets: Target[];
  /** skill name -> entry */
  skills: Record<string, SkillEntry>;
  /** Absolute path the config was read from, or null when using defaults. */
  path: string | null;
}

export const CONFIG_RELATIVE_PATH = path.join(
  "_other",
  "scripts",
  "link-skills",
  "data",
  "skills.yaml",
);

export function configPath(repoRoot: string): string {
  return path.join(repoRoot, CONFIG_RELATIVE_PATH);
}

const DEFAULT_TARGETS: ReadonlyArray<{ id: string; path: string }> = [
  { id: "agents", path: ".agents/skills" },
  { id: "claude", path: ".claude/skills" },
  { id: "cursor", path: ".cursor/skills" },
];

function defaultConfig(repoRoot: string): Config {
  return {
    targets: DEFAULT_TARGETS.map(({ id, path: targetPath }) => ({
      id,
      label: targetPath,
      path: path.join(repoRoot, ...targetPath.split("/")),
    })),
    skills: {},
    path: null,
  };
}

function fail(message: string): never {
  throw new Error(`skills.yaml: ${message}`);
}

function parseTargets(raw: unknown, repoRoot: string): Target[] {
  if (raw === undefined || raw === null) return defaultConfig(repoRoot).targets;
  if (!Array.isArray(raw)) fail("`targets` must be a list");

  const targets: Target[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) {
      fail("each target must be a mapping with `id` and `path`");
    }

    const { id, path: targetPath, enabled } = entry as Record<string, unknown>;

    if (typeof id !== "string" || id.length === 0) fail("each target needs a string `id`");
    if (typeof targetPath !== "string" || targetPath.length === 0) {
      fail(`target "${id}" needs a string \`path\``);
    }
    if (enabled !== undefined && typeof enabled !== "boolean") {
      fail(`target "${id}": \`enabled\` must be true or false`);
    }
    if (seen.has(id)) fail(`duplicate target id "${id}"`);
    seen.add(id);

    if (enabled === false) continue;

    targets.push({
      id,
      label: targetPath,
      path: path.join(repoRoot, ...targetPath.split("/")),
    });
  }

  if (targets.length === 0) fail("no targets are enabled");

  return targets;
}

/** Validate a `targets:` value: true, false, or a list of known target ids. */
function parseToggle(raw: unknown, where: string, targetIds: Set<string>): SkillToggle {
  if (typeof raw === "boolean") return raw;

  if (Array.isArray(raw)) {
    return raw.map((entryId) => {
      if (typeof entryId !== "string") fail(`${where}: target ids must be strings`);
      if (!targetIds.has(entryId)) {
        fail(`${where}: unknown target "${entryId}" (known: ${[...targetIds].join(", ")})`);
      }
      return entryId;
    });
  }

  fail(`${where}: expected true, false, or a list of target ids`);
}

/**
 * Parse the flat `skills:` mapping. Each skill is either a full mapping —
 *
 *   git-flow:
 *     group: git
 *     description: Branch, PR and merge workflow
 *     targets: [agents]
 *
 * — or the shorthand `git-flow: [agents]` / `true` / `false` when the group and
 * description do not matter yet.
 */
function parseSkills(raw: unknown, targetIds: Set<string>): Record<string, SkillEntry> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) fail("`skills` must be a mapping");

  const out: Record<string, SkillEntry> = {};

  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    const where = `skills.${name}`;

    if (typeof value === "boolean" || Array.isArray(value)) {
      out[name] = {
        group: UNGROUPED,
        description: "",
        targets: parseToggle(value, where, targetIds),
      };
      continue;
    }

    if (typeof value !== "object" || value === null) {
      fail(
        `${where}: expected a mapping with \`targets\`, or the shorthand ` +
          `true / false / a list of target ids`,
      );
    }

    const { group, description, targets } = value as Record<string, unknown>;

    if (group !== undefined && typeof group !== "string") {
      fail(`${where}: \`group\` must be a string`);
    }
    if (description !== undefined && typeof description !== "string") {
      fail(`${where}: \`description\` must be a string`);
    }
    if (targets === undefined) fail(`${where}: missing \`targets\``);

    out[name] = {
      group: group ?? UNGROUPED,
      description: description ?? "",
      targets: parseToggle(targets, `${where}.targets`, targetIds),
    };
  }

  return out;
}

/**
 * Fold config metadata into the skills discovered on disk. The config owns
 * `group` outright; it may override a SKILL.md description but never erases
 * one by omission.
 */
export function applyMetadata(config: Config, skills: Skill[]): Skill[] {
  return skills.map((skill) => {
    const entry = config.skills[skill.name];
    if (!entry) return skill;
    return {
      ...skill,
      group: entry.group,
      description: entry.description || skill.description,
    };
  });
}

/** Read data/skills.yaml, falling back to sensible defaults when absent. */
export function loadConfig(repoRoot: string): Config {
  const filePath = configPath(repoRoot);

  let text: string;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (isENOENT(error)) return defaultConfig(repoRoot);
    throw error;
  }

  let document: unknown;
  try {
    document = parse(text);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  if (document === null || document === undefined) return defaultConfig(repoRoot);
  if (typeof document !== "object" || Array.isArray(document)) {
    fail("expected a mapping at the top level");
  }

  const { targets: rawTargets, skills: rawSkills } = document as Record<string, unknown>;
  const targets = parseTargets(rawTargets, repoRoot);
  const skills = parseSkills(rawSkills, new Set(targets.map((t) => t.id)));

  return { targets, skills, path: filePath };
}

function isENOENT(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "ENOENT"
  );
}

/**
 * Whether `skill` should be linked into `target`. Skills absent from the config
 * default to enabled everywhere, so a newly added skill works before it is
 * pinned in YAML.
 */
export function isEnabled(config: Config, skill: Skill, target: Target): boolean {
  const entry = config.skills[skill.name];
  if (entry === undefined) return true;
  if (typeof entry.targets === "boolean") return entry.targets;
  return entry.targets.includes(target.id);
}

/** Skills on disk that the config does not mention, so they can be reported. */
export function unpinnedSkills(config: Config, skills: Skill[]): Skill[] {
  return skills.filter((skill) => config.skills[skill.name] === undefined);
}

/** Skills listed in the config that no longer exist on disk. */
export function missingSkills(config: Config, skills: Skill[]): string[] {
  const onDisk = new Set(skills.map((s) => s.name));
  return Object.keys(config.skills)
    .filter((name) => !onDisk.has(name))
    .sort();
}
