import fs from "node:fs";
import path from "node:path";

export interface Skill {
  /** Directory name, also the symlink name created in each target. */
  name: string;
  /**
   * Grouping label, for display and for reasoning about the library. Comes
   * from `group:` in skills.yaml — not from disk — so re-grouping is a
   * one-line config edit rather than a directory move plus relink.
   */
  group: string;
  /** Absolute path to the skill directory. */
  sourcePath: string;
  /**
   * One-line summary. Taken from `description:` in skills.yaml when present,
   * otherwise from the SKILL.md frontmatter.
   */
  description: string;
}

export type LinkState = "linked" | "missing" | "wrong-target" | "not-a-symlink";

export interface LinkStatus {
  state: LinkState;
  currentTarget: string | null;
}

export type LinkAction =
  | "created"
  | "replaced"
  | "removed"
  | "ok"
  | "skipped"
  | "error";

export interface LinkResult {
  skill: string;
  targetDir: string;
  action: LinkAction;
  message?: string;
}

export interface Target {
  id: string;
  label: string;
  path: string;
}

function isENOENT(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "ENOENT"
  );
}

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

export function skillsSourceDir(repoRoot: string): string {
  return path.join(repoRoot, "_other", "skills");
}

/** Pull `description:` out of a SKILL.md YAML frontmatter block. */
function readDescription(skillDir: string): string {
  let text: string;
  try {
    text = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  } catch {
    return "";
  }

  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!frontmatter) return "";

  const line = /^description:\s*(.+)$/m.exec(frontmatter[1]);
  if (!line) return "";

  return line[1].trim().replace(/^["']|["']$/g, "");
}

/**
 * Discover every skill directory directly under `sourceDir`. A directory is a
 * skill when it contains a SKILL.md; anything else is ignored, so notes and
 * scratch folders can live alongside without confusing the linker.
 *
 * The layout is deliberately flat. Grouping is metadata in skills.yaml, which
 * means changing how the library is organised never breaks a symlink.
 */
export function discoverSkills(sourceDir: string): Skill[] {
  const skills: Skill[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  } catch {
    return skills;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

    const sourcePath = path.join(sourceDir, entry.name);
    try {
      fs.statSync(path.join(sourcePath, "SKILL.md"));
    } catch {
      continue;
    }

    skills.push({
      name: entry.name,
      group: UNGROUPED,
      sourcePath,
      description: readDescription(sourcePath),
    });
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/** Group label used for skills the config does not place in a group. */
export const UNGROUPED = "ungrouped";

/**
 * Nested skill directories are the pre-flatten layout. Detecting them lets the
 * CLI say what to do instead of silently finding nothing.
 */
export function findNestedSkills(sourceDir: string): string[] {
  const nested: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  } catch {
    return nested;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(sourceDir, entry.name);
    if (fs.existsSync(path.join(dir, "SKILL.md"))) continue;

    try {
      for (const child of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!child.isDirectory()) continue;
        if (fs.existsSync(path.join(dir, child.name, "SKILL.md"))) {
          nested.push(`${entry.name}/${child.name}`);
        }
      }
    } catch {
      // unreadable directory — nothing to report
    }
  }

  return nested.sort();
}

/** The relative path a symlink at `linkDir/<name>` should point at. */
export function expectedRelativeTarget(linkDir: string, sourcePath: string): string {
  return path.relative(linkDir, sourcePath);
}

export function inspectLink(linkPath: string, expectedSource: string): LinkStatus {
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(linkPath);
  } catch (error) {
    if (isENOENT(error)) {
      return { state: "missing", currentTarget: null };
    }
    throw error;
  }

  if (!stat.isSymbolicLink()) return { state: "not-a-symlink", currentTarget: null };

  const currentTarget = fs.readlinkSync(linkPath);
  const linkDir = path.resolve(linkPath, "..");
  const correct = path.resolve(linkDir, currentTarget) === path.resolve(expectedSource);

  return { state: correct ? "linked" : "wrong-target", currentTarget };
}

export function statusLabel(status: LinkStatus): string {
  switch (status.state) {
    case "linked":
      return "linked";
    case "missing":
      return "missing";
    case "wrong-target":
      return "wrong target";
    case "not-a-symlink":
      return "not a symlink";
  }
}

