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
    /// Whether the search entry and rows reject input.
    var Disabled bool
    /// Accessible list name. Nil resolves to Choose an item.
    var AccessibilityName string?
    /// Search entry hint. Nil resolves to Search.
    var Placeholder string?
    /// Message shown when the query has no matches.
    var EmptyText string?
    /// List width. Nil resolves to 280.
    var Width Length?
    /// Total height. Nil resolves to 240.
    var Height Length?
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
    /// Hosts must not change state in this callback.
    var CreateEntry Func[SearchList, TextEntry, TextEntry]?
    /// Final row customization. Preserve the supplied action and disabled state.
    /// Hosts must not change state in this callback.
    var CreateRow Func[SearchList, SelectionItem, Button, Blob]?
    /// Final root customization. Preserve the virtual viewport dimensions when resizing.
    /// Hosts must not change state in this callback.
    var CreateRoot Func[SearchList, Container, Blob]?
    internal var ItemAt Func[int32, SelectionItem]?
    internal var ItemCount int32

    /// Builds a fresh list and rejects duplicate identifiers or invalid geometry.
    public func Build() Blob -> Cell.Mount[SearchList, SearchListState](nil, this)

    internal func BuildContent(indices[]int32, positions Dictionary[string, int32]) Blob {
        let theme = Theme.Read()
        let defaultWidth Length = 280.0
        let defaultHeight Length = 240.0
        let width = Width ?? defaultWidth
        let height = Height ?? defaultHeight
        let rowHeight = RowHeight ?? theme.ControlHeight
        if (width.HasMagnitude && !width.IsPercent && (!Double.IsFinite(width.Magnitude) || width.Magnitude <= 2.0))
        || (height.HasMagnitude && !height.IsPercent && (!Double.IsFinite(height.Magnitude) || height.Magnitude <= theme.ControlHeight))
        || !Double.IsFinite(rowHeight) || rowHeight <= 0.0 {
            throw ArgumentOutOfRangeException(
                "Width/Height/RowHeight",
                "Use finite width > 2, height > 40, and row height > 0."
            )
        }

        let background = BackgroundColor ?? theme.PanelColor
        let foreground = TextColor ?? theme.TextColor
        let muted = MutedColor ?? theme.MutedTextColor
        let selection = SelectedColor ?? theme.SelectedFill(theme.ActiveColor)
        let focus = FocusColor ?? theme.FocusColor
        let selectedId = SelectedId
        let onSelect = Disabled ? nil: OnSelect
        let createRow = CreateRow
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
            CreateRow: createRow,
            Owner: this,
        }
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
            Focusable: !Disabled,
            Disabled: Disabled,
            Value: query,
            Controlled: true,
            Placeholder: Placeholder ?? theme.Text("Search"),
            PlaceholderColor: theme.PlaceholderColor,
            OnChange: Disabled ? nil: OnQueryChange,
            Focus: Style{BasedOn: theme.FocusStyle, OutlineColor: focus, OutlineOffset: -theme.FocusRingWidth},
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            Accessibility: Accessibility{Role: AccessibilityRole.TextInput, Name: Placeholder ?? theme.Text("Search")},
        }
        if let createEntry = CreateEntry {
            entry = createEntry(this, entry)
        }
        theme.ApplyInteraction(entry, InteractionFamily.Field)
        entry.Disabled = Disabled
        entry.Focusable = !Disabled
        entry.Value = query
        entry.Controlled = true
        entry.OnChange = Disabled ? nil: OnQueryChange

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
                let item = prepared == nil ? items[indices[index]]: prepared(index)
                return SearchListRow{
                    Item: item,
                    Selected: selectedId != nil && selectedId == item.Id,
                    Options: rowOptions,
                }
            },
            Index = (key string) -> {
                if prepared == nil {
                    return positions.TryGetValue(key, out var index) ? index: -1
                }
                for index in 0 ... count {
                    let item = prepared(index)
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
            BorderRadius: theme.ControlRadius!!,
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
        if let createRoot = CreateRoot {
            return createRoot(this, root)
        }
        return root
    }
}

