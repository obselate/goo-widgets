package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Gallery
import Hexa.NET.SDL3
import System
import System.Collections.Generic

func FeedbackNodes(root AccessibilityNode?, role AccessibilityRole, name string, found List[AccessibilityNode]) {
    guard let root = root else {
        return
    }
    if root.Role == role &&
        (name == "" || root.Name == name || (role == AccessibilityRole.Text && root.Value == name)) {
        found.Add(root)
    }
    for child in root.Children {
        FeedbackNodes(child, role, name, found)
    }
}

func FeedbackNode(adapter SearchListSemantics, role AccessibilityRole, name string, index int32 = 0) AccessibilityNode {
    let nodes = List[AccessibilityNode]()
    FeedbackNodes(adapter.Tree?.Root, role, name, nodes)
    Require(nodes.Count > index, "Gallery node missing: " + role.ToString() + " / " + name)
    return nodes[index]
}

func FeedbackClick(window Window, bounds ElementRect, count int32 = 1) {
    let id = OnlyNativeWindow()
    let x = float32(bounds.X + bounds.Width / 2.0)
    let y = float32(bounds.Y + bounds.Height / 2.0)
    MouseMove(id, x, y)
    for click in 0 ... count {
        MouseButton(id, x, y, true)
        PumpFrames(window, 3)
        MouseButton(id, x, y, false)
    }
    PumpFrames(window, 12)
}

func FeedbackSetValue(window Window, node AccessibilityNode, value string) {
    Require(
        window.PerformAccessibilityAction(node.Id, AccessibilityActionRequest.SetValue(value)),
        "Gallery value edit rejected: " + node.Name
    )
    PumpFrames(window, 16)
}

func FeedbackCombo(window Window, adapter SearchListSemantics) {
    let before = FeedbackNode(adapter, AccessibilityRole.List, "Region").Bounds.Height
    FeedbackSetValue(window, FeedbackNode(adapter, AccessibilityRole.SearchBox, "Search options"), "Region 042")
    let filtered = FeedbackNode(adapter, AccessibilityRole.List, "Region").Bounds.Height
    CaptureIssueProof(window, "gallery-combo-filtered")
    FeedbackSetValue(window, FeedbackNode(adapter, AccessibilityRole.SearchBox, "Search options"), "")
    let restored = FeedbackNode(adapter, AccessibilityRole.List, "Region").Bounds.Height
    CaptureIssueProof(window, "gallery-combo-cleared")
    Console.WriteLine(
        "combo-height before=" + before.ToString() + " filtered=" + filtered.ToString() +
            " cleared=" +
            restored.ToString()
    )
    Require(
        Math.Abs(restored - before) < .1 && filtered < before,
        "Gallery ComboBox did not restore its popup height after clearing search"
    )
    FeedbackSetValue(window, FeedbackNode(adapter, AccessibilityRole.SearchBox, "Search options"), "no such region")
    FeedbackSetValue(window, FeedbackNode(adapter, AccessibilityRole.SearchBox, "Search options"), "")
    Require(
        Math.Abs(FeedbackNode(adapter, AccessibilityRole.List, "Region").Bounds.Height - before) < .1,
        "Clearing an empty search result did not restore popup height"
    )
}

func FeedbackSplit(window Window, adapter SearchListSemantics) {
    for index in 0 ... 2 {
        let divider = FeedbackNode(adapter, AccessibilityRole.Slider, "Resize panes", index)
        let before = divider.ValueNow!!
        let box = divider.Bounds
        let id = OnlyNativeWindow()
        let x = float32(box.X + box.Width / 2.0)
        let y = float32(box.Y + box.Height / 2.0)
        MouseMove(id, x, y)
        MouseButton(id, x, y, true)
        PumpFrames(window, 3)
        MouseMove(id, x + (index == 0 ? 60.0F: 0.0F), y + (index == 1 ? 24.0F: 0.0F))
        PumpFrames(window, 6)
        MouseButton(id, x + (index == 0 ? 60.0F: 0.0F), y + (index == 1 ? 24.0F: 0.0F), false)
        PumpFrames(window, 10)
        let after = FeedbackNode(adapter, AccessibilityRole.Slider, "Resize panes", index).ValueNow!!
        CaptureIssueProof(window, "gallery-split-" + index.ToString())
        Console.WriteLine(
            "split index=" + index.ToString() + " before=" + before.ToString() + " after=" + after.ToString()
        )
        Require(after > before + .05, "Gallery split divider did not move its controlled panes")
    }
}