export function linkSkill(
  skill: Skill,
  targetDir: string,
  options: { dryRun?: boolean } = {},
): LinkResult {
  const linkPath = path.join(targetDir, skill.name);
  const relativeTarget = expectedRelativeTarget(targetDir, skill.sourcePath);
  const status = inspectLink(linkPath, skill.sourcePath);

  if (status.state === "linked") {
    return { skill: skill.name, targetDir, action: "ok", message: "already linked" };
  }

  if (status.state === "not-a-symlink") {
    return {
      skill: skill.name,
      targetDir,
      action: "skipped",
      message: "a real file or directory is in the way — remove it first",
    };
  }

  const action: LinkAction = status.state === "missing" ? "created" : "replaced";

  if (options.dryRun) {
    return { skill: skill.name, targetDir, action, message: relativeTarget };
  }

  try {
    fs.mkdirSync(targetDir, { recursive: true });
    if (status.state === "wrong-target") fs.unlinkSync(linkPath);
    fs.symlinkSync(relativeTarget, linkPath);
    return { skill: skill.name, targetDir, action, message: relativeTarget };
  } catch (error) {
    return {
      skill: skill.name,
      targetDir,
      action: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Remove a skill's symlink from a target directory. Only removes symlinks that
 * point into `_other/skills` — a real file or directory, or a symlink to
 * somewhere else entirely, is left untouched.
 */
export function unlinkSkill(
  skillName: string,
  targetDir: string,
  options: { dryRun?: boolean } = {},
): LinkResult {
  const linkPath = path.join(targetDir, skillName);

  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(linkPath);
  } catch (error) {
    if (isENOENT(error)) {
      return { skill: skillName, targetDir, action: "ok", message: "not linked" };
    }
    throw error;
  }

  if (!stat.isSymbolicLink()) {
    return {
      skill: skillName,
      targetDir,
      action: "skipped",
      message: "a real file or directory — not removing it",
    };
  }

  const currentTarget = fs.readlinkSync(linkPath);
  if (!currentTarget.includes(path.join("_other", "skills"))) {
    return {
      skill: skillName,
      targetDir,
      action: "skipped",
      message: `points outside _other/skills (${currentTarget})`,
    };
  }

  if (options.dryRun) {
    return { skill: skillName, targetDir, action: "removed", message: currentTarget };
  }

  try {
    fs.unlinkSync(linkPath);
    return { skill: skillName, targetDir, action: "removed", message: currentTarget };
  } catch (error) {
    return {
      skill: skillName,
      targetDir,
      action: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export function linkAll(
  skills: Skill[],
  targetDirs: string[],
  options: { dryRun?: boolean } = {},
): LinkResult[] {
  const results: LinkResult[] = [];
  for (const targetDir of targetDirs) {
    for (const skill of skills) {
      results.push(linkSkill(skill, targetDir, options));
    }
  }
  return results;
}

/**
 * Bring every target into line with `wanted`: link the skills it says belong in
 * a target, remove the managed symlinks of those it says do not.
 */
export function reconcile(
  skills: Skill[],
  targets: Target[],
  wanted: (skill: Skill, target: Target) => boolean,
  options: { dryRun?: boolean } = {},
): LinkResult[] {
  const results: LinkResult[] = [];

  for (const target of targets) {
    for (const skill of skills) {
      results.push(
        wanted(skill, target)
          ? linkSkill(skill, target.path, options)
          : unlinkSkill(skill.name, target.path, options),
      );
    }
  }

  return results;
}

/** Symlinks into _other/skills that no longer match a discovered skill. */
export function findOrphans(skills: Skill[], targetDir: string): string[] {
  const known = new Set(skills.map((s) => s.name));
  const orphans: string[] = [];

  try {
    for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
      if (!entry.isSymbolicLink() || known.has(entry.name)) continue;
      const target = fs.readlinkSync(path.join(targetDir, entry.name));
      if (target.includes(path.join("_other", "skills"))) orphans.push(entry.name);
    }
  } catch {
    // target dir does not exist yet
  }

  return orphans.sort();
}

export function shortTargetDir(targetDir: string): string {
  return targetDir.split("/").slice(-2).join("/");
}

export function summarize(results: LinkResult[]): Record<LinkAction, number> {
  const counts: Record<LinkAction, number> = {
    created: 0,
    replaced: 0,
    removed: 0,
    ok: 0,
    skipped: 0,
    error: 0,
  };
  for (const result of results) counts[result.action]++;
  return counts;
}

export function formatResults(results: LinkResult[]): string {
  if (results.length === 0) return "Nothing to do.";

  const lines = results.map((r) => {
    const detail = r.message ? ` (${r.message})` : "";
    return `${r.action.padEnd(8)} ${r.skill} -> ${shortTargetDir(r.targetDir)}${detail}`;
  });

  const counts = summarize(results);
  const summary = (Object.entries(counts) as [LinkAction, number][])
    .filter(([, n]) => n > 0)
    .map(([action, n]) => `${n} ${action}`)
    .join(", ");

  return [...lines, "", summary].join("\n");
}
