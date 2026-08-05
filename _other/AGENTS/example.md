# example

Headings label folders in the sidebar without existing as directories, so
regrouping the nav never moves a file or changes a URL. The root marker
(`assembly/_section.yaml`) declares them in order; any `section` or `group`
marker opts in by id:

```yaml
# assembly/_section.yaml (kind: root)
headings:
  - { id: system-test, name: System Test, order: 200 }

# assembly/Admin/tests/_section.yaml (kind: group)
heading: system-test
```

A heading only ever labels **siblings**, so it works at any depth — put it on a
top-level section to split the sidebar root, or on a nested group to label a row
inside a folder. The example above renders `SYSTEM TEST` above `Tests` *inside*
`Administration`.

Membership lives in the folder, not a central list, so there is one source of
truth. A folder with no `heading`, or one naming a heading the root does not
declare, renders ungrouped above the headings — never hidden. A heading whose
folders all filter out under search emits no label. `heading` is ignored on
`kind: root`, which is never rendered.

Implemented in `frontends/v1/app.ts` (`groupByHeading`) and
`frontends/v3/app.js` (`applyHeadings`); **v2 does not support headings**.
Remember to `deno task build` after changing v1 — it serves `dist/app.js`.
