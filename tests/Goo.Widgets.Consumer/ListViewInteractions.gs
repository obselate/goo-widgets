package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Data
import Goo.Widgets.Layout
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class ListTreeHost : Cell {
    internal var Tree bool
    internal var Multiple bool = true
    internal var Selected[]string = []string{"alpha"}
    internal var Active string?
    internal var Invoked string?
    internal var Renamed string?
    internal var Expanded[]string = []string{}
    internal var Loading[]string = []string{}
    internal var Children[]?TreeNode
    internal var Loads int32
    internal var Root Container?
    internal var DropPosition TreeDropPosition?
    internal let Rows Dictionary[string, Container] = Dictionary[string, Container]()

    private func Change(ids[]string) {
        Selected = ids
        Rebuild()
    }

    public override func Build() Blob {
        let content = if Tree {
            Cell.Mount[TreeViewInput, TreeView](
                "tree",
                TreeViewInput{
                    Nodes: []TreeNode{
                        TreeNode{Id: "alpha", Label: "Alpha"},
                        TreeNode{Id: "locked", Label: "Locked", Disabled: true},
                        TreeNode{Id: "beta", Label: "Beta"},
                        TreeNode{Id: "lazy", Label: "Lazy", HasChildren: true, Children: Children}
                    },
                    SelectedIds: Selected,
                    Multiple: Multiple,
                    OnSelectionChange: Change,
                    ExpandedIds: Expanded,
                    LoadingIds: Loading,
                    OnExpandedChange: (id string, value bool) -> {
                        Expanded = value ? []string{id}: []string{}
                        Rebuild()
                    },
                    LoadChildren: (id string) -> {
                        Loads++
                        Loading = []string{id}
                        Rebuild()
                    },
                    OnRename: (id string) -> Renamed = id,
                    OnDrop: (ids[]string, target string, position TreeDropPosition) -> DropPosition = position,
                    CreateRoot: (input TreeViewInput, root Container) -> {
                        Root = root
                        return root
                    },
                    CreateRow: (input TreeViewInput, row TreeViewRow, root Container) -> {
                        Rows[row.Node.Id!!] = root
                        return root
                    },
                    AccessibilityName: "Selection tree",
                    Height: 280
                }
            )
        } else {
            Cell.Mount[ListViewInput, ListView](
                "list",
                ListViewInput{
                    Multiple: Multiple,
                    SelectedIds: Selected,
                    OnSelectionChange: Change,
                    ActiveId: Active,
                    OnActiveChange: (id string) -> {
                        Active = id
                        Rebuild()
                    },
                    OnInvoke: (id string) -> Invoked = id,
                    Sections: []ListViewSection{
                        ListViewSection{
                            Id: "first",
                            Label: "First section",
                            Items: []ListViewItem{
                                ListViewItem{Id: "alpha", Label: "Alpha"},
                                ListViewItem{Id: "locked", Label: "Locked", Disabled: true},
                                ListViewItem{Id: "beta", Label: "Beta"}
                            }
                        },
                        ListViewSection{
                            Id: "second",
                            Label: "Second section",
                            Items: []ListViewItem{
                                ListViewItem{Id: "gamma", Label: "Gamma"},
                                ListViewItem{Id: "delta", Label: "Delta"}
                            }
                        }
                    },
                    CreateRoot: (input ListViewInput, root Container) -> {
                        Root = root
                        return root
                    },
                    CreateRow: (input ListViewInput, item ListViewItem, root Container) -> {
                        Rows[item.Id!!] = root
                        return root
                    },
                    AccessibilityName: "Selection list",
                    Height: 280
                }
            )
        }
        return Container{Width: Percent(100), Height: Percent(100), Padding: 24, content}
    }
}

func ListKey(window Window, key SDLScancode, modifiers SDLKeymod = SDLKeymod.None) {
    var down = SDLEvent{
        Key: SDLKeyboardEvent{
            Type: SDLEventType.KeyDown,
            WindowID: OnlyNativeWindow(),
            Scancode: key,
            Mod: uint16(modifiers),
            Down: uint8(1)
        }
    }
    SDL.PushEvent(ref down)
    var up = SDLEvent{Key: SDLKeyboardEvent{Type: SDLEventType.KeyUp, WindowID: OnlyNativeWindow(), Scancode: key}}
    SDL.PushEvent(ref up)
    PumpFrames(window, 8)
}

