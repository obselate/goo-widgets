package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import Goo.Widgets.Icons
import Goo.Widgets.Layout
import System
import System.Collections.Generic

/// One stable selector option; custom content retains its accessible label.
public data struct ComboBoxOption {
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string?
    /// Visible and accessible label. Nil uses the item ID.
    var Label string?
    /// Main display content. Nil leaves this slot empty.
    var Content Blob?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
}

/// Controlled selection with optional controlled opening and search state.
public data struct ComboBoxInput {
    /// Options in display order. Nil supplies no options. Each ID must be nonempty, stable, and unique.
    var Items[]?ComboBoxOption
    /// Controlled selected item ID. Nil means no selection.
    var SelectedId string?
    /// Receives the selected item ID after user selection. Nil ignores the request.
    var OnSelect Action[string]?
    /// Enables set selection instead of single selection. False limits selection to one item.
    var Multiple bool
    /// Controlled selected item IDs. Nil means an empty selection.
    var SelectedIds[]?string
    /// Receives a new array of selected IDs after user input. An empty array clears selection. Nil ignores the request.
    var OnSelectionChange Action[[]string]?
    /// Allows creating an option from a nonempty query that has no exact match.
    var AllowFreeText bool
    /// Formats the create-option label from the query string. Nil uses localized create text.
    var FormatCreateText Func[string, string]?
    /// Receives the entered free text when the create option is activated. Nil ignores the request.
    var OnCreate Action[string]?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Hint shown while the entry is empty. Nil uses the widget default text.
    var Placeholder string?
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Optional mounted collision viewport. Presentation uses the Window's Portal overlay.
    var OverlayHost ElementHandle?
    /// Nil lets the widget own opening; otherwise update Open in OnOpenChange.
    var Open bool?
    /// Receives the requested open state after user interaction. Nil ignores the request.
    var OnOpenChange Action[bool]?
    /// Shows a query editor for filtering options.
    var Searchable bool
    /// Nil lets the widget own the query; otherwise update it in OnQueryChange.
    var Query string?
    /// Receives the new query string after a user edit. Nil ignores the notification.
    var OnQueryChange Action[string]?
    /// Hint for the empty search entry. Nil uses the localized search text.
    var SearchPlaceholder string?
    /// Message shown when no options match. Nil uses the localized widget default.
    var EmptyText string?
    /// Trigger layout width. Nil uses 280.
    var Width Length?
    /// Makes the popup at least as wide as the mounted trigger.
    var MatchTriggerWidth bool
    /// Finite positive popup height limit in logical pixels. Nil uses 260.
    var PopupHeight float64?
    /// Preferred anchor-relative placement. Collision handling can move the popup into view.
    var Placement PopoverPlacement
    /// Finite positive option height in logical pixels. Nil uses the theme control height.
    var RowHeight float64?
    /// Layer of the popup while open.
    var ZIndex int32
    /// Receives the widget input and the prepared button, and returns the replacement button. Nil uses the default composition.
    var CreateTrigger Func[ComboBoxInput, Button, Button]?
    /// Replaces the passive expansion indicator; the stable arrow key is reapplied.
    var CreateArrow Func[ComboBoxInput, Blob, Blob]?
    /// Receives the widget input and the prepared entry, and returns the replacement entry. Nil uses the default composition.
    var CreateSearch Func[ComboBoxInput, TextEntry, TextEntry]?
    /// Receives the widget input, the option descriptor, and the prepared container, and returns the replacement container. Nil uses the default composition.
    var CreateRow Func[ComboBoxInput, ComboBoxOption, Container, Container]?
    /// Receives the widget input and the prepared container, and returns the replacement container. Nil uses the default composition.
    var CreatePopup Func[ComboBoxInput, Container, Container]?
    /// Receives the widget input and the prepared container, and returns the replacement container. Nil uses the default composition.
    var CreateRoot Func[ComboBoxInput, Container, Container]?
}

internal data struct ComboBoxRow {
    var Item ComboBoxOption
    var Selected bool
    var Active bool
    var Input ComboBoxInput
}

