from __future__ import annotations

import base64
import hashlib
import json
import mimetypes
import os
import secrets
import sys
from pathlib import Path
from typing import Iterable
from urllib import parse, request
from urllib.error import HTTPError


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "dist" / "cloudflare-public"
WORKER_FILE = ROOT / "cloudflare" / "worker.mjs"
API_BASE = "https://api.cloudflare.com/client/v4"

DEFAULT_ACCOUNT_ID = "9e13869217d7d61b24b8bdd95ac7cb45"
DEFAULT_D1_ID = "442122da-05e0-4d74-996d-84ca6567a6af"
DEFAULT_SCRIPT_NAME = "singularidade-online"
DEFAULT_R2_BUCKET = "singularidade-avatars"


def require_env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if value:
        return value
    raise SystemExit(f"Missing required environment variable: {name}")


def api_request(
    method: str,
    path: str,
    *,
    token: str,
    body: bytes | None = None,
    content_type: str | None = "application/json",
    extra_headers: dict[str, str] | None = None,
) -> dict:
    headers = {
        "Authorization": f"Bearer {token}",
    }
    if content_type:
        headers["Content-Type"] = content_type
    if extra_headers:
        headers.update(extra_headers)

    req = request.Request(f"{API_BASE}{path}", method=method, headers=headers, data=body)
    try:
        with request.urlopen(req) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as error:
            raise RuntimeError(f"Cloudflare HTTP {exc.code}: {raw}") from error
        if not payload.get("success", False):
            messages = payload.get("errors") or payload.get("messages") or [{"message": "Unknown Cloudflare error"}]
            raise RuntimeError(messages[0]["message"])
        raise
    if not payload.get("success", False):
        messages = payload.get("errors") or payload.get("messages") or [{"message": "Unknown Cloudflare error"}]
        raise RuntimeError(messages[0]["message"])
    return payload


def iter_files(directory: Path) -> Iterable[Path]:
    for path in sorted(directory.rglob("*")):
        if path.is_file():
            yield path


def create_manifest(directory: Path) -> tuple[dict[str, dict[str, int | str]], dict[str, dict[str, str]]]:
    manifest: dict[str, dict[str, int | str]] = {}
    uploads: dict[str, dict[str, str]] = {}

    for path in iter_files(directory):
        relative = "/" + path.relative_to(directory).as_posix()
        raw = path.read_bytes()
        encoded = base64.b64encode(raw).decode("ascii")
        extension = path.suffix.lstrip(".")
        digest = hashlib.sha256((encoded + extension).encode("utf-8")).hexdigest()[:32]
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"

        manifest[relative] = {
            "hash": digest,
            "size": len(raw),
        }
        uploads[digest] = {
            "base64": encoded,
            "content_type": mime,
            "path": relative,
        }

    if not manifest:
        raise RuntimeError(f"No files found in {directory}")
    return manifest, uploads


def build_multipart(parts: list[dict[str, str]]) -> tuple[bytes, str]:
    boundary = f"----Singularidade{secrets.token_hex(12)}"
    chunks: list[bytes] = []
    for part in parts:
        chunks.append(f"--{boundary}\r\n".encode("utf-8"))
        disposition = f'Content-Disposition: form-data; name="{part["name"]}"'
        if "filename" in part:
            disposition += f'; filename="{part["filename"]}"'
        chunks.append(f"{disposition}\r\n".encode("utf-8"))
        if part.get("content_type"):
            chunks.append(f'Content-Type: {part["content_type"]}\r\n'.encode("utf-8"))
        chunks.append(b"\r\n")
        body = part["body"]
        chunks.append(body if isinstance(body, bytes) else body.encode("utf-8"))
        chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def upload_assets(account_id: str, script_name: str, token: str, manifest: dict, uploads: dict) -> str:
    session = api_request(
        "POST",
        f"/accounts/{account_id}/workers/scripts/{script_name}/assets-upload-session",
        token=token,
        body=json.dumps({"manifest": manifest}).encode("utf-8"),
    )["result"]

    buckets = session.get("buckets") or []
    completion_token = session.get("jwt")
    if not completion_token:
        raise RuntimeError("Cloudflare did not return an upload JWT.")

    for bucket in buckets:
        parts = []
        for digest in bucket:
            entry = uploads[digest]
            parts.append(
                {
                    "name": digest,
                    "filename": digest,
                    "content_type": entry["content_type"],
                    "body": entry["base64"],
                }
            )
        body, content_type = build_multipart(parts)
        response = api_request(
            "POST",
            f"/accounts/{account_id}/workers/assets/upload?base64=true",
            token=completion_token,
            body=body,
            content_type=content_type,
        )
        next_jwt = (response.get("result") or {}).get("jwt")
        if next_jwt:
            completion_token = next_jwt

    return completion_token


