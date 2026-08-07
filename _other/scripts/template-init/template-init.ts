import { confirm, input } from "@inquirer/prompts";
import { parseArgs } from "node:util";
import tty from "node:tty";
import pc from "picocolors";

import { findRepoRoot } from "../link-skills/lib/skills.ts";
import {
  applyInitialization,
  defaultProjectName,
  isValidPackageName,
  planInitialization,
} from "./lib/init.ts";

const { bold, cyan, dim, green, red } = pc;
const { values: flags } = parseArgs({
  args: process.argv.slice(2),
  options: {
    name: { type: "string", short: "n" },
    yes: { type: "boolean", short: "y", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (flags.help) {
  console.log(`${bold("template-init")} — turn this template into a named project

${bold("Usage")}
  vp run template:init
  vp run template:init -- --name my-project --yes

${bold("Options")}
  -n, --name   Lowercase package/project name
  -y, --yes    Apply without confirmation
  -h, --help   Show this help
`);
  process.exit(0);
}

const repoRoot = findRepoRoot();
const interactive = tty.isatty(0) && tty.isatty(1);
let name = flags.name;

if (!name && interactive) {
  name = await input({
    message: "Project name",
    default: defaultProjectName(repoRoot),
    validate: (value) => isValidPackageName(value) || "Use a lowercase npm-compatible name",
  });
}

if (!name) {
  console.error(`${red("error")} Pass --name when running non-interactively.`);
  process.exit(1);
}
if (!interactive && !flags.yes) {
  console.error(`${red("error")} Pass --yes to apply initialization non-interactively.`);
  process.exit(1);
}
if (!isValidPackageName(name)) {
  console.error(`${red("error")} Use a lowercase npm-compatible project name.`);
  process.exit(1);
}

const plan = planInitialization(repoRoot, name);
console.log(`\n  ${bold(cyan("template-init"))}  ${dim(`${plan.currentName} → ${plan.name}`)}\n`);
for (const file of plan.files) console.log(`      ${file}`);

if (plan.files.length === 0) {
  console.log(`\n  ${green("✓")} Already initialized as ${bold(name)}.\n`);
  process.exit(0);
}

if (interactive && !flags.yes) {
  const accepted = await confirm({
    message: `Apply ${plan.files.length} file change${plan.files.length === 1 ? "" : "s"}?`,
    default: false,
  });
  if (!accepted) {
    console.log(`\n  ${dim("Cancelled. Nothing was written.")}\n`);
    process.exit(0);
  }
}

try {
  const result = applyInitialization(repoRoot, plan);
  console.log(`\n  ${green("✓")} Initialized ${bold(result.name)}.`);
  console.log(
    `  ${dim(`${result.resetChanges} sample change(s), ${result.removedSkillLinks} stale link(s) removed, ${result.skillLinkChanges} skill link change(s).`)}`,
  );
  console.log(
    `  ${dim("Next: edit the README description, choose skills, then run `vp run check`.")}\n`,
  );
} catch (error) {
  console.error(`\n  ${red("error")} ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
}
