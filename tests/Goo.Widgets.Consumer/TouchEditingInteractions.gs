package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import System

internal class TouchEditingHost : Cell {
    internal let Editor ElementHandle = ElementHandle()
    internal var Value string = "Alpha beta gamma"
    internal var ReadOnly bool
    internal var Password bool

    private func Changed(value string) {
        Value = value
        Rebuild()
    }

    public override func Build() Blob {
        let root = Container{Width: Percent(100), Height: Percent(100), Padding: 16}
        root.Children.Add(if Password {
            TextField{Value: Value, Width: 170, Password: true, OnChange: Changed,
                ConfigureEntry: (input TextField, prepared TextEntry) -> {
                    prepared.Value = input.Value ?? ""
                    prepared.Width = Percent(100)
                    prepared.Height = 40
                    prepared.Handle = Editor
                    prepared.OnChange = input.OnChange
                },
            }.Build()
        } else {
            Cell.Mount[TextAreaInput, TextArea]("editor", TextAreaInput{
                Value: Value, Width: Percent(100), Height: 70, ReadOnly: ReadOnly, OnChange: Changed,
                ConfigureEditor: (input TextAreaInput, editor TextEditor) -> { editor.Handle = Editor
                    },
            })
        })
        return root
    }
}

internal class TouchEditingOwnershipHost : Cell {
    internal let Editor TextEntry = TextEntry{Handle: ElementHandle(), Value: "Alpha beta gamma", Width: 180, Height: 40}
    internal var Editing TouchTextEditing?

    public override func Build() Blob {
        let content = Container{}
        content.Add(Editor)
        let input = TouchTextEditingInput{Content: content, Editor: Editor.Handle!!}
        return Cell.Mount[TouchTextEditingInput, TouchTextEditing]("editing", input, () -> {
            let child = TouchTextEditing()
            Editing = child
            return child
        })
    }
}

func TouchEditingOwnership() {
    using let host = ThemePreferenceHost()
    host.Resize(400, 240, 400, 240)
    let root = TouchEditingOwnershipHost()
    let semantics = SearchListSemantics()
    let window = Window{Root: root, AccessibilityAdapter: semantics}
    Theme.Attach(window)
    window.Attach(host)
    host.SetFocused(true)
    ThemeFrames(host)
    let handle = root.Editor.Handle!!
    Require(handle.Focus(), "Retained touch editor did not focus")
    ThemeFrames(host)
    let box = handle.BorderBox
    let point = Point{X: box.X + 20.0, Y: box.Y + box.Height * 0.5}
    Require(handle.TryGetTextPositionAt(point, TextCoordinateSpace.Window, out var caret),
        "Retained touch editor did not expose tap geometry")
    TouchPressAt(window, 501, point)
    TouchReleaseAt(window, 501, point)
    ThemeFrames(host)
    Require(window.Focus.Selection?.Active.Offset == caret.Offset, "Touch tap did not place the retained editor caret")
    Require(FindSemantics(semantics.Tree?.Root, "Edit text") != nil, "Touch toolbar did not open")
    for iteration in 0 ... 3 {
        root.Editing!!.Rebuild()
        ThemeFrames(host)
        root.Rebuild()
        ThemeFrames(host)
        Require(handle.IsMounted && root.Editor.Handle == handle && window.Focus.Editor != nil,
            "Touch rebuild replaced or unfocused the retained editor")
    }
    Require(window.Focus.Execute(TextCommand{Kind: TextCommandKind.SelectAll}),
        "Retained touch editor rejected selection after rebuild")
    ThemeFrames(host)
    Require(window.Focus.Selection?.Active.Offset == 16, "Touch rebuild lost editor selection")
    host.SetFocused(false)
    ThemeFrames(host)
    Require(FindSemantics(semantics.Tree?.Root, "Edit text") == nil, "Touch toolbar did not close")
}

func TouchPressAt(window Window, id int64, point Point) {
    window.PlatformInput.PointerPress(id, PointerDevice.Touch,
        point.X * window.UiScale, point.Y * window.UiScale,
        PointerButton.Primary, KeyModifiers{}, 1.0F)
}

