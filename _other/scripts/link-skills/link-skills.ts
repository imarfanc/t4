#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
// Reconcile _other/skills with .agents, .claude and .cursor, per data/skills.yaml.

import { Checkbox, Confirm } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { parseArgs } from "@std/cli/parse-args";
import { bold, cyan, dim, green, red, yellow } from "@std/fmt/colors";
import { join, relative } from "@std/path";

import {
  type Config,
  CONFIG_RELATIVE_PATH,
  isEnabled,
  loadConfig,
  missingSkills,
  unpinnedSkills,
} from "./lib/config.ts";
import {
  discoverSkills,
  findOrphans,
  findRepoRoot,
  inspectLink,
  type LinkResult,
  type LinkState,
  reconcile,
  shortTargetDir,
  type Skill,
  skillsSourceDir,
  summarize,
  type Target,
} from "./lib/skills.ts";

// Nerd Font glyphs (MesloLGS NF). Kept in one place so the UI stays consistent.
const ICON = {
  ok: "\u{F012C}", // 󰄬
  warn: "\u{F0026}", // 󰀦
  error: "\u{F0159}", // 󰅙
  folder: "\u{F024B}", // 󰉋
  keyboard: "\u{F030C}", // 󰌌
} as const;

const flags = parseArgs(Deno.args, {
  boolean: ["all", "dry-run", "prune", "help"],
  alias: { h: "help", n: "dry-run", a: "all" },
});

const applyConfig = flags.all === true;
const dryRun = flags["dry-run"] === true;
const pruneOnly = flags.prune === true;
const showHelp = flags.help === true;

function printHelp(): void {
  console.log(`${bold("link-skills")} — symlink _other/skills into agent tool directories

Configuration lives in ${bold(CONFIG_RELATIVE_PATH)} and is the source of
truth: skills toggled off there have their symlinks removed.

${bold("Usage")}
  just link                 Interactive picker
  just link-all             Apply the config exactly, no prompts
  just check                Preview changes, write nothing
  just links                List every symlink in the repo

${bold("Options")}
  -a, --all       Apply the config without prompting
  -n, --dry-run   Show what would change, write nothing
      --prune     Report stale links and config drift, then exit
  -h, --help      Show this help
`);
}

if (showHelp) {
  printHelp();
  Deno.exit(0);
}

const isInteractive = Deno.stdin.isTerminal() && Deno.stdout.isTerminal();

const repoRoot = findRepoRoot();
const sourceDir = skillsSourceDir(repoRoot);
const skills = discoverSkills(sourceDir);

let config: Config;
try {
  config = loadConfig(repoRoot);
} catch (error) {
  console.error(`${red(ICON.error)} ${error instanceof Error ? error.message : error}`);
  Deno.exit(1);
}

const targets = config.targets;

if (skills.length === 0) {
  console.error(`${red(ICON.error)} No skills found under ${dim(sourceDir)}`);
  Deno.exit(1);
}

const nameWidth = Math.max(...skills.map((s) => s.name.length)) + 2;

/** Terminal width, clamped so tables never wrap awkwardly on narrow windows. */
function terminalWidth(): number {
  try {
    return Math.max(40, Deno.consoleSize().columns - 4);
  } catch {
    return 80;
  }
}

function stateOf(skill: Skill, target: Target): LinkState {
  return inspectLink(join(target.path, skill.name), skill.sourcePath).state;
}

/** How a skill/target pair reads in the status table, config included. */
function paintCell(skill: Skill, target: Target): string {
  const state = stateOf(skill, target);
  const wanted = isEnabled(config, skill, target);

  if (!wanted) {
    return state === "missing" ? dim("· off") : yellow(`${ICON.warn} off, linked`);
  }

  switch (state) {
    case "linked":
      return green(`${ICON.ok} linked`);
    case "missing":
      return dim("· missing");
    case "wrong-target":
      return yellow(`${ICON.warn} wrong target`);
    case "not-a-symlink":
      return red(`${ICON.error} not a symlink`);
  }
}

function statusTable(skillList: Skill[], targetList: Target[]): string {
  return new Table()
    .header([
      bold("Category"),
      bold("Skill"),
      ...targetList.map((t) => bold(t.label)),
    ])
    .body(
      skillList.map((skill) => [
        dim(skill.category),
        skill.name,
        ...targetList.map((target) => paintCell(skill, target)),
      ]),
    )
    .padding(2)
    .indent(2)
    .border(true)
    .maxWidth(terminalWidth())
    .toString();
}

function banner(): void {
  const configLabel = config.path
    ? relative(repoRoot, config.path)
    : "defaults (no skills.yaml)";

  console.log();
  console.log(`  ${bold(cyan("link-skills"))}  ${dim("vt6 agent skill linker")}`);
  console.log(
    `  ${dim(`${ICON.folder} ${shortTargetDir(sourceDir)}  →  ${targets.map((t) => t.label).join("  ")}`)}`,
  );
  console.log(`  ${dim(`${ICON.folder} ${configLabel}`)}`);
  console.log();
}

function paintAction(result: LinkResult): string {
  switch (result.action) {
    case "created":
      return green(`${ICON.ok} created`);
    case "replaced":
      return green(`${ICON.ok} replaced`);
    case "removed":
      return yellow(`${ICON.warn} removed`);
    case "ok":
      return dim("· unchanged");
    case "skipped":
      return yellow(`${ICON.warn} skipped`);
    case "error":
      return red(`${ICON.error} error`);
  }
}

