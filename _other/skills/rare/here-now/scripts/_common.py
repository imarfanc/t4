"""Shared helpers for here-now publish.py and drive.py."""

from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import re
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
except ModuleNotFoundError:
    print(
        "rich is required: uv run --with rich publish.py  (or drive.py)",
        file=sys.stderr,
    )
    raise SystemExit(1) from None

DEFAULT_BASE_URL = "https://here.now"
CREDENTIALS_FILE = Path.home() / ".herenow" / "credentials"
MAX_FILE_BYTES = 500 * 1024 * 1024
STATE_DIR = Path(".herenow")
STATE_FILE = STATE_DIR / "state.json"

_CONTENT_TYPES = {
    "html": "text/html; charset=utf-8",
    "htm": "text/html; charset=utf-8",
    "css": "text/css; charset=utf-8",
    "js": "text/javascript; charset=utf-8",
    "mjs": "text/javascript; charset=utf-8",
    "json": "application/json; charset=utf-8",
    "excalidraw": "application/json; charset=utf-8",
    "md": "text/plain; charset=utf-8",
    "txt": "text/plain; charset=utf-8",
    "svg": "image/svg+xml",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
    "pdf": "application/pdf",
    "mp4": "video/mp4",
    "mov": "video/quicktime",
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "xml": "application/xml",
    "woff2": "font/woff2",
    "woff": "font/woff",
    "ttf": "font/ttf",
    "ico": "image/x-icon",
}


class UI:
    def __init__(self) -> None:
        self.console = Console(stderr=True, highlight=False)

    def say(self, message: str, *, style: str = "dim") -> None:
        self.console.print(message, style=style)

    def step(self, message: str) -> None:
        self.console.print(message, style="cyan")

    def error(self, message: str) -> None:
        self.console.print(f"error: {message}", style="bold red")

    def upload_progress(self, current: int, total: int, path: str) -> None:
        self.console.print(
            f"[cyan]upload[/cyan] [{current}/{total}] [dim]{path}[/dim]"
        )

    def publish_summary(self, data: dict[str, str]) -> None:
        site_url = data.get("site_url", "")
        slug = data.get("slug", "")
        auth_mode = data.get("auth_mode", "")
        action = data.get("action", "publish")
        persistence = data.get("persistence", "")

        lines = [
            f"[bold green]{action.replace('_', ' ').title()}[/bold green] "
            f"[dim]({auth_mode})[/dim]",
        ]
        if slug:
            lines.append(f"[bold]slug[/bold]  {slug}")
        if site_url:
            lines.append(f"[bold]url[/bold]   [link={site_url}]{site_url}[/link]")

        if persistence == "permanent" or auth_mode == "authenticated":
            lines.append("[green]permanent — saved to your account[/green]")
        elif persistence == "expires_24h" or auth_mode == "anonymous":
            lines.append("[yellow]anonymous — expires in 24 hours[/yellow]")
            claim_url = data.get("claim_url", "")
            if claim_url.startswith("https://"):
                lines.append(f"[bold]claim[/bold] [link={claim_url}]{claim_url}[/link]")

        expires_at = data.get("expires_at", "")
        if expires_at:
            lines.append(f"[dim]expires[/dim] {expires_at}")

        drive_id = data.get("drive_id", "")
        if drive_id:
            lines.append(f"[bold]drive[/bold] {drive_id}")
            drive_version = data.get("drive_version_id", "")
            if drive_version:
                lines.append(f"[bold]version[/bold] {drive_version}")

        self.console.print(
            Panel("\n".join(lines), title="here.now publish", border_style="green")
        )

    def drive_drives(self, payload: dict[str, Any]) -> None:
        table = Table(title="Drives", show_header=True, header_style="bold cyan")
        table.add_column("Name")
        table.add_column("ID")
        table.add_column("Default")
        for drive in payload.get("drives", []):
            table.add_row(
                str(drive.get("name", "")),
                str(drive.get("id", "")),
                "yes" if drive.get("isDefault") else "",
            )
        self.console.print(table)

    def drive_files(self, payload: dict[str, Any]) -> None:
        table = Table(title="Drive files", show_header=True, header_style="bold cyan")
        table.add_column("Path")
        table.add_column("Size")
        table.add_column("Type")
        for file in payload.get("files", []):
            table.add_row(
                str(file.get("path", "")),
                str(file.get("size", "")),
                str(file.get("contentType", "")),
            )
        self.console.print(table)

    def import_summary(
        self, planned: int, uploaded: int, skipped: int, failed: int
    ) -> None:
        style = "green" if failed == 0 else "red"
        self.console.print(
            Panel(
                f"planned [bold]{planned}[/bold]  "
                f"uploaded [bold green]{uploaded}[/bold green]  "
                f"skipped [bold yellow]{skipped}[/bold yellow]  "
                f"failed [bold red]{failed}[/bold red]",
                title="Drive import",
                border_style=style,
            )
        )

    def export_summary(self, total: int) -> None:
        self.console.print(
            Panel(
                f"downloaded [bold green]{total}[/bold green] file(s)",
                title="Drive export",
                border_style="green",
            )
        )


