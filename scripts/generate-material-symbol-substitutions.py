from pathlib import Path
import sys
from xml.sax.saxutils import escape


root = Path(__file__).resolve().parent.parent
source = root / "assets/material-symbols/outlined"
target = root / "src/Goo.Widgets/ILLink.Substitutions.xml"
lines = [
    "<linker>",
    '  <assembly fullname="Goo.Widgets" feature="Goo.Widgets.MaterialSymbols.Subset" featurevalue="true">',
]
for svg in sorted(source.glob("*.svg")):
    lines.append(f'    <resource name="Goo.Widgets.MaterialSymbols.{escape(svg.stem)}.svg" action="remove" />')
lines.extend(["  </assembly>", "</linker>"])
content = "\n".join(lines) + "\n"

if sys.argv[1:] == ["--check"]:
    if not target.exists() or target.read_text() != content:
        raise SystemExit("Material Symbol substitutions are stale. Run scripts/generate-material-symbol-substitutions.py.")
elif not sys.argv[1:]:
    target.write_text(content)
else:
    raise SystemExit("Usage: generate-material-symbol-substitutions.py [--check]")