function report(results: LinkResult[], previewOnly: boolean): void {
  const changed = results.filter((r) => r.action !== "ok");

  if (changed.length === 0) {
    console.log(`\n  ${green(ICON.ok)} Everything already matches the config.\n`);
    return;
  }

  console.log();
  console.log(
    new Table()
      .header([bold(previewOnly ? "Would do" : "Result"), bold("Skill"), bold("Target")])
      .body(
        changed.map((r) => [paintAction(r), r.skill, dim(shortTargetDir(r.targetDir))]),
      )
      .padding(2)
      .indent(2)
      .toString(),
  );

  const counts = summarize(results);
  const summary = (Object.entries(counts) as [keyof typeof counts, number][])
    .filter(([, n]) => n > 0)
    .map(([action, n]) => `${n} ${action}`)
    .join("  ·  ");

  console.log(`\n  ${dim(summary)}\n`);

  for (const failure of changed.filter((r) => r.action === "error" || r.action === "skipped")) {
    console.log(`  ${yellow(ICON.warn)} ${failure.skill}: ${failure.message}`);
  }
}

/** Warn about anything that suggests the config and disk have drifted apart. */
function reportDrift(): void {
  const unpinned = unpinnedSkills(config, skills);
  if (unpinned.length > 0) {
    console.log(
      `  ${yellow(ICON.warn)} not in skills.yaml (treated as on): ` +
        unpinned.map((s) => `${s.category}/${s.name}`).join(", "),
    );
  }

  const missing = missingSkills(config, skills);
  if (missing.length > 0) {
    console.log(
      `  ${yellow(ICON.warn)} in skills.yaml but not on disk: ${missing.join(", ")}`,
    );
  }

  for (const target of targets) {
    const orphans = findOrphans(skills, target.path);
    if (orphans.length === 0) continue;
    console.log(
      `  ${yellow(ICON.warn)} ${target.label} has stale links: ${orphans.join(", ")}`,
    );
  }
}

// ── Non-interactive paths ────────────────────────────────────────────────────

if (applyConfig || !isInteractive) {
  if (!applyConfig && !dryRun && !pruneOnly) {
    console.error(
      `${yellow(ICON.warn)} Not a terminal — run with --all or --dry-run for non-interactive use.`,
    );
    Deno.exit(1);
  }

  banner();

  if (pruneOnly) {
    reportDrift();
    console.log(`\n  ${dim("Nothing was written.")}\n`);
    Deno.exit(0);
  }

  const results = reconcile(
    skills,
    targets,
    (skill, target) => isEnabled(config, skill, target),
    { dryRun },
  );
  report(results, dryRun);
  reportDrift();
  Deno.exit(summarize(results).error > 0 ? 1 : 0);
}

// ── Interactive ──────────────────────────────────────────────────────────────

banner();
console.log(statusTable(skills, targets));
console.log();
reportDrift();

if (pruneOnly) {
  console.log(`\n  ${dim("Nothing was written.")}\n`);
  Deno.exit(0);
}

const KEYS = dim("space toggles · enter confirms · ctrl+c cancels");

const chosenTargetIds = await Checkbox.prompt({
  message: `Reconcile which directories?  ${KEYS}`,
  options: targets.map((target) => ({
    name: target.label,
    value: target.id,
    checked: true,
  })),
  minOptions: 1,
  confirmSubmit: false,
});

const chosenTargets = targets.filter((t) => chosenTargetIds.includes(t.id));

/** A skill needs attention when any chosen target disagrees with the config. */
function needsWork(skill: Skill): boolean {
  return chosenTargets.some((target) => {
    const state = stateOf(skill, target);
    return isEnabled(config, skill, target) ? state !== "linked" : state !== "missing";
  });
}

/** Trim a description to one readable line beside the skill name. */
function summaryOf(skill: Skill): string {
  if (!skill.description) return "";
  const firstSentence = skill.description.split(/(?<=\.)\s/)[0];
  const clipped = firstSentence.length > 60
    ? `${firstSentence.slice(0, 57).trimEnd()}…`
    : firstSentence;
  return dim(`  ${clipped}`);
}

const chosenSkillNames = await Checkbox.prompt({
  message: `Which skills?  ${KEYS}`,
  options: skills.map((skill) => ({
    name: `${skill.name.padEnd(nameWidth)}${dim(skill.category.padEnd(10))}${summaryOf(skill)}`,
    value: skill.name,
    checked: needsWork(skill),
  })),
  minOptions: 1,
  maxRows: 15,
  search: skills.length > 12,
  confirmSubmit: false,
});

const chosenSkills = skills.filter((s) => chosenSkillNames.includes(s.name));

const wanted = (skill: Skill, target: Target) => isEnabled(config, skill, target);
const preview = reconcile(chosenSkills, chosenTargets, wanted, { dryRun: true });
const pending = preview.filter((r) => r.action !== "ok");

if (pending.length === 0) {
  console.log(`\n  ${green(ICON.ok)} Nothing to change — the selection matches the config.\n`);
  Deno.exit(0);
}

report(preview, true);

if (dryRun) {
  console.log(`  ${dim("Dry run — nothing was written.")}\n`);
  Deno.exit(0);
}

const removals = pending.filter((r) => r.action === "removed").length;
const confirmed = await Confirm.prompt({
  message: removals > 0
    ? `Apply ${pending.length} change${pending.length === 1 ? "" : "s"}, ` +
      `including ${removals} removal${removals === 1 ? "" : "s"}?`
    : `Apply ${pending.length} change${pending.length === 1 ? "" : "s"}?`,
  default: removals === 0,
});

if (!confirmed) {
  console.log(`\n  ${dim("Cancelled. Nothing was written.")}\n`);
  Deno.exit(0);
}

const results = reconcile(chosenSkills, chosenTargets, wanted);
report(results, false);
console.log(statusTable(skills, targets));
console.log(`\n  ${dim(`${ICON.keyboard} done`)}\n`);

Deno.exit(summarize(results).error > 0 ? 1 : 0);
