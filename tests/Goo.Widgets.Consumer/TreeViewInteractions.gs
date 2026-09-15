package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class TreeViewProbe : TreeView {
    internal func Render(input TreeViewInput) Blob -> base.Build(input)
}

func TreeViewContracts() {
    let probe = TreeViewProbe()
    var rejected bool
    try {
        probe.Render(TreeViewInput{Nodes: []TreeNode{TreeNode{Id: "same", Children: []TreeNode{TreeNode{Id: "same"}}}}})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Collapsed tree descendants escaped identity validation")
    let cycle = [1]TreeNode
    cycle[0] = TreeNode{Id: "cycle", Children: cycle}
    rejected = false
    try {
        probe.Render(TreeViewInput{Nodes: cycle})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "A cyclic tree reached flattening indefinitely")
    let root = (
        probe.Render(
            TreeViewInput{
                Virtualize: false,
                MultiSelectable: true,
                Nodes: []TreeNode{
                    TreeNode{
                        Id: "parent",
                        CheckState: AccessibilityChecked.Mixed,
                        Children: []TreeNode{TreeNode{Id: "child"}}
                    }
                },
            }
        ) as Container
    )!!
    Require(
        root.Focusable && root.Accessibility!!.MultiSelectable == true,
        "Tree lost stable-root focus or multiselect semantics"
    )
}

internal class TreeHost : Cell {
    internal var Expanded[]string = []string{"group"}
    internal var Selected string = "alpha"
    internal var GroupCheck AccessibilityChecked = AccessibilityChecked.Mixed
    internal var AlphaCheck AccessibilityChecked = AccessibilityChecked.True
    internal var BetaCheck AccessibilityChecked = AccessibilityChecked.False
    internal var CheckCalls int32
    internal var Large bool
    internal var Virtualize bool = true
    internal var Passive bool
    internal var Root Container?
    internal let Rows Dictionary[string, Container] = Dictionary[string, Container]()
    internal let Expanders Dictionary[string, Button] = Dictionary[string, Button]()
    internal let Checks Dictionary[string, Button] = Dictionary[string, Button]()
    internal let After ElementHandle = ElementHandle()

    private func Row(input TreeViewInput, row TreeViewRow, prepared Container) Container {
        Rows[row.Node.Id!!] = prepared
        return prepared
    }

    private func Expander(input TreeViewInput, row TreeViewRow, prepared Button) Button {
        prepared.Handle = ElementHandle()
        Expanders[row.Node.Id!!] = prepared
        return prepared
    }

    private func Check(input TreeViewInput, row TreeViewRow, prepared Button) Button {
        prepared.Handle = ElementHandle()
        Checks[row.Node.Id!!] = prepared
        return prepared
    }

    private func CaptureRoot(input TreeViewInput, prepared Container) Container {
        Root = prepared
        return prepared
    }

    private func Expand(id string, state bool) {
        let values = List[string]()
        for current in Expanded {
            if current != id {
                values.Add(current)
            }
        }
        if state {
            values.Add(id)
        }
        Expanded = values.ToArray()
        Rebuild()
    }

    private func ChangeCheck(id string, state AccessibilityChecked) {
        CheckCalls++
        if id == "group" {
            GroupCheck = state
        }
        if id == "alpha" {
            AlphaCheck = state
        }
        if id == "beta" {
            BetaCheck = state
        }
        Rebuild()
    }

    private func Select(id string) {
        Selected = id
        Rebuild()
    }

    private func Nodes()[]TreeNode {
        if Large {
            let children = [1500]TreeNode
            for index in 0 ... children.Length {
                children[index] = TreeNode{Id: "item-" + index.ToString(), Label: "Item " + index.ToString()}
            }
            return []TreeNode{TreeNode{Id: "mass", Label: "Large collection", Children: children}}
        }
        return []TreeNode{
            TreeNode{
                Id: "group",
                Label: "Workspace",
                CheckState: GroupCheck,
                Children: []TreeNode{
                    TreeNode{Id: "alpha", Label: "Notes", CheckState: AlphaCheck},
                    TreeNode{
                        Id: "locked",
                        Label: "Locked archive",
                        Disabled: true,
                        CheckState: AccessibilityChecked.False
                    },
                    TreeNode{
                        Id: "folder",
                        Label: "Projects",
                        Children: []TreeNode{TreeNode{Id: "beta", Label: "Release plan", CheckState: BetaCheck}}
                    },
                }
            },
            TreeNode{Id: "other", Label: "Shared with me"},
        }
    }

    public override func Build() Blob {
        var configuration = TreeViewInput{
            Nodes: Nodes(),
            ExpandedIds: Expanded,
            SelectedId: Selected,
            Virtualize: Virtualize,
            Height: 245,
            MultiSelectable: true,
            AccessibilityName: "Files",
            OnExpandedChange: Expand,
            OnCheckChange: ChangeCheck,
            CreateRow: Row,
            CreateCheck: Check,
            CreateExpander: Expander,
            CreateRoot: CaptureRoot
        }
        if !Passive {
            configuration.OnSelect = Select
        }
        return Container{
            Width: Length.Percent(100),
            Height: Length.Percent(100),
            Padding: 24,
            Gap: 18,
            BackgroundColor: "#111318",
            Text{Key: "title", Content: "TreeView · controlled hierarchy", FontSize: 24, Color: "#fafafa"},
            Text{
                Key: "hint",
                Content: "Arrow keys navigate. Space changes a check; Enter selects a row.",
                Color: "#a1a1aa"
            },
            Cell.Mount[TreeViewInput, TreeView]("tree", configuration),
            Button{
                Key: "after",
                Handle: After,
                Focusable: true,
                Padding: 10,
                BackgroundColor: "#2d3550",
                Color: "#e0e7ff",
                Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "After tree"},
                Text{Content: "Next control"}
            }
        }
    }
}

