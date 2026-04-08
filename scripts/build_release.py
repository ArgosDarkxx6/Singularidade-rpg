from __future__ import annotations

import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT / "dist"
STAGE_ROOT_NAME = "Singularidade"
STAGE_DIR = DIST_DIR / STAGE_ROOT_NAME
PUBLIC_DIR = DIST_DIR / "cloudflare-public"
ZIP_PATH = DIST_DIR / "Singularidade.zip"
MAX_EXTRACTED_PATH = 180

TOP_LEVEL_FILES = [
    "index.html",
    "book.html",
    "app.js",
    "styles.css",
    "styles.mobile.css",
    "wrangler.jsonc",
    "README.md",
    "CHANGELOG.md",
    "TEST_REPORT.md",
]

ASSET_ENTRIES = [
    "book_art",
    "reference_art",
    "cover.png",
    "icon.png",
    "logo.png",
    "Singularidade_Livro_de_Regras.pdf",
]

STYLE_ENTRIES = [
    "tokens.css",
    "components.css",
    "shell.css",
    "views.css",
    "mobile-base.css",
    "mobile.css",
]

CRITICAL_PUBLIC_FILES = [
    "index.html",
    "book.html",
    "app.js",
    "styles.css",
    "styles.mobile.css",
    "styles/tokens.css",
    "styles/components.css",
    "styles/shell.css",
    "styles/views.css",
    "styles/mobile-base.css",
    "styles/mobile.css",
    "src/main.js",
    "src/book-page.js",
    "assets/icon.png",
    "assets/logo.png",
    "assets/cover.png",
    "assets/Singularidade_Livro_de_Regras.pdf",
]


def remove_path(path: Path) -> None:
    if path.is_dir():
        shutil.rmtree(path)
    elif path.exists():
        path.unlink()


def ensure_clean_stage() -> None:
    remove_path(DIST_DIR)
    STAGE_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)


def clean_workspace_artifacts() -> None:
    remove_path(ROOT / "Singularidade_site_final")
    remove_path(ROOT / "Singularidade_site_final.zip")
    remove_path(ROOT / "tests" / "artifacts")

    for cache_dir in ROOT.rglob("__pycache__"):
        remove_path(cache_dir)

    for pyc_file in ROOT.rglob("*.pyc"):
        remove_path(pyc_file)


def copy_runtime_bundle(target: Path) -> None:
    for name in ("index.html", "book.html", "app.js", "styles.css", "styles.mobile.css"):
        source = ROOT / name
        if source.exists():
            shutil.copy2(source, target / name)

    styles_target = target / "styles"
    styles_target.mkdir(parents=True, exist_ok=True)
    for name in STYLE_ENTRIES:
        source = ROOT / "styles" / name
        if source.exists():
            shutil.copy2(source, styles_target / name)

    shutil.copytree(ROOT / "src", target / "src", dirs_exist_ok=True)

    assets_target = target / "assets"
    assets_target.mkdir(parents=True, exist_ok=True)
    for name in ASSET_ENTRIES:
        source = ROOT / "assets" / name
        target = assets_target / name
        if source.is_dir():
            shutil.copytree(source, target, dirs_exist_ok=True)
        elif source.exists():
            shutil.copy2(source, target)


def copy_required_files() -> None:
    for name in TOP_LEVEL_FILES:
        source = ROOT / name
        if source.exists():
            shutil.copy2(source, STAGE_DIR / name)

    copy_runtime_bundle(STAGE_DIR)
    copy_runtime_bundle(PUBLIC_DIR)

    if (ROOT / "cloudflare").exists():
        shutil.copytree(ROOT / "cloudflare", STAGE_DIR / "cloudflare", dirs_exist_ok=True)


def validate_public_bundle() -> list[str]:
    missing: list[str] = []
    for relative in CRITICAL_PUBLIC_FILES:
        if not (PUBLIC_DIR / relative).exists():
            missing.append(relative)
    return missing


def validate_stage() -> tuple[int, list[tuple[int, str]]]:
    violations: list[tuple[int, str]] = []
    staged_lengths: list[tuple[int, str]] = []
    forbidden_entries = {"__pycache__", "release_build", "tests", "artifacts"}

    for path in sorted(STAGE_DIR.rglob("*")):
        relative = path.relative_to(STAGE_DIR)
        archive_path = Path(STAGE_ROOT_NAME) / relative
        length = len(str(archive_path).replace("/", "\\"))
        staged_lengths.append((length, str(archive_path).replace("/", "\\")))

        if any(part in forbidden_entries for part in path.parts):
            violations.append((length, f"forbidden entry: {archive_path}"))
        if path.suffix.lower() == ".pyc":
            violations.append((length, f"compiled python cache: {archive_path}"))
        if path.name.lower().endswith(".zip"):
            violations.append((length, f"nested zip: {archive_path}"))
        if length > MAX_EXTRACTED_PATH:
            violations.append((length, f"path too long: {archive_path}"))

    max_length = max((length for length, _ in staged_lengths), default=0)
    return max_length, violations


def write_zip() -> None:
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(STAGE_DIR.rglob("*")):
            if path.is_file():
                arcname = (Path(STAGE_ROOT_NAME) / path.relative_to(STAGE_DIR)).as_posix()
                archive.write(path, arcname)


def print_summary(max_length: int) -> None:
    print(f"Stage directory: {STAGE_DIR}")
    print(f"Cloudflare public directory: {PUBLIC_DIR}")
    print(f"Final zip: {ZIP_PATH}")
    print(f"Max extracted path length: {max_length}")


def main() -> int:
    if not (ROOT / "src").exists():
        print("Missing required directory: src", file=sys.stderr)
        return 1
    if not (ROOT / "assets").exists():
        print("Missing required directory: assets", file=sys.stderr)
        return 1

    clean_workspace_artifacts()
    ensure_clean_stage()
    copy_required_files()
    max_length, violations = validate_stage()
    missing_public_files = validate_public_bundle()

    if violations:
        print("Release validation failed:", file=sys.stderr)
        for length, message in violations:
            print(f"  [{length}] {message}", file=sys.stderr)
        return 1
    if missing_public_files:
        print("Release validation failed:", file=sys.stderr)
        for relative in missing_public_files:
            print(f"  missing public bundle file: {relative}", file=sys.stderr)
        return 1

    write_zip()
    print_summary(max_length)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
