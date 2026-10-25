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
    var Id string?
    var Label string?
    var Content Blob?
    var Disabled bool
}

/// Controlled selection with optional controlled opening and search state.
public data struct ComboBoxInput {
    var Items[]?ComboBoxOption
    var SelectedId string?
    var OnSelect Action[string]?
    var Multiple bool
    var SelectedIds[]?string
    var OnSelectedIdsChange Action[[]string]?
    var AllowFreeText bool
    var CreateText Func[string, string]?
    var OnCreate Action[string]?
    var Disabled bool
    var Placeholder string?
    var AccessibilityName string?
    /// Optional mounted collision viewport. Presentation uses the Window's Portal overlay.
    var OverlayHost ElementHandle?
    /// Nil lets the widget own opening; otherwise update Open in OnOpenChange.
    var Open bool?
    var OnOpenChange Action[bool]?
    var Searchable bool
    /// Nil lets the widget own the query; otherwise update it in OnQueryChange.
    var Query string?
    var OnQueryChange Action[string]?
    var SearchPlaceholder string?
    var EmptyText string?
    var Width float64
    /// Makes the popup at least as wide as the mounted trigger.
    var MatchTriggerWidth bool
    var PopupHeight float64
    var Placement PopoverPlacement
    var RowHeight float64
    /// Layer of the popup while open.
    var ZIndex int32
    var CreateTrigger Func[ComboBoxInput, Button, Button]?
    /// Replaces the passive expansion indicator; the stable arrow key is reapplied.
    var CreateArrow Func[ComboBoxInput, Blob, Blob]?
    var CreateSearch Func[ComboBoxInput, TextEntry, TextEntry]?
    var CreateRow Func[ComboBoxInput, ComboBoxOption, Container, Container]?
    var CreatePopup Func[ComboBoxInput, Container, Container]?
    var CreateRoot Func[ComboBoxInput, Container, Container]?
}

