#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if (( $# == 0 )); then
  set -- CHROME VIRTUAL COMBOBOX DATA_GRID PATH_ACTIONS TREE LISTS SEARCHLIST CALENDAR OVERLAYS POPUPS TIME_AXIS \
    GRID_CHARTS COMPOSITES DISCLOSURE WINDOW THEME CHOICES FEEDBACK_IDENTITY NAVIGATION LAYOUT FIELDS MODAL_CLIPBOARD \
    TEXT_SURFACES MARKDOWN TOUCH_EDITING GRAPH_TOUCH TOKENS
fi
for suite in "$@"; do
  printf 'SUITE %s\n' "$suite"
  case "$suite" in
    CHROME)
      env GOO_WIDGETS_CHROME=1 SDL_VIDEODRIVER=wayland \
        dotnet tools/Goo.Widgets.NativeTests/bin/Release/net10.0/Goo.Widgets.NativeTests.dll isolated -- \
        dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
      ;;
    FIELDS|MODAL_CLIPBOARD|TEXT_SURFACES|MARKDOWN|TOUCH_EDITING|TOKENS)
      env "GOO_WIDGETS_$suite=1" SDL_VIDEODRIVER=wayland GOO_WAYLAND_COMPOSITOR=sway scripts/with-headless-wayland.sh \
        dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
      ;;
    VIRTUAL|COMBOBOX|DATA_GRID|PATH_ACTIONS|TREE|LISTS|SEARCHLIST|CALENDAR|OVERLAYS|POPUPS|TIME_AXIS|GRID_CHARTS|COMPOSITES|DISCLOSURE|WINDOW|THEME|CHOICES|FEEDBACK_IDENTITY|NAVIGATION|LAYOUT|GRAPH_TOUCH)
      env "GOO_WIDGETS_$suite=1" SDL_VIDEODRIVER=wayland scripts/with-headless-wayland.sh \
        dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
      ;;
    *) printf 'Unknown native suite: %s\n' "$suite" >&2; exit 2 ;;
  esac
done
