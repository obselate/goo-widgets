package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Hexa.NET.SDL3
import System
import System.Collections.Generic
import System.Reflection

internal class TextAreaProbe : TextArea {
    internal func Render(input TextAreaInput) Blob -> base.Build(input)
}

func ControllerDisposed(controller TextEditorController) bool -> bool(
    typeof(TextEditorController).GetField("disposed", BindingFlags.Instance | BindingFlags.NonPublic)!!.GetValue(
        controller
    )!!
)

func TextAreaOwnership() {
    let external = TextEditorController(TextDocument("External"))
    let probe = TextAreaProbe()
    probe.Render(TextAreaInput{Controller: external})
    probe.Dispose()
    probe.Dispose()
    Require(!ControllerDisposed(external), "TextArea disposed an external controller")
    external.Dispose()
    let owned = TextAreaProbe()
    let root = (owned.Render(TextAreaInput{Value: "Owned"}) as Container)!!
    let controller = (root.Children[0] as TextEditor)!!.Controller
    owned.Dispose()
    owned.Dispose()
    Require(ControllerDisposed(controller), "TextArea failed to dispose its owned controller")
}

internal class TabBarProbe : TabBar {
    internal func Render(input TabBarInput) Blob -> base.Build(input)
}

func TabBarContracts() {
    let tabs = TabBarProbe()
    let root = (
        tabs.Render(
            TabBarInput{
                SelectedId: "one",
                Items: []NavigationItem{
                    NavigationItem{Id: "one", Label: "One"},
                    NavigationItem{Id: "two", Label: "Two"}
                },
                CreateItem: (input TabBarInput, item NavigationItem, prepared Button) -> Button{
                    BorderRadius: 17,
                    Text{Content: item.Label!!}
                },
            }
        ) as Container
    )!!
    let first = (root.Children[0] as Button)!!
    let second = (root.Children[1] as Button)!!
    Require(
        first.Key == "one" &&
            first.TabStop &&
            first.Focusable &&
            first
            .Accessibility
            ?.Selected == true &&
            !second.TabStop,
        "Tab item customization replaced required selection/focus wiring"
    )
    var rejected bool
    try {
        tabs.Render(TabBarInput{Items: []NavigationItem{NavigationItem{Id: "same"}, NavigationItem{Id: "same"}}})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "TabBar accepted duplicate identities")
}

internal class CompositeHost : Cell {
    internal var Split float64 = .4
    internal var Vertical bool
    internal var Commits int32
    internal var Divider Container?
    internal var SplitRoot Container?
    internal var Selected string = "one"
    internal var Manual bool
    internal let Tabs Dictionary[string, Button] = Dictionary[string, Button]()
    internal var TabRoot Container?
    internal let TabViewport ElementHandle = ElementHandle()
    internal var Value string = "Alpha\nBeta"
    internal var Changes int32
    internal var Editor TextEditor?
    internal var ReadOnly bool
    internal var Disabled bool
    internal var NoWrap bool
    internal let EditorViewport ElementHandle = ElementHandle()
    internal var ShowArea bool = true

    private func Divide(value float64) {
        Split = value
        Rebuild()
    }

    private func TabSelected(id string) {
        Selected = id
        Rebuild()
    }

    private func TextChanged(value string) {
        Value = value
        Changes++
        Rebuild()
    }

    private func CaptureDivider(input SplitPaneInput, root Container) Container {
        Divider = root
        return root
    }

    private func CaptureSplit(input SplitPaneInput, root Container) Container {
        SplitRoot = root
        return root
    }

    private func CaptureTab(input TabBarInput, item NavigationItem, button Button) Button {
        Tabs[item.Id!!] = button
        return button
    }

    private func CaptureTabs(input TabBarInput, root Container) Container {
        root.Handle = TabViewport
        TabRoot = root
        return root
    }

    private func CaptureEditor(input TextAreaInput, editor TextEditor) TextEditor {
        editor.Handle = EditorViewport
        Editor = editor
        return editor
    }

