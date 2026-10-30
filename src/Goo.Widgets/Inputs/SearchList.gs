package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
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
    /// Virtual row height in pixels. Nil uses the theme's control height.
    var RowHeight float64?
    /// Surface color. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Primary text color. Nil uses the nearest theme.
    var TextColor Color?
    /// Secondary text color. Nil uses the nearest theme.
    var MutedColor Color?
    /// Selected row color. Nil uses the nearest theme.
    var SelectedColor Color?
    /// Focus outline color. Nil uses the nearest theme.
    var FocusColor Color?
    /// Vertical scrollbar. Nil uses the theme overlay parts.
    var ScrollbarY Scrollbar?
    /// Vertical visibility. Nil uses Auto.
    var ScrollbarVisibilityY ScrollbarVisibility?
    /// Final entry customization. Preserve Value and OnChange for controlled editing.
    var CustomizeEntry Func[TextEntry, TextEntry]?
    /// Final row customization. Preserve the supplied action and disabled state.
    var CustomizeRow Func[SelectionItem, Button, Blob]?
    /// Final root customization. Preserve the virtual viewport dimensions when resizing.
    var CustomizeRoot Func[Container, Blob]?
    internal var ItemAt Func[int32, SelectionItem]?
    internal var ItemCount int32

    /// Builds a fresh list and rejects duplicate identifiers or invalid geometry.
    public func Build() Blob {
        let theme = Theme.Read()
        let width = Width ?? 280.0
        let height = Height ?? 240.0
        let rowHeight = RowHeight ?? theme.ControlHeight
        if !Double.IsFinite(width) || width <= 2.0 || !Double.IsFinite(height) || height <= theme.ControlHeight
        || !Double.IsFinite(rowHeight) || rowHeight <= 0.0 {
            throw ArgumentOutOfRangeException(
                "Width/Height/RowHeight",
                "Use finite width > 2, height > 40, and row height > 0."
            )
        }

        let background = BackgroundColor ?? theme.PanelColor
        let foreground = TextColor ?? theme.TextColor
        let muted = MutedColor ?? theme.MutedTextColor
        let selection = SelectedColor ?? theme.AccentColor.WithAlpha(0.15)
        let focus = FocusColor ?? theme.FocusColor
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
            OnSelect: onSelect,
            Customize: customizeRow,
        }
        let filtered = List[int32]()
        let identifiers = HashSet[string](StringComparer.Ordinal)
        if ItemAt == nil {
            for index in 0 ... items.Length {
                let item = items[index]
                let id = item.Id ?? ""
                if !identifiers.Add(id) {
                    throw ArgumentException("SearchList item identifiers must be unique: " + id)
                }
                if query.Length == 0 || ((item.Label ?? "") + " " + (item.Detail ?? "")).IndexOf(
                    query,
                    StringComparison.OrdinalIgnoreCase
                ) >= 0 {
                    filtered.Add(index)
                }
            }
        }
        let indices = filtered.ToArray()
        let prepared = ItemAt
        let count = prepared == nil ? indices.Length: ItemCount

        var entry = TextEntry{
            Key: "search",
            Height: theme.ControlHeight,
            FlexShrink: 0,
            Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
            BackgroundColor: background,
            Color: foreground,
            FontFamily: theme.FontFamily,
            FontSize: theme.FontSize,
            FontWeight: theme.FontWeight,
            SelectionColor: theme.AccentColor.WithAlpha(0.35),
            Cursor: Cursor.Text,
            Focusable: true,
            Value: query,
            Controlled: true,
            Placeholder: Placeholder ?? theme.Text("Search"),
            PlaceholderColor: theme.PlaceholderColor,
            OnChange: OnQueryChange,
            Focus: Style{OutlineWidth: theme.FocusRingWidth, OutlineColor: focus, OutlineOffset: -theme.FocusRingWidth},
            Accessibility: Accessibility{Role: AccessibilityRole.TextInput, Name: Placeholder ?? theme.Text("Search")},
        }
        if let customize = CustomizeEntry {
            entry = customize(entry)
        }

        let key((SearchListRow) -> string) = (row SearchListRow) -> "item:" + (row.Item.Id ?? "")
        let build((SearchListRow) -> Blob) = buildSearchListRow
        let source = VirtualRowsSource[SearchListRow](
            []SearchListRow{},
            virtualItemExtent(rowHeight, "RowHeight"),
            key,
            build,
            nil
        ){
            Count = count,
            Get = (index int32) -> {
                let item = prepared == nil ? items[indices[index]]: prepared!!(index)
                return SearchListRow{
                    Item: item,
                    Selected: selectedId != nil && selectedId == item.Id,
                    Options: rowOptions,
                }
            },
            Index = (key string) -> {
                for index in 0 ... count {
                    let item = prepared == nil ? items[indices[index]]: prepared!!(index)
                    let id = item.Id ?? ""
                    if key.Length == id.Length + 5 && key.StartsWith("item:", StringComparison.Ordinal)
                    && key.EndsWith(id, StringComparison.Ordinal) {
                        return index
                    }
                }
                return -1
            },
        }
        let list Virtual = Virtual(source){
            Key = "items",
            FlexGrow = 1,
            FlexBasis = 0,
            MinHeight = 0,
            OverflowX = Overflow.Hidden,
            OverflowY = Overflow.Scroll,
            ScrollbarY = ScrollbarY ?? theme.Scrollbar,
            ScrollbarVisibilityY = ScrollbarVisibilityY ?? Goo.ScrollbarVisibility.Auto,
            Accessibility = Accessibility{Role: AccessibilityRole.List, Name: AccessibilityName ?? theme.Text("Choose an item")},
        }

        let root = Container{
            LineHeight: theme.LineHeight,
            Width: width,
            Height: height,
            MinHeight: 0,
            MinWidth: 0,
            FlexShrink: 0,
            BackgroundColor: background,
            BorderWidth: theme.BorderWidth,
            BorderColor: selection,
            BorderRadius: theme.ControlRadius,
            Overflow: Overflow.Hidden,
            entry,
        }
        if count == 0 {
            root.Children.Add(
                Text{
                    Key: "empty",
                    Content: EmptyText ?? theme.Text("No matches"),
                    Color: muted,
                    Padding: theme.ControlPadding,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.FontSize,
                    FontWeight: theme.FontWeight,
                }
            )
        } else {
            root.Children.Add(list)
        }
        if let customize = CustomizeRoot {
            return customize(root)
        }
        return root
    }
}

