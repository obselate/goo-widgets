#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

for suite in VIRTUAL COMBOBOX DATA_GRID TREE SEARCHLIST EDITING_BINDINGS CALENDAR OVERLAYS TIME_AXIS GRID_CHARTS \
  COMPOSITES DISCLOSURE WINDOW MARKDOWN THEME; do
  env "GOO_WIDGETS_$suite=1" SDL_VIDEODRIVER=wayland scripts/with-headless-wayland.sh \
    dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
done
