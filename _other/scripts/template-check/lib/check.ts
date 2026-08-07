import fs from "node:fs";
import path from "node:path";

import {
  applyMetadata,
  isEnabled,
  loadConfig as loadSkillsConfig,
  missingSkills,
  unpinnedSkills,
} from "../../link-skills/lib/config.ts";
import {
  discoverSkills,
  findOrphans,
  inspectLink,
  skillsSourceDir,
} from "../../link-skills/lib/skills.ts";
import { loadTaskCatalog, readPackageName } from "../../vp-run-chooser/lib/catalog.ts";
import {
  loadConfig as loadResetConfig,
  planReset,
  unregisteredSamples,
} from "../../template-reset/lib/reset.ts";

export type CheckLevel = "pass" | "warn" | "fail";

export interface CheckResult {
  level: CheckLevel;
  name: string;
  detail: string;
}

export function runChecks(repoRoot: string): CheckResult[] {
  const results: CheckResult[] = [];
  checkPackageAndTasks(repoRoot, results);
  checkInitialization(repoRoot, results);
  checkSkills(repoRoot, results);
  checkSymlinks(repoRoot, results);
  checkMarkdownLinks(repoRoot, results);
  checkPortableFiles(repoRoot, results);
  checkEnvironmentExample(repoRoot, results);
  return results;
}

function checkPackageAndTasks(repoRoot: string, results: CheckResult[]): void {
  try {
    const packagePath = path.join(repoRoot, "package.json");
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8")) as Record<string, unknown>;
    const manager = typeof pkg.packageManager === "string" ? pkg.packageManager : "";
    if (!/^pnpm@\d+\.\d+\.\d+$/.test(manager)) {
      results.push(fail("toolchain", "package.json needs an exact pnpm packageManager version"));
    } else {
      results.push(pass("toolchain", `${manager}; package.json parses`));
    }
    const tasks = loadTaskCatalog(repoRoot);
    results.push(pass("task catalog", `${tasks.length} task(s) match package.json`));
  } catch (error) {
    results.push(fail("package/tasks", message(error)));
  }
}

function checkInitialization(repoRoot: string, results: CheckResult[]): void {
  try {
    const name = readPackageName(repoRoot);
    const resetConfig = loadResetConfig(repoRoot);
    const resetPlan = planReset(repoRoot, resetConfig);
    const errors = resetPlan.items.filter((item) => item.action === "error");
    const pending = resetPlan.items.filter(
      (item) => item.action === "truncate" || item.action === "delete",
    );
    const stray = unregisteredSamples(repoRoot, resetConfig);

    if (errors.length > 0) {
      results.push(fail("sample registry", errors.map((item) => item.path).join(", ")));
    } else if (stray.length > 0) {
      results.push(fail("sample registry", `unregistered marker(s): ${stray.join(", ")}`));
    } else {
      results.push(pass("sample registry", "all sample markers are registered"));
    }

    if (name === "repo-template") {
      results.push(
        warn(
          "initialization",
          `${pending.length} sample change(s) remain; run template:init for a new repo`,
        ),
      );
    } else if (pending.length > 0) {
      results.push(
        fail("initialization", `${pending.length} sample change(s) remain after rename`),
      );
    } else {
      const wrongHeadings = ["README.md", "AGENTS.md"].filter((file) => {
        const text = fs.readFileSync(path.join(repoRoot, file), "utf8");
        return text.split(/\r?\n/, 1)[0] !== `# ${name}`;
      });
      results.push(
        wrongHeadings.length === 0
          ? pass("initialization", `project identity is ${name}`)
          : fail("initialization", `heading mismatch: ${wrongHeadings.join(", ")}`),
      );
    }
  } catch (error) {
    results.push(fail("initialization", message(error)));
  }
}

