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
    internal var Query string?
    internal var Sections[]ListViewSection = []ListViewSection{
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
    }

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
                    OnLoadChildren: (id string) -> {
                        Loads++
                        Loading = []string{id}
                        Rebuild()
                    },
                    OnRename: (id string) -> Renamed = id,
                    OnDrop: (ids[]string, target string, position TreeDropPosition) -> DropPosition = position,
                    ConfigureRoot: (input TreeViewInput, root Container) -> {
                        Root = root
                        },
                    ConfigureRow: (input TreeViewInput, row TreeViewRow, root Container) -> {
                        Rows[row.Node.Id!!] = root
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
                    OnClick: (id string) -> Invoked = id,
                    Sections: Sections,
                    Query: Query,
                    ConfigureRoot: (input ListViewInput, root Container) -> {
                        Root = root
                        },
                    ConfigureRow: (input ListViewInput, item ListViewItem, root Container) -> {
                        Rows[item.Id!!] = root
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

func ListHeldClick(window Window, handle ElementHandle) {
    let box = handle.BorderBox
    let id = OnlyNativeWindow()
    let x = float32(box.X + box.Width / 2)
    let y = float32(box.Y + box.Height / 2)
    MouseMove(id, x, y)
    MouseButton(id, x, y, true)
    PumpFrames(window, 4)
    MouseButton(id, x, y, false)
    PumpFrames(window, 8)
}

func ListViewInteractions() {
    let host = ListTreeHost()
    let root = ApplicationRoot(host)
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "List selection verification",
        Size: LayoutSize(620, 440),
        Root: root,
        AccessibilityAdapter: semantics
    }
    RunNativeWindow(window, () -> {
        window.Open()
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
        let gamma = FindSemantics(semantics.Tree!!.Root, "Gamma")!!
        Require(gamma.PositionInSet == 3 && gamma.SizeOfSet == 5,
            "ListView included section headers in item positions or set size")
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
        GridModifierKey(SDLScancode.Lctrl, SDLKeymod.Ctrl, true)
        ListHeldClick(window, host.Rows["alpha"].Handle!!)
        GridModifierKey(SDLScancode.Lctrl, SDLKeymod.None, false)
        Require(host.Selected.Length == 2, "List Ctrl-click did not add a row")
        host.Multiple = false
        host.Rebuild()
        PumpFrames(window, 6)
        ListKey(window, SDLScancode.Down, SDLKeymod.Shift)
        Require(host.Selected.Length == 1, "Single-select list retained multiple rows")
        host.Query = "Delta"
        host.Rebuild()
        PumpFrames(window, 6)
        Require(
            FindSemantics(semantics.Tree!!.Root, "Delta") != nil &&
                FindSemantics(semantics.Tree!!.Root, "Alpha") == nil,
            "List query did not refresh cached sections"
        )
        host.Query = nil
        host.Sections = []ListViewSection{
            ListViewSection{Id: "replacement", Items: []ListViewItem{ListViewItem{Id: "new", Label: "New row"}}}
        }
        host.Rebuild()
        PumpFrames(window, 6)
        ListKey(window, SDLScancode.Home)
        Require(
            host.Active == "new" && FindSemantics(semantics.Tree!!.Root, "Delta") == nil,
            "List replacement sections retained cached rows or indices"
        )
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
    })
    Console.WriteLine("PASS: List/tree native selection, type-ahead, invoke, lazy loading, rename and drop contracts")
    ListRowInteractions()
    ListFillInteractions()
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
            ConfigureRoot: (value ListRow, leading Blob?, content Container, trailing Blob?, prepared Container) -> {
                    prepared.Handle = Row
                    prepared.Height = 60
                    prepared.Children.Clear()
                    prepared.Children.Add(content)
                },
            Actions: ActionButton{
                Content: "Pin",
                AccessibilityName: "Row action",
                OnClick: () -> Actions++,
                ConfigureRoot: (value ActionButton, text Text, prepared Button) -> {
                    prepared.Handle = ActionHandle
                    prepared.OnClick = value.OnClick
                    prepared.Children.Clear()
                    prepared.Children.Add(text)
                }}.Build()
        }.Build(),
        ListRow{
            Title: "Disabled row",
            Disabled: true,
            OnClick: () -> Clicks++,
            ConfigureRoot: (value ListRow, leading Blob?, content Container, trailing Blob?, prepared Container) -> {
                    prepared.Handle = DisabledRow
                    prepared.Height = 60
                    prepared.Children.Clear()
                    prepared.Children.Add(content)
                }}.Build(),
        Button{Handle: After, OnClick: () -> { }, Text{Content: "After"}}
    }
}

