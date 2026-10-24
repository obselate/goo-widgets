#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

for suite in VIRTUAL COMBOBOX DATA_GRID PATH_ACTIONS TREE LISTS SEARCHLIST EDITING_BINDINGS CALENDAR OVERLAYS TIME_AXIS GRID_CHARTS \
  COMPOSITES DISCLOSURE WINDOW THEME CHOICES FEEDBACK_IDENTITY TEXT_SURFACES; do
  printf 'SUITE %s\n' "$suite"
  env "GOO_WIDGETS_$suite=1" SDL_VIDEODRIVER=wayland scripts/with-headless-wayland.sh \
    dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
done
printf 'SUITE MARKDOWN\n'
env GOO_WIDGETS_MARKDOWN=1 SDL_VIDEODRIVER=wayland GOO_WAYLAND_COMPOSITOR=sway scripts/with-headless-wayland.sh \
  dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
printf 'SUITE TOUCH_EDITING\n'
env GOO_WIDGETS_TOUCH_EDITING=1 SDL_VIDEODRIVER=wayland GOO_WAYLAND_COMPOSITOR=sway scripts/with-headless-wayland.sh \
  dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
printf 'SUITE GRAPH_TOUCH\n'
env GOO_WIDGETS_GRAPH_TOUCH=1 SDL_VIDEODRIVER=wayland scripts/with-headless-wayland.sh \
  dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
