from pathlib import Path
import re
import struct
import xml.etree.ElementTree as ET
import zlib
from zipfile import ZipFile

root = Path(__file__).resolve().parent.parent


def validate_embedded_pdb(data):
    if len(data) < 64 or data[:2] != b"MZ":
        raise SystemExit("Packaged assembly is not a PE image.")
    pe = struct.unpack_from("<I", data, 60)[0]
    if pe + 24 > len(data) or data[pe:pe + 4] != b"PE\0\0":
        raise SystemExit("Packaged assembly has no PE header.")
    section_count = struct.unpack_from("<H", data, pe + 6)[0]
    optional_size = struct.unpack_from("<H", data, pe + 20)[0]
    optional = pe + 24
    if optional + optional_size > len(data):
        raise SystemExit("Packaged assembly has an invalid optional header.")
    magic = struct.unpack_from("<H", data, optional)[0]
    directory = optional + (96 if magic == 0x10B else 112 if magic == 0x20B else -1)
    if directory < optional or directory + 56 > len(data):
        raise SystemExit("Packaged assembly has an invalid optional header.")
    debug_rva, debug_size = struct.unpack_from("<II", data, directory + 48)
    sections = optional + optional_size
    debug_offset = None
    for index in range(section_count):
        section = sections + index * 40
        if section + 40 > len(data):
            raise SystemExit("Packaged assembly has an invalid section table.")
        virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from(
            "<IIII", data, section + 8)
        if virtual_address <= debug_rva < virtual_address + max(virtual_size, raw_size):
            debug_offset = raw_offset + debug_rva - virtual_address
            break
    if debug_offset is None or debug_offset + debug_size > len(data) or debug_size % 28 != 0:
        raise SystemExit("Packaged assembly has an invalid debug directory.")
    embedded = []
    for index in range(debug_size // 28):
        entry = debug_offset + index * 28
        kind = struct.unpack_from("<I", data, entry + 12)[0]
        size = struct.unpack_from("<I", data, entry + 16)[0]
        raw_offset = struct.unpack_from("<I", data, entry + 24)[0]
        if size > 0 and raw_offset + size > len(data):
            raise SystemExit("Packaged assembly has invalid debug data.")
        if kind == 17:
            embedded.append(data[raw_offset:raw_offset + size])
    if len(embedded) != 1:
        raise SystemExit("Packaged assembly must contain one embedded portable PDB.")
    payload = embedded[0]
    if len(payload) < 8 or payload[:4] != b"MPDB":
        raise SystemExit("Packaged assembly has an invalid embedded PDB header.")
    declared = struct.unpack_from("<I", payload, 4)[0]
    try:
        pdb = zlib.decompress(payload[8:], -15)
    except zlib.error as error:
        raise SystemExit("Packaged assembly has an invalid embedded PDB payload.") from error
    if len(pdb) != declared:
        raise SystemExit("Packaged assembly embedded PDB length is invalid.")
    if len(pdb) < 4 or pdb[:4] != b"BSJB":
        raise SystemExit("Packaged assembly embedded PDB is not portable.")


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
    validate_embedded_pdb(archive.read("lib/net10.0/Goo.Widgets.dll"))
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