func ListRowInteractions() {
    let host = ListRowHost()
    let root = ApplicationRoot(host)
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "List row verification",
        Size: LayoutSize(500, 360),
        Root: root,
        AccessibilityAdapter: semantics
    }
    RunNativeWindow(window, () -> {
        window.Open()
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
        ListHeldClick(window, host.ActionHandle)
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
    })
    Console.WriteLine("PASS: ListRow focus/hover actions, invoke, child action routing and disabled input")
}

internal class ListFillHost : Cell {
    internal let Panel ElementHandle = ElementHandle()
    internal let Header ElementHandle = ElementHandle()
    internal let Rows Dictionary[string, Container] = Dictionary[string, Container]()
    internal var Root Container?
    internal var PanelHeight Length = 600
    private let items[]ListViewItem = ListFillItems()

    public override func Build() Blob -> Container{
        Width: Percent(100),
        Height: Percent(100),
        Padding: 24,
        Container{
            Handle: Panel,
            Height: PanelHeight,
            Container{Handle: Header, Padding: 12, Text{Content: "Inbox, 10,000 messages"}},
            Cell.Mount[ListViewInput, ListView](
                "list",
                ListViewInput{
                    Items: items,
                    AccessibilityName: "Messages",
                    ConfigureRoot: (input ListViewInput, root Container) -> {
                        Root = root
                        },
                    ConfigureRow: (input ListViewInput, item ListViewItem, row Container) -> {
                        Rows[item.Id!!] = row
                        }}
            )
        }
    }
}

func ListFillItems()[]ListViewItem {
    let items = List[ListViewItem]()
    for index in 0 ... 10000 {
        items.Add(ListViewItem{Id: index.ToString(), Label: "Message " + index.ToString()})
    }
    return items.ToArray()
}

func ListFillInteractions() {
    let host = ListFillHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "List fill verification",
        Size: LayoutSize(480, 680),
        Root: ApplicationRoot(host),
        AccessibilityAdapter: semantics
    }
    RunNativeWindow(window, () -> {
        window.Open()
        PumpFrames(window, 15)
        CaptureIssueProof(window, "listview-fill")
        let panel = host.Panel.BorderBox
        let header = host.Header.BorderBox
        let list = host.Root!!.Handle!!.BorderBox
        Require(
            Math.Abs(list.Height - (panel.Height - header.Height)) < 1.0 && header.Height > 24.0,
            "ListView without Height did not fill the panel below its header"
        )
        var mounted int32
        for row in host.Rows.Values {
            if row.Handle!!.IsMounted {
                mounted++
            }
        }
        Require(mounted > 0 && mounted < 40, "ListView realized " + mounted.ToString() + " of 10,000 rows")
        let scroll(() -> AccessibilityScrollInfo) = () -> FindSemantics(semantics.Tree?.Root, "Messages")!!.Children[0].ScrollInfo!!
        CompositeClick(window, host.Rows["1"].Handle!!)
        Require(scroll().TargetY == 0.0, "A pointer click on a visible row scrolled the list")
        let height = host.Rows["1"].Handle!!.BorderBox.Height
        var last = 1
        while float64(last + 2) * height <= scroll().ViewportHeight {
            ListKey(window, SDLScancode.Down)
            last++
        }
        Require(scroll().TargetY == 0.0, "Keyboard focus on a visible row scrolled the list")
        ListKey(window, SDLScancode.Down)
        let expected = float64(float32(float64(last + 2) * height) - float32(scroll().ViewportHeight))
        Require(
            scroll().TargetY == expected,
            "Down past the last visible row set scroll target " + scroll().TargetY.ToString() + ", expected " + expected.ToString()
        )
        ListKey(window, SDLScancode.End)
        CaptureIssueProof(window, "listview-fill-end")
        Require(
            host.Rows.ContainsKey("9999") && host.Rows["9999"].Handle!!.IsMounted && !host.Rows["0"].Handle!!.IsMounted,
            "ListView did not scroll inside its panel"
        )
        host.PanelHeight = 200
        host.Rebuild()
        PumpFrames(window, 6)
        let small = host.Root!!.Handle!!.BorderBox.Height
        Require(Math.Abs(small - (200.0 - header.Height)) < 1.0, "ListView without Height did not shrink in a 200 px panel")
        host.PanelHeight = Length.Auto
        host.Rebuild()
        PumpFrames(window, 6)
        CaptureIssueProof(window, "listview-fill-unbounded")
        let unbounded = host.Root!!.Handle!!.BorderBox.Height
        Require(Math.Abs(unbounded - 280.0) < 1.0, "ListView without Height lost its 280 px default in an unbounded parent")
        Console.WriteLine(
            "PASS: ListView without Height fills its panel and scrolls: height " + list.Height.ToString() +
                " of panel " + panel.Height.ToString() + ", " + mounted.ToString() + " of 10,000 rows realized, " +
                small.ToString() + " in a 200 px panel, " + unbounded.ToString() + " in an unbounded parent"
        )
    })
}
