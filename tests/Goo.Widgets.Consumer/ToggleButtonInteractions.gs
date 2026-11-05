package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Hexa.NET.SDL3
import System

internal class ToggleButtonHost : Cell {
    internal var Value bool
    internal var Changes int32
    internal var Accept bool = true
    internal var Root Blob?
    internal var DisabledRoot Blob?

    public override func Build() Blob {
        Root = ToggleButton{
            Content: "Pinned",
            Value: Value,
            OnChange: (value bool) -> {
                Changes++
                if Accept { Value = value }
                Rebuild()
            },
        }.Build()
        DisabledRoot = ToggleButton{Content: "Archived", Value: true, Disabled: true, OnChange: (value bool) -> Changes++}.Build()
        return Container{
            Padding: Theme.Read().ControlPadding,
            Gap: Theme.Read().ControlGap,
            BasedOn: Theme.Read().CanvasStyle,
            Root!!,
            DisabledRoot!!,
            Button{Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Next"}, Text{Content: "Next"}},
        }
    }
}

func ToggleButtonInteractions() {
    let host = ToggleButtonHost()
    let adapter = SearchListSemantics()
    let window = Window{Title: "Toggle value", Width: 420, Height: 240, Root: ApplicationRoot(host), AccessibilityAdapter: adapter}
    window.Open()
    try {
        PumpFrames(window, 20)
        for palette in []Theme{Theme.Bone, Theme.Ink, Theme.Ink.WithHighContrast()} {
            Theme.Attach(window, palette with{TransitionMs = 0.0})
            PumpFrames(window, 8)
            Require(FeedbackNode(adapter, AccessibilityRole.Button, "Archived").Checked == AccessibilityChecked.True, "Disabled toggle lost its value")
            CompositeClick(window, host.DisabledRoot!!.Handle!!)
            Require(host.Changes == 0, "Disabled toggle accepted pointer input")
        }
        ChoiceKey(window, SDLScancode.Tab)
        Require(FeedbackNode(adapter, AccessibilityRole.Button, "Pinned").Focused, "Toggle did not receive Tab focus")
        let id = OnlyNativeWindow()
        var down = SDLEvent{Key: SDLKeyboardEvent{Type: SDLEventType.KeyDown, WindowID: id, Scancode: SDLScancode.Space, Down: uint8(1)}}
        var up = SDLEvent{Key: SDLKeyboardEvent{Type: SDLEventType.KeyUp, WindowID: id, Scancode: SDLScancode.Space}}
        Require(SDL.PushEvent(ref down), "SDL rejected toggle Space down")
        PumpFrames(window, 6)
        Require(!host.Value && host.Changes == 0, "Toggle changed before Space release")
        Require(SDL.PushEvent(ref up), "SDL rejected toggle Space release")
        PumpFrames(window, 6)
        Require(host.Value && host.Changes == 1 && FeedbackNode(adapter, AccessibilityRole.Button, "Pinned").Checked == AccessibilityChecked.True, "Space did not publish pressed toggle state: value=" + host.Value.ToString() + ", changes=" + host.Changes.ToString() + ", checked=" + FeedbackNode(adapter, AccessibilityRole.Button, "Pinned").Checked.ToString())
        ChoiceKey(window, SDLScancode.Return)
        Require(!host.Value && host.Changes == 2, "Enter did not clear the toggle")
        CompositeClick(window, host.Root!!.Handle!!)
        Require(host.Value && host.Changes == 3, "Pointer did not press the toggle")
        let bounds = host.Root!!.Handle!!.BorderBox
        let selectedImage = ThemeCapture(window)
        Require(ThemePixel(selectedImage, int32(bounds.X + bounds.Width / 2), int32(bounds.Y + 3), Theme.Read(window).ActiveColor), "Selected toggle lost its surface on hover")
        host.Accept = false
        CompositeClick(window, host.Root!!.Handle!!)
        Require(host.Value && host.Changes == 4 && FeedbackNode(adapter, AccessibilityRole.Button, "Pinned").Checked == AccessibilityChecked.True, "Toggle changed its controlled value without host acceptance")
        ChoiceKey(window, SDLScancode.Tab)
        Require(FeedbackNode(adapter, AccessibilityRole.Button, "Next").Focused, "Disabled toggle remained in Tab traversal")
        Console.WriteLine("PASS: ToggleButton pointer, Space release, Enter, controlled value, disabled traversal and light/dark/high-contrast semantics")
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
}