func TouchMoveAt(window Window, id int64, point Point) {
    window.PlatformInput.PointerMove(id, PointerDevice.Touch,
        point.X * window.UiScale, point.Y * window.UiScale, KeyModifiers{}, 1.0F)
}

func TouchReleaseAt(window Window, id int64, point Point) {
    window.PlatformInput.PointerRelease(id, PointerDevice.Touch,
        point.X * window.UiScale, point.Y * window.UiScale,
        PointerButton.Primary, KeyModifiers{}, 0.0F)
}

func TouchHoldWord(window Window, host TouchEditingHost) {
    Require(host.Editor.Focus(), "Touch editor did not focus")
    Require(host.Editor.TryGetTextCaretRect(TextPosition{Offset: 2}, TextCoordinateSpace.Window, out var caret),
        "Touch editor did not expose retained caret geometry")
    let point = Point{X: caret.X + 1.0, Y: caret.Y + caret.Height * 0.5}
    TouchPressAt(window, 501, point)
    PumpFrames(window, 70)
    let selection = window.Focus.Selection!!
    Require(selection.Anchor.Offset == 0 && selection.Active.Offset == 5,
        "Long press did not select the held word")
    CaptureIssueProof(window, "touch-editing-held")
    TouchReleaseAt(window, 501, point)
    PumpFrames(window, 5)
}

