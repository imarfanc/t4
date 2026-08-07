import pc from "picocolors";

import { findRepoRoot } from "../link-skills/lib/skills.ts";
import { type CheckLevel, runChecks } from "./lib/check.ts";

const { bold, cyan, dim, green, red, yellow } = pc;
const repoRoot = findRepoRoot();
const results = runChecks(repoRoot);

function label(level: CheckLevel): string {
  if (level === "pass") return green("✓ pass");
  if (level === "warn") return yellow("! warn");
  return red("✗ fail");
}

console.log(`\n  ${bold(cyan("template-check"))}  ${dim("local repository health")}\n`);
for (const result of results) {
  console.log(`  ${label(result.level).padEnd(16)} ${bold(result.name)}  ${dim(result.detail)}`);
}

const failures = results.filter((result) => result.level === "fail").length;
const warnings = results.filter((result) => result.level === "warn").length;
console.log();
if (failures === 0) {
  console.log(
    `  ${green("✓")} Healthy${warnings ? ` with ${warnings} expected warning(s)` : ""}.\n`,
  );
} else {
  console.log(`  ${red("✗")} ${failures} check(s) failed.\n`);
}
process.exit(failures === 0 ? 0 : 1);
