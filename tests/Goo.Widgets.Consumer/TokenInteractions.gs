package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import Goo.Widgets.Inputs
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class TokenHost : Cell {
    internal var Tokens[]string = []string{"first@example.com"}
    internal var Entry TextEntry?
    internal var Selected[]string = []string{"alpha"}
    internal let Items List[ComboBoxOption] = List[ComboBoxOption](
        []ComboBoxOption{ComboBoxOption{Id: "alpha", Label: "Alpha"}, ComboBoxOption{Id: "beta", Label: "Beta"}}
    )
    internal var Created string = ""
    internal var Open bool
    internal var Trigger Button?
    internal var Query string = ""
    internal var Removed int32
    internal var Disabled bool
    internal var ReadOnly bool
    internal var CopyRequests int32
    internal var Suggestions[]string = []string{}

    public override func Build() Blob -> Container{
        Width: Percent(100),
        Height: Percent(100),
        Padding: 24,
        Gap: 20,
        Cell.Mount[TokenInputInput, TokenInput](
            "tokens",
            TokenInputInput{
                Value: Tokens,
                Width: Percent(100),
                AccessibilityName: "Recipients",
                Disabled: Disabled,
                ReadOnly: ReadOnly,
                Suggestions: Suggestions,
                Validate: value -> value.Contains("@"),
                OnChange: values -> {
                    Tokens = values
                    Rebuild()
                },
                CreateEntry: (input, entry) -> {
                    Entry = entry
                    entry.KeyBindings = []KeyBinding{
                        KeyBinding{Key: Key.C, Modifiers: KeyModifiers{Ctrl: true}, OnPress: () -> CopyRequests++}
                    }
                    return entry
                },
            }
        ),
        Chip{Label: "Removable chip", Invalid: true, OnRemove: () -> Removed++,}.Build(),
        Cell.Mount[ComboBoxInput, ComboBox](
            "multiple",
            ComboBoxInput{
                Multiple: true,
                AllowFreeText: true,
                Searchable: true,
                SelectedIds: Selected,
                OnSelectionChange: values -> {
                    Selected = values
                    Rebuild()
                },
                Items: Items.ToArray(),
                Open: Open,
                OnOpenChange: value -> {
                    Open = value
                    Rebuild()
                },
                Query: Query,
                OnQueryChange: value -> {
                    Query = value
                    Rebuild()
                },
                OnCreate: value -> {
                    Created = value
                    Items.Add(ComboBoxOption{Id: value, Label: value})
                    let values = List[string](Selected)
                    values.Add(value)
                    Selected = values.ToArray()
                    Rebuild()
                },
                CreateTrigger: (input, button) -> {
                    Trigger = button
                    return button
                },
            }
        ),
    }
}

