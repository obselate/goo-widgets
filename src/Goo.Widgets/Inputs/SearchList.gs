package Goo.Widgets.Inputs

import Goo
import Goo.Widgets.Data
import System
import System.Collections.Generic

/// A controlled, searchable virtual list. The host owns the query and selected Id.
public data struct SearchList {
    /// Items with stable, unique identifiers. Nil resolves to an empty list.
    var Items[]?SelectionItem
    /// Case-insensitive query over labels and details.
    var Query string?
    /// Identifier selected by the host. Nil leaves all items unselected.
    var SelectedId string?
    /// Receives query edits. Update Query in the owning Cell.
    var OnQueryChange Action[string]?
    /// Receives the identifier activated by pointer or keyboard.
    var OnSelect Action[string]?
    /// Accessible list name. Nil resolves to Choose an item.
    var AccessibilityName string?
    /// Search entry hint. Nil resolves to Search.
    var Placeholder string?
    /// Message shown when the query has no matches.
    var EmptyText string?
    /// List width in pixels. Nil resolves to 280.
    var Width float64?
    /// Total height in pixels. Nil resolves to 240.
    var Height float64?
    /// Virtual row height in pixels. Nil resolves to 40.
    var RowHeight float64?
    /// Surface color. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Primary text color. Nil resolves to #fafafa.
    var TextColor Color?
    /// Secondary text color. Nil resolves to #a1a1aa.
    var MutedColor Color?
    /// Selected row color. Nil resolves to #3f3f46.
    var SelectedColor Color?
    /// Focus outline color. Nil resolves to #a1a1aa.
    var FocusColor Color?
    /// Enables visible focus highlights. Disabled by default.
    var ShowFocusHighlight bool
    /// Final entry customization. Preserve Value and OnChange for controlled editing.
    var CustomizeEntry Func[TextEntry, TextEntry]?
    /// Final row customization. Preserve the supplied action and disabled state.
    var CustomizeRow Func[SelectionItem, Button, Blob]?
    /// Final root customization. Preserve the virtual viewport dimensions when resizing.
    var CustomizeRoot Func[Container, Blob]?

    /// Builds a fresh list and rejects duplicate identifiers or invalid geometry.
    public func Build() Blob {
        let width = Width ?? 280.0
        let height = Height ?? 240.0
        let rowHeight = RowHeight ?? 40.0
        if !Double.IsFinite(width) || width <= 2.0 || !Double.IsFinite(height) || height <= 40.0
        || !Double.IsFinite(rowHeight) || rowHeight <= 0.0 {
            throw ArgumentOutOfRangeException(
                "Width/Height/RowHeight",
                "Use finite width > 2, height > 40, and row height > 0."
            )
        }

        let background = BackgroundColor ?? Color.Parse("#18181b")
        let foreground = TextColor ?? Color.Parse("#fafafa")
        let muted = MutedColor ?? Color.Parse("#a1a1aa")
        let selection = SelectedColor ?? Color.Parse("#3f3f46")
        let focus = FocusColor ?? muted
        let showFocusHighlight = ShowFocusHighlight
        let selectedId = SelectedId
        let onSelect = OnSelect
        let customizeRow = CustomizeRow
        let query = Query ?? ""
        let items = Items ?? []SelectionItem{}
        let rowOptions = SearchListRowOptions{
            RowHeight: rowHeight,
            Background: background,
            Foreground: foreground,
            Muted: muted,
            Selection: selection,
            Focus: focus,
            ShowFocusHighlight: showFocusHighlight,
            OnSelect: onSelect,
            Customize: customizeRow,
        }
        let filtered = List[SearchListRow](
            if query.Length == 0 {
                items.Length
            } else {
                0
            }
        )
        let identifiers = HashSet[string](StringComparer.Ordinal)
        for item in items {
            let id = item.Id ?? ""
            if !identifiers.Add(id) {
                throw ArgumentException("SearchList item identifiers must be unique: " + id)
            }
            if query.Length == 0 || ((item.Label ?? "") + " " + (item.Detail ?? "")).IndexOf(
                query,
                StringComparison.OrdinalIgnoreCase
            ) >= 0 {
                filtered.Add(
                    SearchListRow{Item: item, Selected: selectedId != nil && selectedId == id, Options: rowOptions,}
                )
            }
        }

        var entry = TextEntry{
            Key: "search",
            Height: 40,
            FlexShrink: 0,
            PaddingLeft: 10,
            PaddingRight: 10,
            BackgroundColor: background,
            Color: foreground,
            Focusable: true,
            Value: query,
            Placeholder: Placeholder ?? "Search",
            OnChange: OnQueryChange,
            Focus: if showFocusHighlight {
                Style{OutlineWidth: 1, OutlineColor: focus, OutlineOffset: -1}
            } else {
                Style{}
            },
            Accessibility: Accessibility{Role: AccessibilityRole.TextInput, Name: Placeholder ?? "Search"},
        }
        if let customize = CustomizeEntry {
            entry = customize(entry)
        }

        let list = Virtual(
            filtered,
            width - 2.0,
            rowHeight,
            (row SearchListRow) -> row.Item.Id ?? "",
            (row SearchListRow) -> row.Build()
        ){
            Key = "items",
            FlexGrow = 1,
            FlexBasis = 0,
            MinHeight = 0,
            OverflowX = Overflow.Hidden,
            OverflowY = Overflow.Scroll,
            ScrollbarVisibility = ScrollbarVisibility.Always,
            Accessibility = Accessibility{Role: AccessibilityRole.List, Name: AccessibilityName ?? "Choose an item"},
        }

        let root = Container{
            Width: width,
            Height: height,
            MinHeight: 0,
            MinWidth: 0,
            FlexShrink: 0,
            BackgroundColor: background,
            BorderWidth: 1,
            BorderColor: selection,
            BorderRadius: 4,
            Overflow: Overflow.Hidden,
            entry,
        }
        if filtered.Count == 0 {
            root.Children.Add(Text{Key: "empty", Content: EmptyText ?? "No matches", Color: muted, Padding: 12})
        } else {
            root.Children.Add(list)
        }
        if let customize = CustomizeRoot {
            return customize(root)
        }
        return root
    }
}