def die(ui: UI, message: str, code: int = 1) -> None:
    ui.error(message)
    raise SystemExit(code)


def compute_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def guess_content_type(path: Path) -> str:
    ext = path.suffix.lstrip(".").lower()
    if ext in _CONTENT_TYPES:
        return _CONTENT_TYPES[ext]
    guessed, _ = mimetypes.guess_type(str(path))
    return guessed or "application/octet-stream"


def normalize_client(client: str) -> str:
    normalized = re.sub(r"[^a-z0-9._-]", "-", client.lower())
    return normalized.strip("-")


def client_header(client: str | None, *, suffix: str) -> str:
    value = f"here-now-{suffix}"
    if client:
        normalized = normalize_client(client)
        if normalized:
            value = f"{normalized}/{suffix}"
    return value


def load_api_key(explicit: str | None) -> tuple[str, str]:
    if explicit:
        return explicit, "flag"
    env = os.environ.get("HERENOW_API_KEY", "").strip()
    if env:
        return env, "env"
    if CREDENTIALS_FILE.is_file():
        key = CREDENTIALS_FILE.read_text(encoding="utf-8").strip()
        if key:
            return key, "credentials"
    return "", "none"


def load_drive_token(explicit: str | None) -> str:
    if explicit:
        return explicit
    return os.environ.get("HERENOW_DRIVE_TOKEN", "").strip()


def urlenc(value: str) -> str:
    return quote(value, safe="")


def urlenc_path(path: str) -> str:
    return "/".join(urlenc(part) for part in path.split("/") if part != "")


def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2))


def emit_publish_result(**fields: str) -> None:
    print("", file=sys.stderr)
    for key, value in fields.items():
        print(f"publish_result.{key}={value}", file=sys.stderr)


class ApiError(RuntimeError):
    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(f"HTTP {code}: {message}")


def auth_help_for_slug_update(slug: str, *, has_claim_token: bool) -> str:
    lines = [
        f"Cannot update site '{slug}' without authentication.",
        "",
        "Provide one of:",
        "  • API key in ~/.herenow/credentials (recommended)",
        "  • HERENOW_API_KEY environment variable",
    ]
    if has_claim_token:
        lines.append("  • claim token (from .herenow/state.json or --claim-token)")
    else:
        lines.append(
            "  • --claim-token (anonymous sites only; none in .herenow/state.json)"
        )
    lines.extend(
        [
            "",
            "Get an API key: https://here.now/docs",
            "  curl -sS https://here.now/api/auth/agent/request-code \\",
            "    -H 'content-type: application/json' -d '{\"email\":\"you@example.com\"}'",
        ]
    )
    return "\n".join(lines)


class ApiClient:
    def __init__(
        self,
        base_url: str,
        token: str,
        *,
        client_header_value: str | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.client_header_value = client_header_value

    def _headers(self, *, json_body: bool = False) -> dict[str, str]:
        headers: dict[str, str] = {}
        if self.token:
            headers["authorization"] = f"Bearer {self.token}"
        if json_body:
            headers["content-type"] = "application/json"
        if self.client_header_value:
            headers["x-herenow-client"] = self.client_header_value
        return headers

    def request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        *,
        extra_headers: dict[str, str] | None = None,
        raw: bool = False,
    ) -> Any:
        url = path if path.startswith("http") else f"{self.base_url}{path}"
        data = None
        headers = self._headers(json_body=body is not None)
        if extra_headers:
            headers.update(extra_headers)
        if body is not None:
            data = json.dumps(body).encode()
        req = Request(url, data=data, method=method, headers=headers)
        try:
            with urlopen(req) as resp:
                payload = resp.read()
                if raw:
                    return payload
                if not payload:
                    return {}
                return json.loads(payload.decode())
        except HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            try:
                parsed = json.loads(detail)
                err = parsed.get("error") or detail
            except json.JSONDecodeError:
                err = detail or exc.reason
            raise ApiError(exc.code, str(err)) from exc

    def get_json(self, path: str) -> Any:
        return self.request("GET", path)

    def post_json(self, path: str, body: dict[str, Any] | None = None) -> Any:
        return self.request("POST", path, body)

    def put_json(self, path: str, body: dict[str, Any] | None = None) -> Any:
        return self.request("PUT", path, body)

    def delete_json(self, path: str) -> Any:
        return self.request("DELETE", path)

    def upload_bytes(self, url: str, path: Path, content_type: str) -> int:
        req = Request(
            url,
            data=path.read_bytes(),
            method="PUT",
            headers={"Content-Type": content_type},
        )
        try:
            with urlopen(req) as resp:
                return resp.status
        except HTTPError as exc:
            return exc.code

    def download(self, path: str, out: Path) -> None:
        payload = self.request("GET", path, raw=True)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(payload)
