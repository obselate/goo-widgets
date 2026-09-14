#!/usr/bin/env python3
"""Run native widget acceptance in a private KWin compositor and input seat.

Usage: /usr/bin/python3 scripts/with-isolated-wayland.py -- command arguments...
Requires KWin, libei development files, dbus-python, and AT-SPI registry binaries.
It never sends input to or changes configuration on the user's desktop.
"""
import json
import os
from pathlib import Path
import shlex
import signal
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
if "--session" in sys.argv:
    import dbus
    session = dbus.SessionBus()
    remote = dbus.Interface(session.get_object("org.kde.KWin", "/org/kde/KWin/EIS/RemoteDesktop"), "org.kde.KWin.EIS.RemoteDesktop")
    fd, cookie = remote.connectToEIS(3)
    fd = fd.take()
    seat = subprocess.Popen([os.environ["GOO_WIDGET_SEAT"], str(fd)], pass_fds=(fd,), stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    os.close(fd)
    try:
        assert seat.stdout.readline().strip() == "ready", "Isolated input seat failed"
        with Path(os.environ["GOO_WIDGET_COMMAND_LOG"]).open("w") as output:
            result = subprocess.run(json.loads(os.environ["GOO_WIDGET_COMMAND"]), cwd=ROOT, stdout=output, stderr=subprocess.STDOUT).returncode
        Path(os.environ["GOO_WIDGET_RESULT"]).write_text(str(result))
    finally:
        seat.terminate()
        seat.wait(timeout=5)
    raise SystemExit(result)

if "--" not in sys.argv:
    raise SystemExit(__doc__)
command = sys.argv[sys.argv.index("--") + 1:]
if not command:
    raise SystemExit("A command is required after --")
logdir = ROOT / "artifacts/native-test"
logdir.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix="goo-widgets-") as temporary:
    temporary = Path(temporary)
    runtime = temporary / "runtime"
    runtime.mkdir(mode=0o700)
    config = temporary / "config"
    config.mkdir()
    env = dict(os.environ)
    env.pop("DISPLAY", None)
    env.update(XDG_RUNTIME_DIR=str(runtime), XDG_CONFIG_HOME=str(config), WAYLAND_DISPLAY="goo-widgets", QT_QPA_PLATFORM="wayland",
               GDK_BACKEND="wayland", GIO_USE_VFS="local", NO_AT_BRIDGE="1", GOO_WIDGET_COMMAND=json.dumps(command),
               GOO_WIDGET_SEAT=str(temporary / "seat"), GOO_WIDGET_RESULT=str(temporary / "result"), GOO_WIDGET_COMMAND_LOG=str(logdir / "command.log"))
    flags = subprocess.check_output(["pkg-config", "--cflags", "--libs", "libei-1.0"], text=True).split()
    subprocess.run(["cc", "-O2", str(ROOT / "scripts/native-test-seat.c"), "-o", env["GOO_WIDGET_SEAT"], *flags], check=True)
    wrapper = temporary / "session"
    wrapper.write_text("#!/bin/sh\nexec " + shlex.quote(sys.executable) + " " + shlex.quote(__file__) + " --session\n")
    wrapper.chmod(0o700)
    bus = subprocess.Popen(["dbus-daemon", "--config-file=/usr/share/defaults/at-spi2/accessibility.conf", "--nofork", "--print-address"], stdout=subprocess.PIPE, text=True)
    registry = None
    try:
        env["AT_SPI_BUS_ADDRESS"] = bus.stdout.readline().strip()
        assert env["AT_SPI_BUS_ADDRESS"].startswith("unix:")
        registry = subprocess.Popen(["/usr/lib/at-spi2-registryd"], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with (logdir / "compositor.log").open("w") as log:
            compositor = subprocess.Popen(["dbus-run-session", "--", "kwin_wayland", "--virtual", "--width", "1400", "--height", "900", "--scale", "1",
                "--xwayland", "--no-global-shortcuts", "--no-lockscreen", "--no-kactivities", "--socket", "goo-widgets", "--exit-with-session", str(wrapper)],
                env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            try:
                compositor.wait(timeout=240)
            finally:
                if compositor.poll() is None:
                    os.killpg(compositor.pid, signal.SIGTERM)
                    compositor.wait(timeout=10)
        command_log = Path(env["GOO_WIDGET_COMMAND_LOG"])
        if command_log.exists():
            with command_log.open() as output:
                shutil.copyfileobj(output, sys.stdout)
        result_path = temporary / "result"
        if not result_path.exists():
            raise RuntimeError("Native command did not complete; see " + str(logdir / "compositor.log"))
        result = int(result_path.read_text())
    finally:
        if registry is not None and registry.poll() is None:
            registry.terminate()
            registry.wait(timeout=5)
        bus.terminate()
        bus.wait(timeout=5)
raise SystemExit(result)