func TokenInteractions() {
    RetainedAllocationContracts()
    let host = TokenHost()
    let suggestions = List[string]()
    for index in 0 ... 1000 {
        suggestions.Add("invalid-" + index.ToString())
    }
    host.Suggestions = suggestions.ToArray()
    let semantics = SearchListSemantics()
    let root = ApplicationRoot(host)
    let window = Window{
        Root: root,
        Size: LayoutSize(640, 520),
        AccessibilityAdapter: semantics,
        Title: "Token and multiple selection contracts",
    }
    RunNativeWindow(window, () -> {
        window.Open()
        PumpFrames(window, 12)
        let id = OnlyNativeWindow()
        Require(host.Entry!!.Handle!!.Focus(), "Token editor did not focus")
        SelectorType(window, id, "invalid")
        Require(FindSemantics(semantics.Tree?.Root, "Add invalid-0") != nil, "Matching token suggestion did not mount")
        Require(FindSemantics(semantics.Tree?.Root, "Add invalid-999") == nil, "Off-screen token suggestion mounted")
        host.ReadOnly = true
        host.Rebuild()
        PumpFrames(window, 5)
        Require(host.Entry!!.Handle!!.Focus(), "Read-only token entry did not focus")
        Require(host.Entry!!.Accessibility!!.ReadOnly == true, "Token entry did not expose read-only state")
        Require(FindSemantics(semantics.Tree?.Root, "Add invalid-0") == nil, "Read-only token suggestions remained visible")
        Require(FindSemantics(semantics.Tree?.Root, "Remove first@example.com") == nil, "Read-only token exposed removal")
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        SelectorKey(id, SDLScancode.C, SDLKeymod.Ctrl)
        PumpFrames(window, 4)
        Require(host.CopyRequests == 1 && window.Focus.Selection!!.Active.Offset
            - window.Focus.Selection!!.Anchor.Offset == 7, "Read-only token draft lost selection or copy routing")
        SelectorType(window, id, "changed,")
        SendKey(id, SDLScancode.Backspace)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 5)
        Require(host.Tokens.Length == 1 && host.Entry!!.Value == "invalid", "Read-only token draft changed")
        host.ReadOnly = false
        host.Rebuild()
        PumpFrames(window, 5)
        Console.WriteLine("PASS: read-only tokens retain focus selection and copy without edits removal or suggestions")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 6)
        Require(host.Tokens.Length == 2 && host.Tokens[1] == "invalid", "Enter did not retain an invalid token")
        Require(FindSemantics(semantics.Tree?.Root, "invalid") != nil, "Invalid token text was lost")
        SelectorType(window, id, "second@example.com,")
        Require(host.Tokens.Length == 3 && host.Entry!!.Value == "", "Separator did not commit and clear the draft")
        SendKey(id, SDLScancode.Backspace)
        PumpFrames(window, 5)
        Require(host.Tokens.Length == 3, "First Backspace removed instead of selecting the last token")
        Require(
            FindSemantics(semantics.Tree?.Root, "second@example.com")!!.Checked == AccessibilityChecked.True,
            "First Backspace did not select the last token"
        )
        SendKey(id, SDLScancode.Backspace)
        PumpFrames(window, 5)
        Require(host.Tokens.Length == 2, "Second Backspace did not remove the selected token")
        SelectorType(window, id, "draft")
        SendKey(id, SDLScancode.Backspace)
        PumpFrames(window, 5)
        Require(host.Tokens.Length == 2 && host.Entry!!.Value == "draf", "Backspace in a draft removed a token")
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        window.Clipboard.WriteText("third@example.com,fourth@example.com")
        SelectorKey(id, SDLScancode.V, SDLKeymod.Ctrl)
        PumpFrames(window, 10)
        Require(
            host.Tokens.Length == 4 && host.Tokens[2] == "third@example.com"
            && host.Tokens[3] == "fourth@example.com",
            "Paste did not split and commit every token"
        )
        let remove = FindSemantics(semantics.Tree?.Root, "Remove Removable chip")!!
        Require(
            window.PerformAccessibilityAction(remove.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
            "Chip remove action did not have its own focus target"
        )
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 5)
        Require(host.Removed == 1, "Chip removal did not activate with Enter")
        SendKey(id, SDLScancode.Space)
        PumpFrames(window, 5)
        Require(host.Removed == 2, "Chip removal did not activate with Space")
        Require(host.Trigger!!.Handle!!.Focus(), "Multiple ComboBox trigger did not focus")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 10)
        Require(host.Open, "Multiple ComboBox did not open")
        SendKey(id, SDLScancode.Down)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(host.Open && host.Selected.Length == 2, "Multiple selection closed the popup or lost a selection")
        Require(
            FindSemantics(semantics.Tree?.Root, "Beta")!!.Checked == AccessibilityChecked.True,
            "Multiple option did not expose checked semantics"
        )
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(
            host.Open && host.Selected.Length == 1 && host.Selected[0] == "alpha",
            "Multiple selection did not toggle off"
        )
        SelectorType(window, id, "Gamma")
        SendKey(id, SDLScancode.End)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 10)
        Require(
            host.Created == "Gamma" && host.Open && host.Query == "" && host.Selected.Length == 2,
            "Creatable multiple selection did not create, retain opening, and clear search"
        )
        SelectorType(window, id, "gamma")
        Require(
            FindSemantics(semantics.Tree?.Root, "Create “gamma”") == nil,
            "An exact existing label was offered for creation"
        )
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 6)
        host.Disabled = true
        host.Rebuild()
        PumpFrames(window, 5)
        Require(!host.Entry!!.Handle!!.Focus(), "Disabled token editor accepted focus")
        Console.WriteLine(
            "PASS: token keyboard editing, paste, invalid values, chip removal, multiple selection and creation"
        )
    })
}
