package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Content
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs
import Hexa.NET.SDL3
import System

internal class TextSurfaceHost : Cell {
    internal var Window Window?
    internal var Query string = "text"
    internal var Options FindOptions
    internal var Issue string?
    internal var Next int32
    internal var Previous int32
    internal var Closed int32
    internal var Replaced int32
    internal var ReplacedAll int32
    internal var Disabled bool
    internal var Value string = "one"
    internal var Submitted string?
    internal var Cancelled bool
    internal var Expanded bool
    internal var Area TextEditor?
    internal var Code TextEditor?
    internal var HighlightColor Color
    internal let QueryHandle ElementHandle = ElementHandle()
    internal let AreaHandle ElementHandle = ElementHandle()
    internal let CodeHandle ElementHandle = ElementHandle()
    internal let Source string = "let value = 42\nsecond\nthird\nfourth\nfifth\nsixth"

    public override func Build() Blob -> Container{
        Width: Percent(100),
        Padding: 16,
        Gap: 12,
        FindBar{
            Query: Query,
            Options: Options,
            MatchCount: 3,
            ActiveMatch: 2,
            Issue: Issue,
            Replacement: "new",
            Disabled: Disabled,
            OnQueryChange: value -> {
                Query = value
                Rebuild()
            },
            OnOptionsChange: value -> {
                Options = value
                Rebuild()
            },
            OnNext: () -> Next++,
            OnPrevious: () -> Previous++,
            OnClose: () -> Closed++,
            OnReplace: () -> Replaced++,
            OnReplaceAll: () -> ReplacedAll++,
            CreateEntry: input -> TextEntry{
                Handle: QueryHandle,
                Value: input.Value ?? "",
                Controlled: true,
                OnChange: input.OnChange,
                Height: 32,
                Width: Percent(100)
            },
        }.Build(),
        Cell.Mount[TextAreaInput, TextArea](
            "area",
            TextAreaInput{
                Value: Value,
                Label: "Message",
                Width: Percent(100),
                MinimumRows: 1,
                MaximumRows: 3,
                MaxLength: 12,
                SubmitOnEnter: true,
                Disabled: Disabled,
                OnChange: value -> {
                    Value = value
                    Rebuild()
                },
                OnSubmit: value -> Submitted = value,
                OnCancel: () -> Cancelled = true,
                CreateEditor: (input, editor) -> {
                    editor.Handle = AreaHandle
                    Area = editor
                    return editor
                },
            }
        ),
        Cell.Mount[CodeBlockInput, CodeBlock](
            "code",
            CodeBlockInput{
                Code: Source,
                Language: "G#",
                Window: Window,
                ShowLineNumbers: true,
                CollapsedLines: 2,
                Expanded: Expanded,
                OnExpandedChange: value -> {
                    Expanded = value
                    Rebuild()
                },
                Highlight: (layer, palette) -> {
                    HighlightColor = palette.Keyword
                    layer.SetStyle("keyword", TextRange(0, 3), Style{Color: palette.Keyword})
                },
                CreateEditor: (input, editor) -> {
                    editor.Handle = CodeHandle
                    Code = editor
                    return editor
                },
            }
        ),
    }
}

