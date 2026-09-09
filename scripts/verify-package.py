from pathlib import Path
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile

root = Path(__file__).resolve().parent.parent
project = ET.parse(root / "src/Goo.Widgets/Goo.Widgets.gsproj").getroot()
version = project.findtext("PropertyGroup/Version")
if not version or not re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?", version):
    raise SystemExit("The library Version must be SemVer.")
package = root / "artifacts/packages" / f"Goo.Widgets.{version}.nupkg"
with ZipFile(package) as archive:
    required = {
        "lib/net10.0/Goo.Widgets.dll", "lib/net10.0/Goo.Widgets.xml", "README.md",
        "LICENSE", "licenses/material-symbols/LICENSE", "licenses/material-symbols/README.md",
    }
    missing = required - set(archive.namelist())
    if missing:
        raise SystemExit(f"Package is missing {sorted(missing)}")
    manifest = ET.fromstring(archive.read("Goo.Widgets.nuspec"))
    ns = {"n": manifest.tag.split("}")[0].lstrip("{")}
    metadata = manifest.find("n:metadata", ns)
    if metadata.findtext("n:version", namespaces=ns) != version:
        raise SystemExit("Package version does not match the library.")
    if metadata.findtext("n:license", namespaces=ns) != "MIT AND Apache-2.0":
        raise SystemExit("Package must declare MIT for widgets and Apache-2.0 for icons.")
    dependencies = {item.attrib["id"]: item.attrib["version"] for item in manifest.findall(".//n:dependency", ns)}
    expected_dependencies = {item.attrib["Include"]: item.attrib["Version"] for item in project.findall(".//PackageReference")}
    if dependencies != expected_dependencies:
        raise SystemExit(f"Package dependencies {dependencies} do not match {expected_dependencies}")
    if any(name.startswith(("deps/", "samples/", "tests/")) for name in archive.namelist()):
        raise SystemExit("Build tooling or consumer source leaked into the package.")
    for name in required:
        target = root / "artifacts/package" / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(archive.read(name))
print(f"Verified {package.name}: assembly, documentation, licenses, and dependencies {dependencies}.")