function checkSkills(repoRoot: string, results: CheckResult[]): void {
  try {
    const config = loadSkillsConfig(repoRoot);
    const skills = applyMetadata(config, discoverSkills(skillsSourceDir(repoRoot)));
    const missing = missingSkills(config, skills);
    const unpinned = unpinnedSkills(config, skills).map((skill) => skill.name);
    const drift: string[] = [];

    for (const target of config.targets) {
      for (const skill of skills) {
        const state = inspectLink(path.join(target.path, skill.name), skill.sourcePath).state;
        const wanted = isEnabled(config, skill, target);
        if ((wanted && state !== "linked") || (!wanted && state !== "missing")) {
          drift.push(`${target.id}/${skill.name} (${state}${wanted ? ", wanted" : ", off"})`);
        }
      }
      for (const orphan of findOrphans(skills, target.path))
        drift.push(`${target.id}/${orphan} (orphan)`);
    }

    if (missing.length > 0 || unpinned.length > 0 || drift.length > 0) {
      const parts = [
        missing.length ? `missing: ${missing.join(", ")}` : "",
        unpinned.length ? `unpinned: ${unpinned.join(", ")}` : "",
        drift.length ? `link drift: ${drift.join(", ")}` : "",
      ].filter(Boolean);
      results.push(fail("skills", parts.join("; ")));
    } else {
      results.push(pass("skills", `${skills.length} configured skill(s); links match`));
    }
  } catch (error) {
    results.push(fail("skills", message(error)));
  }
}

function checkSymlinks(repoRoot: string, results: CheckResult[]): void {
  const broken: string[] = [];
  walk(repoRoot, (absolute, relative, entry) => {
    if (!entry.isSymbolicLink()) return;
    try {
      fs.statSync(absolute);
    } catch {
      broken.push(relative);
    }
  });
  results.push(
    broken.length === 0
      ? pass("symlinks", "no broken repository symlinks")
      : fail("symlinks", `broken: ${broken.join(", ")}`),
  );
}

function checkMarkdownLinks(repoRoot: string, results: CheckResult[]): void {
  const broken: string[] = [];
  walk(repoRoot, (absolute, relative, entry) => {
    if (!entry.isFile() || !relative.endsWith(".md")) return;
    const text = fs.readFileSync(absolute, "utf8").replace(/<!--[\s\S]*?-->/g, "");
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      let target = match[1].trim().replace(/^<|>$/g, "").split("#", 1)[0];
      if (!target || /^(?:https?:|mailto:|app:)/.test(target) || target.includes("<")) continue;
      try {
        target = decodeURIComponent(target);
      } catch {
        // Keep the literal target; existence below will report it if invalid.
      }
      if (!fs.existsSync(path.resolve(path.dirname(absolute), target))) {
        broken.push(`${relative} → ${target}`);
      }
    }
  });
  results.push(
    broken.length === 0
      ? pass("Markdown links", "local link targets exist")
      : fail("Markdown links", broken.join("; ")),
  );
}

function checkPortableFiles(repoRoot: string, results: CheckResult[]): void {
  const offenders: string[] = [];
  for (const relative of [".vscode/settings.json", ".vscode/sessions.json", "package.json"]) {
    const absolute = path.join(repoRoot, relative);
    if (!fs.existsSync(absolute)) continue;
    const text = fs.readFileSync(absolute, "utf8");
    if (/\/(?:Users|home)\/[A-Za-z0-9._-]+\//.test(text)) offenders.push(relative);
  }
  results.push(
    offenders.length === 0
      ? pass("portable config", "no personal home paths in shared config")
      : fail("portable config", `personal path(s): ${offenders.join(", ")}`),
  );
}

function checkEnvironmentExample(repoRoot: string, results: CheckResult[]): void {
  const example = path.join(repoRoot, ".env.example");
  results.push(
    fs.existsSync(example)
      ? pass("environment", ".env.example is present")
      : fail("environment", ".env.example is missing"),
  );
}

function walk(
  repoRoot: string,
  visit: (absolute: string, relative: string, entry: fs.Dirent) => void,
): void {
  const skipped = new Set([".git", "node_modules", "dist", "build", "coverage"]);
  const descend = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skipped.has(entry.name)) continue;
      const absolute = path.join(dir, entry.name);
      const relative = path.relative(repoRoot, absolute);
      visit(absolute, relative, entry);
      if (entry.isDirectory()) descend(absolute);
    }
  };
  descend(repoRoot);
}

function pass(name: string, detail: string): CheckResult {
  return { level: "pass", name, detail };
}

function warn(name: string, detail: string): CheckResult {
  return { level: "warn", name, detail };
}

function fail(name: string, detail: string): CheckResult {
  return { level: "fail", name, detail };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