func FeedbackChrome(window Window, adapter SearchListSemantics) {
    FeedbackClick(window, FeedbackNode(adapter, AccessibilityRole.Text, "Example window").Bounds, 2)
    CaptureIssueProof(window, "gallery-chrome-title-double-click")
    Require(
        FeedbackNode(adapter, AccessibilityRole.Text, "Maximized").Value == "Maximized",
        "Gallery title text did not bubble double-click into WindowChrome"
    )
    FeedbackClick(window, FeedbackNode(adapter, AccessibilityRole.Button, "Embedded control").Bounds, 2)
    Require(
        FeedbackNode(adapter, AccessibilityRole.Text, "Maximized").Value == "Maximized",
        "Embedded chrome control also toggled window state"
    )
}

func FeedbackDisclosure(window Window, adapter SearchListSemantics) {
    let header = FeedbackNode(adapter, AccessibilityRole.Button, "Custom appearance")
    Require(
        window.PerformAccessibilityAction(header.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
        "Custom disclosure could not focus"
    )
    PumpFrames(window, 10)
    CaptureIssueProof(window, "gallery-disclosure-focus")
    FeedbackClick(window, header.Bounds)
    CaptureIssueProof(window, "gallery-disclosure-collapsed")
    FeedbackClick(window, FeedbackNode(adapter, AccessibilityRole.Button, "Custom appearance").Bounds)
    CaptureIssueProof(window, "gallery-disclosure-reopened")
}

func FeedbackMedia(window Window, adapter SearchListSemantics) {
    FeedbackSetValue(window, FeedbackNode(adapter, AccessibilityRole.Slider, "Volume"), "0")
    let label = FeedbackNode(adapter, AccessibilityRole.Text, "Volume").Bounds
    let track = FeedbackNode(adapter, AccessibilityRole.Slider, "Volume").Bounds
    CaptureIssueProof(window, "gallery-media-volume-zero")
    Console.WriteLine(
        "volume label-right=" + (label.X + label.Width).ToString() + " thumb-left=" + (track.X - 10.0).ToString()
    )
    Require(track.X - 10.0 >= label.X + label.Width + 2.0, "Volume thumb overlaps its label at zero")
}

func FeedbackWheel(window Window, bounds ElementRect, direction float32) {
    var event = SDLEvent{
        Wheel: SDLMouseWheelEvent{
            Type: SDLEventType.MouseWheel,
            WindowID: OnlyNativeWindow(),
            Which: 1u,
            MouseX: float32(bounds.X + bounds.Width / 2.0),
            MouseY: float32(bounds.Y + bounds.Height - 30.0),
            Y: direction,
        }
    }
    Require(SDL.PushEvent(ref event), "SDL rejected gallery wheel input")
    PumpFrames(window, 20)
}

func FeedbackGrid(window Window, adapter SearchListSemantics) {
    let sequenceGrid = FeedbackNode(adapter, AccessibilityRole.Grid, "Managed hosts").Bounds
    for name in[]string{"atlas", "borealis", "cirrus", "ember", "fjord", "grove", "harbor"} {
        for step in 0 ... 20 {
            let row = FeedbackNode(adapter, AccessibilityRole.Row, name).Bounds
            if row.Y + 18.0 < sequenceGrid.Y + sequenceGrid.Height - 4.0 {
                break
            }
            FeedbackWheel(window, sequenceGrid, -1.0F)
        }
        for toggle in 0 ... 2 {
            let before = FeedbackNode(adapter, AccessibilityRole.Row, name)
            let wasSelected = before.Selected
            let box = before.Bounds
            FeedbackClick(window, ElementRect{X: box.X + 8.0, Y: box.Y + 8.0, Width: 20, Height: 20})
            let after = FeedbackNode(adapter, AccessibilityRole.Row, name)
            Console.WriteLine(
                "grid-sequence " + name + " before-y=" + box.Y.ToString() + " after-y=" + after.Bounds.Y.ToString()
            )
            if Math.Abs(after.Bounds.Y - box.Y) >= .1 {
                CaptureIssueProof(window, "gallery-grid-sequence-reset-" + name)
            }
            Require(
                after.Selected != wasSelected && Math.Abs(after.Bounds.Y - box.Y) < .1,
                "Sequential checkbox selection changed the scroll position: " + name
            )
        }
    }
    FeedbackWheel(window, sequenceGrid, 20.0F)
    let filter = FeedbackNode(adapter, AccessibilityRole.TextInput, "")
    Require(
        window.PerformAccessibilityAction(filter.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
        "Grid filter focus failed"
    )
    let grid = FeedbackNode(adapter, AccessibilityRole.Grid, "Managed hosts").Bounds
    FeedbackWheel(window, grid, -0.8F)
    let clicked = FeedbackNode(adapter, AccessibilityRole.Row, "fjord").Bounds
    CaptureIssueProof(window, "gallery-grid-scrolled-before-check")
    FeedbackClick(window, ElementRect{X: clicked.X + 8.0, Y: clicked.Y + 8.0, Width: 20, Height: 20})
    let clickedAfter = FeedbackNode(adapter, AccessibilityRole.Row, "fjord")
    CaptureIssueProof(window, "gallery-grid-scrolled-after-check")
    Console.WriteLine(
        "grid-scrolled fjord selected=" + clickedAfter.Selected.ToString() + " before-y=" + clicked.Y.ToString() +
            " after-y=" +
            clickedAfter
            .Bounds
            .Y
            .ToString()
    )
    Require(
        clickedAfter.Selected == true && Math.Abs(clickedAfter.Bounds.Y - clicked.Y) < .1,
        "Focusing a scrolled grid moved the checkbox under the pointer or selected a different row"
    )
    let partial = FeedbackNode(adapter, AccessibilityRole.Row, "grove").Bounds
    Require(
        partial.Y < grid.Y + grid.Height && partial.Y + partial.Height > grid.Y + grid.Height,
        "Expected a partially visible row for the edge-click regression"
    )
    FeedbackClick(window, ElementRect{X: partial.X + 8.0, Y: partial.Y + 10.0, Width: 20, Height: 4})
    let partialAfter = FeedbackNode(adapter, AccessibilityRole.Row, "grove")
    Require(
        partialAfter.Selected == true && Math.Abs(partialAfter.Bounds.Y - partial.Y) < .1,
        "Clicking a partially visible checkbox scrolled the row before activation"
    )
    CaptureIssueProof(window, "gallery-grid-partial-check")
    FeedbackWheel(window, grid, 20.0F)
    CaptureIssueProof(window, "gallery-grid-initial")
    for name in[]string{"borealis", "cirrus", "ember"} {
        let row = FeedbackNode(adapter, AccessibilityRole.Row, name)
        let box = row.Bounds
        FeedbackClick(window, ElementRect{X: box.X + 8.0, Y: box.Y + 8.0, Width: 20.0, Height: 20.0})
        let current = FeedbackNode(adapter, AccessibilityRole.Row, name)
        Console.WriteLine(
            "grid-check " + name + " selected=" + current.Selected.ToString() + " before-y=" + box.Y.ToString() +
                " after-y=" +
                current
                .Bounds
                .Y
                .ToString()
        )
        Require(current.Selected == true, "Gallery checkbox selected a different row: " + name)
        CaptureIssueProof(window, "gallery-grid-check-" + name)
    }
    FeedbackClick(window, FeedbackNode(adapter, AccessibilityRole.ColumnHeader, "Host").Bounds)
    CaptureIssueProof(window, "gallery-grid-sorted")
    for name in[]string{"atlas", "borealis", "cirrus", "ember", "fjord", "grove"} {
        Require(
            FeedbackNode(adapter, AccessibilityRole.Row, name).Selected == true,
            "Sorting transferred selected identity: " + name
        )
    }
    FeedbackSetValue(window, filter, "borealis")
    Require(
        FeedbackNode(adapter, AccessibilityRole.Row, "borealis").Selected == true,
        "Filtering lost selected identity"
    )
    FeedbackSetValue(window, FeedbackNode(adapter, AccessibilityRole.TextInput, ""), "")
    let ember = FeedbackNode(adapter, AccessibilityRole.Row, "ember")
    Require(
        window.PerformAccessibilityAction(ember.Id, AccessibilityActionRequest(AccessibilityAction.Expand)),
        "Grid detail expansion failed"
    )
    PumpFrames(window, 16)
    CaptureIssueProof(window, "gallery-grid-filter-clear-expanded")
    for name in[]string{"atlas", "borealis", "cirrus", "ember", "fjord", "grove"} {
        Require(
            FeedbackNode(adapter, AccessibilityRole.Row, name).Selected == true,
            "Filtering or detail expansion transferred selected identity: " + name
        )
    }
}

func FeedbackTree(window Window, adapter SearchListSemantics) {
    for name in[]string{"Documents", "All hosts"} {
        let row = FeedbackNode(adapter, AccessibilityRole.TreeItem, name)
        let checked = row.Checked
        FeedbackClick(window, ElementRect{X: row.Bounds.X + 100.0, Y: row.Bounds.Y + 8.0, Width: 80, Height: 18})
        let collapsed = FeedbackNode(adapter, AccessibilityRole.TreeItem, name)
        Require(
            collapsed.Expanded == false && collapsed.Checked == checked,
            "Whole-row activation did not collapse without changing checks: " + name
        )
        SendKey(OnlyNativeWindow(), SDLScancode.Return)
        PumpFrames(window, 12)
        Require(
            FeedbackNode(adapter, AccessibilityRole.TreeItem, name).Expanded == true,
            "Enter did not expand tree branch"
        )
        Require(
            window.PerformAccessibilityAction(collapsed.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Tree activation failed"
        )
        PumpFrames(window, 12)
        Require(
            FeedbackNode(adapter, AccessibilityRole.TreeItem, name).Expanded == false,
            "Accessible activation did not collapse tree branch"
        )
    }
    let hosts = FeedbackNode(adapter, AccessibilityRole.TreeItem, "All hosts")
    Require(
        window.PerformAccessibilityAction(hosts.Id, AccessibilityActionRequest(AccessibilityAction.Expand)),
        "Tree expand failed"
    )
    PumpFrames(window, 12)
    let box = FeedbackNode(adapter, AccessibilityRole.TreeItem, "All hosts").Bounds
    FeedbackClick(window, ElementRect{X: box.X + 34.0, Y: box.Y + 8.0, Width: 14, Height: 18})
    let checked = FeedbackNode(adapter, AccessibilityRole.TreeItem, "All hosts")
    Require(
        checked.Expanded == true && checked.Checked == AccessibilityChecked.True,
        "Checkbox click also collapsed the branch or failed the host check policy"
    )
    SendKey(OnlyNativeWindow(), SDLScancode.Space)
    PumpFrames(window, 12)
    Require(
        checked.Expanded == true && checked.Checked == AccessibilityChecked.False,
        "Space changed expansion instead of the host check policy"
    )
    CaptureIssueProof(window, "gallery-tree-whole-row")
}

func FeedbackMenu(window Window, adapter SearchListSemantics) {
    SendKey(OnlyNativeWindow(), SDLScancode.Escape)
    PumpFrames(window, 10)
    FeedbackClick(window, FeedbackNode(adapter, AccessibilityRole.Button, "Root: down").Bounds)
    FeedbackClick(window, FeedbackNode(adapter, AccessibilityRole.Button, "Submenus: right").Bounds)
    let trigger = FeedbackNode(adapter, AccessibilityRole.Button, "Open actions").Bounds
    FeedbackClick(window, trigger)
    let last = FeedbackNode(adapter, AccessibilityRole.MenuItem, "Sync unavailable").Bounds
    CaptureIssueProof(window, "gallery-menu-up")
    Require(last.Y + last.Height <= trigger.Y + 1.0, "Menu did not prefer opening above its trigger")
    let tools = FeedbackNode(adapter, AccessibilityRole.MenuItem, "Tools")
    Require(
        window.PerformAccessibilityAction(tools.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
        "Menu branch focus failed"
    )
    SendKey(OnlyNativeWindow(), SDLScancode.Left)
    PumpFrames(window, 14)
    let submenu = FeedbackNode(adapter, AccessibilityRole.MenuItem, "Copy address").Bounds
    Require(submenu.X + submenu.Width <= tools.Bounds.X + 1.0, "Submenu did not open to the left")
    CaptureIssueProof(window, "gallery-menu-up-left")
    SendKey(OnlyNativeWindow(), SDLScancode.Right)
    PumpFrames(window, 12)
    let submenus = List[AccessibilityNode]()
    FeedbackNodes(adapter.Tree?.Root, AccessibilityRole.Menu, "Tools", submenus)
    Require(submenus.Count == 0, "Right did not close a left-opening submenu")
}

func GalleryFeedbackInteractions() {
    let failures = List[string]()
    var visited = false
    for page in[]string{
        "Combo box",
        "Split pane",
        "Window chrome",
        "Disclosure",
        "Media transport",
        "Data grid",
        "Tree view",
        "Menu"
    } {
        if page != Environment.GetEnvironmentVariable("GOO_WIDGETS_GALLERY_FEEDBACK_PAGE") {
            continue
        }
        visited = true
        let registry = CreateRegistry()
        let adapter = SearchListSemantics()
        let window = Window{
            Title: "Gallery feedback · " + page,
            Width: 1100,
            Height: 800,
            Root: Gallery(registry, registry.IndexOf(page)),
            AccessibilityAdapter: adapter
        }
        window.Open()
        try {
            PumpFrames(window, 24)
            if page == "Combo box" {
                FeedbackCombo(window, adapter)
            } else if page == "Split pane" {
                FeedbackSplit(window, adapter)
            } else if page == "Window chrome" {
                FeedbackChrome(window, adapter)
            } else if page == "Disclosure" {
                FeedbackDisclosure(window, adapter)
            } else if page == "Media transport" {
                FeedbackMedia(window, adapter)
            } else if page == "Data grid" {
                FeedbackGrid(window, adapter)
            } else if page == "Tree view" {
                FeedbackTree(window, adapter)
            } else if page == "Menu" {
                FeedbackMenu(window, adapter)
            }
            Console.WriteLine("PASS gallery feedback: " + page)
        } catch (error Exception) {
            failures.Add(page + ": " + error.Message)
            Console.WriteLine("FAIL gallery feedback: " + page + ": " + error.ToString())
        } finally {
            window.RequestClose()
            PumpFrames(window, 6)
        }
    }
    Require(visited, "Set GOO_WIDGETS_GALLERY_FEEDBACK_PAGE to a supported page")
    Require(failures.Count == 0, String.Join("; ", failures))
}