// Virtual retains a row while this value compares equal, including every render input.
internal struct SearchListRow : IEquatable[SearchListRow] {
    internal var Item SelectionItem
    internal var Selected bool
    internal var Options SearchListRowOptions?

    public func Equals(other SearchListRow) bool ->
    Item.Id == other.Item.Id && Item.Label == other.Item.Label && Item.Detail == other.Item.Detail
    &&
        Item.Disabled == other
        .Item
        .Disabled &&
        Selected == other.Selected &&
        (Options == other.Options || (Options?.Equals(other.Options) ?? false))

    internal func Build() Blob {
        let item = Item
        let id = item.Id ?? ""
        let options = Options!!
        let onSelect = options.OnSelect
        let row = Button{
            Height: options.RowHeight,
            Width: Length.Percent(100),
            FlexShrink: 0,
            PaddingLeft: 10,
            PaddingRight: 10,
            Gap: 10,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.FlexStart,
            Focusable: true,
            Cursor: Cursor.Pointer,
            Disabled: item.Disabled,
            Opacity: if item.Disabled {
                0.45
            } else {
                1.0
            },
            BackgroundColor: if Selected {
                options.Selection
            } else {
                options.Background
            },
            Hover: Style{BackgroundColor: options.Selection},
            Focus: if options.ShowFocusHighlight {
                Style{OutlineWidth: 1, OutlineColor: options.Focus, OutlineOffset: -1}
            } else {
                Style{}
            },
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: item.Label ?? "", Selected: Selected},
            OnClick: () -> {
                if !item.Disabled {
                    onSelect?.Invoke(id)
                }
            },
            Text{Content: item.Label ?? "", Color: options.Foreground, FlexGrow: 1, MinWidth: 0},
            Text{Content: item.Detail ?? "", Color: options.Muted, FontSize: 12},
        }
        if let customize = options.Customize {
            return customize(item, row)
        }
        return row
    }
}

// One snapshot per Build avoids duplicating colors and callbacks in every filtered row.
internal class SearchListRowOptions : IEquatable[SearchListRowOptions] {
    internal var RowHeight float64
    internal var Background Color
    internal var Foreground Color
    internal var Muted Color
    internal var Selection Color
    internal var Focus Color
    internal var ShowFocusHighlight bool
    internal var OnSelect Action[string]?
    internal var Customize Func[SelectionItem, Button, Blob]?

    public func Equals(other SearchListRowOptions?) bool -> other != nil
    && RowHeight == other.RowHeight && sameColor(Background, other.Background)
    && sameColor(Foreground, other.Foreground) && sameColor(Muted, other.Muted)
    && sameColor(Selection, other.Selection) && sameColor(Focus, other.Focus)
    && ShowFocusHighlight == other.ShowFocusHighlight
    && Object.Equals(OnSelect, other.OnSelect) && Object.Equals(Customize, other.Customize)

    private func sameColor(a Color, b Color) bool -> a.R == b.R && a.G == b.G && a.B == b.B && a.A == b.A
}
