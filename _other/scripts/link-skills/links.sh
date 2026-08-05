#!/usr/bin/env bash
# List every symlink in the repo and whether it resolves.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../../" && pwd)"
cd "$root"

found=0
broken=0
while IFS= read -r link; do
  rel="${link#./}"
  target="$(readlink "$link")"
  found=$((found + 1))
  if [ -e "$link" ]; then
    printf '  \033[32m󰄬\033[0m  %s \033[2m→ %s\033[0m\n' "$rel" "$target"
  else
    printf '  \033[31m󰅙\033[0m  %s \033[2m→ %s (broken)\033[0m\n' "$rel" "$target"
    broken=$((broken + 1))
  fi
done < <(find . \( -path ./.git -o -path ./node_modules \) -prune -o -type l -print | sort)

printf '\n  \033[2m󰉋 %s\033[0m\n' "$root"
if [ "$broken" -gt 0 ]; then
  printf '  \033[2m%s symlinks, %s broken\033[0m\n\n' "$found" "$broken"
  exit 1
fi
printf '  \033[2m%s symlinks, all resolve\033[0m\n\n' "$found"
