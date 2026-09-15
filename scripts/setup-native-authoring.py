#!/usr/bin/env python3
import argparse
from pathlib import Path
import subprocess
import shutil

from bootstrap_gsharp import bootstrap

ROOT = Path(__file__).resolve().parents[1]
VERSION = "0.5.4-preview.2"

parser = argparse.ArgumentParser(description="Build upstream G# tools and local Goo preview dependencies.")
parser.add_argument("--goo-source", type=Path, default=ROOT.parent / "goo-gsharp")
parser.add_argument("--linux-sdl", type=Path, help="Current patched Linux SDL payload; defaults to the core native-authoring artifact.")
args = parser.parse_args()
goo = args.goo_source.resolve()
if not (goo / "Goo/Goo.gsproj").is_file():
    parser.error("--goo-source must point to the standalone Goo checkout with Container.Add and Button.Add")
linux_sdl = (args.linux_sdl or goo / "artifacts/native-authoring/libSDL3.so").resolve()
if not linux_sdl.is_file() or b"Goo.Window.TitlebarDoubleClick.1" not in linux_sdl.read_bytes():
    parser.error("--linux-sdl must contain the current Goo titlebar patch; build it with the core build-sdl-linux-x64.sh script in its supported Linux build environment")
bootstrap(ROOT / "artifacts/gsharp")
native = ROOT / "artifacts/native-payloads"
native.mkdir(parents=True, exist_ok=True)
restore = native / "NativePayloads.csproj"
restore.write_text('<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup><ItemGroup><PackageReference Include="Goo" Version="0.5.3" /></ItemGroup></Project>')
subprocess.run(["dotnet", "restore", str(restore), "--source", "https://api.nuget.org/v3/index.json"], check=True)
packages = subprocess.check_output(["dotnet", "nuget", "locals", "global-packages", "--list"], text=True).strip().split(": ", 1)[1]
payload = Path(packages) / "goo/0.5.3/runtimes"
feed = ROOT / "artifacts/feed"
for project in ["Goo/Goo.gsproj", "Goo.Svg/Goo.Svg.csproj"]:
    subprocess.run(["dotnet", "pack", str(goo / project), "-c", "Release", "--nologo",
                    f"-p:GooReleaseVersion={VERSION}",
                    f"-p:GsharpCompilerFullPath={ROOT / 'artifacts/gsharp/compiler/gsc.dll'}",
                    f"-p:GooLinuxSdlPath={linux_sdl}",
                    f"-p:GooWindowsSdlPath={payload / 'win-x64/native/SDL3.dll'}",
                    f"-p:GooMacOsArm64NativeRoot={payload / 'osx-arm64/native'}",
                    "-o", str(feed)], check=True)

for package in ["goo", "goo.svg"]:
    cached = Path(packages) / package / VERSION
    if cached.exists():
        shutil.rmtree(cached)