func TouchEditingInteractions() {
    let host = TouchEditingHost()
    let semantics = SearchListSemantics()
    let window = Window{Root: host, Size: LayoutSize(500, 300), AccessibilityAdapter: semantics,
        Title: "Goo touch editing check"}
    RunNativeWindow(window, () -> {
        window.Open()
        PumpFrames(window, 15)
        TouchHoldWord(window, host)
        Require(FindSemantics(semantics.Tree?.Root, "Cut") != nil
            && FindSemantics(semantics.Tree?.Root, "Copy") != nil
            && FindSemantics(semantics.Tree?.Root, "Paste") != nil,
            "Selected text did not show edit commands")
        let start = FindSemantics(semantics.Tree?.Root, "Selection start")!!.Bounds
        let grab = Point{X: start.X + start.Width * 0.5, Y: start.Y + start.Height * 0.5}
        TouchPressAt(window, 502, grab)
        Require(host.Editor.TryGetTextCaretRect(TextPosition{Offset: 5}, TextCoordinateSpace.Window, out var same),
            "Collapsed endpoint geometry was unavailable")
        TouchMoveAt(window, 502, Point{X: same.X, Y: grab.Y})
        PumpFrames(window, 3)
        Require(host.Editor.TryGetTextCaretRect(TextPosition{Offset: 8}, TextCoordinateSpace.Window, out var crossed),
            "Crossed endpoint geometry was unavailable")
        let end = Point{X: crossed.X, Y: grab.Y}
        TouchMoveAt(window, 502, end)
        PumpFrames(window, 3)
        TouchReleaseAt(window, 502, end)
        PumpFrames(window, 5)
        let selection = window.Focus.Selection!!
        Require(selection.Anchor.Offset == 8 && selection.Active.Offset == 5,
            "Dragging the anchor across a collapsed selection lost capture or changed the active endpoint")
        let all = FindSemantics(semantics.Tree?.Root, "Select all")!!
        Require(window.PerformAccessibilityAction(all.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Select all did not activate")
        PumpFrames(window, 5)
        let copy = FindSemantics(semantics.Tree?.Root, "Copy")!!.Bounds
        let copyPoint = Point{X: copy.X + copy.Width * 0.5, Y: copy.Y + copy.Height * 0.5}
        let focus = window.Focus.Editor!!.FocusId
        TouchPressAt(window, 503, copyPoint)
        TouchReleaseAt(window, 503, copyPoint)
        PumpFrames(window, 5)
        Require(window.Clipboard.ReadText().Text == host.Value && window.Focus.Editor?.FocusId == focus,
            "Touch Copy changed focus or copied the wrong selection")
        window.Clipboard.WriteText("replacement")
        let paste = FindSemantics(semantics.Tree?.Root, "Paste")!!
        window.PerformAccessibilityAction(paste.Id, AccessibilityActionRequest(AccessibilityAction.Activate))
        PumpFrames(window, 5)
        Require(host.Value == "replacement", "Touch Paste did not replace the selected text")
        host.Value = "Alpha beta gamma"
        host.ReadOnly = true
        host.Rebuild()
        PumpFrames(window, 5)
        TouchHoldWord(window, host)
        Require(FindSemantics(semantics.Tree?.Root, "Copy") != nil
            && FindSemantics(semantics.Tree?.Root, "Cut") == nil
            && FindSemantics(semantics.Tree?.Root, "Paste") == nil,
            "Read-only touch editing exposed a write command")
        for width in []int32{320, 700, 2560} {
            window.UiScale = 1.5F
            window.Size = LayoutSize(float64(width) / window.UiScale, float64(width == 2560 ? 1440 : 300) / window.UiScale)
            PumpFrames(window, 8)
            let toolbar = FindSemantics(semantics.Tree?.Root, "Edit text")!!.Bounds
            Require(toolbar.X >= 0.0 && toolbar.Y >= 0.0
                && toolbar.X + toolbar.Width <= float64(window.NativeWidth) / 1.5 + 0.1
                && toolbar.Y + toolbar.Height <= float64(window.NativeHeight) / 1.5 + 0.1,
                "Touch edit toolbar left the scaled viewport")
            CaptureIssueProof(window, "touch-editing-150-" + width.ToString())
        }
        window.UiScale = 1.0F
        window.Size = LayoutSize(float64(500) / window.UiScale, float64(300) / window.UiScale)
        host.ReadOnly = false
        let lines = [40]string
        for index in 0 ... lines.Length { lines[index] = "Scrollable line " + index.ToString() }
        host.Value = String.Join("\n", lines)
        host.Rebuild()
        PumpFrames(window, 8)
        let editorBox = host.Editor.ContentBox
        let scrollStart = Point{X: editorBox.X + editorBox.Width * 0.5, Y: editorBox.Y + editorBox.Height * 0.8}
        let scrollEnd = Point{X: scrollStart.X, Y: editorBox.Y + 2}
        TouchPressAt(window, 505, scrollStart)
        TouchMoveAt(window, 505, scrollEnd)
        PumpFrames(window, 3)
        TouchReleaseAt(window, 505, scrollEnd)
        PumpFrames(window, 3)
        Require(host.Editor.ScrollOffset.Y > 0, "Touch editing wrapper prevented editor scrolling")
        host.Value = "Alpha beta gamma"
        host.Password = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(host.Editor.Focus(), "Password editor did not focus")
        Require(host.Editor.TryGetTextCaretRect(TextPosition{Offset: 2}, TextCoordinateSpace.Window, out var passwordCaret),
            "Password caret geometry was unavailable")
        let passwordPoint = Point{X: passwordCaret.X, Y: passwordCaret.Y + passwordCaret.Height * 0.5}
        TouchPressAt(window, 504, passwordPoint)
        TouchReleaseAt(window, 504, passwordPoint)
        PumpFrames(window, 5)
        let selectPassword = FindSemantics(semantics.Tree?.Root, "Select all")!!
        window.PerformAccessibilityAction(selectPassword.Id, AccessibilityActionRequest(AccessibilityAction.Activate))
        PumpFrames(window, 5)
        Require(FindSemantics(semantics.Tree?.Root, "Cut") == nil
            && FindSemantics(semantics.Tree?.Root, "Copy") == nil,
            "Password touch editing exposed text export")
        CaptureIssueProof(window, "touch-editing-password")
    })
    Console.WriteLine("PASS: touch word selection, crossing handles, focus-safe clipboard, read-only/password and 150% fit")
}
