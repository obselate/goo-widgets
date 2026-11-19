#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
export INPUT_TARGET="${1:?input target required}"
work="$PWD/artifacts/input-fuzz"
mkdir -p "$work/failures/$INPUT_TARGET"
export INPUT_CURRENT="$work/failures/$INPUT_TARGET/current-input"
dotnet tools/Goo.Widgets.InputFuzz/bin/Release/net10.0/Goo.Widgets.InputFuzz.dll tools/Goo.Widgets.InputFuzz/corpus
