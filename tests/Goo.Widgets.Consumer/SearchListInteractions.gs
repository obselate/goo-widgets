package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Data
import Goo.Widgets.Inputs
import System.Collections.Generic

internal class SearchListSemantics : AccessibilityAdapter {
    internal var Tree AccessibilityTree?
    public func Update(tree AccessibilityTree) {
        Tree = tree
    }
}

internal class SearchListHost : Cell {
    internal var Selected string = "alpha"
    internal var Selection Color = Color.Parse("#3f3f46")
    internal var Foreground Color = Color.Parse("#fafafa")
    internal var Height float64 = 40.0
    internal var Alternate bool
    internal var Custom bool
    internal var Calls int32
    internal var Activations int32
    internal var AlternateActivations int32
    internal let Rows Dictionary[string, Button] = Dictionary[string, Button]()
    internal let Handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    private let items[]SelectionItem = []SelectionItem{
        SelectionItem{Id: "alpha", Label: "Alpha", Detail: "Project"},
        SelectionItem{Id: "beta", Label: "Beta", Detail: "Document"},
        SelectionItem{Id: "gamma", Label: "Gamma", Detail: "Locked", Disabled: true},
    }

    private let selectionCallback Action[string]
    private let selectAlternate Action[string]
    private let row Func[SelectionItem, Button, Blob]
    private let customRow Func[SelectionItem, Button, Blob]

    internal init() {
        selectionCallback = Select
        selectAlternate = SelectAlternate
        row = Row
        customRow = CustomRow
    }

    private func Select(id string) {
        Selected = id
        Activations++
        Rebuild()
    }

    private func SelectAlternate(id string) {
        Selected = id
        AlternateActivations++
        Rebuild()
    }

    private func Row(item SelectionItem, row Button) Blob {
        let id = item.Id!!
        if !Handles.ContainsKey(id) {
            Handles.Add(id, ElementHandle{})
        }
        row.Handle = Handles[id]
        Rows[id] = row
        Calls++
        return row
    }

    private func CustomRow(item SelectionItem, row Button) Blob {
        row.Children.Add(Text{Content: "Custom"})
        return Row(item, row)
    }

    public override func Build() Blob -> Container{
        Padding: 24,
        Gap: 16,
        BackgroundColor: "#09090b",
        Color: "#fafafa",
        Text{Content: "SearchList · controlled selection", FontSize: 22},
        SearchList{
            Items: items,
            SelectedId: Selected,
            Width: 400,
            Height: 240,
            RowHeight: Height,
            SelectedColor: Selection,
            TextColor: Foreground,
            OnSelect: if Alternate {
                selectAlternate
            } else {
                selectionCallback
            },
            CustomizeRow: if Custom {
                customRow
            } else {
                row
            },
        }.Build(),
        Text{Content: "Selected: " + Selected},
    }
}

func FindSemantics(node AccessibilityNode?, name string) AccessibilityNode? {
    guard let node = node else {
        return nil
    }
    if node.Name == name {
        return node
    }
    for child in node.Children {
        if let found = FindSemantics(child, name) {
            return found
        }
    }
    return nil
}

func SearchListInteractions() {
    let host = SearchListHost{}
    let semantics = SearchListSemantics{}
    let window = Window{Title: "SearchList retained selection", Width: 520, Height: 390, Root: host}
    window.AccessibilityAdapter = semantics
    window.Open()
    try {
        PumpFrames(window, 12)
        let alpha = FindSemantics(semantics.Tree?.Root, "Alpha")!!
        let beta = FindSemantics(semantics.Tree?.Root, "Beta")!!
        Require(alpha.Selected == true && beta.Selected == false, "Initial list selection is incorrect.")
        let calls = host.Calls
        host.Rebuild()
        PumpFrames(window, 4)
        Require(host.Calls == calls, "Unchanged rows were unnecessarily rebuilt.")
        CaptureIssueProof(window, "SearchList-before")
        Require(
            window.PerformAccessibilityAction(beta.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Beta accessibility activation was rejected."
        )
        PumpFrames(window, 4)
        Require(host.Selected == "beta" && host.Activations == 1, "Selection callback did not update the host.")
        Require(
            FindSemantics(semantics.Tree?.Root, "Alpha")!!.Selected == false
            && FindSemantics(semantics.Tree?.Root, "Beta")!!.Selected == true,
            "Controlled selection remained stale after OnSelect and Rebuild."
        )
        Require(host.Calls == calls + 2, "Selection should rebuild only the old and new selected rows.")
        Require(
            FindSemantics(semantics.Tree?.Root, "Alpha")!!.Id == alpha.Id
            && FindSemantics(semantics.Tree?.Root, "Beta")!!.Id == beta.Id,
            "Selection replaced retained row identity."
        )
        CaptureIssueProof(window, "SearchList-after")
        host.Selection = Color.Parse("#14532d")
        host.Rebuild()
        PumpFrames(window, 4)
        Require(host.Calls == calls + 5, "Retained rows ignored the new selected color.")
        host.Foreground = Color.Parse("#fef08a")
        host.Rebuild()
        PumpFrames(window, 4)
        Require(host.Calls == calls + 8, "Retained rows ignored the new text color.")
        host.Height = 52
        host.Alternate = true
        host.Custom = true
        host.Rebuild()
        PumpFrames(window, 4)
        Require(host.Rows["beta"].Children.Count == 3, "Retained rows ignored changed colors or row customization.")
        Require(
            Math.Abs(host.Handles["beta"].BorderBox.Height - 52.0) < 1.0,
            "Retained row ignored the new row height."
        )
        ClickNativeButton(window, OnlyNativeWindow(), host.Rows["alpha"])
        Require(
            host.Selected == "alpha" && host.AlternateActivations == 1 && host.Activations == 1,
            "Retained row invoked a stale selection callback."
        )
        ClickNativeButton(window, OnlyNativeWindow(), host.Rows["gamma"])
        Require(host.Selected == "alpha" && host.AlternateActivations == 1, "Disabled row accepted selection.")
        CaptureIssueProof(window, "SearchList-custom")
        Console.WriteLine(
            "PASS: SearchList retained selection, stable identity, unchanged row reuse, updated colors/height/callback/customization, disabled input."
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
    Require(!window.IsOpen, "SearchList verification window did not close.")
}
