package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import Goo.Widgets.Navigation
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class PathActionsHost : Cell {
    internal var Narrow bool
    internal var Selected string = ""
    internal var Invoked string = ""
    internal var Invokes int32
    internal var Root Container?
    internal var Viewport ElementHandle = ElementHandle()
    internal var Sorts[]DataGridSortColumn = []DataGridSortColumn{}
    internal var Order[]string = []string{"a", "b", "c"}
    internal let Items[]BreadcrumbItem = []BreadcrumbItem{
        BreadcrumbItem{Id: "home", Label: "Home"},
        BreadcrumbItem{Id: "overflow", Label: "Projects"},
        BreadcrumbItem{Id: "widgets", Label: "Widgets"},
        BreadcrumbItem{Id: "navigation", Label: "Navigation"},
        BreadcrumbItem{Id: "current", Label: "Current"}
    }

    public override func Build() Blob -> Container{
        Padding: 16,
        Gap: 16,
        Typography{Content: "Path actions", Variant: TextVariant.H2}.Build(),
        Kbd{Keys: []KeyBinding{KeyBinding{Key: Key.K, Modifiers: KeyModifiers{Ctrl: true}}}}.Build(),
        Container{
            Width: Narrow ? 260: 700,
            Cell.Mount[BreadcrumbInput, Breadcrumb](
                "path",
                BreadcrumbInput{Items: Items, OnSelect: (id string) -> Selected = id}
            )
        },
        Cell.Mount[DataGridInput, DataGrid](
            "grid",
            DataGridInput{
                Width: 300,
                Height: 180,
                ViewportHandle: Viewport,
                VirtualizeColumns: true,
                Columns: []DataGridColumn{
                    DataGridColumn{Id: "a", Label: "Alpha", Width: 180, Sortable: true},
                    DataGridColumn{Id: "b", Label: "Beta", Width: 180, Sortable: true},
                    DataGridColumn{Id: "c", Label: "Gamma", Width: 180, Sortable: true}
                },
                Rows: []DataGridRow{
                    DataGridRow{Id: "first", Label: "First"},
                    DataGridRow{Id: "disabled", Label: "Disabled", Disabled: true}
                },
                PinnedColumns: []string{"a"},
                ColumnOrder: Order,
                Sorts: Sorts,
                OnSortsChange: (sorts[]DataGridSortColumn) -> {
                    Sorts = sorts
                    Rebuild()
                },
                OnColumnOrderChange: (order[]string) -> {
                    Order = order
                    Rebuild()
                },
                OnRowInvoke: (id string) -> {
                    Invoked = id
                    Invokes++
                },
                Footer: Text{Content: "Total: 2", Accessibility: Accessibility{Name: "Total: 2"}},
                Density: DataGridDensity.Compact,
                CreateRoot: (input DataGridInput, root Container) -> {
                    Root = root
                    return root
                }
            }
        )
    }
}

