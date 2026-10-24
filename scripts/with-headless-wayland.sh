#!/usr/bin/env bash
set -euo pipefail

runtime_root="$(mktemp -d "${RUNNER_TEMP:-/tmp}/goo-xdg-runtime.XXXXXX")"
export XDG_RUNTIME_DIR="$runtime_root"
export WAYLAND_DISPLAY="${GOO_WAYLAND_DISPLAY:-goo-wayland}"
export GOO_HEADLESS_WAYLAND=1
compositor_log="$runtime_root/compositor.log"

cleanup() {
  status=$?
  kill -- "$compositor_target" 2>/dev/null || true
  wait "$compositor_pid" 2>/dev/null || true
  while kill -0 -- "$compositor_target" 2>/dev/null; do
    sleep 0.1
  done
  if (( status != 0 )); then
    mkdir -p artifacts/native-test
    cp "$compositor_log" artifacts/native-test/headless-compositor.log
    cat "$compositor_log"
  fi
  rm -rf -- "$runtime_root"
  exit "$status"
}
trap cleanup EXIT

if [[ "${GOO_WAYLAND_COMPOSITOR:-}" == sway ]]; then
  WLR_BACKENDS=headless WLR_LIBINPUT_NO_DEVICES=1 WLR_RENDERER=pixman \
    setsid dbus-run-session -- sway --config /dev/null >"$compositor_log" 2>&1 &
  compositor_pid=$!
  compositor_target=-$compositor_pid
elif command -v weston >/dev/null 2>&1; then
  weston --backend=headless-backend.so --renderer="${GOO_WESTON_RENDERER:-pixman}" \
    --width="${GOO_HEADLESS_WIDTH:-1400}" --height="${GOO_HEADLESS_HEIGHT:-900}" \
    --socket="$WAYLAND_DISPLAY" --idle-time=0 >"$compositor_log" 2>&1 &
  compositor_pid=$!
  compositor_target=$compositor_pid
else
  XDG_CONFIG_HOME="$runtime_root/config" setsid dbus-run-session -- kwin_wayland --virtual \
    --width "${GOO_HEADLESS_WIDTH:-1400}" --height "${GOO_HEADLESS_HEIGHT:-900}" --scale 1 --no-global-shortcuts --no-lockscreen --no-kactivities \
    --socket "$WAYLAND_DISPLAY" >"$compositor_log" 2>&1 &
  compositor_pid=$!
  compositor_target=-$compositor_pid
fi
for _ in $(seq 1 50); do
  if [[ "${GOO_WAYLAND_COMPOSITOR:-}" == sway ]]; then
    for socket in "$XDG_RUNTIME_DIR"/wayland-*; do
      if [[ -S "$socket" ]]; then
        export WAYLAND_DISPLAY="${socket##*/}"
        break
      fi
    done
  fi
  test -S "$XDG_RUNTIME_DIR/$WAYLAND_DISPLAY" && break
  sleep 0.1
done
test -S "$XDG_RUNTIME_DIR/$WAYLAND_DISPLAY"

"$@"