func ListViewInteractions() {
    let host = ListTreeHost()
    let root = ApplicationRoot(host)
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "List selection verification",
        Width: 620,
        Height: 440,
        Root: root,
        AccessibilityAdapter: semantics
    }
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 15)
        host.Root!!.Handle!!.Focus()
        PumpFrames(window, 6)
        ListKey(window, SDLScancode.Down)
        Require(host.Selected.Length == 1 && host.Selected[0] == "beta", "List Down did not skip disabled rows")
        ListKey(window, SDLScancode.Down, SDLKeymod.Shift)
        Require(
            host.Selected.Length == 2 && host.Selected[0] == "beta" && host.Selected[1] == "gamma",
            "List Shift range did not skip its section header"
        )
        let list = FindSemantics(semantics.Tree!!.Root, "Selection list")!!
        Require(
            list.Relationships.ActiveDescendant == FindSemantics(semantics.Tree!!.Root, "Gamma")!!.Id,
            "List active descendant did not follow focus"
        )
        ListKey(window, SDLScancode.Space, SDLKeymod.Ctrl)
        Require(host.Selected.Length == 1 && host.Selected[0] == "beta", "List Ctrl-Space failed to toggle")
        ListKey(window, SDLScancode.A, SDLKeymod.Gui)
        Require(host.Selected.Length == 4, "List Command-A included disabled rows or skipped selectable rows")
        ListKey(window, SDLScancode.Home)
        ListKey(window, SDLScancode.D)
        Require(host.Active == "delta", "List TypeAhead did not find Delta")
        ListKey(window, SDLScancode.Return)
        Require(host.Invoked == "delta", "List Enter did not invoke")
        host.Invoked = nil
        CompositeClick(window, host.Rows["delta"].Handle!!)
        CompositeClick(window, host.Rows["delta"].Handle!!)
        Require(host.Invoked == "delta", "List double press did not invoke")
        GridModifiedClick(window, host.Rows["alpha"].Handle!!, SDLKeymod.Ctrl)
        Require(host.Selected.Length == 2, "List Ctrl-click did not add a row")
        host.Multiple = false
        host.Rebuild()
        PumpFrames(window, 6)
        ListKey(window, SDLScancode.Down, SDLKeymod.Shift)
        Require(host.Selected.Length == 1, "Single-select list retained multiple rows")
        host.Tree = true
        host.Multiple = true
        host.Selected = []string{"alpha"}
        host.Rebuild()
        PumpFrames(window, 10)
        host.Root!!.Handle!!.Focus()
        PumpFrames(window, 6)
        ListKey(window, SDLScancode.Down)
        ListKey(window, SDLScancode.Down, SDLKeymod.Shift)
        Require(
            host.Selected.Length == 2 && host.Selected[0] == "beta" && host.Selected[1] == "lazy",
            "Tree Shift range failed"
        )
        ListKey(window, SDLScancode.Space, SDLKeymod.Ctrl)
        Require(host.Selected.Length == 1 && host.Selected[0] == "beta", "Tree Ctrl-Space failed")
        ListKey(window, SDLScancode.F2)
        Require(host.Renamed == "lazy", "Tree F2 did not request rename")
        ListKey(window, SDLScancode.Right)
        Require(
            host.Loads == 1 && FindSemantics(semantics.Tree!!.Root, "Loading children") != nil,
            "Lazy branch did not request children or show loading row"
        )
        ListKey(window, SDLScancode.Right)
        Require(host.Loads == 1, "Lazy load repeated while loading")
        host.Children = []TreeNode{TreeNode{Id: "child", Label: "Loaded child"}}
        host.Loading = []string{}
        host.Rebuild()
        PumpFrames(window, 8)
        ListKey(window, SDLScancode.Right)
        let tree = FindSemantics(semantics.Tree!!.Root, "Selection tree")!!
        Require(
            tree.Relationships.ActiveDescendant == FindSemantics(semantics.Tree!!.Root, "Loaded child")!!.Id,
            "Loaded child was not navigable"
        )
        ListKey(window, SDLScancode.A, SDLKeymod.Ctrl)
        Require(host.Selected.Length == 4, "Tree Ctrl-A selection failed")
        host.Selected = []string{"alpha"}
        host.Rebuild()
        PumpFrames(window, 6)
        let source = host.Rows["alpha"].DragSource!!.Create(DragStartEvent{})!!
        let target = host.Rows["beta"].DropTarget!!
        for y in[]float64{1, 16, 31} {
            let e = DragEvent{
                Data: source,
                AllowedEffects: DragEffect.Move,
                Position: Point{X: 4, Y: y},
                Kind: DragEventKind.Drop
            }
            Require(target.Query(e) == DragEffect.Move, "Tree rejected a valid move")
            target.Changed?.Invoke(e)
            Require(
                host.DropPosition == (
                    y == 1 ? TreeDropPosition.Before: y == 16 ? TreeDropPosition.Into: TreeDropPosition.After
                ),
                "Tree drop position was incorrect"
            )
        }
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine("PASS: List/tree native selection, type-ahead, invoke, lazy loading, rename and drop contracts")
    ListRowInteractions()
}