func PathActionsInteractions() {
    let chord = KeyBinding{Key: Key.K, Modifiers: KeyModifiers{Ctrl: true, Shift: true, Super: true}}
    Require(Kbd.Label(chord, KbdPlatform.Linux) == "Ctrl+Shift+Super+K", "Linux key labels changed")
    Require(Kbd.Label(chord, KbdPlatform.Windows) == "Ctrl+Shift+Super+K", "Windows key labels changed")
    Require(Kbd.Label(chord, KbdPlatform.MacOS) == "Ctrl+Shift+Cmd+K", "Mac primary modifier was lost")
    let host = PathActionsHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Path action verification",
        Width: 760,
        Height: 460,
        Root: host,
        AccessibilityAdapter: semantics
    }
    Theme.Attach(window, Theme.Default)
    window.Open()
    try {
        PumpFrames(window, 20)
        let nativeId = OnlyNativeWindow()
        let heading = FindSemantics(semantics.Tree!!.Root, "Path actions")!!
        Require(heading.Role == AccessibilityRole.Heading && heading.Level == 2, "Typography lost heading level")
        let current = FindSemantics(semantics.Tree!!.Root, "Current")!!
        Require(
            current.Role == AccessibilityRole.Text && !window.PerformAccessibilityAction(
                current.Id,
                AccessibilityActionRequest(AccessibilityAction.Activate)
            ),
            "Current breadcrumb is actionable"
        )
        FeedbackClick(window, FindSemantics(semantics.Tree!!.Root, "Home")!!.Bounds)
        SendKey(nativeId, SDLScancode.Right)
        PumpFrames(window, 5)
        Require(FindSemantics(semantics.Tree!!.Root, "Projects")!!.Focused, "Breadcrumb arrow navigation failed")
        SendKey(nativeId, SDLScancode.Return)
        PumpFrames(window, 5)
        Require(host.Selected == "overflow", "Breadcrumb keyboard activation failed")
        host.Narrow = true
        host.Rebuild()
        PumpFrames(window, 12)
        let hidden = FindSemantics(semantics.Tree!!.Root, "Show hidden path")!!
        FeedbackClick(window, hidden.Bounds)
        PumpFrames(window, 10)
        Require(FindSemantics(semantics.Tree!!.Root, "Path locations") != nil, "Overflow did not open a Menu")
        SendKey(nativeId, SDLScancode.Return)
        PumpFrames(window, 10)
        Require(host.Selected == "overflow", "Overflow menu did not select its first middle segment")
        host.Root!!.Handle!!.Focus()
        SendKey(nativeId, SDLScancode.Return)
        PumpFrames(window, 5)
        Require(host.Invokes == 1 && host.Invoked == "first", "Enter did not invoke active row")
        let row = FindSemantics(semantics.Tree!!.Root, "First")!!
        FeedbackClick(window, row.Bounds)
        FeedbackClick(window, row.Bounds)
        Require(host.Invokes == 2, "Double press did not invoke row exactly once")
        FeedbackClick(window, FindSemantics(semantics.Tree!!.Root, "Disabled")!!.Bounds)
        FeedbackClick(window, FindSemantics(semantics.Tree!!.Root, "Disabled")!!.Bounds)
        Require(host.Invokes == 2, "Disabled row invoked")
        Require(FindSemantics(semantics.Tree!!.Root, "Total: 2") != nil, "Aggregation footer missing")
        FeedbackClick(window, FindSemantics(semantics.Tree!!.Root, "Alpha")!!.Bounds)
        FeedbackClick(window, FindSemantics(semantics.Tree!!.Root, "Beta")!!.Bounds)
        Require(
            host.Sorts.Length == 2 && host.Sorts[0].ColumnId == "a" && host.Sorts[1].ColumnId == "b",
            "Multi-sort lost priority"
        )
        let beta = FindSemantics(semantics.Tree!!.Root, "Beta")!!
        window.PerformAccessibilityAction(beta.Id, AccessibilityActionRequest(AccessibilityAction.Focus))
        SelectorKey(nativeId, SDLScancode.Right, SDLKeymod.Alt)
        PumpFrames(window, 8)
        Require(host.Order[1] == "c" && host.Order[2] == "b", "Keyboard column reorder failed")
        let gamma = FindSemantics(semantics.Tree!!.Root, "Gamma")!!.Bounds
        let betaTarget = FindSemantics(semantics.Tree!!.Root, "Beta")!!.Bounds
        let dragX = float32(gamma.X + gamma.Width / 2)
        let dragY = float32(gamma.Y + gamma.Height / 2)
        MouseMove(nativeId, dragX, dragY)
        MouseButton(nativeId, dragX, dragY, true)
        MouseMove(nativeId, float32(betaTarget.X + betaTarget.Width / 2), dragY)
        MouseButton(nativeId, float32(betaTarget.X + betaTarget.Width / 2), dragY, false)
        PumpFrames(window, 8)
        Require(host.Order[1] == "b" && host.Order[2] == "c", "Pointer column reorder failed")
        let cellBefore = FindSemantics(FindSemantics(semantics.Tree!!.Root, "First"), "Alpha")!!.Bounds.X
        let before = FindSemantics(semantics.Tree!!.Root, "Alpha")!!.Bounds.X
        host.Viewport.JumpTo(220, 0)
        PumpFrames(window, 10)
        Require(
            Math.Abs(FindSemantics(semantics.Tree!!.Root, "Alpha")!!.Bounds.X - before) < 1,
            "Pinned header moved with horizontal scroll"
        )
        Require(
            Math.Abs(FindSemantics(FindSemantics(semantics.Tree!!.Root, "First"), "Alpha")!!.Bounds.X - cellBefore) < 1,
            "Pinned virtual cell moved or was removed"
        )
        Require(
            FindSemantics(semantics.Tree!!.Root, "First")!!.Bounds.Height < Theme.Read(window).ControlHeight,
            "Compact density did not reduce row height"
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 4)
    }
    Console.WriteLine(
        "PASS: Typography headings, Kbd platform labels, breadcrumb keyboard/overflow, DataGrid invoke and table options"
    )
}
