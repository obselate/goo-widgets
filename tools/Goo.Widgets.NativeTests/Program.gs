package Goo.Widgets.NativeTests

import System
import System.Collections.Generic
import System.Diagnostics
import System.IO
import System.Linq
import System.Runtime.InteropServices
import System.Threading

func Root() string {
    var directory = DirectoryInfo(AppContext.BaseDirectory)
    while !File.Exists(Path.Combine(directory.FullName, "Goo.Widgets.slnx")) {
        directory = directory.Parent ?? throw DirectoryNotFoundException("Goo.Widgets.slnx not found.")
    }
    return directory.FullName
}

func Require(condition bool, message string) {
    if !condition {
        throw InvalidOperationException(message)
    }
}

func Main() int {
    try {
        let args = Environment.GetCommandLineArgs().Skip(1).ToArray()
        Require(
            args.Length > 0,
            "Usage: Goo.Widgets.NativeTests isolated -- command arguments... | gallery [--output path] [pages...]"
        )
        if args[0] == "isolated" {
            Require(args.Length > 2 && args[1] == "--", "A command is required after isolated --")
            return Isolated(args.Skip(2).ToArray())
        }
        Require(args[0] == "gallery", "Unknown command: " + args[0])
        return Gallery(args.Skip(1).ToArray())
    } catch (error Exception) {
        Console.Error.WriteLine(error.Message)
        return 1
    }
}

func Start(executable string, args[]string, env Dictionary[string, string]) Process {
    let info = ProcessStartInfo(executable){
        UseShellExecute = false,
        WorkingDirectory = Root(),
        RedirectStandardOutput = true,
        RedirectStandardError = true
    }
    info.Environment.Clear()
    for item in env {
        info.Environment[item.Key] = item.Value
    }
    for arg in args {
        info.ArgumentList.Add(arg)
    }
    return Process.Start(info)!!
}

func Stop(process Process?) {
    if process != nil && !process.HasExited {
        process.Kill(true)
        process.WaitForExit()
    }
}

func Run(
    executable string,
    args[]string,
    env Dictionary[string, string],
    seconds int,
    log string,
    cancellation CancellationTokenSource? = nil
) int {
    using let process = Start(executable, args, env)
    let stdout = process.StandardOutput.ReadToEndAsync()
    let stderr = process.StandardError.ReadToEndAsync()
    var code int
    try {
        let deadline = Environment.TickCount64 + int64(seconds) * 1000
        while !process.WaitForExit(100) &&
            Environment.TickCount64 < deadline &&
            cancellation?.IsCancellationRequested != true { }
        code = if process.HasExited {
            process.ExitCode
        } else {
            124
        }
    } finally {
        Stop(process)
        File.WriteAllText(log, stdout.GetAwaiter().GetResult() + stderr.GetAwaiter().GetResult())
    }
    return code
}

func EnvironmentCopy() Dictionary[string, string] {
    let result = Dictionary[string, string]()
    for key in Environment.GetEnvironmentVariables().Keys {
        let name = key.ToString()!!
        result[name] = Environment.GetEnvironmentVariable(name)!!
    }
    return result
}

func Quote(value string) string -> "'" + value.Replace("'", "'\"'\"'") + "'"

