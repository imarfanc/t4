# template-check

Runs the repository's local, application-neutral health checks:

```bash
<runner> run template:check
```

The normal all-in-one command is `<runner> run check`, which runs Vite+
formatting, linting, and type checks before this template-specific check.

It validates package and task metadata, initialization state, registered sample
content, skill configuration and links, all repository symlinks, local Markdown
links, portable shared configuration, and `.env.example` presence. It does not
require GitHub, a remote, or application code.

The untouched template may pass with one warning that initialization remains.
Once the package has been renamed, pending sample content becomes a failure.