/// An anchored selector with virtual options and commit/cancel keyboard navigation.
public open class ComboBox : Cell[ComboBoxInput], IDisposable {
    private var current ComboBoxInput
    private var theme Theme
    private let trigger ElementHandle = ElementHandle()
    private let listHandle ElementHandle = ElementHandle()
    private let searchHandle ElementHandle = ElementHandle()
    private let viewport ElementHandle = ElementHandle()
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private var overlay ElementHandle?
    private var overlayBox ElementRect
    private var rows[]int32 = []int32{}
    private var created ComboBoxOption
    private var ids Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
    private var positions Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
    private var prepared bool
    private var preparedQuery string = ""
    private var multipleLabel string?
    private var firstId string = ""
    private var lastId string = ""
    private var activeId string = ""
    private var ownedOpen bool
    private var ownedQuery string = ""
    private var wasOpen bool
    private var revealPending bool
    private var disposed bool
    private var createId string = ""

    /// Subscribes to list viewport metrics for active-option reveal. Dispose the selector to release the subscription.
    public init() {
        viewport.MetricsChanged += ListMetrics
    }

    /// Releases geometry subscriptions. The composed popup owns its focus scope.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        viewport.MetricsChanged -= ListMetrics
        BindOverlay(nil)
    }

    protected override func Build(input ComboBoxInput) Blob {
        let itemsChanged = !prepared || !Object.ReferenceEquals(current.Items, input.Items)
        let optionsChanged = itemsChanged || current.Searchable != input.Searchable ||
            current.AllowFreeText != input.AllowFreeText || !Object.Equals(current.FormatCreateText, input.FormatCreateText)
        let selectionChanged = itemsChanged || current.Multiple != input.Multiple ||
            !Object.ReferenceEquals(current.SelectedIds, input.SelectedIds)
        theme = Theme.Read()
        let defaultWidth Length = 280.0
        current = input with{
            Width = input.Width ?? defaultWidth,
            PopupHeight = input.PopupHeight ?? 260.0,
            RowHeight = input.RowHeight ?? theme.ControlHeight,
            Placeholder = input.Placeholder ?? theme.Text("Choose an option"),
            AccessibilityName = input.AccessibilityName ?? theme.Text("Choose an option"),
            ZIndex = input.ZIndex == 0 ? 20: input.ZIndex
        }
        if (current.Width!!.HasMagnitude && !current.Width!!.IsPercent && (!Double.IsFinite(current.Width!!.Magnitude) || current.Width!!.Magnitude <= 2.0))
        || !Double.IsFinite(current.PopupHeight!!) || current.PopupHeight!! <= 42.0
        || !Double.IsFinite(current.RowHeight!!) || current.RowHeight!! <= 0.0 {
            prepared = false
            throw ArgumentOutOfRangeException("ComboBox dimensions")
        }
        let requestedOpen = !input.Disabled && (input.Open ?? ownedOpen)
        BindOverlay(input.OverlayHost)
        let isOpen = requestedOpen && (overlay?.IsMounted ?? true)
        let query = input.Query ?? ownedQuery
        let items = input.Items ?? []ComboBoxOption{}
        if optionsChanged || preparedQuery != query {
            prepared = false
            if itemsChanged {
                ids = Dictionary[string, int32](StringComparer.Ordinal)
                for index in 0 ... items.Length {
                    let item = items[index]
                    if String.IsNullOrEmpty(item.Id) || !ids.TryAdd(item.Id!!, index) {
                        throw ArgumentException("ComboBox option IDs must be nonempty and unique")
                    }
                }
            }
            let filtered = List[int32]()
            positions = Dictionary[string, int32](StringComparer.Ordinal)
            firstId = ""
            lastId = ""
            let creation = input.AllowFreeText ? query.Trim(): ""
            var exact bool
            for index in 0 ... items.Length {
                let item = items[index]
                if input.AllowFreeText && String.Equals(
                    item.Label ?? item.Id!!,
                    creation,
                    StringComparison.OrdinalIgnoreCase
                ) {
                    exact = true
                }
                if (!input.Searchable && !input.AllowFreeText) || query.Length == 0 || (item.Label ?? item.Id!!).IndexOf(
                    query,
                    StringComparison.OrdinalIgnoreCase
                ) >= 0 {
                    positions.Add(item.Id!!, filtered.Count)
                    filtered.Add(index)
                    if !item.Disabled {
                        if firstId == "" {
                            firstId = item.Id!!
                        }
                        lastId = item.Id!!
                    }
                }
            }
            createId = ""
            if creation.Length > 0 && !exact {
                createId = "create"
                while ids.ContainsKey(createId) {
                    createId += "-"
                }
                created = ComboBoxOption{
                    Id: createId,
                    Label: input.FormatCreateText?.Invoke(creation) ?? "Create “" + creation + "”",
                }
                positions.Add(createId, filtered.Count)
                filtered.Add(-1)
                if firstId == "" {
                    firstId = createId
                }
                lastId = createId
            }
            rows = filtered.ToArray()
            let removed = List[string]()
            for id in handles.Keys {
                if id != createId && !ids.ContainsKey(id) {
                    removed.Add(id)
                }
            }
            for id in removed {
                handles.Remove(id)
            }
            preparedQuery = query
            prepared = true
        }
        var selected ComboBoxOption?
        if input.SelectedId != nil && ids.TryGetValue(input.SelectedId!!, out var selectedIndex) {
            selected = items[selectedIndex]
        }
        if selectionChanged {
            multipleLabel = nil
            if input.Multiple {
                let selectedIndices = SortedSet[int32]()
                for id in input.SelectedIds ?? []string{} {
                    if ids.TryGetValue(id, out var index) {
                        selectedIndices.Add(index)
                    }
                }
                let labels = List[string]()
                for index in selectedIndices {
                    labels.Add(items[index].Label ?? items[index].Id!!)
                }
                if labels.Count > 0 {
                    multipleLabel = String.Join(", ", labels)
                }
            }
        }
        if !isOpen {
            wasOpen = false
        } else if !wasOpen {
            activeId = Index(input.SelectedId ?? "") >= 0 ? input.SelectedId!!: First(false)
            wasOpen = true
            revealPending = true
        }
        if Index(activeId) < 0 {
            activeId = First(false)
        }
        let label = input.Multiple
        ? multipleLabel ?? current.Placeholder!!
        : selected?.Label ?? selected?.Id ?? current.Placeholder!!
        let valueContent = (input.Multiple ? nil: selected?.Content) ??
            Text{
            Content: label,
            Color: input.Disabled ? theme.DisabledTextColor:
                (input.Multiple ? multipleLabel == nil: selected == nil) ? theme.MutedTextColor: theme.TextColor,
            FontFamily: theme.FontFamily,
            FontSize: theme.FontSize,
            FontWeight: theme.FontWeight,
            TextWrap: TextWrap.NoWrap
        }
        var button = Button{
            Height: theme.ControlHeight,
            Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
            Gap: theme.ControlGap,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            BackgroundColor: theme.FieldColor,
            BorderColor: theme.InputBorderColor,
            BorderWidth: theme.BorderWidth,
            BorderRadius: theme.ControlRadius!!,
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
        }
        if let create = current.CreateTrigger {
            button = create(current, button)
        }
        theme.ApplyInteraction(button, InteractionFamily.Field)
        button.Key = "trigger"
        button.Handle = trigger
        button.Disabled = current.Disabled
        button.Focusable = !current.Disabled
        button.OnClick = () -> SetOpen(!isOpen)
        WidgetKeyBindings.BindActivation(button)
        button.OnKeyDown = TriggerKey
        button.Accessibility = Accessibility{
            Role: AccessibilityRole.ComboBox,
            Name: current.AccessibilityName!!,
            Value: label,
            Expanded: isOpen,
            HasPopup: true,
            Relationships: AccessibilityRelationships{Controls: []ElementHandle{listHandle}}
        }
        button.Children.Clear()
        button.Children.Add(
            Container{Key: "value", FlexGrow: 1.0, MinWidth: 0.0, Overflow: Overflow.Hidden, valueContent}
        )
        var arrow Blob = ControlIcons.Create(ControlIcon.ExpandMore, 16, theme.MutedTextColor)
        if let create = current.CreateArrow {
            arrow = create(current, arrow)
        }
        arrow.Key = "arrow"
        button.Children.Add(arrow)
        var root = Container{
            Width: current.Width!!,
            MinWidth: 0.0,
            Overflow: Overflow.Visible,
            LineHeight: theme.LineHeight
        }
        if let create = current.CreateRoot {
            root = create(current, root)
        }
        root.Children.Clear()
        root.Children.Add(button)
        let popupHeight = Math.Min(
            current.PopupHeight!!,
            2.0 + ((current.Searchable || current.AllowFreeText) ? theme.ControlHeight + 1.0: 0.0) + Math.Max(
                theme.ControlHeight,
                float64(rows.Length) * current.RowHeight!!
            )
        )
        var popup = PopoverInput{
            Open: isOpen,
            Anchor: trigger,
            Placement: current.Placement,
            Content: BuildList(query, popupHeight),
            Width: current.Width!!,
            MaxHeight: popupHeight,
            Padding: 0.0,
            AccessibilityName: current.AccessibilityName,
            InitialFocus: (current.Searchable || current.AllowFreeText) ? searchHandle: listHandle,
            OnDismiss: Dismiss,
            CreatePanel: PopupPanel,
            ZIndex: current.ZIndex,
        }
        if isOpen && overlay != nil {
            popup.Viewport = overlayBox
        }
        if current.MatchTriggerWidth && trigger.IsMounted {
            popup.MinWidth = trigger.BorderBox.Width
        }
        root.Children.Add(Cell.Mount[PopoverInput, Popover]("popup", popup))
        return root
    }

    private func BuildList(query string, height float64) Container {
        let activeHandle ElementHandle? = activeId == "" ? nil: Handle(activeId)
        let relationships = AccessibilityRelationships{ActiveDescendant: activeHandle}
        let content = Container{Height: height - 2.0, MinHeight: 0.0, MinWidth: 0.0}
        if current.Searchable || current.AllowFreeText {
            var entry = TextEntry{
                Height: theme.ControlHeight,
                FlexShrink: 0.0,
                Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
                BackgroundColor: Color.Transparent,
                Color: theme.TextColor,
                FontFamily: theme.FontFamily,
                FontSize: theme.FontSize,
                FontWeight: theme.FontWeight,
                SelectionColor: theme.AccentColor.WithAlpha(0.35),
                PlaceholderColor: theme.PlaceholderColor,
                Cursor: Cursor.Text,
                TransitionMs: theme.TransitionMs,
                TransitionEasing: Easing.EaseOut,
                TransitionProperties: theme.InteractionTransitions,
            }
            if let create = current.CreateSearch {
                entry = create(current, entry)
            }
            theme.ApplyInteraction(entry, InteractionFamily.Field)
            entry.Focus!!.OutlineOffset = -theme.FocusRingWidth
            entry.Key = "search"
            entry.Handle = searchHandle
            entry.Value = query
            entry.Controlled = true
            entry.Placeholder = current.SearchPlaceholder ?? theme.Text("Search options")
            entry.Focusable = true
            entry.OnChange = QueryChanged
            entry.OnKeyDown = ListKey
            entry.OnFocus = (event FocusEvent) -> Reveal()
            entry.Accessibility = Accessibility{
                Role: AccessibilityRole.SearchBox,
                Name: current.SearchPlaceholder ?? theme.Text("Search options"),
                Relationships: relationships
            }
            content.Children.Add(entry)
            content.Children.Add(Container{Height: 1.0, FlexShrink: 0.0, BackgroundColor: theme.BorderColor})
        }
        let snapshot = current
        let selected = activeId
        let indices = rows
        let lookup = positions
        let items = current.Items ?? []ComboBoxOption{}
        let creation = created
        let key((ComboBoxRow) -> string) = (row ComboBoxRow) -> row.Item.Id!!
        let build((ComboBoxRow) -> Blob) = BuildRow
        let source = VirtualRowsSource[ComboBoxRow](
            []ComboBoxRow{},
            virtualItemExtent(current.RowHeight!!, "RowHeight"),
            key,
            build,
            nil
        ){
            Count = rows.Length,
            Get = (index int32) -> {
                let item = indices[index] < 0 ? creation: items[indices[index]]
                return ComboBoxRow{
                    Item: item,
                    Selected: indices[index] >= 0 && (snapshot.Multiple
                    ? Array.IndexOf(snapshot.SelectedIds ?? []string{}, item.Id!!) >= 0
                    : item.Id == snapshot.SelectedId),
                    Active: item.Id == selected,
                    Input: snapshot,
                }
            },
            Index = (id string) -> lookup.TryGetValue(id, out var index) ? index: -1,
        }
        let virtualRows Virtual = Virtual(source)
        virtualRows.ScrollbarY = theme.Scrollbar
        virtualRows.Key = "rows"
        virtualRows.Handle = viewport
        virtualRows.FlexGrow = 1.0
        virtualRows.FlexBasis = 0.0
        virtualRows.MinHeight = 0.0
        virtualRows.OverflowY = Overflow.Scroll
        virtualRows.OverflowX = Overflow.Hidden
        virtualRows.Accessibility = nil
        let list = Container{
            Key: "list",
            Handle: listHandle,
            FlexGrow: 1.0,
            FlexBasis: 0.0,
            MinHeight: 0.0,
            Focusable: !current.Searchable && !current.AllowFreeText,
            FocusTarget: activeHandle,
            OnKeyDown: ListKey,
            OnFocus: (event FocusEvent) -> Reveal(),
            Accessibility: Accessibility{
                Role: AccessibilityRole.List,
                Name: current.AccessibilityName!!,
                SizeOfSet: rows.Length,
                Relationships: relationships
            }
        }
        if rows.Length == 0 {
            list.Children.Add(
                Text{
                    Content: current.EmptyText ?? theme.Text("No matches"),
                    Padding: theme.ControlPadding,
                    Color: theme.MutedTextColor,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.FontSize,
                    FontWeight: theme.FontWeight,
                }
            )
        } else {
            list.Children.Add(virtualRows)
        }
        content.Children.Add(list)
        return content
    }

    private func BuildRow(row ComboBoxRow) Blob {
        let item = row.Item
        let id = item.Id!!
        var result = Container{
            Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Margin: Edges{Right: 4.0, Left: 4.0},
            BorderRadius: theme.ControlRadius!!,
            BackgroundColor: row.Selected ? theme.SelectedFill(theme.ActiveColor): row.Active ? theme.HoverColor: Color.Transparent,
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
        }
        if let create = row.Input.CreateRow {
            result = create(row.Input, item, result)
        }
        theme.ApplyInteraction(result, InteractionFamily.Row, row.Selected)
        result.Key = id
        result.Handle = Handle(id)
        result.Height = row.Input.RowHeight!!
        result.MinHeight = row.Input.RowHeight!!
        result.MaxHeight = row.Input.RowHeight!!
        result.Focusable = false
        result.Disabled = item.Disabled
        result.OnClick = () -> Commit(id)
        result.OnPointerEnter = (event PointerEvent) -> {
            if !item.Disabled {
                activeId = id
                Rebuild()
            }
        }
        result.Accessibility = Accessibility{
            Role: row.Input.Multiple && id != createId ? AccessibilityRole.Checkbox: AccessibilityRole.ListItem,
            Name: item.Label ?? id,
            Selected: row.Selected,
            Checked: row.Input.Multiple && id != createId
            ? (row.Selected ? AccessibilityChecked.True: AccessibilityChecked.False): AccessibilityChecked.Unspecified,
            Actions: []AccessibilityAction{AccessibilityAction.Select},
            OnAction: (request AccessibilityActionRequest) -> {
                if request.Action != AccessibilityAction.Select || item.Disabled {
                    return false
                }
                Commit(id)
                return true
            }
        }
        result.Children.Clear()
        if row.Input.Multiple && id != createId {
            result.Children.Add(
                ControlIcons.Create(row.Selected ? ControlIcon.CheckBox: ControlIcon.CheckBoxOutlineBlank, 18, theme.AccentColor)
            )
        }
        result.Children.Add(
            item.Content ??
                Text{
                Content: item.Label ?? id,
                Color: item.Disabled ? theme.DisabledTextColor: row.Selected ? theme.SelectedText(theme.TextColor): theme.TextColor,
                TextWrap: TextWrap.NoWrap,
                FontFamily: theme.FontFamily,
                FontSize: theme.FontSize,
                FontWeight: theme.FontWeight,
            }
        )
        return result
    }

    private func PopupPanel(input PopoverInput, bounds ElementRect, content Blob) Container {
        let prepared = Container{
            BasedOn: theme.OverlayStyle,
            BackgroundColor: theme.OverlayColor,
            BorderColor: theme.InputBorderColor,
            BorderWidth: theme.BorderWidth,
            BorderRadius: theme.PanelRadius!!,
        }
        return if let create = current.CreatePopup {
            create(current, prepared)
        } else {
            prepared
        }
    }

    private func Handle(id string) ElementHandle {
        if !handles.ContainsKey(id) {
            handles.Add(id, ElementHandle())
        }
        return handles[id]
    }

    private func Option(index int32) ComboBoxOption -> rows[index] < 0 ? created: current.Items!![rows[index]]

    private func Index(id string) int32 {
        if positions.TryGetValue(id, out var index) && !Option(index).Disabled {
            return index
        }
        return -1
    }

    private func First(last bool) string -> last ? lastId: firstId

    private func Reveal() {
        if activeId == "" {
            revealPending = false
            return
        }
        if !viewport.IsMounted {
            revealPending = true
            return
        }
        let handle = Handle(activeId)
        revealPending = false
        if handle.IsMounted {
            handle.ScrollIntoView()
        } else {
            viewport.ScrollToItem(activeId)
        }
    }

    private func SetOpen(value bool) {
        if current.Disabled {
            return
        }
        ownedOpen = value
        if !value {
            ownedQuery = ""
        }
        current.OnOpenChange?.Invoke(value)
        Rebuild()
    }

    private func Dismiss(reason PopoverDismissReason) {
        SetOpen(false)
    }

    private func Commit(id string) {
        if current.Disabled || Index(id) < 0 {
            return
        }
        if id == createId {
            current.OnCreate?.Invoke((current.Query ?? ownedQuery).Trim())
            if !current.Multiple {
                SetOpen(false)
            } else {
                QueryChanged("")
            }
        } else if current.Multiple {
            let values = List[string](current.SelectedIds ?? []string{})
            if !values.Remove(id) {
                values.Add(id)
            }
            current.OnSelectionChange?.Invoke(values.ToArray())
            Rebuild()
        } else {
            current.OnSelect?.Invoke(id)
            SetOpen(false)
        }
    }

    private func QueryChanged(value string) {
        ownedQuery = value
        viewport.JumpTo(0.0, 0.0)
        current.OnQueryChange?.Invoke(value)
        Rebuild()
    }

    private func TriggerKey(event KeyEvent) {
        if event.Key == Key.Down || event.Key == Key.Up || event.Key == Key.Home || event.Key == Key.End {
            event.PreventDefault()
            event.StopPropagation()
            SetOpen(true)
        }
    }

    private func ListKey(event KeyEvent) {
        if event.Key == Key.Enter {
            event.PreventDefault()
            event.StopPropagation()
            Commit(activeId)
            return
        }
        if event.Key != Key.Down && event.Key != Key.Up && event.Key != Key.Home && event.Key != Key.End {
            return
        }
        event.PreventDefault()
        event.StopPropagation()
        if event.Key == Key.Home || event.Key == Key.End {
            activeId = First(event.Key == Key.End)
        } else {
            let direction = event.Key == Key.Down ? 1: -1
            let start = Index(activeId)
            for step in 1 ... rows.Length + 1 {
                let index = (Math.Max(0, start) + direction * step + rows.Length) % rows.Length
                if !Option(index).Disabled {
                    activeId = Option(index).Id!!
                    break
                }
            }
        }
        Reveal()
        Rebuild()
    }

    private func BindOverlay(next ElementHandle?) {
        if overlay == next {
            return
        }
        if let previous = overlay {
            previous.MetricsChanged -= OverlayMetrics
        }
        overlay = next
        if let handle = overlay {
            overlayBox = handle.BorderBox
            handle.MetricsChanged += OverlayMetrics
        }
    }

    private func OverlayMetrics(metrics ElementMetrics) {
        if disposed {
            return
        }
        if !metrics.IsMounted {
            if wasOpen {
                SetOpen(false)
            }
            return
        }
        if overlayBox != metrics.BorderBox {
            overlayBox = metrics.BorderBox
            Rebuild()
        }
    }

    private func ListMetrics(metrics ElementMetrics) {
        if !disposed && metrics.IsMounted && revealPending {
            Reveal()
        }
    }
}
