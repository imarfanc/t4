port := "5173"

picker := justfile_directory() / "_other/scripts/melker/recipes.melker"

_default:
    #!/usr/bin/env bash
    set -euo pipefail
    just_bin="{{ just_executable() }}"
    # Melker is the picker: it groups recipes under real, unselectable headers
    # and filters as you type. It writes the chosen recipe name to MELKER_CHOICE
    # and exits, leaving the running to us.
    if ! command -v melker >/dev/null 2>&1; then
        printf '\n󰀦 melker is not installed.\n   deno install -g -A jsr:@melker/melker\n\n' >&2
        exec "$just_bin" --list
    fi
    choice_file="$(mktemp)"
    trap 'rm -f "$choice_file"' EXIT
    # --trust skips the approval prompt: the policy sits next to this justfile,
    # and its only powers are running `just --dump` and writing one temp file.
    # fullcolor-dark unless you have already chosen a theme: auto-detection can
    # land on the grayscale theme, which drops every color the picker sets.
    MELKER_CHOICE="$choice_file" MELKER_THEME="${MELKER_THEME:-fullcolor-dark}" \
        melker --trust "{{ picker }}"
    recipe="$(cat "$choice_file")"
    [ -n "$recipe" ] || exit 0
    exec "$just_bin" "$recipe"

# Launch the desktop window with hot reload
[group('run')]
dev:
    deno task dev

# Launch the desktop window
[group('run')]
start:
    deno task start

# Launch the plain browser server
[group('run')]
browser:
    PORT={{ port }} deno task browser

# Launch with authentication switched off
[group('run')]
public:
    AUTH_BYPASS=1 PORT={{ port }} deno task browser

# Run the full test suite (fmt, lint, check, tests)
[group('check')]
test:
    ./test.sh

# Run the tests only
[group('check')]
test-quick:
    ./test.sh --quick

[group('check')]
fmt:
    deno task fmt

[group('check')]
lint:
    deno task lint

[group('check')]
check:
    deno task check

# Bundle the auth frontend
[group('tools')]
build:
    deno task build

# Skill symlinks: bare opens its picker, or pass link / link-all / check / prune / links
[group('tools')]
skills *args:
    @{{ just_executable() }} \
        --justfile {{ justfile_directory() }}/_other/scripts/link-skills/justfile \
        --working-directory {{ justfile_directory() }}/_other/scripts/link-skills \
        {{ args }}
