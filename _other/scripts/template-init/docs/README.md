# template-init

Turns a fresh copy of the template into a named project in one local command:

```bash
<runner> run template:init
<runner> run template:init -- --name my-project --yes
```

It renames `package.json`, `README.md`, and `AGENTS.md`; strips registered sample
history and skills; removes the matching sample entries from `skills.yaml`; and
reconciles the remaining skill links. It is safe to run again: an initialized,
clean project reports that there is nothing to change.

The initializer intentionally does not invent application scripts, select a
framework, or rewrite project prose beyond the top-level name. Those choices
belong to the new project.
