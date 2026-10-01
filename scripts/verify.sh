#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

python3 scripts/generate-material-symbol-substitutions.py --check
dotnet restore Goo.Widgets.slnx --locked-mode
dotnet build Goo.Widgets.slnx -c Release --no-restore --nologo
python3 scripts/verify-screenshots.py
dotnet pack src/Goo.Widgets/Goo.Widgets.gsproj -c Release --no-build --no-restore -o artifacts/packages
dotnet pack src/Goo.Widgets.Markdown/Goo.Widgets.Markdown.gsproj -c Release --no-build --no-restore -o artifacts/packages
python3 scripts/verify-package.py --markdown
dotnet restore tests/Goo.Widgets.Consumer/Goo.Widgets.Consumer.gsproj --locked-mode
dotnet run --project tests/Goo.Widgets.Consumer/Goo.Widgets.Consumer.gsproj -c Release --no-restore
version="$(dotnet msbuild src/Goo.Widgets/Goo.Widgets.gsproj -getProperty:Version -nologo)"
subset_packages="$(mktemp -d)"
trap 'rm -rf -- "$subset_packages"' EXIT
NUGET_PACKAGES="$subset_packages" dotnet restore tests/Goo.Widgets.SubsetConsumer/Goo.Widgets.SubsetConsumer.csproj \
  -p:GooWidgetsPackageVersion="$version" -p:NuGetLockFilePath="$subset_packages/subset.lock.json" \
  -s artifacts/packages -s https://api.nuget.org/v3/index.json
NUGET_PACKAGES="$subset_packages" dotnet run --project tests/Goo.Widgets.SubsetConsumer/Goo.Widgets.SubsetConsumer.csproj \
  -c Release --no-restore -p:GooWidgetsPackageVersion="$version" \
  -p:NuGetLockFilePath="$subset_packages/subset.lock.json"

(
  cd artifacts/packages
  version="$(dotnet msbuild ../../src/Goo.Widgets/Goo.Widgets.gsproj -getProperty:Version -nologo)"
  sha256sum "Goo.Widgets.$version.nupkg" "Goo.Widgets.Markdown.$version.nupkg" > SHA256SUMS
)

git diff --check