internal data struct ComboBoxRow {
    var Item ComboBoxOption
    var Selected bool
    var Active bool
    var KeyboardActive bool
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
    private let rows List[int32] = List[int32]()
    private var created ComboBoxOption
    private let ids HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private let priorIds List[string] = List[string]()
    private var activeId string = ""
    private var pointerFocus bool
    private var ownedOpen bool
    private var ownedQuery string = ""
    private var wasOpen bool
    private var revealPending bool
    private var disposed bool
    private var createId string = ""

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
        theme = Theme.Read()
        current = input with{
            Width = input.Width == 0.0 ? 280.0: input.Width,
            PopupHeight = input.PopupHeight == 0.0 ? 260.0: input.PopupHeight,
            RowHeight = input.RowHeight == 0.0 ? theme.ControlHeight: input.RowHeight,
            Placeholder = input.Placeholder ?? theme.Text("Choose an option"),
            AccessibilityName = input.AccessibilityName ?? theme.Text("Choose an option"),
            ZIndex = input.ZIndex == 0 ? 20: input.ZIndex
        }
        if !Double.IsFinite(current.Width) || current.Width <= 2.0
        || !Double.IsFinite(current.PopupHeight) || current.PopupHeight <= 42.0
        || !Double.IsFinite(current.RowHeight) || current.RowHeight <= 0.0 {
            throw ArgumentOutOfRangeException("ComboBox dimensions")
        }
        let requestedOpen = !input.Disabled && (input.Open ?? ownedOpen)
        BindOverlay(input.OverlayHost)
        let isOpen = requestedOpen && (overlay?.IsMounted ?? true)
        let query = input.Query ?? ownedQuery
        let creation = input.AllowFreeText ? query.Trim(): ""
        let items = input.Items ?? []ComboBoxOption{}
        var changedIds = priorIds.Count != items.Length
        if !changedIds {
            for i in 0 ... items.Length {
                if priorIds[i] != items[i].Id {
                    changedIds = true
                    break
                }
            }
        }
        if changedIds {
            ids.Clear()
            priorIds.Clear()
            for item in items {
                if String.IsNullOrEmpty(item.Id) || !ids.Add(item.Id!!) {
                    throw ArgumentException("ComboBox option IDs must be nonempty and unique")
                }
                priorIds.Add(item.Id!!)
            }
        }
        var selected ComboBoxOption?
        let selectedIds HashSet[string]? = input.Multiple ? HashSet[string](
            input.SelectedIds ?? []string{},
            StringComparer.Ordinal
        ): nil
        let labels List[string]? = input.Multiple ? List[string](): nil
        var exact bool
        rows.Clear()
        for index in 0 ... items.Length {
            let item = items[index]
            if item.Id == input.SelectedId {
                selected = item
            }
            if input.Multiple && selectedIds!!.Contains(item.Id!!) {
                labels!!.Add(item.Label ?? item.Id!!)
            }
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
                rows.Add(index)
            }
        }
        createId = ""
        if creation.Length > 0 && !exact {
            createId = "create"
            while ids.Contains(createId) {
                createId += "-"
            }
            created = ComboBoxOption{
                Id: createId,
                Label: input.CreateText?.Invoke(creation) ?? "Create “" + creation + "”",
            }
            rows.Add(-1)
        }
        let removed = List[string]()
        for id in handles.Keys {
            if id != createId && !ids.Contains(id) {
                removed.Add(id)
            }
        }
        for id in removed {
            handles.Remove(id)
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
        ? (labels!!.Count == 0 ? current.Placeholder!!: String.Join(", ", labels!!))
        : selected?.Label ?? selected?.Id ?? current.Placeholder!!
        let valueContent = (input.Multiple ? nil: selected?.Content) ??
            Text{
            Content: label,
            Color: (input.Multiple ? labels!!.Count == 0: selected == nil) ? theme.MutedTextColor: theme.TextColor,
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
            BorderRadius: theme.ControlRadius,
            Focus: theme.FocusStyle,
        }
        if let create = current.CreateTrigger {
            button = create(current, button)
        }
        button.Key = "trigger"
        button.Handle = trigger
        button.Disabled = current.Disabled
        button.Focusable = !current.Disabled
        button.OnClick = () -> SetOpen(!isOpen)
        button.OnPointerDown = (event PointerEvent) -> pointerFocus = true
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
        var arrow Blob = MaterialIcons.Create("expand_more", 16, theme.MutedTextColor)
        if let create = current.CreateArrow {
            arrow = create(current, arrow)
        }
        arrow.Key = "arrow"
        button.Children.Add(arrow)
        var root = Container{
            Width: current.Width,
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
            current.PopupHeight,
            2.0 + ((current.Searchable || current.AllowFreeText) ? theme.ControlHeight + 1.0: 0.0) + Math.Max(
                theme.ControlHeight,
                float64(rows.Count) * current.RowHeight
            )
        )
        var popup = PopoverInput{
            Open: isOpen,
            Anchor: trigger,
            Placement: current.Placement,
            Content: BuildList(query, popupHeight),
            Width: current.Width,
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
        var activeHandle ElementHandle?
        if activeId != "" {
            activeHandle = Handle(activeId)
        }
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
                PlaceholderColor: theme.MutedTextColor,
                Cursor: Cursor.Text,
            }
            if let create = current.CreateSearch {
                entry = create(current, entry)
            }
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
        let keyboard = !pointerFocus && !current.Searchable && !current.AllowFreeText
        let indices = rows.ToArray()
        let items = current.Items ?? []ComboBoxOption{}
        let creation = created
        let key((ComboBoxRow) -> string) = (row ComboBoxRow) -> row.Item.Id!!
        let build((ComboBoxRow) -> Blob) = BuildRow
        let source = VirtualRowsSource[ComboBoxRow](
            []ComboBoxRow{},
            virtualItemExtent(current.RowHeight, "RowHeight"),
            key,
            build,
            nil
        ){
            Count = rows.Count,
            Get = (index int32) -> {
                let item = indices[index] < 0 ? creation: items[indices[index]]
                return ComboBoxRow{
                    Item: item,
                    Selected: indices[index] >= 0 && (snapshot.Multiple
                    ? Array.IndexOf(snapshot.SelectedIds ?? []string{}, item.Id!!) >= 0
                    : item.Id == snapshot.SelectedId),
                    Active: item.Id == selected,
                    KeyboardActive: item.Id == selected && keyboard,
                    Input: snapshot,
                }
            },
            Index = (id string) -> {
                for index in 0 ... indices.Length {
                    let item = indices[index] < 0 ? creation: items[indices[index]]
                    if item.Id == id {
                        return index
                    }
                }
                return -1
            },
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
            OnKeyDown: ListKey,
            OnFocus: (event FocusEvent) -> Reveal(),
            Accessibility: Accessibility{
                Role: AccessibilityRole.List,
                Name: current.AccessibilityName!!,
                SizeOfSet: rows.Count,
                Relationships: relationships
            }
        }
        if rows.Count == 0 {
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
            BorderRadius: theme.ControlRadius,
            BackgroundColor: row.Active ? theme.AccentColor.WithAlpha(0.15): Color.Transparent,
            Opacity: item.Disabled ? .45: 1.0,
            OutlineWidth: row.KeyboardActive ? 2.0: 0.0,
            OutlineColor: theme.AccentColor,
            OutlineOffset: -2.0,
        }
        if let create = row.Input.CreateRow {
            result = create(row.Input, item, result)
        }
        result.Key = id
        result.Handle = Handle(id)
        result.Height = row.Input.RowHeight
        result.MinHeight = row.Input.RowHeight
        result.MaxHeight = row.Input.RowHeight
        result.Focusable = false
        result.Disabled = item.Disabled
        result.OnClick = () -> Commit(id)
        result.OnPointerEnter = (event PointerEvent) -> {
            if !item.Disabled {
                activeId = id
                pointerFocus = true
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
                MaterialIcons.Create(row.Selected ? "check_box": "check_box_outline_blank", 18, theme.AccentColor)
            )
        }
        result.Children.Add(
            item.Content ??
                Text{
                Content: item.Label ?? id,
                Color: theme.TextColor,
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
            BackgroundColor: theme.OverlayColor,
            BorderColor: theme.InputBorderColor,
            BorderWidth: theme.BorderWidth,
            BorderRadius: theme.PanelRadius,
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
        for i in 0 ... rows.Count {
            if Option(i).Id == id && !Option(i).Disabled {
                return i
            }
        }
        return -1
    }

    private func First(last bool) string {
        for step in 0 ... rows.Count {
            let i = last ? rows.Count - 1 - step: step
            if !Option(i).Disabled {
                return Option(i).Id!!
            }
        }
        return ""
    }

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
            current.OnSelectedIdsChange?.Invoke(values.ToArray())
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
        pointerFocus = false
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
        pointerFocus = false
        if event.Key == Key.Home || event.Key == Key.End {
            activeId = First(event.Key == Key.End)
        } else {
            let direction = event.Key == Key.Down ? 1: -1
            let start = Index(activeId)
            for step in 1 ... rows.Count + 1 {
                let index = (Math.Max(0, start) + direction * step + rows.Count) % rows.Count
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