internal class ListRowHost : Cell {
    internal var Clicks int32
    internal var Invokes int32
    internal var Actions int32
    internal let Row ElementHandle = ElementHandle()
    internal let ActionHandle ElementHandle = ElementHandle()
    internal let DisabledRow ElementHandle = ElementHandle()
    internal let After ElementHandle = ElementHandle()

    public override func Build() Blob -> Container{
        Width: Percent(100),
        Height: Percent(100),
        Padding: 24,
        Gap: 20,
        ListRow{
            Title: "Interactive row",
            OnClick: () -> Clicks++,
            OnInvoke: () -> Invokes++,
            CreateRoot: (value ListRow, leading Blob?, content Container, trailing Blob?) ->
            Container{Handle: Row, Height: 60, content},
            Actions: ActionButton{
                Content: "Pin",
                OnClick: () -> Actions++,
                CreateRoot: (value ActionButton, text Text) -> Button{
                    Handle: ActionHandle,
                    OnClick: value.OnClick,
                    Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Row action"},
                    text
                }
            }.Build()
        }.Build(),
        ListRow{
            Title: "Disabled row",
            Disabled: true,
            OnClick: () -> Clicks++,
            CreateRoot: (value ListRow, leading Blob?, content Container, trailing Blob?) ->
            Container{Handle: DisabledRow, Height: 60, content}
        }.Build(),
        Button{Handle: After, OnClick: () -> { }, Text{Content: "After"}}
    }
}

func ListRowInteractions() {
    let host = ListRowHost()
    let root = ApplicationRoot(host)
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "List row verification",
        Width: 500,
        Height: 360,
        Root: root,
        AccessibilityAdapter: semantics
    }
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 12)
        host.After.Focus()
        let outside = host.After.BorderBox
        MouseMove(OnlyNativeWindow(), float32(outside.X + 3), float32(outside.Y + 3))
        PumpFrames(window, 8)
        Require(
            FindSemantics(semantics.Tree!!.Root, "Row action") == nil,
            "Row actions were visible without hover or focus"
        )
        host.Row.Focus()
        PumpFrames(window, 6)
        Require(FindSemantics(semantics.Tree!!.Root, "Row action") != nil, "Focused row did not reveal actions")
        ListKey(window, SDLScancode.Return)
        Require(host.Invokes == 1 && host.Clicks == 0, "Row Enter did not invoke exactly once")
        CompositeClick(window, host.ActionHandle)
        Require(host.Actions == 1 && host.Clicks == 0, "Row action also triggered the row")
        ListKey(window, SDLScancode.Return)
        Require(host.Actions == 2 && host.Invokes == 1, "Action keyboard input bubbled into row invocation")
        host.After.Focus()
        let box = host.After.BorderBox
        MouseMove(OnlyNativeWindow(), float32(box.X + 3), float32(box.Y + 3))
        PumpFrames(window, 8)
        Require(FindSemantics(semantics.Tree!!.Root, "Row action") == nil, "Blurred unhovered row retained its actions")
        let rowBox = host.Row.BorderBox
        MouseMove(OnlyNativeWindow(), float32(rowBox.X + 3), float32(rowBox.Y + 3))
        PumpFrames(window, 8)
        Require(FindSemantics(semantics.Tree!!.Root, "Row action") != nil, "Hovered row did not reveal actions")
        CompositeClick(window, host.DisabledRow)
        Require(host.Clicks == 0, "Disabled row accepted a click")
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine("PASS: ListRow focus/hover actions, invoke, child action routing and disabled input")
}
