#!/usr/bin/env python3
"""Publish files to here.now."""

from __future__ import annotations

import argparse
import fnmatch
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True

from _common import (  # noqa: E402
    ApiClient,
    ApiError,
    DEFAULT_BASE_URL,
    STATE_DIR,
    STATE_FILE,
    UI,
    auth_help_for_slug_update,
    client_header,
    compute_sha256,
    die,
    emit_publish_result,
    guess_content_type,
    load_api_key,
)

SKIP_DIR_FILES = {".DS_Store", ".herenow/fork-meta.json", ".herenowignore"}
# Published Site Data / proxy config (everything else under .*/ stays local).
PUBLISH_DOTFILES = {".herenow/data.json", ".herenow/proxy.json"}
# here.now PublishCreateRequest.files maxItems (openapi.json)
MAX_PUBLISH_FILES = 1000


def guard_publish_file_count(ui: UI, files: list[dict[str, object]]) -> None:
    n = len(files)
    if n <= MAX_PUBLISH_FILES:
        return
    over = n - MAX_PUBLISH_FILES
    die(
        ui,
        f"too many files for one here.now publish: {n} "
        f"(API max is {MAX_PUBLISH_FILES}, over by {over}). "
        f"Remove files, or add patterns to .herenowignore "
        f"(at least {over} file(s) must leave the publish set).",
    )


def load_herenowignore(target: Path) -> list[str]:
    """Load ignore patterns from site-root .herenowignore (gitignore-ish)."""
    path = target / ".herenowignore" if target.is_dir() else target.parent / ".herenowignore"
    if not path.is_file():
        return []
    patterns: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        patterns.append(line)
    return patterns


def path_matches_ignore(rel: str, patterns: list[str]) -> bool:
    """Match rel against ignore patterns (basename, full path, **/prefix)."""
    name = Path(rel).name
    for pat in patterns:
        if pat.endswith("/"):
            prefix = pat.rstrip("/")
            if rel == prefix or rel.startswith(prefix + "/"):
                return True
            continue
        if fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch(name, pat):
            return True
        if "/" not in pat.rstrip("/") and fnmatch.fnmatch(rel, f"**/{pat}"):
            return True
    return False


def should_skip(rel: str, ignore_patterns: list[str] | None = None) -> bool:
    if rel in SKIP_DIR_FILES:
        return True
    if Path(rel).name == ".DS_Store":
        return True
    parts = Path(rel).parts
    if any(part.startswith(".") for part in parts) and rel not in PUBLISH_DOTFILES:
        return True
    if ignore_patterns and path_matches_ignore(rel, ignore_patterns):
        return True
    return False


def guard_base_url(
    ui: UI, base_url: str, api_key: str, allow_non_default: bool
) -> None:
    if (
        api_key
        and base_url.rstrip("/") != DEFAULT_BASE_URL
        and not allow_non_default
    ):
        die(
            ui,
            "refusing to send API key to non-default base URL; "
            "pass --allow-nonherenow-base-url to override",
        )


def load_claim_token(slug: str | None, claim_token: str | None) -> str:
    if claim_token or not slug or not STATE_FILE.is_file():
        return claim_token or ""
    try:
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        return state.get("publishes", {}).get(slug, {}).get("claimToken", "")
    except (OSError, json.JSONDecodeError):
        return ""