def deploy_worker(
    account_id: str,
    script_name: str,
    api_token: str,
    completion_token: str,
    d1_id: str,
    reference_source: str,
    r2_bucket: str | None,
    do_migration_tag: str | None,
) -> dict:
    worker_code = WORKER_FILE.read_text(encoding="utf-8")
    bindings: list[dict[str, str]] = [
        {"name": "ASSETS", "type": "assets"},
        {"name": "DB", "type": "d1", "id": d1_id},
        {"name": "TABLE_ROOM", "type": "durable_object_namespace", "class_name": "TableRoom"},
        {"name": "REFERENCE_SOURCE", "type": "plain_text", "text": reference_source},
    ]
    if r2_bucket:
        bindings.append({"name": "AVATARS", "type": "r2_bucket", "bucket_name": r2_bucket})

    metadata = {
        "main_module": "worker.mjs",
        "compatibility_date": "2026-04-07",
        "bindings": bindings,
        "assets": {
            "jwt": completion_token,
            "config": {
                "html_handling": "auto-trailing-slash",
                "not_found_handling": "single-page-application",
                "run_worker_first": ["/api/*"],
            },
        },
    }
    if do_migration_tag:
        metadata["migrations"] = {
            "new_tag": do_migration_tag,
            "new_sqlite_classes": ["TableRoom"],
        }

    parts = [
        {
            "name": "metadata",
            "content_type": "application/json",
            "body": json.dumps(metadata),
        },
        {
            "name": "worker.mjs",
            "filename": "worker.mjs",
            "content_type": "application/javascript+module",
            "body": worker_code,
        },
    ]
    body, content_type = build_multipart(parts)
    return api_request(
        "PUT",
        f"/accounts/{account_id}/workers/scripts/{script_name}",
        token=api_token,
        body=body,
        content_type=content_type,
    )


def main() -> int:
    api_token = require_env("CLOUDFLARE_API_TOKEN")
    account_id = require_env("CLOUDFLARE_ACCOUNT_ID", DEFAULT_ACCOUNT_ID)
    script_name = require_env("CLOUDFLARE_SCRIPT_NAME", DEFAULT_SCRIPT_NAME)
    d1_id = require_env("CLOUDFLARE_D1_ID", DEFAULT_D1_ID)
    reference_source = os.environ.get("CLOUDFLARE_REFERENCE_SOURCE", "jujutsu-kaisen-fandom")
    r2_bucket = os.environ.get("CLOUDFLARE_R2_BUCKET", DEFAULT_R2_BUCKET)
    do_migration_tag = os.environ.get("CLOUDFLARE_DO_MIGRATION_TAG", "").strip() or None

    if not PUBLIC_DIR.exists():
        raise SystemExit(f"Missing build output: {PUBLIC_DIR}. Run python scripts/build_release.py first.")
    if not WORKER_FILE.exists():
        raise SystemExit(f"Missing worker file: {WORKER_FILE}")

    manifest, uploads = create_manifest(PUBLIC_DIR)
    completion_token = upload_assets(account_id, script_name, api_token, manifest, uploads)
    result = deploy_worker(
        account_id,
        script_name,
        api_token,
        completion_token,
        d1_id,
        reference_source,
        r2_bucket,
        do_migration_tag,
    )
    subdomain = os.environ.get("CLOUDFLARE_SUBDOMAIN", "salesweslley360")

    print(json.dumps(
        {
            "ok": True,
            "worker": script_name,
            "subdomain": subdomain,
            "url": f"https://{script_name}.{subdomain}.workers.dev",
            "manifest_files": len(manifest),
            "cloudflare_result": result.get("result", {}),
        },
        ensure_ascii=False,
        indent=2,
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
