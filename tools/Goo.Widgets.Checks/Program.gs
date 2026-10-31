package Goo.Widgets.Checks

import System
import System.Buffers.Binary
import System.Collections.Generic
import System.IO
import System.Linq
import System.Text
import System.Text.RegularExpressions

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
        Require(args.Length > 0, "Usage: Goo.Widgets.Checks symbols [--check] | screenshots | package [--markdown]")
        if args[0] == "symbols" {
            Symbols(args.Skip(1).ToArray())
        } else if args[0] == "screenshots" {
            Screenshots()
        } else if args[0] == "package" {
            Packages(args.Contains("--markdown"))
        } else {
            throw ArgumentException("Unknown check: " + args[0])
        }
        return 0
    } catch (error Exception) {
        Console.Error.WriteLine(error.Message)
        return 1
    }
}

func Symbols(args[]string) {
    Require(args.Length == 0 || (args.Length == 1 && args[0] == "--check"), "Usage: symbols [--check]")
    let root = Root()
    let target = Path.Combine(root, "src/Goo.Widgets/ILLink.Substitutions.xml")
    let lines = StringBuilder(
        "<linker>\n  <assembly fullname=\"Goo.Widgets\" feature=\"Goo.Widgets.MaterialSymbols.Subset\" featurevalue=\"true\">\n"
    )
    for svg in Directory.GetFiles(Path.Combine(root, "assets/material-symbols/outlined"), "*.svg").OrderBy(
        path -> path,
        StringComparer.Ordinal
    ) {
        let name = Path.GetFileNameWithoutExtension(svg).Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")
        lines
            .Append("    <resource name=\"Goo.Widgets.MaterialSymbols.")
            .Append(name)
            .Append(".svg\" action=\"remove\" />\n")
    }
    let content = lines.Append("  </assembly>\n</linker>\n").ToString()
    if args.Length == 1 {
        Require(
            File.Exists(target) && File.ReadAllText(target).Replace("\r\n", "\n") == content,
            "Material Symbol substitutions are stale. Run dotnet run --project tools/Goo.Widgets.Checks -- symbols."
        )
    } else {
        File.WriteAllText(target, content)
    }
    let controls = File.ReadAllText(Path.Combine(root, "src/Goo.Widgets/Icons/ControlIcons.gs"))
    let mappings = Regex.Matches(controls, "case ControlIcon\\.(\\w+): \"(\\w+)\"")
    let members = Regex.Match(controls, "internal enum ControlIcon \\{([^}]+)\\}").Groups[1].Value
        .Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
    Require(
        mappings.Select(match -> match.Groups[1].Value).OrderBy(name -> name, StringComparer.Ordinal)
            .SequenceEqual(members.OrderBy(name -> name, StringComparer.Ordinal)),
        "Every control icon must have exactly one resource name."
    )
    for path in Directory.GetFiles(Path.Combine(root, "src"), "*.gs", SearchOption.AllDirectories) {
        Require(
            Path.GetFileName(path) == "ControlIcons.gs" || !Regex.IsMatch(File.ReadAllText(path), "\\bMaterialIcons\\s*\\.\\s*Create\\s*\\("),
            "Widget controls must use ControlIcons.Create: " + path
        )
    }
    let targets = Path.Combine(root, "buildTransitive/Goo.Widgets.targets")
    let previous = File.ReadAllText(targets).Replace("\r\n", "\n")
    Require(Regex.Matches(previous, "<_GooMaterialIcon Include=\"[a-z_;]+\" />").Count == 1, "Control icon resource list is missing.")
    let selected = String.Join(";", mappings.Select(match -> match.Groups[2].Value).OrderBy(name -> name, StringComparer.Ordinal))
    let updated = Regex.Replace(previous, "<_GooMaterialIcon Include=\"[a-z_;]+\" />", "<_GooMaterialIcon Include=\"" + selected + "\" />")
    if args.Length == 1 {
        Require(previous == updated, "Control icon resources are stale. Run dotnet run --project tools/Goo.Widgets.Checks -- symbols.")
    } else {
        File.WriteAllText(targets, updated)
    }
}

