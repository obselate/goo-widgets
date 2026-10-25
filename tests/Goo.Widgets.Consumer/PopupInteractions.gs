package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import Hexa.NET.SDL3
import System
import System.Threading

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

internal class HoverHost : Cell {
    internal let Before ElementHandle = ElementHandle()
    internal let Target ElementHandle = ElementHandle()
    internal let Action ElementHandle = ElementHandle()

    public override func Build() Blob -> Container{
        Width: Percent(100),
        Height: Percent(100),
        Padding: 24,
        Gap: 24,
        Button{Handle: Before, Width: 120, Height: 32, OnClick: () -> { }, Accessibility: Accessibility{Name: "Before"},},
        Cell.Mount[HoverCardInput, HoverCard](
            "card",
            HoverCardInput{
                OpenDelayMs: 600,
                CloseDelayMs: 600,
                AccessibilityName: "Profile",
                Target: Button{Handle: Target, Width: 120, Height: 32, OnClick: () -> { }, Accessibility: Accessibility{Name: "Target"},},
                Content: Button{Handle: Action, Width: 160, Height: 32, OnClick: () -> { }, Accessibility: Accessibility{Name: "Message"},},
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
    HoverCardInteractions()
}

func HoverCardInteractions() {
    let host = HoverHost()
    let semantics = SearchListSemantics()
    let root = ApplicationRoot(host)
    let window = Window{Title: "Hover card verification", Width: 640, Height: 420, Root: root, AccessibilityAdapter: semantics}
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 12)
        let id = OnlyNativeWindow()
        let target = host.Target.BorderBox
        let x = float32(target.X + target.Width / 2.0)
        let y = float32(target.Y + target.Height / 2.0)
        MouseMove(id, x, y)
        PumpFrames(window, 3)
        Require(!host.Action.IsMounted, "Hover card opened before its delay")
        Thread.Sleep(700)
        PumpFrames(window, 4)
        Require(host.Action.IsMounted, "Hover card did not open after its delay")
        let card = host.Action.BorderBox
        MouseMove(id, float32(card.X + card.Width / 2.0), float32(card.Y + card.Height / 2.0))
        Thread.Sleep(700)
        PumpFrames(window, 4)
        Require(host.Action.IsMounted, "Hover card closed while the pointer was on it")
        MouseMove(id, 600.0F, 400.0F)
        PumpFrames(window, 3)
        Require(host.Action.IsMounted, "Hover card closed before its delay")
        Thread.Sleep(700)
        PumpFrames(window, 4)
        Require(!host.Action.IsMounted, "Hover card did not close after the pointer left")
        MouseMove(id, x, y)
        MouseButton(id, x, y, true)
        MouseButton(id, x, y, false)
        PumpFrames(window, 3)
        Require(host.Action.IsMounted, "Press did not open the hover card at once")
        MouseMove(id, 600.0F, 400.0F)
        Thread.Sleep(700)
        PumpFrames(window, 4)
        Require(host.Action.IsMounted, "Hover card closed while its target had focus")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 4)
        Require(!host.Action.IsMounted && OverlayFocus(semantics, "Target"), "Escape did not close the card and keep focus")
        host.Before.Focus()
        PumpFrames(window, 2)
        host.Target.Focus()
        PumpFrames(window, 3)
        Require(
            FindSemantics(semantics.Tree?.Root, "Profile")?.Role == AccessibilityRole.Group && OverlayFocus(semantics, "Target"),
            "Focus did not open a Group card at once without moving focus"
        )
        SendKey(id, SDLScancode.Tab)
        Thread.Sleep(700)
        PumpFrames(window, 4)
        Require(host.Action.IsMounted && OverlayFocus(semantics, "Message"), "Tab did not reach the open card content")
        Console.WriteLine("PASS: hover card delays, pointer on card, press, focus, Tab and Escape")
    } finally {
        window.RequestClose()
        window.Pump(0)
    }
}
