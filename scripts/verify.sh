#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

dotnet restore deps/Goo.Gslint/Goo.Gslint.csproj --locked-mode
dotnet build deps/Goo.Gslint/Goo.Gslint.csproj -c Release --no-restore --nologo
dotnet deps/Goo.Gslint/bin/Release/net10.0/Goo.Gslint.dll --strict --severity GL0005=none src samples tests
dotnet restore Goo.Widgets.slnx --locked-mode
dotnet build Goo.Widgets.slnx -c Release --no-restore --nologo
dotnet pack src/Goo.Widgets/Goo.Widgets.gsproj -c Release --no-build --no-restore -o artifacts/packages
python3 scripts/verify-package.py
dotnet restore tests/Goo.Widgets.Consumer/Goo.Widgets.Consumer.gsproj --locked-mode
dotnet run --project tests/Goo.Widgets.Consumer/Goo.Widgets.Consumer.gsproj -c Release --no-restore

(
  cd artifacts/packages
  sha256sum Goo.Widgets.*.nupkg > SHA256SUMS
)

git diff --check
