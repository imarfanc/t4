# t4

Starter repo. Tasks run through [Vite+](https://viteplus.dev/) (`vp`) — no `just`,
no global Deno, no Gum. On a new Mac with Xcode and `vp`:

```bash
vp install          # once
vp run choose        # grouped task picker (search + sections)
vp run skills       # symlink skills into agent directories
vp fmt              # format (built-in)
vp lint             # lint (built-in)
vp check            # fmt + lint + typecheck (built-in)
```

See `_other/scripts/link-skills/docs/README.md` for skill symlink workflows.