func Isolated(command[]string) int {
    let root = Root()
    let logs = Path.Combine(root, "artifacts/native-test")
    Directory.CreateDirectory(logs)
    let temporary = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
        ".cache/goo-fix/widgets-" + Guid.NewGuid().ToString("N")
    )
    Directory.CreateDirectory(temporary, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute)
    using let cancellation = CancellationTokenSource()
    using let terminate = PosixSignalRegistration.Create(
        PosixSignal.SIGTERM,
        context -> {
            context.Cancel = true
            cancellation.Cancel()
        }
    )
    using let interrupt = PosixSignalRegistration.Create(
        PosixSignal.SIGINT,
        context -> {
            context.Cancel = true
            cancellation.Cancel()
        }
    )
    var bus Process? = nil
    var registry Process? = nil
    try {
        let env = EnvironmentCopy()
        for name in[]string{
            "DISPLAY",
            "WAYLAND_SOCKET",
            "SESSION_MANAGER",
            "DBUS_SESSION_BUS_ADDRESS",
            "DBUS_STARTER_ADDRESS",
            "DBUS_STARTER_BUS_TYPE",
            "AT_SPI_BUS_ADDRESS",
            "GOO_WIDGET_INPUT_COMMAND_FD",
            "GOO_WIDGET_INPUT_ACK_FD"
        } {
            env.Remove(name)
        }
        for name in[]string{"runtime", "config", "cache", "data"} {
            Directory.CreateDirectory(
                Path.Combine(temporary, name),
                UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute
            )
        }
        env["XDG_RUNTIME_DIR"] = Path.Combine(temporary, "runtime")
        env["XDG_CONFIG_HOME"] = Path.Combine(temporary, "config")
        env["XDG_CONFIG_DIRS"] = env["XDG_CONFIG_HOME"]
        env["XDG_CACHE_HOME"] = Path.Combine(temporary, "cache")
        env["XDG_DATA_HOME"] = Path.Combine(temporary, "data")
        env["WAYLAND_DISPLAY"] = "goo-widgets"
        env["QT_QPA_PLATFORM"] = "wayland"
        env["GDK_BACKEND"] = "wayland"
        env["GIO_USE_VFS"] = "local"
        env["NO_AT_BRIDGE"] = "1"
        env["GOO_WIDGET_RESULT"] = Path.Combine(temporary, "result")
        let seat = Path.Combine(temporary, "seat")
        env["GOO_WIDGET_SEAT"] = seat
        let compilerLog = Path.Combine(logs, "seat-build.log")
        using let flags = Start("pkg-config", []string{"--cflags", "--libs", "libei-1.0", "dbus-1"}, env)
        let compilerFlags = flags.StandardOutput.ReadToEnd()
        flags.WaitForExit()
        Require(flags.ExitCode == 0, "libei and D-Bus development files are required.")
        let compilerArgs = List[string]([]string{"-O2", Path.Combine(root, "scripts/native-test-seat.c"), "-o", seat})
        compilerArgs.AddRange(compilerFlags.Split([]char{' ', '\n', '\t'}, StringSplitOptions.RemoveEmptyEntries))
        Require(
            Run("cc", compilerArgs.ToArray(), env, 30, compilerLog, cancellation) == 0,
            "Input seat build failed. See " + compilerLog
        )
        bus = Start(
            "dbus-daemon",
            []string{
                "--config-file=/usr/share/defaults/at-spi2/accessibility.conf",
                "--nofork",
                "--print-address",
                "--address=unix:path=" + Path.Combine(temporary, "runtime/atspi-bus")
            },
            env
        )
        let busErrors = bus.StandardError.ReadToEndAsync()
        let address = bus.StandardOutput.ReadLineAsync()
        Require(address.Wait(TimeSpan.FromSeconds(10)), "Private accessibility bus startup timed out.")
        env["AT_SPI_BUS_ADDRESS"] = address.Result ?? ""
        Require(
            env["AT_SPI_BUS_ADDRESS"].StartsWith("unix:path=" + temporary, StringComparison.Ordinal),
            "Private accessibility bus did not start."
        )
        registry = Start("/usr/lib/at-spi2-registryd", []string{}, env)
        let registryOutput = registry.StandardOutput.ReadToEndAsync()
        let registryErrors = registry.StandardError.ReadToEndAsync()
        let commandLog = Path.Combine(logs, "command.log")
        let compositorLog = Path.Combine(logs, "compositor.log")
        let session = Path.Combine(temporary, "run-session")
        File.WriteAllText(
            session,
            "#!/bin/sh\nexec " + Quote(seat) + " --launch " + String.Join(" ", command.Select(arg -> Quote(arg))) +
                " >" +
                Quote(commandLog) +
                " 2>&1\n"
        )
        File.SetUnixFileMode(session, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute)
        let result = Run(
            "dbus-run-session",
            []string{
                "--",
                "kwin_wayland",
                "--virtual",
                "--width",
                "1400",
                "--height",
                "900",
                "--scale",
                "1",
                "--xwayland",
                "--no-global-shortcuts",
                "--no-lockscreen",
                "--no-kactivities",
                "--socket",
                "goo-widgets",
                "--exit-with-session",
                session
            },
            env,
            240,
            compositorLog,
            cancellation
        )
        if File.Exists(commandLog) {
            Console.Write(File.ReadAllText(commandLog))
        }
        Require(!cancellation.IsCancellationRequested, "Private session interrupted.")
        Require(result != 124, "Private compositor exceeded 240 seconds. See " + compositorLog)
        Require(File.Exists(env["GOO_WIDGET_RESULT"]), "Native command did not complete. See " + compositorLog)
        return Int32.Parse(File.ReadAllText(env["GOO_WIDGET_RESULT"]))
    } finally {
        Stop(registry)
        registry?.Dispose()
        Stop(bus)
        bus?.Dispose()
        Directory.Delete(temporary, true)
    }
}
