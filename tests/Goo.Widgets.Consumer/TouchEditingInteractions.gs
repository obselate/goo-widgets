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
            TextField{Value: Value, Width: 170, OnChange: Changed,
                CreateEntry: (input TextField) -> TextEntry{Value: input.Value ?? "", Password: true,
                    Width: Percent(100), Height: 40,
                    Handle: Editor, OnChange: input.OnChange},
            }.Build()
        } else {
            Cell.Mount[TextAreaInput, TextArea]("editor", TextAreaInput{
                Value: Value, Width: Percent(100), Height: 70, ReadOnly: ReadOnly, OnChange: Changed,
                CreateEditor: (input TextAreaInput, editor TextEditor) -> { editor.Handle = Editor
                    return editor },
            })
        })
        return root
    }
}

func TouchPressAt(window Window, id int64, point Point) {
    window.PlatformInput.PointerPress(id, PointerDevice.Touch,
        float32(point.X) * window.UiScale, float32(point.Y) * window.UiScale,
        PointerButton.Primary, KeyModifiers{}, 1.0F)
}

func TouchMoveAt(window Window, id int64, point Point) {
    window.PlatformInput.PointerMove(id, PointerDevice.Touch,
        float32(point.X) * window.UiScale, float32(point.Y) * window.UiScale, KeyModifiers{}, 1.0F)
}

func TouchReleaseAt(window Window, id int64, point Point) {
    window.PlatformInput.PointerRelease(id, PointerDevice.Touch,
        float32(point.X) * window.UiScale, float32(point.Y) * window.UiScale,
        PointerButton.Primary, KeyModifiers{}, 0.0F)
}

func TouchHoldWord(window Window, host TouchEditingHost) {
    Require(host.Editor.Focus(), "Touch editor did not focus")
    Require(host.Editor.TryGetTextCaretRect(TextPosition{Offset: 2}, TextCoordinateSpace.Window, out var caret),
        "Touch editor did not expose retained caret geometry")
    let point = Point{X: caret.X + 1.0, Y: caret.Y + caret.Height * 0.5}
    TouchPressAt(window, 501, point)
    PumpFrames(window, 70)
    let selection = window.PlatformInput.Selection!!
    Require(selection.Anchor.Offset == 0 && selection.Active.Offset == 5,
        "Long press did not select the held word")
    CaptureIssueProof(window, "touch-editing-held")
    TouchReleaseAt(window, 501, point)
    PumpFrames(window, 5)
}

func TouchEditingInteractions() {
    let host = TouchEditingHost()
    let semantics = SearchListSemantics()
    let window = Window{Root: host, Width: 500, Height: 300, AccessibilityAdapter: semantics,
        Title: "Goo touch editing check"}.Open()
    try {
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
        let selection = window.PlatformInput.Selection!!
        Require(selection.Anchor.Offset == 8 && selection.Active.Offset == 5,
            "Dragging the anchor across a collapsed selection lost capture or changed the active endpoint")
        let all = FindSemantics(semantics.Tree?.Root, "Select all")!!
        Require(window.PerformAccessibilityAction(all.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Select all did not activate")
        PumpFrames(window, 5)
        let copy = FindSemantics(semantics.Tree?.Root, "Copy")!!.Bounds
        let copyPoint = Point{X: copy.X + copy.Width * 0.5, Y: copy.Y + copy.Height * 0.5}
        let focus = window.PlatformInput.Editor!!.FocusId
        TouchPressAt(window, 503, copyPoint)
        TouchReleaseAt(window, 503, copyPoint)
        PumpFrames(window, 5)
        Require(window.GetClipboardText() == host.Value && window.PlatformInput.Editor?.FocusId == focus,
            "Touch Copy changed focus or copied the wrong selection")
        window.SetClipboardText("replacement")
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
            window.Width = width
            window.Height = width == 2560 ? 1440 : 300
            PumpFrames(window, 8)
            let toolbar = FindSemantics(semantics.Tree?.Root, "Edit text")!!.Bounds
            Require(toolbar.X >= 0.0 && toolbar.Y >= 0.0
                && toolbar.X + toolbar.Width <= float64(window.Width) / 1.5 + 0.1
                && toolbar.Y + toolbar.Height <= float64(window.Height) / 1.5 + 0.1,
                "Touch edit toolbar left the scaled viewport")
            CaptureIssueProof(window, "touch-editing-150-" + width.ToString())
        }
        window.UiScale = 1.0F
        window.Width = 500
        window.Height = 300
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
    } finally {
        window.RequestClose()
        PumpFrames(window, 2)
    }
    Console.WriteLine("PASS: touch word selection, crossing handles, focus-safe clipboard, read-only/password and 150% fit")
}
