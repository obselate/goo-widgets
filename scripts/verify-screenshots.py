from pathlib import Path
import re
import sys


root = Path(__file__).resolve().parent.parent
library = root / "src" / "Goo.Widgets"
gallery = root / "samples" / "Goo.Widgets.Gallery"
screenshots = root / "samples" / "screenshots"
registry_path = gallery / "Gallery.gs"
build_pattern = re.compile(r"\bfunc\s+Build\s*\(")
png_signature = b"\x89PNG\r\n\x1a\n"


def is_widget(path: Path) -> bool:
    source = path.read_text(encoding="utf-8")
    declaration = rf"\bpublic\s+(?:(?:open|data|partial|sealed)\s+)*(?:class|struct)\s+{re.escape(path.stem)}\b"
    return bool(build_pattern.search(source) and re.search(declaration, source))


widgets = sorted({
    path.stem
    for path in library.rglob("*.gs")
    if is_widget(path)
})
markdown_library = root / "src" / "Goo.Widgets.Markdown"
widgets += sorted(path.stem for path in markdown_library.glob("*.gs")
                  if is_widget(path))
errors: list[str] = []

if not widgets:
    errors.append(f"no widget Build methods found under: {library}")

registry = registry_path.read_text(encoding="utf-8")
for widget in widgets:
    page_name = f"{widget}Page.gs"
    pages = sorted(gallery.rglob(page_name))
    if not pages:
        errors.append(f"missing gallery page: {gallery}/**/{page_name}")
    elif len(pages) > 1:
        errors.append(f"multiple gallery pages for {widget}: {', '.join(map(str, pages))}")

    if not re.search(rf"\b{re.escape(widget)}Page\s*\{{\s*\}}", registry):
        errors.append(f"missing gallery registration: {registry_path} ({widget}Page{{}})")

    screenshot = screenshots / f"{widget}.png"
    if not screenshot.is_file():
        errors.append(f"missing screenshot: {screenshot}")
        continue

    with screenshot.open("rb") as stream:
        header = stream.read(33)
    if len(header) < 33:
        errors.append(f"invalid screenshot {screenshot}: truncated PNG header")
    elif header[:8] != png_signature:
        errors.append(f"invalid screenshot {screenshot}: missing PNG signature")
    elif header[12:16] != b"IHDR" or int.from_bytes(header[8:12], "big") != 13:
        errors.append(f"invalid screenshot {screenshot}: first chunk is not a 13-byte IHDR")
    elif 0 in (int.from_bytes(header[16:20], "big"), int.from_bytes(header[20:24], "big")):
        errors.append(f"invalid screenshot {screenshot}: PNG dimensions must be positive")

if errors:
    print(f"Screenshot verification failed for {len(widgets)} widgets:", file=sys.stderr)
    print("\n".join(f"- {error}" for error in errors), file=sys.stderr)
    raise SystemExit(1)

print(f"Verified {len(widgets)} widget screenshots.")