    public override func Build() Blob {
        let root = Container{
            Padding: 24,
            Gap: 18,
            Width: Length.Percent(100),
            Height: Length.Percent(100),
            BackgroundColor: "#09090b",
            Color: "#fafafa",
            Text{Key: "heading", Content: "Composite widgets", FontSize: 24},
            Cell.Mount[TabBarInput, TabBar](
                "tabs",
                TabBarInput{
                    SelectedId: Selected,
                    OnSelect: TabSelected,
                    Activation: Manual ? TabActivation.Manual: TabActivation.Automatic,
                    CreateItem: CaptureTab,
                    CreateRoot: CaptureTabs,
                    Items: []NavigationItem{
                        NavigationItem{Id: "one", Label: "Overview"},
                        NavigationItem{Id: "locked", Label: "Unavailable", Disabled: true},
                        NavigationItem{Id: "three", Label: "Activity"},
                        NavigationItem{Id: "four", Label: "Documents and history"},
                        NavigationItem{Id: "five", Label: "Preferences"},
                        NavigationItem{Id: "six", Label: "Connections"},
                    },
                }
            ),
            Cell.Mount[SplitPaneInput, SplitPane](
                "split",
                SplitPaneInput{
                    Value: Split,
                    OnChange: Divide,
                    OnCommit: (value float64) -> {
                        Commits++
                    },
                    Orientation: Vertical ? SplitOrientation.Vertical: SplitOrientation.Horizontal,
                    Height: 180,
                    MinimumFirst: 90,
                    MinimumSecond: 80,
                    CreateHandle: CaptureDivider,
                    CreateRoot: CaptureSplit,
                    First: Container{
                        Width: Length.Percent(100),
                        Height: Length.Percent(100),
                        Padding: 16,
                        BackgroundColor: "#152a36",
                        Text{Content: "First pane"}
                    },
                    Second: Container{
                        Width: Length.Percent(100),
                        Height: Length.Percent(100),
                        Padding: 16,
                        BackgroundColor: "#202236",
                        Text{Content: "Second pane"}
                    },
                }
            )
        }
        if ShowArea {
            root.Children.Add(
                Cell.Mount[TextAreaInput, TextArea](
                    "area",
                    TextAreaInput{
                        Value: Value,
                        OnChange: TextChanged,
                        Label: "Notes",
                        Placeholder: "Write a note",
                        Width: Length.Percent(100),
                        MinimumRows: 4,
                        ReadOnly: ReadOnly,
                        Disabled: Disabled,
                        Wrap: NoWrap ? TextWrap.NoWrap: TextWrap.Wrap,
                        ShowFocusHighlight: true,
                        CreateEditor: CaptureEditor,
                    }
                )
            )
        }
        return root
    }
}

func CompositeClick(window Window, handle ElementHandle) {
    let box = handle.BorderBox
    let id = OnlyNativeWindow()
    MouseMove(id, float32(box.X + box.Width / 2.0), float32(box.Y + box.Height / 2.0))
    MouseButton(id, float32(box.X + box.Width / 2.0), float32(box.Y + box.Height / 2.0), true)
    MouseButton(id, float32(box.X + box.Width / 2.0), float32(box.Y + box.Height / 2.0), false)
    PumpFrames(window, 8)
}

