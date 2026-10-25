package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import Hexa.NET.SDL3
import System

internal class TriggerHost : Cell {
    internal let Editor ElementHandle = ElementHandle()
    internal let Controller TextEditorController = TextEditorController(TextDocument(""))
    internal var Offset float64
    internal var Cancels int32

    public override func Build() Blob -> Container{
        Width: Percent(100),
        Height: Percent(100),
        Padding: 24,
        Container{Height: Offset, FlexShrink: 0},
        Cell.Mount[TriggerMenuInput, TriggerMenu](
            "mentions",
            TriggerMenuInput{
                Editor: Editor,
                Controller: Controller,
                Items: (trigger string) -> []string{"Ada Lovelace", "Alan Turing", "Annie Easley", "Grace Hopper", "Radia Perlman"},
                Content: Cell.Mount[TextAreaInput, TextArea](
                    "message",
                    TextAreaInput{
                        Controller: Controller,
                        AccessibilityName: "Message",
                        Width: 400,
                        OnCancel: () -> Cancels++,
                        CreateEditor: (input TextAreaInput, editor TextEditor) -> {
                            editor.Handle = Editor
                            return editor
                        },
                    }
                ),
            }
        ),
    }
}

func PopupInteractions() {
    let host = TriggerHost()
    let semantics = SearchListSemantics()
    let root = ApplicationRoot(host)
    let window = Window{Title: "Popup verification", Width: 720, Height: 520, Root: root, AccessibilityAdapter: semantics}
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 12)
        let id = OnlyNativeWindow()
        Require(host.Editor.Focus(), "Trigger editor did not focus")
        SelectorType(window, id, "Hi @an")
        let first = FindSemantics(semantics.Tree?.Root, "Annie Easley")
        Require(first?.Selected == true, "Trigger menu did not open on its first ranked item")
        Require(host.Controller.IsFocused, "Trigger menu took editor focus")
        Require(
            host.Editor.TryGetTextCaretRect(TextPosition{Offset: 3}, TextCoordinateSpace.Window, out var caret),
            "Trigger caret was not measurable"
        )
        let placed = first!!.Bounds
        Require(
            placed.Y >= caret.Y + caret.Height && Math.Abs(placed.X - caret.X) < 16.0,
            "Trigger menu was not placed at the trigger"
        )
        host.Offset = 40.0
        host.Rebuild()
        PumpFrames(window, 8)
        let moved = FindSemantics(semantics.Tree?.Root, "Annie Easley")!!.Bounds
        Require(Math.Abs(moved.Y - placed.Y - 40.0) < 0.5, "Trigger menu did not follow its editor")
        SendKey(id, SDLScancode.Down)
        PumpFrames(window, 4)
        Require(FindSemantics(semantics.Tree?.Root, "Alan Turing")?.Selected == true, "Down did not move the active item")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 6)
        Require(
            host.Controller.Document.GetText() == "Hi @Alan Turing " && FindSemantics(semantics.Tree?.Root, "Annie Easley") == nil,
            "Enter did not replace the trigger range"
        )
        SelectorType(window, id, "@gr")
        Require(FindSemantics(semantics.Tree?.Root, "Grace Hopper") != nil, "Trigger menu did not reopen")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 4)
        Require(
            FindSemantics(semantics.Tree?.Root, "Grace Hopper") == nil
            && host.Controller.Document.GetText() == "Hi @Alan Turing @gr" && host.Cancels == 0,
            "Escape did not close the menu and keep the typed text"
        )
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 4)
        Require(host.Cancels == 1, "Escape did not reach the editor after the menu closed")
        SelectorType(window, id, " @ra")
        FeedbackClick(window, FindSemantics(semantics.Tree?.Root, "Radia Perlman")!!.Bounds)
        Require(
            host.Controller.Document.GetText() == "Hi @Alan Turing @gr @Radia Perlman " && host.Controller.IsFocused,
            "Pointer pick did not replace the trigger range in the focused editor"
        )
        Console.WriteLine("PASS: trigger menu focus, placement, keyboard and pointer picks, Escape")
    } finally {
        window.RequestClose()
        window.Pump(0)
    }
}