func TreeActive(adapter SearchListSemantics, name string) bool {
    let tree = FindSemantics(adapter.Tree!!.Root, "Files")!!
    let row = FindSemantics(adapter.Tree!!.Root, name)
    return row != nil && tree.Focused && tree.Relationships.ActiveDescendant == row.Id
}

func TreeViewInteractions() {
    TreeViewContracts()
    let host = TreeHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "TreeView verification",
        Width: 620,
        Height: 480,
        Root: host,
        AccessibilityAdapter: semantics
    }
    window.Open()
    try {
        PumpFrames(window, 20)
        let id = OnlyNativeWindow()
        host.Root!!.Handle!!.Focus()
        PumpFrames(window, 8)
        Require(TreeActive(semantics, "Notes"), "Tree failed initial selected active-descendant focus")
        SendKey(id, SDLScancode.Down)
        PumpFrames(window, 8)
        Require(TreeActive(semantics, "Projects"), "Tree Down did not skip a disabled row")
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 8)
        Require(
            FindSemantics(semantics.Tree!!.Root, "Projects")!!.Expanded == true,
            "Tree Right did not request expansion"
        )
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 8)
        Require(TreeActive(semantics, "Release plan"), "Tree Right did not enter the first child")
        SendKey(id, SDLScancode.Space)
        PumpFrames(window, 8)
        Require(
            host.BetaCheck == AccessibilityChecked.True &&
                host.GroupCheck == AccessibilityChecked.Mixed &&
                host.CheckCalls == 1,
            "Tree imposed a cascade policy or failed a check callback"
        )
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(
            host.Selected == "beta" && FindSemantics(semantics.Tree!!.Root, "Release plan")!!.Selected == true,
            "Tree Enter did not apply controlled selection"
        )
        CaptureIssueProof(window, "tree-expanded")
        host.Expanded = []string{}
        host.Rebuild()
        PumpFrames(window, 8)
        Require(
            TreeActive(semantics, "Workspace") && FindSemantics(semantics.Tree!!.Root, "Release plan") == nil,
            "Collapsing an active descendant did not move logical focus to its visible ancestor"
        )
        SendKey(id, SDLScancode.Space)
        PumpFrames(window, 8)
        Require(
            host.GroupCheck == AccessibilityChecked.True &&
                host.AlphaCheck == AccessibilityChecked.True &&
                host.BetaCheck == AccessibilityChecked.True,
            "Mixed parent check did not request True"
        )
        CompositeClick(window, host.Expanders["group"].Handle!!)
        Require(
            FindSemantics(semantics.Tree!!.Root, "Workspace")!!.Expanded == true,
            "Tree expander native pointer input failed"
        )
        CompositeClick(window, host.Checks["alpha"].Handle!!)
        Require(
            host.AlphaCheck == AccessibilityChecked.False && host.GroupCheck == AccessibilityChecked.True,
            "Checkbox pointer input imposed a cascade"
        )
        let disabled = FindSemantics(semantics.Tree!!.Root, "Locked archive")!!
        Require(
            disabled.Disabled && !window.PerformAccessibilityAction(
                disabled.Id,
                AccessibilityActionRequest(AccessibilityAction.Select)
            ),
            "Disabled tree item accepted accessible selection"
        )
        let folder = FindSemantics(semantics.Tree!!.Root, "Projects")!!
        Require(
            window.PerformAccessibilityAction(folder.Id, AccessibilityActionRequest(AccessibilityAction.Expand)),
            "Tree did not advertise accessible expansion"
        )
        PumpFrames(window, 8)
        let beta = FindSemantics(semantics.Tree!!.Root, "Release plan")!!
        Require(
            window.PerformAccessibilityAction(beta.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
            "Tree did not support accessible active-descendant focus"
        )
        PumpFrames(window, 8)
        Require(TreeActive(semantics, "Release plan"), "Accessible Focus failed to update the active descendant")
        SendKey(id, SDLScancode.Left)
        PumpFrames(window, 6)
        Require(TreeActive(semantics, "Projects"), "Tree Left did not reach the parent")
        SendKey(id, SDLScancode.Left)
        PumpFrames(window, 6)
        Require(
            FindSemantics(semantics.Tree!!.Root, "Projects")!!.Expanded == false,
            "Tree Left did not collapse the parent"
        )
        host.Virtualize = false
        host.Rebuild()
        PumpFrames(window, 8)
        CaptureIssueProof(window, "tree-nonvirtual")
        host.Large = true
        host.Virtualize = true
        host.Expanded = []string{"mass"}
        host.Rebuild()
        PumpFrames(window, 12)
        SendKey(id, SDLScancode.End)
        PumpFrames(window, 18)
        Require(TreeActive(semantics, "Item 1499"), "Tree End failed to reveal a virtual descendant")
        var mounted int32
        for row in host.Rows.Values {
            if row.Handle!!.IsMounted {
                mounted++
            }
        }
        Require(mounted < 30, "Tree mounted all 1500 children instead of virtualizing")
        CaptureIssueProof(window, "tree-virtual-end")
        SendKey(id, SDLScancode.Tab)
        PumpFrames(window, 6)
        Require(
            FindSemantics(semantics.Tree!!.Root, "After tree")!!.Focused,
            "Tab failed to leave the tree as one focus stop"
        )
        var tab = SDLEvent{
            Key: SDLKeyboardEvent{
                Type: SDLEventType.KeyDown,
                WindowID: id,
                Scancode: SDLScancode.Tab,
                Mod: uint16(SDLKeymod.Shift),
                Down: uint8(1)
            }
        }
        SDL.PushEvent(ref tab)
        var tabUp = SDLEvent{Key: SDLKeyboardEvent{Type: SDLEventType.KeyUp, WindowID: id, Scancode: SDLScancode.Tab}}
        SDL.PushEvent(ref tabUp)
        PumpFrames(window, 8)
        Require(TreeActive(semantics, "Item 1499"), "Shift-Tab did not restore logical tree focus")
        SendKey(id, SDLScancode.Home)
        PumpFrames(window, 15)
        Require(TreeActive(semantics, "Large collection"), "Tree Home failed across virtual pages")
        host.Virtualize = false
        host.Rebuild()
        PumpFrames(window, 25)
        mounted = 0
        for row in host.Rows.Values {
            if row.Handle!!.IsMounted {
                mounted++
            }
        }
        Require(
            mounted == 1501 && TreeActive(semantics, "Large collection"),
            "Disabling virtualization did not realize all rows or retained focus"
        )
        host.Passive = true
        host.Rebuild()
        PumpFrames(window, 12)
        let first = FindSemantics(semantics.Tree!!.Root, "Item 0")!!
        Require(
            window.PerformAccessibilityAction(first.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Passive tree activation failed to focus its row"
        )
        PumpFrames(window, 8)
        Require(
            TreeActive(semantics, "Item 0") && host.Selected == "beta",
            "Passive tree activation changed selection or lost logical focus"
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine(
        "PASS: Tree controlled expansion/checks/selection, disabled state, active-descendant keyboard/AX focus, collapse recovery, one Tab stop and 1500-node virtualization"
    )
}