internal class SearchListState : Cell[SearchList] {
    private var items[]?SelectionItem
    private var query string?
    private var prepared bool
    private var indices[]int32 = []int32{}
    private var positions Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)

    protected override func Build(input SearchList) Blob {
        if input.ItemAt == nil &&
            (!prepared || !Object.ReferenceEquals(items, input.Items) || query != input.Query) {
            let filtered = List[int32]()
            let identifiers = HashSet[string](StringComparer.Ordinal)
            let lookup = Dictionary[string, int32](StringComparer.Ordinal)
            let nextItems = input.Items ?? []SelectionItem{}
            let nextQuery = input.Query ?? ""
            for index in 0 ... nextItems.Length {
                let item = nextItems[index]
                let id = item.Id ?? ""
                if !identifiers.Add(id) {
                    throw ArgumentException("SearchList item identifiers must be unique: " + id)
                }
                if nextQuery.Length == 0 || ((item.Label ?? "") + " " + (item.Detail ?? "")).IndexOf(
                    nextQuery,
                    StringComparison.OrdinalIgnoreCase
                ) >= 0 {
                    lookup.Add("item:" + id, filtered.Count)
                    filtered.Add(index)
                }
            }
            items = input.Items
            query = input.Query
            indices = filtered.ToArray()
            positions = lookup
            prepared = true
        }
        return (input with{
            OnQueryChange = value -> InvokeInputCallback(input.OnQueryChange, value),
            OnSelect = id -> InvokeInputCallback(input.OnSelect, id),
        }).BuildContent(indices, positions)
    }
}

internal func buildSearchListRow(row SearchListRow) Blob -> row.Build()

/// Retains a virtual row while all render inputs compare equal.
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
        let options = Options!!
        let item = Item with{Disabled = Item.Disabled || options.Owner.Disabled}
        let id = item.Id ?? ""
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
            BackgroundColor: if Selected {
                options.Selection
            } else {
                options.Background
            },
            Hover: Selected && options.Owner.SelectedColor != nil ? Style{BackgroundColor: options.Selection}: nil,
            Active: Selected && options.Owner.SelectedColor != nil ? Style{BackgroundColor: options.Selection}: nil,
            Focus: Style{BasedOn: theme.FocusStyle, OutlineColor: options.Focus, OutlineOffset: -theme.FocusRingWidth},
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Button,
                Name: item.Label ?? "",
                Selected: Selected
            },
            OnClick: () -> {
                if !item.Disabled {
                    onSelect?.Invoke(id)
                }
            },
            Text{
                Content: item.Label ?? "",
                Color: item.Disabled ? theme.DisabledTextColor: Selected ? theme.SelectedText(options.Foreground, options.Selection): options.Foreground,
                FlexGrow: 1,
                MinWidth: 0,
                FontFamily: theme.FontFamily,
                FontSize: theme.FontSize,
                FontWeight: theme.FontWeight,
            },
            Text{
                Content: item.Detail ?? "",
                Color: item.Disabled ? theme.DisabledTextColor: Selected ? theme.SelectedText(options.Muted, options.Selection): options.Muted,
                FontFamily: theme.FontFamily,
                FontSize: theme.CaptionFontSize,
                FontWeight: theme.CaptionFontWeight,
            },
        }
        if Selected && (theme.Selection == SelectionStyle.Indicator || theme.HighContrast) { row.Children.Add(theme.SelectionBar()) }
        var result Blob = row
        if let createRow = options.CreateRow {
            result = createRow(options.Owner, item, row)
        }
        theme.ApplyInteraction(result, InteractionFamily.Row, Selected)
        result.Disabled = item.Disabled
        result.Focusable = !item.Disabled
        result.OnClick = row.OnClick
        result.Accessibility = row.Accessibility
        WidgetKeyBindings.BindActivation(result)
        return result
    }
}

/// One Build snapshot sharing colors and callbacks across filtered rows.
internal class SearchListRowOptions : IEquatable[SearchListRowOptions] {
    internal var RowHeight float64
    internal var Background Color
    internal var Foreground Color
    internal var Muted Color
    internal var Selection Color
    internal var Focus Color
    internal var OnSelect Action[string]?
    internal var CreateRow Func[SearchList, SelectionItem, Button, Blob]?
    internal var Owner SearchList

    public func Equals(other SearchListRowOptions?) bool -> other != nil
    && RowHeight == other.RowHeight && sameColor(Background, other.Background)
    && sameColor(Foreground, other.Foreground) && sameColor(Muted, other.Muted)
    && sameColor(Selection, other.Selection) && sameColor(Focus, other.Focus)
    && Object.Equals(OnSelect, other.OnSelect) && Object.Equals(CreateRow, other.CreateRow) && Owner.Disabled == other.Owner.Disabled

    private func sameColor(a Color, b Color) bool -> a.R == b.R && a.G == b.G && a.B == b.B && a.A == b.A
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w SearchList) Blob -> w.Build()