func CompositeInteractions() {
    TextAreaOwnership()
    let host = CompositeHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Goo Widgets composite verification",
        Width: 700,
        Height: 610,
        Root: host,
        AccessibilityAdapter: semantics
    }
    window.Open()
    try {
        PumpFrames(window, 20)
        let id = OnlyNativeWindow()
        Require(host.Tabs["one"].TabStop && !host.Tabs["three"].TabStop, "TabBar did not establish one roving stop")
        host.Tabs["one"].Handle!!.Focus()
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 8)
        Require(
            host.Selected == "three" && FindSemantics(semantics.Tree!!.Root, "Activity")!!.Focused,
            "Arrow navigation did not skip the disabled tab"
        )
        host.Manual = true
        host.Rebuild()
        PumpFrames(window, 5)
        SendKey(id, SDLScancode.End)
        PumpFrames(window, 8)
        Require(
            host.Selected == "three" && FindSemantics(semantics.Tree!!.Root, "Connections")!!.Focused,
            "Manual tab navigation changed selection or lost focus"
        )
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(host.Selected == "six", "Manual tab activation failed")
        host.Tabs["locked"].Handle!!.ScrollIntoView()
        PumpFrames(window, 8)
        CompositeClick(window, host.Tabs["locked"].Handle!!)
        Require(host.Selected == "six", "Disabled tab accepted pointer selection")
        host.Tabs["one"].Handle!!.ScrollIntoView()
        PumpFrames(window, 8)
        CompositeClick(window, host.Tabs["one"].Handle!!)
        Require(host.Selected == "one", "Pointer tab selection failed")
        let divider = host.Divider!!.Handle!!
        divider.Focus()
        let beforeKey = host.Split
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 8)
        Require(host.Split > beforeKey && host.Commits == 1, "SplitPane keyboard adjustment failed")
        let box = divider.BorderBox
        let x = float32(box.X + box.Width / 2.0)
        let y = float32(box.Y + box.Height / 2.0)
        MouseButton(id, x, y, true)
        MouseMove(id, x + 90.0F, y)
        PumpFrames(window, 8)
        MouseButton(id, x + 90.0F, y, false)
        PumpFrames(window, 8)
        Require(host.Split > beforeKey + .1 && host.Commits == 2, "Captured splitter drag failed")
        let nextBox = host.Divider!!.Handle!!.BorderBox
        MouseButton(id, float32(nextBox.X + 2.0), float32(nextBox.Y + 40.0), true)
        PumpFrames(window, 3)
        var lost = SDLEvent{Window: SDLWindowEvent{Type: SDLEventType.WindowFocusLost, WindowID: id}}
        SDL.PushEvent(ref lost)
        PumpFrames(window, 4)
        let cancelled = host.Split
        MouseMove(id, 4, 4)
        MouseButton(id, 4, 4, false)
        PumpFrames(window, 4)
        Require(
            host.Split == cancelled && host.Commits == 2,
            "Pointer cancellation retained splitter capture or committed"
        )
        var gained = SDLEvent{Window: SDLWindowEvent{Type: SDLEventType.WindowFocusGained, WindowID: id}}
        SDL.PushEvent(ref gained)
        let controller = host.Editor!!.Controller
        controller.Selection = TextSelection{Anchor: TextPosition{Offset: 0}, Active: TextPosition{Offset: 5}}
        host.Value = "Alpha\nBeta\nGamma"
        host.Rebuild()
        PumpFrames(window, 8)
        Require(
            host.Editor!!.Controller == controller &&
                controller
                .Selection
                .Anchor
                .Offset == 0 &&
                controller
                .Selection
                .Active
                .Offset == 5 &&
                host.Changes == 0,
            "External TextArea value lost controller/selection or emitted a user change"
        )
        controller.Selection = TextSelection{
            Anchor: TextPosition{Offset: host.Value.Length},
            Active: TextPosition{Offset: host.Value.Length}
        }
        let editorNode = FindSemantics(semantics.Tree!!.Root, "Notes")!!
        window.PerformAccessibilityAction(editorNode.Id, AccessibilityActionRequest(AccessibilityAction.Focus))
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(
            host.Value.EndsWith("\n") && host.Changes == 1,
            "Native multiline editing did not emit a controlled string"
        )
        host.ReadOnly = true
        host.Rebuild()
        PumpFrames(window, 5)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 5)
        Require(host.Changes == 1, "Read-only TextArea accepted editing")
        host.ReadOnly = false
        host.Disabled = true
        host.Rebuild()
        PumpFrames(window, 5)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 5)
        Require(host.Changes == 1, "Disabled TextArea accepted editing")
        host.Disabled = false
        host.ReadOnly = true
        host.Rebuild()
        PumpFrames(window, 5)
        CaptureIssueProof(window, "composites-wide")
        window.Width = 390
        PumpFrames(window, 15)
        Require(
            host.TabViewport.ScrollRange.X > 0.0 && host.TabRoot!!.Children.Count == 6,
            "Tab overflow dropped entries or lost its scroll range"
        )
        let splitBox = host.SplitRoot!!.Handle!!.ContentBox
        let splitPixels = host.Divider!!.Handle!!.BorderBox.X - splitBox.X
        Require(splitPixels >= 89.9 && splitBox.Width - splitPixels - 6.0 >= 79.9, "Container resize lost pane minima")
        CaptureIssueProof(window, "composites-narrow")
        host.Vertical = true
        host.Rebuild()
        PumpFrames(window, 10)
        host.Divider!!.Handle!!.Focus()
        let vertical = host.Split
        SendKey(id, SDLScancode.Up)
        PumpFrames(window, 8)
        Require(host.Split <= vertical, "Vertical splitter keyboard direction failed")
        CaptureIssueProof(window, "composites-vertical")
        host.NoWrap = true
        host.Value = String('x', 240)
        host.Rebuild()
        PumpFrames(window, 10)
        Require(host.EditorViewport.ScrollRange.X > 0.0, "No-wrap TextArea lost horizontal scrolling")
        host.ShowArea = false
        host.Rebuild()
        PumpFrames(window, 8)
        Require(ControllerDisposed(controller), "Mounted TextArea did not dispose its default controller on removal")
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Require(!window.IsOpen, "Composite widget window failed to close")
    Console.WriteLine(
        "PASS: split drag/cancel/resize/keyboard, tab pointer/disabled/manual/automatic/overflow, TextArea controlled edits/selection/ownership/read-only"
    )
}
