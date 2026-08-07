import fs from "node:fs";
import path from "node:path";

import { isEnabled, loadConfig as loadSkillsConfig } from "../../link-skills/lib/config.ts";
import { discoverSkills, reconcile, skillsSourceDir } from "../../link-skills/lib/skills.ts";
import {
  applyPlan,
  loadConfig as loadResetConfig,
  planReset,
  unlinkDeletedSkills,
} from "../../template-reset/lib/reset.ts";

const TEMPLATE_NAME = "repo-template";
const SAMPLE_SKILLS_START = "  # template:sample-skills:start";
const SAMPLE_SKILLS_END = "  # template:sample-skills:end";

export interface InitPlan {
  currentName: string;
  name: string;
  resetChanges: number;
  files: string[];
}

export interface InitResult {
  name: string;
  resetChanges: number;
  removedSkillLinks: number;
  skillLinkChanges: number;
  files: string[];
}

export function readPackage(repoRoot: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as Record<
    string,
    unknown
  >;
}

export function defaultProjectName(repoRoot: string): string {
  const folder = path.basename(repoRoot).toLowerCase();
  return isValidPackageName(folder) ? folder : "my-project";
}

export function isValidPackageName(name: string): boolean {
  if (name.length === 0 || name.length > 214 || name !== name.toLowerCase()) return false;
  return /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name);
}

export function planInitialization(repoRoot: string, name: string): InitPlan {
  const pkg = readPackage(repoRoot);
  const currentName = typeof pkg.name === "string" ? pkg.name : TEMPLATE_NAME;
  const reset = planReset(repoRoot, loadResetConfig(repoRoot));
  const resetChanges = reset.items.filter(
    (item) => item.action === "truncate" || item.action === "delete",
  ).length;
  const files = new Set<string>();

  if (currentName !== name) files.add("package.json");
  for (const file of ["README.md", "AGENTS.md"]) {
    if (headingNeedsUpdate(repoRoot, file, name)) files.add(file);
  }
  if (hasSampleSkillBlock(repoRoot)) {
    files.add("_other/scripts/link-skills/data/skills.yaml");
  }
  for (const item of reset.items) {
    if (item.action === "truncate" || item.action === "delete") files.add(item.path);
  }

  return { currentName, name, resetChanges, files: [...files].sort() };
}

export function applyInitialization(repoRoot: string, plan: InitPlan): InitResult {
  const resetConfig = loadResetConfig(repoRoot);
  const resetPlan = planReset(repoRoot, resetConfig);
  const skillTargets = loadSkillsConfig(repoRoot).targets.map((target) =>
    path.relative(repoRoot, target.path),
  );

  const resetResults = applyPlan(repoRoot, resetConfig, resetPlan);
  const resetFailures = resetResults.filter((result) => result.action === "error");
  if (resetFailures.length > 0) {
    throw new Error(
      resetFailures.map((failure) => `${failure.path}: ${failure.detail}`).join("; "),
    );
  }

  const removedSkillLinks = unlinkDeletedSkills(
    repoRoot,
    resetPlan.orphanedSkillKeys,
    skillTargets,
  ).length;

  removeSampleSkillBlock(repoRoot);
  writeProjectIdentity(repoRoot, plan.name);

  const skillsConfig = loadSkillsConfig(repoRoot);
  const skills = discoverSkills(skillsSourceDir(repoRoot));
  const linkResults = reconcile(skills, skillsConfig.targets, (skill, target) =>
    isEnabled(skillsConfig, skill, target),
  );
  const linkFailures = linkResults.filter(
    (result) => result.action === "error" || result.action === "skipped",
  );
  if (linkFailures.length > 0) {
    throw new Error(
      linkFailures
        .map((failure) => `${failure.targetDir}/${failure.skill}: ${failure.message}`)
        .join("; "),
    );
  }

  return {
    name: plan.name,
    resetChanges: resetResults.filter((result) => result.applied).length,
    removedSkillLinks,
    skillLinkChanges: linkResults.filter((result) => result.action !== "ok").length,
    files: plan.files,
  };
}

function headingNeedsUpdate(repoRoot: string, relativePath: string, name: string): boolean {
  try {
    const firstLine = fs
      .readFileSync(path.join(repoRoot, relativePath), "utf8")
      .split(/\r?\n/, 1)[0];
    return firstLine !== `# ${name}`;
  } catch {
    return false;
  }
}

function writeProjectIdentity(repoRoot: string, name: string): void {
  const packagePath = path.join(repoRoot, "package.json");
  const pkg = readPackage(repoRoot);
  pkg.name = name;
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

  for (const relativePath of ["README.md", "AGENTS.md"]) {
    const filePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    const next = text.replace(/^# .*$/m, `# ${name}`);
    fs.writeFileSync(filePath, next, "utf8");
  }
}

function hasSampleSkillBlock(repoRoot: string): boolean {
  const filePath = path.join(repoRoot, "_other/scripts/link-skills/data/skills.yaml");
  try {
    return fs.readFileSync(filePath, "utf8").includes(SAMPLE_SKILLS_START);
  } catch {
    return false;
  }
}

function removeSampleSkillBlock(repoRoot: string): void {
  const filePath = path.join(repoRoot, "_other/scripts/link-skills/data/skills.yaml");
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, "utf8");
  const start = text.indexOf(SAMPLE_SKILLS_START);
  if (start === -1) return;
  const end = text.indexOf(SAMPLE_SKILLS_END, start);
  if (end === -1) throw new Error(`skills.yaml: missing ${SAMPLE_SKILLS_END}`);

  const after = text.indexOf("\n", end);
  const next = `${text.slice(0, start).trimEnd()}\n${after === -1 ? "" : text.slice(after + 1)}`;
  fs.writeFileSync(filePath, next, "utf8");
}
