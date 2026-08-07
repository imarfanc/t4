// Strip the sample content this template ships with, per data/template.yaml.
// Dry run by default — nothing is written without --apply.

import { confirm } from "@inquirer/prompts";
import path from "node:path";
import { parseArgs } from "node:util";
import tty from "node:tty";
import pc from "picocolors";

import { findRepoRoot } from "../link-skills/lib/skills.ts";
import { loadConfig as loadSkillsConfig } from "../link-skills/lib/config.ts";
import {
  type ApplyResult,
  applyPlan,
  CONFIG_RELATIVE_PATH,
  loadConfig,
  type PlanAction,
  type PlanItem,
  planReset,
  SAMPLE_MARKER,
  type TemplateConfig,
  unlinkDeletedSkills,
  unregisteredSamples,
} from "./lib/reset.ts";
import { formatTable } from "../link-skills/lib/table.ts";

const { bold, cyan, dim, green, red, yellow } = pc;

// Nerd Font glyphs (MesloLGS NF), matching link-skills.
const ICON = {
  ok: "\u{F012C}", // 󰄬
  warn: "\u{F0026}", // 󰀦
  error: "\u{F0159}", // 󰅙
  folder: "\u{F024B}", // 󰉋
} as const;

// The task runner this repo uses today — help text only.
// See _other/AGENTS/RUNNER.md.
const RUNNER = "vp";

const { values: flags } = parseArgs({
  args: process.argv.slice(2),
  options: {
    apply: { type: "boolean", default: false },
    yes: { type: "boolean", short: "y", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (flags.help === true) {
  console.log(`${bold("template-reset")} — strip this template's sample content

Sample content is registered in ${bold(CONFIG_RELATIVE_PATH)}: files whose
placeholder text sits below a ${bold(SAMPLE_MARKER)} marker, and files that are
wholly sample and get deleted. Structure is always kept.

${bold("Usage")}
  ${RUNNER} run template:reset         Preview, write nothing
  ${RUNNER} run template:reset:apply   Carry it out

${bold("Options")}
      --apply   Write the changes
  -y, --yes     Skip the confirmation prompt
  -h, --help    Show this help
`);
  process.exit(0);
}

const repoRoot = findRepoRoot();

let config: TemplateConfig;
try {
  config = loadConfig(repoRoot);
} catch (error) {
  console.error(`${red(ICON.error)} ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

const plan = planReset(repoRoot, config);

/** Where link-skills puts symlinks, so orphans can be cleaned from the same places. */
function loadSkillTargets(root: string) {
  try {
    return loadSkillsConfig(root).targets;
  } catch {
    return []; // no skills.yaml, or it does not parse — nothing to clean
  }
}

function paintAction(action: PlanAction): string {
  switch (action) {
    case "truncate":
      return yellow(`${ICON.warn} truncate`);
    case "delete":
      return red(`${ICON.error} delete`);
    case "already-clean":
      return dim("· clean");
    case "missing":
      return dim("· absent");
    case "error":
      return red(`${ICON.error} error`);
  }
}

console.log();
console.log(`  ${bold(cyan("template-reset"))}  ${dim("strip shipped sample content")}`);
console.log(`  ${dim(`${ICON.folder} ${CONFIG_RELATIVE_PATH}`)}`);
console.log();

const pending = plan.items.filter(
  (item) => item.action === "truncate" || item.action === "delete",
);

if (plan.items.length > 0) {
  console.log(
    formatTable({
      headers: [bold("Action"), bold("Path"), bold("Detail")],
      rows: plan.items.map((item: PlanItem) => [
        paintAction(item.action),
        item.path,
        dim(item.detail),
      ]),
      padding: 2,
      indent: 2,
    }),
  );
  console.log();
}

const stray = unregisteredSamples(repoRoot, config);
if (stray.length > 0) {
  console.log(
    `  ${yellow(ICON.warn)} carries ${SAMPLE_MARKER} but is not in template.yaml: ` +
      stray.join(", "),
  );
  console.log(`  ${dim("Add a rule for it, or remove the marker.")}\n`);
}

if (pending.length === 0) {
  console.log(`  ${green(ICON.ok)} Nothing to strip — this repo is already adapted.\n`);
  process.exit(0);
}

if (flags.apply !== true) {
  console.log(
    `  ${dim(`Dry run — nothing was written. Run \`${RUNNER} run template:reset:apply\`.`)}\n`,
  );
  process.exit(0);
}

const isInteractive = tty.isatty(0) && tty.isatty(1);

if (isInteractive && flags.yes !== true) {
  const deletions = pending.filter((item) => item.action === "delete").length;
  const confirmed = await confirm({
    message: `Apply ${pending.length} change${pending.length === 1 ? "" : "s"}` +
      (deletions > 0
        ? `, including ${deletions} deletion${deletions === 1 ? "" : "s"}?`
        : "?"),
    default: false,
  });

  if (!confirmed) {
    console.log(`\n  ${dim("Cancelled. Nothing was written.")}\n`);
    process.exit(0);
  }
}

const results = applyPlan(repoRoot, config, plan);
const failures = results.filter((r: ApplyResult) => r.action === "error");
const done = results.filter((r: ApplyResult) => r.applied);

console.log(`  ${green(ICON.ok)} ${done.length} applied.`);

for (const failure of failures) {
  console.log(`  ${red(ICON.error)} ${failure.path}: ${failure.detail}`);
}

if (plan.orphanedSkillKeys.length > 0) {
  // Clean up the symlinks this run just orphaned, so the repo is not left in a
  // state that reports drift the person did not cause.
  const targetDirs = loadSkillTargets(repoRoot).map((target) =>
    path.relative(repoRoot, target.path)
  );
  const unlinked = unlinkDeletedSkills(repoRoot, plan.orphanedSkillKeys, targetDirs);

  if (unlinked.length > 0) {
    console.log(`  ${green(ICON.ok)} ${unlinked.length} stale symlink(s) removed:`);
    for (const link of unlinked) console.log(`      ${dim(link)}`);
  }

  console.log(
    `\n  ${yellow(ICON.warn)} Now remove these keys from ` +
      `${dim(config.skillsConfig ?? "skills.yaml")}:`,
  );
  for (const key of plan.orphanedSkillKeys) console.log(`      ${key}`);
  console.log(
    `  ${dim(`Editing YAML mechanically is worse than naming the lines. ` +
      `Then: \`${RUNNER} run skills:check\`.`)}`,
  );
}

if (plan.followups.length > 0) {
  console.log(`\n  ${bold("Still to do by hand")}`);
  for (const step of plan.followups) console.log(`      · ${step}`);
}

console.log();
process.exit(failures.length > 0 ? 1 : 0);
