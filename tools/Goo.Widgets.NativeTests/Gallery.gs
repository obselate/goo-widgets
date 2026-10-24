package Goo.Widgets.NativeTests

import System
import System.Collections.Generic
import System.IO
import System.Linq
import System.Text.Json

func Gallery(args[]string) int {
    let supported = []string{
        "Combo box",
        "Split pane",
        "Window chrome",
        "Disclosure",
        "Media transport",
        "Data grid",
        "Tree view",
        "Menu"
    }
    var output = Path.Combine(Root(), "artifacts/gallery-feedback")
    let pages = List[string]()
    var options = true
    var i = 0
    while i < args.Length {
        if options && args[i] == "--" {
            options = false
        } else if options && (args[i] == "--help" || args[i] == "-h") {
            Console.WriteLine(
                "Usage: gallery [--output path] [pages...]\nSupported pages: " + String.Join(", ", supported)
            )
            return 0
        } else if options && args[i] == "--output" {
            i++
            if i == args.Length {
                Console.Error.WriteLine("--output requires a path")
                return 2
            }
            output = Path.GetFullPath(
                if args[i] == "" {
                    "."
                } else {
                    args[i]
                }
            )
        } else if options && args[i].StartsWith("--output=", StringComparison.Ordinal) {
            let value = args[i].Substring(9)
            output = Path.GetFullPath(
                if value == "" {
                    "."
                } else {
                    value
                }
            )
        } else {
            pages.Add(args[i])
        }
        i++
    }
    if !pages.All(page -> supported.Contains(page)) {
        Console.Error.WriteLine("Supported pages: " + String.Join(", ", supported))
        return 2
    }
    let env = EnvironmentCopy()
    Require(
        env.GetValueOrDefault("WAYLAND_DISPLAY") == "goo-widgets" && env.ContainsKey("GOO_WIDGET_INPUT_COMMAND_FD") &&
            env.ContainsKey("GOO_WIDGET_INPUT_ACK_FD") && env.ContainsKey("GOO_WIDGET_SEAT"),
        "Run gallery inside the isolated launcher."
    )
    if pages.Count == 0 {
        pages.AddRange(supported)
    }
    Directory.CreateDirectory(output)
    let rows = List[Dictionary[string, object]]()
    var passed = true
    for page in pages {
        env["GOO_WIDGETS_GALLERY_FEEDBACK"] = "1"
        env["GOO_WIDGETS_GALLERY_FEEDBACK_PAGE"] = page
        env["GOO_WIDGETS_PROOF_DIR"] = output
        let log = Path.Combine(output, page.ToLowerInvariant().Replace(' ', '-') + ".log")
        let status = Path.Combine(env["XDG_RUNTIME_DIR"], "gallery-case-result")
        File.Delete(status)
        var code = Run(
            env["GOO_WIDGET_SEAT"],
            []string{
                "--case",
                status,
                "dotnet",
                Path.Combine(Root(), "tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll")
            },
            env,
            90,
            log
        )
        if code == 0 {
            code = Int32.Parse(File.ReadAllText(status))
        }
        File.Delete(status)
        if code == 124 {
            File.AppendAllText(log, "\nFAIL: native gallery case exceeded 90 seconds\n")
        }
        let row = Dictionary[string, object]()
        row["page"] = page
        row["exit_code"] = code
        row["log"] = log
        rows.Add(row)
        Console.WriteLine(
            page + " " + if code == 0 {
                "PASS"
            } else {
                "FAIL"
            }
        )
        let text = File.ReadAllText(log)
        Console.WriteLine(text.Substring(Math.Max(0, text.Length - 4000)))
        File.WriteAllText(
            Path.Combine(output, "results.json"),
            JsonSerializer.Serialize(rows, JsonSerializerOptions{WriteIndented: true}) + "\n"
        )
        passed = passed && code == 0
    }
    return if passed {
        0
    } else {
        1
    }
}
