#!/usr/bin/env python3
"""Manage here.now Drives."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True

from _common import (  # noqa: E402
    DEFAULT_BASE_URL,
    MAX_FILE_BYTES,
    UI,
    ApiClient,
    compute_sha256,
    die,
    guess_content_type,
    load_api_key,
    load_drive_token,
    print_json,
    urlenc,
    urlenc_path,
)

IMPORT_SKIP_PREFIXES = (".git/", "node_modules/")


class DriveApp:
    def __init__(self, args: argparse.Namespace) -> None:
        self.ui = UI()
        self.args = args
        self.base_url = args.base_url.rstrip("/")
        self.api_key, _ = load_api_key(args.api_key)
        self.drive_token = load_drive_token(args.token)

        if self.base_url != DEFAULT_BASE_URL and not args.allow_nonherenow_base_url:
            if self.api_key or self.drive_token:
                die(
                    self.ui,
                    "refusing to send credentials to non-default base URL; "
                    "pass --allow-nonherenow-base-url to override",
                )

        token = self.drive_token or self.api_key
        if not token:
            die(
                self.ui,
                "missing credentials; set HERENOW_API_KEY, HERENOW_DRIVE_TOKEN, "
                "or ~/.herenow/credentials",
            )
        self.client = ApiClient(self.base_url, token)

    @property
    def uses_drive_token(self) -> bool:
        return bool(self.drive_token)

    def resolve_drive(self, name: str) -> str:
        if name.startswith("drv_"):
            return name
        if self.uses_drive_token:
            die(
                self.ui,
                "drive tokens must reference drives by drv_ id; "
                "use account credentials to resolve drive names",
            )
        if name in {"default", "my-drive", "My Drive"}:
            return self.client.get_json("/api/v1/drives/default")["drive"]["id"]
        rows = [
            drive
            for drive in self.client.get_json("/api/v1/drives").get("drives", [])
            if drive.get("name") == name
        ]
        if len(rows) != 1:
            die(
                self.ui,
                f"drive name '{name}' matched {len(rows)} drives; use a drv_ id",
            )
        return rows[0]["id"]

    def drive_head(self, drive_id: str) -> str:
        payload = self.client.get_json(f"/api/v1/drives/{drive_id}")
        drive = payload.get("drive", payload)
        return drive.get("headVersionId") or payload.get("headVersionId") or ""

    def file_meta(self, drive_id: str, path: str) -> dict[str, object] | None:
        payload = self.client.get_json(
            f"/api/v1/drives/{drive_id}/files?prefix={urlenc(path)}&limit=200"
        )
        for file in payload.get("files", []):
            if file.get("path") == path:
                return file
        return None

    def put_file(self, drive: str, path: str, local_file: Path) -> dict[str, object]:
        if not local_file.is_file():
            die(self.ui, "--from must be a file")
        drive_id = self.resolve_drive(drive)
        size = local_file.stat().st_size
        if size > MAX_FILE_BYTES:
            die(
                self.ui,
                f"{path} exceeds the {MAX_FILE_BYTES} byte Drive file limit",
            )
        content_type = guess_content_type(local_file)
        sha = compute_sha256(local_file)
        body: dict[str, object] = {
            "path": path,
            "size": size,
            "contentType": content_type,
            "sha256": sha,
        }
        meta = self.file_meta(drive_id, path)
        if meta:
            body["ifMatch"] = meta["etag"]
        else:
            body["ifNoneMatch"] = "*"

        upload = self.client.post_json(
            f"/api/v1/drives/{drive_id}/files/uploads",
            body,
        )
        http_code = self.client.upload_bytes(
            upload["uploadUrl"],
            local_file,
            content_type,
        )
        if http_code < 200 or http_code >= 300:
            raise RuntimeError(f"upload failed for {path} (HTTP {http_code})")
        return self.client.post_json(
            f"/api/v1/drives/{drive_id}/files/finalize",
            {"uploadId": upload["uploadId"]},
        )

    def cmd_create(self, args: argparse.Namespace) -> int:
        body: dict[str, object] = {"isDefault": args.default}
        if args.name:
            body["name"] = args.name
        print_json(self.client.post_json("/api/v1/drives", body))
        return 0

    def cmd_default(self) -> int:
        print_json(self.client.get_json("/api/v1/drives/default"))
        return 0

    def cmd_ls(self, args: argparse.Namespace) -> int:
        if not args.drive:
            if self.uses_drive_token:
                die(self.ui, "drive tokens cannot list drives; pass a drv_ id")
            payload = self.client.get_json("/api/v1/drives")
            if sys.stdout.isatty():
                self.ui.drive_drives(payload)
            else:
                print_json(payload)
            return 0

        drive_id = self.resolve_drive(args.drive)
        prefix = args.prefix or ""
        payload = self.client.get_json(
            f"/api/v1/drives/{drive_id}/files?prefix={urlenc(prefix)}"
        )
        if sys.stdout.isatty():
            self.ui.drive_files(payload)
        else:
            print_json(payload)
        return 0

    def cmd_cat(self, args: argparse.Namespace) -> int:
        drive_id = self.resolve_drive(args.drive)
        payload = self.client.request(
            "GET",
            f"/api/v1/drives/{drive_id}/files/{urlenc_path(args.path)}",
            raw=True,
        )
        sys.stdout.buffer.write(payload)
        return 0

    def cmd_put(self, args: argparse.Namespace) -> int:
        try:
            print_json(
                self.put_file(args.drive, args.path, Path(args.from_path))
            )
        except RuntimeError as exc:
            die(self.ui, str(exc))
        return 0

    def cmd_import(self, args: argparse.Namespace) -> int:
        source = Path(args.from_path)
        if not source.is_dir():
            die(self.ui, "--from must be a folder")

        prefix = (args.prefix or "").rstrip("/")
        planned = uploaded = skipped = failed = 0

        for path in sorted(source.rglob("*")):
            if not path.is_file():
                continue
            rel = path.relative_to(source).as_posix()
            if rel.startswith(IMPORT_SKIP_PREFIXES) or rel.endswith("/.DS_Store"):
                continue
            if rel == ".DS_Store":
                continue

            planned += 1
            size = path.stat().st_size
            if size > MAX_FILE_BYTES:
                self.ui.say(
                    f"skip oversized {path} ({size} bytes > {MAX_FILE_BYTES})",
                    style="yellow",
                )
                skipped += 1
                continue

            dest = rel if not prefix else f"{prefix}/{rel}"
            if args.dry_run:
                self.ui.say(f"upload {path} -> {dest}")
                skipped += 1
                continue

            self.ui.step(f"upload {path} -> {dest}")
            try:
                self.put_file(args.drive, dest, path)
                uploaded += 1
            except RuntimeError as exc:
                self.ui.say(str(exc), style="red")
                failed += 1

        self.ui.import_summary(planned, uploaded, skipped, failed)
        return 1 if failed else 0

    def cmd_export(self, args: argparse.Namespace) -> int:
        drive_id = self.resolve_drive(args.drive)
        prefix = (args.prefix or "").rstrip("/")
        if not args.to_path:
            die(self.ui, "--to is required")

        total = 0
        cursor = ""
        while True:
            url = (
                f"/api/v1/drives/{drive_id}/files?prefix={urlenc(prefix)}&limit=200"
            )
            if cursor:
                url += f"&cursor={urlenc(cursor)}"
            payload = self.client.get_json(url)
            for file_path in (item.get("path") for item in payload.get("files", [])):
                if not file_path:
                    continue
                rel = file_path
                if prefix:
                    rel = file_path.removeprefix(f"{prefix}/")
                out = Path(args.to_path) / rel
                if args.dry_run:
                    self.ui.say(f"download {file_path} -> {out}")
                else:
                    self.ui.step(f"download {file_path} -> {out}")
                    self.client.download(
                        f"/api/v1/drives/{drive_id}/files/{urlenc_path(file_path)}",
                        out,
                    )
                total += 1
            cursor = payload.get("nextCursor") or ""
            if not cursor:
                break

        self.ui.export_summary(total)
        return 0

    def cmd_rm(self, args: argparse.Namespace) -> int:
        drive_id = self.resolve_drive(args.drive)
        if args.recursive:
            if args.confirm != args.path:
                die(
                    self.ui,
                    f"recursive delete requires --confirm '{args.path}'",
                )
            head = self.drive_head(drive_id)
            print_json(
                self.client.delete_json(
                    f"/api/v1/drives/{drive_id}/files/{urlenc_path(args.path)}"
                    f"?recursive=true&baseVersionId={urlenc(head)}"
                )
            )
            return 0

        meta = self.file_meta(drive_id, args.path)
        if not meta:
            die(self.ui, f"file not found: {args.path}")
        print_json(
            self.client.request(
                "DELETE",
                f"/api/v1/drives/{drive_id}/files/{urlenc_path(args.path)}",
                extra_headers={"If-Match": str(meta["etag"])},
            )
        )
        return 0

    def cmd_share(self, args: argparse.Namespace) -> int:
        drive_id = self.resolve_drive(args.drive)
        body: dict[str, object] = {"perms": args.perms}
        if args.manage_tokens:
            body["manageTokens"] = True
        if args.ttl:
            body["ttl"] = args.ttl
        if args.prefix:
            body["pathPrefix"] = args.prefix
        if args.label:
            body["label"] = args.label
        response = self.client.post_json(
            f"/api/v1/drives/{drive_id}/tokens",
            body,
        )
        print(response.get("shareBlock", ""))
        return 0

    def cmd_tokens(self, args: argparse.Namespace) -> int:
        drive_id = self.resolve_drive(args.drive)
        print_json(self.client.get_json(f"/api/v1/drives/{drive_id}/tokens"))
        return 0

    def cmd_revoke(self, args: argparse.Namespace) -> int:
        drive_id = self.resolve_drive(args.drive)
        print_json(
            self.client.delete_json(
                f"/api/v1/drives/{drive_id}/tokens/{args.token_id}"
            )
        )
        return 0

    def cmd_delete(self, args: argparse.Namespace) -> int:
        drive_id = self.resolve_drive(args.drive)
        payload = self.client.get_json(f"/api/v1/drives/{drive_id}")
        name = payload.get("drive", payload).get("name", "")
        if args.confirm != name:
            die(self.ui, f"delete requires --confirm '{name}'")
        print_json(self.client.delete_json(f"/api/v1/drives/{drive_id}"))
        return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage here.now Drives")
    parser.add_argument("--api-key", dest="api_key")
    parser.add_argument("--token")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--allow-nonherenow-base-url", action="store_true")

    sub = parser.add_subparsers(dest="command")

    create = sub.add_parser("create")
    create.add_argument("name", nargs="?", default="")
    create.add_argument("--default", action="store_true")

    sub.add_parser("default")

    ls = sub.add_parser("ls")
    ls.add_argument("drive", nargs="?")
    ls.add_argument("prefix", nargs="?", default="")

    cat = sub.add_parser("cat")
    cat.add_argument("drive")
    cat.add_argument("path")

    put = sub.add_parser("put")
    put.add_argument("drive")
    put.add_argument("path")
    put.add_argument("--from", dest="from_path", required=True)

    imp = sub.add_parser("import")
    imp.add_argument("drive")
    imp.add_argument("prefix")
    imp.add_argument("--from", dest="from_path", required=True)
    imp.add_argument("--dry-run", action="store_true")

    export = sub.add_parser("export")
    export.add_argument("drive")
    export.add_argument("prefix")
    export.add_argument("--to", dest="to_path")
    export.add_argument("--dry-run", action="store_true")

    rm = sub.add_parser("rm")
    rm.add_argument("drive")
    rm.add_argument("path")
    rm.add_argument("--recursive", action="store_true")
    rm.add_argument("--confirm")

    share = sub.add_parser("share")
    share.add_argument("drive")
    share.add_argument("--perms", default="write")
    share.add_argument("--prefix", default="")
    share.add_argument("--ttl", default="")
    share.add_argument("--label", default="")
    share.add_argument("--manage-tokens", action="store_true")

    tokens = sub.add_parser("tokens")
    tokens.add_argument("drive")

    revoke = sub.add_parser("revoke")
    revoke.add_argument("drive")
    revoke.add_argument("token_id")

    delete = sub.add_parser("delete")
    delete.add_argument("drive")
    delete.add_argument("--confirm")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return 1

    app = DriveApp(args)
    handlers = {
        "create": lambda: app.cmd_create(args),
        "default": app.cmd_default,
        "ls": lambda: app.cmd_ls(args),
        "cat": lambda: app.cmd_cat(args),
        "put": lambda: app.cmd_put(args),
        "import": lambda: app.cmd_import(args),
        "export": lambda: app.cmd_export(args),
        "rm": lambda: app.cmd_rm(args),
        "share": lambda: app.cmd_share(args),
        "tokens": lambda: app.cmd_tokens(args),
        "revoke": lambda: app.cmd_revoke(args),
        "delete": lambda: app.cmd_delete(args),
    }
    return handlers[args.command]()


if __name__ == "__main__":
    raise SystemExit(main())
