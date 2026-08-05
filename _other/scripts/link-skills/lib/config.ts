import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

import type { Skill, Target } from "./skills.ts";

/** Which targets a skill should be linked into. */
export type SkillToggle = boolean | string[];

export interface Config {
  targets: Target[];
  /** category -> skill name -> toggle */
  skills: Record<string, Record<string, SkillToggle>>;
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

function parseSkills(
  raw: unknown,
  targetIds: Set<string>,
): Record<string, Record<string, SkillToggle>> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) fail("`skills` must be a mapping");

  const out: Record<string, Record<string, SkillToggle>> = {};

  for (const [category, entries] of Object.entries(raw as Record<string, unknown>)) {
    if (entries === null) {
      out[category] = {};
      continue;
    }
    if (typeof entries !== "object" || Array.isArray(entries)) {
      fail(`\`skills.${category}\` must be a mapping of skill name to toggle`);
    }

    const group: Record<string, SkillToggle> = {};

    for (const [name, toggle] of Object.entries(entries as Record<string, unknown>)) {
      if (typeof toggle === "boolean") {
        group[name] = toggle;
        continue;
      }

      if (Array.isArray(toggle)) {
        const ids = toggle.map((entryId) => {
          if (typeof entryId !== "string") {
            fail(`skills.${category}.${name}: target ids must be strings`);
          }
          if (!targetIds.has(entryId)) {
            fail(
              `skills.${category}.${name}: unknown target "${entryId}" ` +
                `(known: ${[...targetIds].join(", ")})`,
            );
          }
          return entryId;
        });
        group[name] = ids;
        continue;
      }

      fail(`skills.${category}.${name}: expected true, false, or a list of target ids`);
    }

    out[category] = group;
  }

  return out;
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
  const toggle = config.skills[skill.category]?.[skill.name];
  if (toggle === undefined) return true;
  if (typeof toggle === "boolean") return toggle;
  return toggle.includes(target.id);
}

/** Skills on disk that the config does not mention, so they can be reported. */
export function unpinnedSkills(config: Config, skills: Skill[]): Skill[] {
  return skills.filter(
    (skill) => config.skills[skill.category]?.[skill.name] === undefined,
  );
}

/** Skills listed in the config that no longer exist on disk. */
export function missingSkills(config: Config, skills: Skill[]): string[] {
  const onDisk = new Set(skills.map((s) => `${s.category}/${s.name}`));
  const missing: string[] = [];

  for (const [category, entries] of Object.entries(config.skills)) {
    for (const name of Object.keys(entries)) {
      const key = `${category}/${name}`;
      if (!onDisk.has(key)) missing.push(key);
    }
  }

  return missing.sort();
}