func IsWidget(path string) bool {
    let source = File.ReadAllText(path)
    let declaration = "\\bpublic\\s+(?:(?:open|data|partial|sealed)\\s+)*(?:class|struct)\\s+" + Regex.Escape(
        Path.GetFileNameWithoutExtension(path)
    ) +
        "\\b"
    return Regex.IsMatch(source, "\\bfunc\\s+Build\\s*\\(") && Regex.IsMatch(source, declaration)
}

func Screenshots() {
    let root = Root()
    let library = Path.Combine(root, "src/Goo.Widgets")
    let gallery = Path.Combine(root, "samples/Goo.Widgets.Gallery")
    let registryPath = Path.Combine(gallery, "Gallery.gs")
    let widgets = Directory
        .GetFiles(library, "*.gs", SearchOption.AllDirectories)
        .Where(path -> IsWidget(path))
        .Select(path -> Path.GetFileNameWithoutExtension(path))
        .Distinct()
        .OrderBy(name -> name, StringComparer.Ordinal)
        .ToList()
    widgets.AddRange(
        Directory
            .GetFiles(Path.Combine(root, "src/Goo.Widgets.Markdown"), "*.gs")
            .Where(path -> IsWidget(path))
            .Select(path -> Path.GetFileNameWithoutExtension(path))
            .OrderBy(name -> name, StringComparer.Ordinal)
    )
    let errors = List[string]()
    if widgets.Count == 0 {
        errors.Add("no widget Build methods found under: " + library)
    }
    let registry = File.ReadAllText(registryPath)
    for widget in widgets {
        let pageName = widget + "Page.gs"
        let pages = Directory
            .GetFiles(gallery, pageName, SearchOption.AllDirectories)
            .OrderBy(path -> path, StringComparer.Ordinal)
            .ToArray()
        if pages.Length == 0 {
            errors.Add("missing gallery page: " + gallery + "/**/" + pageName)
        } else if pages.Length > 1 {
            errors.Add("multiple gallery pages for " + widget + ": " + String.Join(", ", pages))
        }
        if !Regex.IsMatch(registry, "\\b" + Regex.Escape(widget) + "Page\\s*\\{") {
            errors.Add("missing gallery registration: " + registryPath + " (" + widget + "Page)")
        }
        let screenshot = Path.Combine(root, "samples/screenshots", widget + ".png")
        if !File.Exists(screenshot) {
            errors.Add("missing screenshot: " + screenshot)
            continue
        }
        using let stream = File.OpenRead(screenshot)
        let header = [33]byte
        let length = stream.ReadAtLeast(header, 33, false)
        var reason = ""
        if length < 33 {
            reason = "truncated PNG header"
        } else if BinaryPrimitives.ReadUInt64BigEndian(header) != 0x89504E470D0A1A0A {
            reason = "missing PNG signature"
        } else if BinaryPrimitives.ReadUInt32BigEndian(header.AsSpan(12, 4)) != 0x49484452 ||
            BinaryPrimitives.ReadUInt32BigEndian(header.AsSpan(8, 4)) != 13 {
            reason = "first chunk is not a 13-byte IHDR"
        } else if BinaryPrimitives.ReadUInt32BigEndian(header.AsSpan(16, 4)) == 0 ||
            BinaryPrimitives.ReadUInt32BigEndian(header.AsSpan(20, 4)) == 0 {
            reason = "PNG dimensions must be positive"
        }
        if reason != "" {
            errors.Add("invalid screenshot " + screenshot + ": " + reason)
        }
    }
    Require(
        errors.Count == 0,
        "Screenshot verification failed for " + widgets.Count.ToString() + " widgets:\n- " + String.Join("\n- ", errors)
    )
    Console.WriteLine("Verified " + widgets.Count.ToString() + " widget screenshots.")
}