def build_manifest(target: Path) -> tuple[list[dict[str, object]], dict[str, Path]]:
    files: list[dict[str, object]] = []
    file_map: dict[str, Path] = {}
    ignore_patterns = load_herenowignore(target)

    if target.is_file():
        rel = target.name
        if should_skip(rel, ignore_patterns):
            return files, file_map
        files.append(
            {
                "path": rel,
                "size": target.stat().st_size,
                "contentType": guess_content_type(target),
                "hash": compute_sha256(target),
            }
        )
        file_map[rel] = target.resolve()
        return files, file_map

    if not target.is_dir():
        raise ValueError(f"not a file or directory: {target}")

    for path in sorted(target.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(target).as_posix()
        if should_skip(rel, ignore_patterns):
            continue
        files.append(
            {
                "path": rel,
                "size": path.stat().st_size,
                "contentType": guess_content_type(path),
                "hash": compute_sha256(path),
            }
        )
        file_map[rel] = path.resolve()

    return files, file_map


def publish_from_drive(
    ui: UI,
    args: argparse.Namespace,
    api_key: str,
    api_key_source: str,
) -> int:
    if not api_key:
        die(ui, "--from-drive requires an account API key")

    body: dict[str, object] = {"driveId": args.from_drive}
    if args.drive_version:
        body["versionId"] = args.drive_version
    if args.slug:
        body["slug"] = args.slug
    viewer: dict[str, str] = {}
    if args.title:
        viewer["title"] = args.title
    if args.description:
        viewer["description"] = args.description
    if viewer:
        body["viewer"] = viewer
    if args.spa:
        body["spaMode"] = True

    client = ApiClient(
        args.base_url,
        api_key,
        client_header_value=client_header(args.client, suffix="publish-py"),
    )
    ui.step("publishing from Drive...")
    response = client.post_json("/api/v1/publish/from-drive", body)
    if response.get("error"):
        die(ui, str(response["error"]))

    site_url = response["siteUrl"]
    out_slug = response["slug"]
    print(site_url)
    emit_publish_result(
        site_url=site_url,
        slug=out_slug,
        action="from_drive",
        auth_mode="authenticated",
        api_key_source=api_key_source,
        persistence="permanent",
        drive_id=args.from_drive,
        drive_version_id=response.get("driveVersionId", ""),
        current_version_id=response.get("currentVersionId", ""),
    )
    ui.publish_summary(
        {
            "site_url": site_url,
            "slug": out_slug,
            "action": "from_drive",
            "auth_mode": "authenticated",
            "persistence": "permanent",
            "drive_id": args.from_drive,
            "drive_version_id": response.get("driveVersionId", ""),
        }
    )
    return 0


def ensure_update_auth(
    ui: UI, slug: str | None, api_key: str, claim_token: str
) -> None:
    if not slug or api_key or claim_token:
        return
    die(ui, auth_help_for_slug_update(slug, has_claim_token=False))


def request_publish(
    client: ApiClient,
    ui: UI,
    *,
    slug: str | None,
    body: dict[str, object],
    api_key: str,
    claim_token: str,
) -> tuple[dict[str, object], str]:
    try:
        if slug:
            return client.put_json(f"/api/v1/publish/{slug}", body), "update"
        return client.post_json("/api/v1/publish", body), "create"
    except ApiError as exc:
        if exc.code == 401 and slug:
            die(
                ui,
                auth_help_for_slug_update(slug, has_claim_token=bool(claim_token)),
            )
        die(ui, str(exc))


def save_state(slug: str, entry: dict[str, str]) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    if STATE_FILE.is_file():
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    else:
        state = {"publishes": {}}
    state.setdefault("publishes", {})[slug] = entry
    STATE_FILE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    ui = UI()
    parser = argparse.ArgumentParser(description="Publish files to here.now")
    parser.add_argument("target", nargs="?", help="File or directory to publish")
    parser.add_argument("--api-key", dest="api_key")
    parser.add_argument("--slug")
    parser.add_argument("--claim-token", dest="claim_token")
    parser.add_argument("--title")
    parser.add_argument("--description")
    parser.add_argument("--ttl")
    parser.add_argument("--client")
    parser.add_argument("--spa", action="store_true")
    parser.add_argument("--from-drive", dest="from_drive")
    parser.add_argument("--version", dest="drive_version")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--allow-nonherenow-base-url", action="store_true")
    args = parser.parse_args()

    if not args.from_drive and not args.target:
        parser.print_help()
        return 1

    if args.from_drive and args.target:
        die(ui, "--from-drive does not accept a local file-or-dir argument")

    api_key, api_key_source = load_api_key(args.api_key)
    guard_base_url(ui, args.base_url, api_key, args.allow_nonherenow_base_url)

    if args.from_drive:
        return publish_from_drive(ui, args, api_key, api_key_source)

    target = Path(args.target)
    if not target.exists():
        die(ui, f"path does not exist: {target}")

    try:
        files, file_map = build_manifest(target)
    except ValueError as exc:
        die(ui, str(exc))

    if not files:
        die(ui, "no files found")

    guard_publish_file_count(ui, files)

    body: dict[str, object] = {"files": files}
    if args.ttl:
        body["ttlSeconds"] = int(args.ttl)
    viewer: dict[str, str] = {}
    if args.title:
        viewer["title"] = args.title
    if args.description:
        viewer["description"] = args.description
    if viewer:
        body["viewer"] = viewer

    claim_token = load_claim_token(args.slug, args.claim_token)
    if claim_token and args.slug:
        body["claimToken"] = claim_token
    if args.spa:
        body["spaMode"] = True

    ensure_update_auth(ui, args.slug, api_key, claim_token)

    auth_mode = "authenticated" if api_key else "anonymous"
    client = ApiClient(
        args.base_url,
        api_key,
        client_header_value=client_header(args.client, suffix="publish-py"),
    )

    ui.step(f"creating publish ({len(files)} files)...")
    response, action = request_publish(
        client,
        ui,
        slug=args.slug,
        body=body,
        api_key=api_key,
        claim_token=claim_token,
    )

    if response.get("error"):
        details = response.get("details")
        message = str(response["error"])
        if details:
            message = f"{message} ({details})"
        die(ui, message)

    out_slug = response.get("slug")
    if not out_slug:
        die(ui, f"unexpected response: {response}")

    upload = response["upload"]
    version_id = upload["versionId"]
    finalize_url = upload["finalizeUrl"]
    site_url = response["siteUrl"]
    uploads = upload.get("uploads", [])
    skipped_count = len(upload.get("skipped") or [])

    if skipped_count:
        ui.step(
            f"uploading {len(uploads)} files ({skipped_count} unchanged, skipped)..."
        )
    else:
        ui.step(f"uploading {len(uploads)} files...")

    upload_errors = 0
    for index, item in enumerate(uploads, start=1):
        upload_path = item["path"]
        upload_url = item["url"]
        upload_ct = (item.get("headers") or {}).get("Content-Type", "")

        if target.is_file():
            local_file = target
        else:
            local_file = file_map.get(upload_path)

        if not local_file or not local_file.is_file():
            ui.say(f"warning: missing local file for {upload_path}", style="yellow")
            upload_errors += 1
            continue

        ui.upload_progress(index, len(uploads), upload_path)
        http_code = client.upload_bytes(
            upload_url,
            local_file,
            upload_ct or guess_content_type(local_file),
        )
        if http_code < 200 or http_code >= 300:
            ui.say(
                f"warning: upload failed for {upload_path} (HTTP {http_code})",
                style="yellow",
            )
            upload_errors += 1

    if upload_errors:
        die(ui, f"{upload_errors} file(s) failed to upload")

    ui.step("finalizing...")
    try:
        fin_response = client.post_json(finalize_url, {"versionId": version_id})
    except ApiError as exc:
        die(ui, str(exc))
    if fin_response.get("error"):
        die(ui, f"finalize failed: {fin_response['error']}")

    entry = {"siteUrl": site_url}
    claim_token_out = response.get("claimToken") or ""
    claim_url_out = response.get("claimUrl") or ""
    expires_at = response.get("expiresAt") or ""
    if claim_token_out:
        entry["claimToken"] = claim_token_out
    if claim_url_out:
        entry["claimUrl"] = claim_url_out
    if expires_at:
        entry["expiresAt"] = expires_at
    save_state(out_slug, entry)

    print(site_url)

    persistence = "permanent"
    if auth_mode == "anonymous":
        persistence = "expires_24h"
    elif expires_at:
        persistence = "expires_at"

    safe_claim_url = claim_url_out if claim_url_out.startswith("https://") else ""

    emit_publish_result(
        site_url=site_url,
        slug=out_slug,
        action=action,
        auth_mode=auth_mode,
        api_key_source=api_key_source,
        persistence=persistence,
        expires_at=expires_at,
        claim_url=safe_claim_url,
    )
    ui.publish_summary(
        {
            "site_url": site_url,
            "slug": out_slug,
            "action": action,
            "auth_mode": auth_mode,
            "persistence": persistence,
            "expires_at": expires_at,
            "claim_url": safe_claim_url,
        }
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