internal func buildSearchListRow(row SearchListRow) Blob -> row.Build()

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
        let theme = Theme.Read()
        let item = Item
        let id = item.Id ?? ""
        let options = Options!!
        let onSelect = options.OnSelect
        let row = Button{
            Height: options.RowHeight,
            Width: Percent(100),
            FlexShrink: 0,
            Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
            Gap: theme.ControlGap,
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
            Focus: Style{OutlineWidth: theme.FocusRingWidth, OutlineColor: options.Focus, OutlineOffset: -theme.FocusRingWidth},
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: item.Label ?? "", Selected: Selected},
            OnClick: () -> {
                if !item.Disabled {
                    onSelect?.Invoke(id)
                }
            },
            Text{
                Content: item.Label ?? "",
                Color: options.Foreground,
                FlexGrow: 1,
                MinWidth: 0,
                FontFamily: theme.FontFamily,
                FontSize: theme.FontSize,
                FontWeight: theme.FontWeight,
            },
            Text{
                Content: item.Detail ?? "",
                Color: options.Muted,
                FontFamily: theme.FontFamily,
                FontSize: theme.CaptionFontSize,
                FontWeight: theme.CaptionFontWeight,
            },
        }
        var result Blob = row
        if let customize = options.Customize {
            result = customize(item, row)
        }
        WidgetKeyBindings.BindActivation(result)
        return result
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
    internal var OnSelect Action[string]?
    internal var Customize Func[SelectionItem, Button, Blob]?

    public func Equals(other SearchListRowOptions?) bool -> other != nil
    && RowHeight == other.RowHeight && sameColor(Background, other.Background)
    && sameColor(Foreground, other.Foreground) && sameColor(Muted, other.Muted)
    && sameColor(Selection, other.Selection) && sameColor(Focus, other.Focus)
    && Object.Equals(OnSelect, other.OnSelect) && Object.Equals(Customize, other.Customize)

    private func sameColor(a Color, b Color) bool -> a.R == b.R && a.G == b.G && a.B == b.B && a.A == b.A
}
