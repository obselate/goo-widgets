package Goo.Widgets.Consumer

import Goo
import System.Diagnostics
import System.IO
import System.Threading

// Optional actual-window evidence for the native interaction checks.
func CaptureIssueProof(window Window, name string) {
    let directory = Environment.GetEnvironmentVariable("GOO_WIDGETS_PROOF_DIR")
    if String.IsNullOrEmpty(directory) {
        return
    }
    Directory.CreateDirectory(directory)
    using let diagnostics = DevTools.Attach(window)
    let executable = Environment.GetEnvironmentVariable("GOO_CLI") ?? "goo"
    let info = ProcessStartInfo(
        if executable.EndsWith(".dll") {
            "dotnet"
        } else {
            executable
        }
    )
    if executable.EndsWith(".dll") {
        info.ArgumentList.Add(executable)
    }
    info.UseShellExecute = false
    info.ArgumentList.Add("capture")
    info.ArgumentList.Add("--pid")
    info.ArgumentList.Add(Environment.ProcessId.ToString())
    info.ArgumentList.Add("--output")
    info.ArgumentList.Add(Path.Combine(directory, name + ".png"))
    using let capture = Process.Start(info)!!
    let deadline = Environment.TickCount64 + 15000
    var previous = Environment.TickCount64
    while !capture.HasExited && Environment.TickCount64 < deadline {
        let now = Environment.TickCount64
        window.Pump(float64(now - previous) / 1000.0)
        previous = now
        Thread.Sleep(1)
    }
    if !capture.HasExited {
        capture.Kill()
        capture.WaitForExit()
        throw TimeoutException("Widget proof capture timed out.")
    }
    Require(capture.ExitCode == 0, "Widget proof capture failed.")
}