func TextSurfaceActivate(window Window, semantics SearchListSemantics, name string) {
    let node = FindSemantics(semantics.Tree?.Root, name)!!
    Require(
        window.PerformAccessibilityAction(node.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
        "Cannot activate " + name
    )
    PumpFrames(window, 4)
}

func TextSurfaceInteractions() {
    let host = TextSurfaceHost()
    let semantics = SearchListSemantics()
    let root = ApplicationRoot(host)
    let window = Window{Root: root, Width: 760, Height: 800, AccessibilityAdapter: semantics, Title: "Text surfaces"}
    host.Window = window
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 12)
        let id = OnlyNativeWindow()
        Require(host.QueryHandle.Focus(), "Find query did not focus")
        SendKey(id, SDLScancode.Return)
        SelectorKey(id, SDLScancode.Return, SDLKeymod.Shift)
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 4)
        Require(host.Next == 1 && host.Previous == 1 && host.Closed == 1, "Find keyboard commands failed")
        TextSurfaceActivate(window, semantics, "Match case")
        TextSurfaceActivate(window, semantics, "Whole word")
        TextSurfaceActivate(window, semantics, "Regular expression")
        Require(
            host.Options.MatchCase && host.Options.WholeWord && host.Options.Regex,
            "Find toggles lost controlled state"
        )
        TextSurfaceActivate(window, semantics, "Replace")
        TextSurfaceActivate(window, semantics, "Replace all")
        Require(host.Replaced == 1 && host.ReplacedAll == 1, "Replace actions failed")
        host.Issue = "Invalid regular expression"
        host.Rebuild()
        PumpFrames(window, 4)
        host.QueryHandle.Focus()
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 4)
        Require(
            host.Next == 1 && FindSemantics(semantics.Tree?.Root, "Invalid regular expression") != nil,
            "Invalid pattern remained actionable"
        )
        host.Issue = nil
        host.Rebuild()
        PumpFrames(window, 4)
        Require(host.AreaHandle.Focus(), "TextArea did not focus")
        let initialHeight = host.AreaHandle.BorderBox.Height
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 4)
        Require(host.Submitted == "one" && host.Value == "one", "Enter did not submit without a newline")
        SelectorKey(id, SDLScancode.Return, SDLKeymod.Shift)
        PumpFrames(window, 4)
        Require(
            host.Value.Contains("\n") && host.AreaHandle.BorderBox.Height > initialHeight,
            "Shift+Enter did not insert and grow"
        )
        Require(window.PlatformInput.SetComposition("ime", 3, 0), "IME preedit was rejected")
        host.Submitted = nil
        window.PlatformInput.KeyPress(Key.Enter, KeyModifiers{})
        window.PlatformInput.KeyRelease(Key.Enter)
        PumpFrames(window, 4)
        Require(host.Submitted == nil, "IME Enter submitted")
        Require(window.PlatformInput.SetComposition("ime", 3, 0), "IME preedit was rejected")
        window.PlatformInput.KeyPress(Key.Escape, KeyModifiers{})
        window.PlatformInput.KeyRelease(Key.Escape)
        PumpFrames(window, 4)
        Require(host.Area!!.Controller.Composition == nil && !host.Cancelled, "Escape did not cancel composition first")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 4)
        Require(host.Cancelled, "TextArea Escape did not cancel")
        host.Value = "one\ntwo\nthree"
        host.Rebuild()
        PumpFrames(window, 5)
        let cappedHeight = host.AreaHandle.BorderBox.Height
        host.Value = "one\ntwo\nthree\nfour\nfive\nsix"
        host.Rebuild()
        PumpFrames(window, 5)
        Require(Math.Abs(host.AreaHandle.BorderBox.Height - cappedHeight) < 1, "TextArea exceeded MaximumRows")
        Require(
            FindSemantics(semantics.Tree?.Root, host.Value.Length.ToString() + " / 12") != nil,
            "TextArea counter did not update"
        )
        Require(
            host.Area!!.Accessibility!!.Invalid == true && host.Area!!.Controller.Document.GetText() == host.Value,
            "Soft limit discarded input or lost invalid state"
        )
        host.Value = "one"
        host.Rebuild()
        PumpFrames(window, 5)
        Require(Math.Abs(host.AreaHandle.BorderBox.Height - initialHeight) < 1, "TextArea did not shrink")
        window.Width = 360
        host.Value = "one two three four five six seven eight nine ten eleven twelve"
        host.Rebuild()
        PumpFrames(window, 5)
        Require(
            host.AreaHandle.BorderBox.Height > initialHeight && host.AreaHandle.BorderBox.Height <= cappedHeight + 1,
            "Wrapped text did not grow within MaximumRows"
        )
        host.Value = host.Value + host.Value + host.Value
        host.Rebuild()
        PumpFrames(window, 5)
        Require(Math.Abs(host.AreaHandle.BorderBox.Height - cappedHeight) < 1, "Wrapped text exceeded the row cap")
        window.Width = 760
        host.Value = "one"
        host.Rebuild()
        PumpFrames(window, 5)
        Require(
            host.Code!!.ReadOnly && host.Code!!.ShowLineNumbers && host.Code!!.Layers.Length == 1,
            "CodeBlock did not use read-only core presentation"
        )
        Require(
            host.HighlightColor == Theme.Read(window).Syntax.Keyword,
            "CodeBlock highlight did not use Theme syntax palette"
        )
        let foldedHeight = host.CodeHandle.BorderBox.Height
        TextSurfaceActivate(window, semantics, "Copy code")
        Require(window.GetClipboardText() == host.Source, "CodeBlock copy omitted folded lines")
        TextSurfaceActivate(window, semantics, "Show all 6 lines")
        Require(host.Expanded && host.CodeHandle.BorderBox.Height > foldedHeight, "CodeBlock did not expand")
        Require(host.CodeHandle.Focus(), "CodeBlock did not allow selection")
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        SelectorKey(id, SDLScancode.C, SDLKeymod.Ctrl)
        PumpFrames(window, 5)
        Require(window.GetClipboardText() == host.Source, "Read-only code selection copy failed")
        window.Height = 1440
        window.UiScale = 1.5F
        for width in[]int32{320, 700, 2560} {
            window.Width = width
            PumpFrames(window, 5)
            for handle in[]ElementHandle{host.QueryHandle, host.AreaHandle, host.CodeHandle} {
                let bounds = handle.BorderBox
                Require(
                    bounds.X >= 0 && bounds.Width > 0 && bounds.X + bounds.Width <= float64(width) / 1.5 + 1,
                    "Text surface exceeded the scaled viewport"
                )
            }
        }
        host.Disabled = true
        host.Rebuild()
        PumpFrames(window, 5)
        Require(!host.QueryHandle.Focus() && !host.AreaHandle.Focus(), "Disabled text surfaces accepted focus")
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
    TextSurfaceGalleryProof()
    Console.WriteLine(
        "PASS: FindBar keys and options, CodeBlock copy and folding, TextArea submit, IME, counter and growth"
    )
}

func TextSurfaceGalleryProof() {
    for mode in[]ThemeMode{ThemeMode.Light, ThemeMode.Dark} {
        for title in[]string{"Find bar", "Code block", "Text area"} {
            let registry = CreateRegistry()
            let gallery = Gallery(registry, registry.IndexOf(title))
            let window = Window{Root: gallery, Width: 1100, Height: 800, Title: title}
            gallery.AttachWindow(window)
            Theme.SetMode(window, mode)
            window.Open()
            try {
                PumpFrames(window, 15)
                CaptureIssueProof(
                    window,
                    "gallery-" + title.ToLowerInvariant().Replace(" ", "-") + "-" + mode.ToString().ToLowerInvariant()
                )
            } finally {
                window.RequestClose()
                PumpFrames(window, 3)
            }
        }
    }
}
