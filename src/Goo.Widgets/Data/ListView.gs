package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import System
import System.Collections.Generic

/// A selectable row with a stable identity and optional content slots.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
/// Root configuration targets the returned outermost layout element.
public data struct ListViewItem {
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string?
    /// Visible and accessible label. Nil uses the item ID.
    var Label string?
    /// Secondary row text. Nil omits it.
    var Caption string?
    /// Content before the label. Nil leaves this slot empty.
    var Leading Blob?
    /// Content after the editor or label. Nil leaves this slot empty.
    var Trailing Blob?
    /// Action content shown with the item. Nil leaves this slot empty.
    var Actions Blob?
    /// Optional displayed count. Nil omits the count.
    var Count int32?
    /// Marks the row as unread without changing selection.
    var Unread bool
    /// Uses subdued row presentation without disabling interaction.
    var Muted bool
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
}

/// A labeled group. Its header is not selectable.
public data struct ListViewSection {
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string?
    /// Visible and accessible label. Nil uses the item ID.
    var Label string?
    /// Rows in this section in display order. Nil supplies an empty section.
    var Items[]?ListViewItem
}

/// Controlled list contents, selection, focus, and row factories.
public data struct ListViewInput {
    /// Ungrouped rows in display order. Nil supplies no ungrouped rows. IDs must be stable and unique.
    var Items[]?ListViewItem
    /// Grouped rows in display order. Nil supplies no sections. Row IDs must remain unique across sections.
    var Sections[]?ListViewSection
    /// Controlled selected item IDs. Nil means an empty selection.
    var SelectedIds[]?string
    /// Enables set selection instead of single selection. False limits selection to one item.
    var Multiple bool
    /// Receives a new array of selected IDs after user input. An empty array clears selection. Nil ignores the request.
    var OnSelectionChange Action[[]string]?
    /// Receives the activated item ID. Nil ignores activation.
    var OnClick Action[string]?
    /// Controlled keyboard-active item ID, independent of selection. Nil lets the widget choose an eligible item.
    var ActiveId string?
    /// Receives the new keyboard-active item ID after navigation. Nil ignores the notification.
    var OnActiveChange Action[string]?
    /// Filter text. Nil uses an empty query.
    var Query string?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Root layout width. Nil fills the available width.
    var Width Length?
    /// Root layout height. Nil uses 280 and grows or shrinks to fill the free space of the parent.
    var Height Length?
    /// Finite positive row height in logical pixels. Nil uses the theme control height.
    var RowHeight float64?
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Configures the fresh row before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Actions, Accessibility.Name, Accessibility.OnAction, Accessibility.PositionInSet, Accessibility.Role, Accessibility.Selected, Accessibility.SizeOfSet, Disabled, Focusable, Handle, OnClick, OnPointerDown, TabStop.
    var ConfigureRow Action[ListViewInput, ListViewItem, Container]?
    /// Configures the fresh root before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.MultiSelectable, Accessibility.Name, Accessibility.Relationships.ActiveDescendant, Accessibility.Role, Disabled, FocusTarget, Focusable, Handle, OnBlur, OnKeyDown.
    var ConfigureRoot Action[ListViewInput, Container]?
}

internal data struct ListViewEntry {
    var Id string
    var Item ListViewItem
    var Header string?
    var PositionInSet int32
}

/// A virtual list with controlled selection and one keyboard focus target.
public open class ListView : Cell[ListViewInput] {
    private let rootHandle ElementHandle = ElementHandle()
    private let viewport ElementHandle = ElementHandle()
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private let typeAhead TypeAhead = TypeAhead()
    private var entries List[ListViewEntry] = List[ListViewEntry]()
    private var indices Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
    private var selected HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private var prepared bool
    private var hasCaption bool
    private var searchable List[string] = List[string]()
    private var input ListViewInput
    private var theme Theme
    private var activeId string?
    private var anchorId string?
    private var modifiers KeyModifiers
    private var fromChild bool
    private var presses int32

    protected override func Build(value ListViewInput) Blob {
        let prepare = !prepared || !Object.ReferenceEquals(input.Items, value.Items) ||
            !Object.ReferenceEquals(input.Sections, value.Sections) || input.Query != value.Query
        theme = Theme.Read()
        let height Length = 280
        input = value with{
            Width = value.Width ?? Percent(100),
            Height = value.Height ?? height,
            RowHeight = value.RowHeight ?? theme.ControlHeight,
            AccessibilityName = value.AccessibilityName ?? theme.Text("List")
        }
        if !Double.IsFinite(input.RowHeight!!) || input.RowHeight!!<= 0 {
            prepared = false
            throw ArgumentOutOfRangeException("RowHeight")
        }
        selected = HashSet[string](input.SelectedIds ?? []string{}, StringComparer.Ordinal)
        if prepare {
            prepared = false
            entries = List[ListViewEntry]()
            indices = Dictionary[string, int32](StringComparer.Ordinal)
            searchable = List[string]()
            hasCaption = false
            let ids = HashSet[string](StringComparer.Ordinal)
            AddItems(input.Items ?? []ListViewItem{}, ids)
            for section in input.Sections ?? []ListViewSection{} {
                if String.IsNullOrEmpty(section.Id) || !ids.Add("\0" + section.Id) {
                    throw ArgumentException("List section IDs must be nonempty and unique.")
                }
                let header = entries.Count
                entries.Add(ListViewEntry{Id: "\0" + section.Id, Header: section.Label ?? section.Id})
                AddItems(section.Items ?? []ListViewItem{}, ids)
                if entries.Count == header + 1 {
                    entries.RemoveAt(header)
                }
            }
            for index in 0 ... entries.Count {
                let entry = entries[index]
                if entry.Header == nil {
                    indices.Add(entry.Id, index)
                    hasCaption = hasCaption || entry.Item.Caption != nil
                    entries[index] = entry with{PositionInSet = indices.Count - 1}
                    if !entry.Item.Disabled {
                        searchable.Add(entry.Id)
                    }
                }
            }
            let removed = List[string]()
            for pair in handles {
                if !indices.ContainsKey(pair.Key) {
                    removed.Add(pair.Key)
                }
            }
            for id in removed {
                handles.Remove(id)
            }
            typeAhead.Items = searchable
            prepared = true
        }
        if value.RowHeight == nil && hasCaption {
            input.RowHeight = Math.Max(
                theme.ControlHeight,
                (theme.FontSize + theme.CaptionFontSize) * theme.LineHeight + theme.Spacing
            )
        }
        if Index(input.ActiveId) >= 0 {
            activeId = input.ActiveId
        }
        if Index(activeId) < 0 {
            activeId = searchable.Count == 0 ? nil: searchable[0]
        }
        typeAhead.TextForId = (id string) -> {
            let index = indices[id]
            return entries[index].Item.Label ?? id
        }
        typeAhead.OnMatch = Activate
        let snapshot = input
        let key((ListViewEntry) -> string) = (entry ListViewEntry) -> entry.Id
        let build((ListViewEntry) -> Blob) = (entry ListViewEntry) -> BuildRow(snapshot, entry)
        let source = VirtualRowsSource[ListViewEntry](
            entries,
            virtualItemExtent(input.RowHeight!!, "RowHeight"),
            key,
            build,
            nil
        )
        source.StableItems = true
        let rows Virtual = Virtual{Source: source}
        rows.Handle = viewport
        rows.FlexGrow = 1
        rows.MinHeight = 0
        rows.OverflowY = Overflow.Scroll
        rows.OverflowX = Overflow.Hidden
        rows.ScrollbarY = theme.Scrollbar
        var root = Container{
            Width: input.Width!!,
            Height: input.Height!!,
            MinWidth: 0,
            MinHeight: 0,
            BackgroundColor: theme.PanelColor,
            BorderRadius: theme.PanelRadius!!,
            Padding: Edges{Right: theme.RowInset, Left: theme.RowInset},
        }
        if value.Height == nil {
            root.FlexGrow = 1
            root.FlexShrink = 1
        }
        root.Children.Clear()
        root.Children.Add(rows)
        if let configure = input.ConfigureRoot {
            let originalAccessibilityMultiSelectable = root.Accessibility?.MultiSelectable
            let originalAccessibilityName = (root.Accessibility?.Name ?? "")
            let originalAccessibilityRole = (root.Accessibility?.Role ?? AccessibilityRole(0))
            let originalDisabled = root.Disabled
            let originalFocusTarget = root.FocusTarget
            let originalFocusable = root.Focusable
            let originalHandle = root.Handle
            let originalOnBlur = root.OnBlur
            let originalOnKeyDown = root.OnKeyDown
            configure.Invoke(input, root)
            if root.Accessibility?.MultiSelectable != originalAccessibilityMultiSelectable {
                throw InvalidOperationException("ListView owns Accessibility.MultiSelectable; configure ListViewInput instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("ListView owns Accessibility.Name; set ListViewInput.AccessibilityName instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("ListView owns Accessibility.Role; configure ListViewInput instead of changing it in ConfigureRoot")
            }
            if root.Disabled != originalDisabled {
                throw InvalidOperationException("ListView owns Disabled; set ListViewInput.Disabled instead of changing it in ConfigureRoot")
            }
            if root.FocusTarget != originalFocusTarget {
                throw InvalidOperationException("ListView owns FocusTarget; configure ListViewInput instead of changing it in ConfigureRoot")
            }
            if root.Focusable != originalFocusable {
                throw InvalidOperationException("ListView owns Focusable; configure ListViewInput instead of changing it in ConfigureRoot")
            }
            if root.Handle != originalHandle {
                throw InvalidOperationException("ListView owns Handle; configure ListViewInput instead of changing it in ConfigureRoot")
            }
            if root.OnBlur != originalOnBlur {
                throw InvalidOperationException("ListView owns OnBlur; configure ListViewInput instead of changing it in ConfigureRoot")
            }
            if root.OnKeyDown != originalOnKeyDown {
                throw InvalidOperationException("ListView owns OnKeyDown; configure ListViewInput instead of changing it in ConfigureRoot")
            }
        }
        root.Handle = rootHandle
        root.Focusable = !input.Disabled
        root.Disabled = input.Disabled
        root.OnKeyDown = KeyDown
        root.OnBlur = (e FocusEvent) -> typeAhead.Reset()
        root.FocusTarget = activeId == nil ? nil: Handle(activeId!!)
        let rootAccessibility = if let configured = root.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        rootAccessibility.Role = AccessibilityRole.List
        rootAccessibility.Name = input.AccessibilityName!!
        rootAccessibility.MultiSelectable = input.Multiple
        let rootRelationships = if let configured = rootAccessibility.Relationships { AccessibilityRelationships{...configured} } else { AccessibilityRelationships{} }
        rootRelationships.ActiveDescendant = activeId == nil ? nil: Handle(activeId!!)
        rootAccessibility.Relationships = rootRelationships
        root.Accessibility = rootAccessibility
        return root
    }

    private func AddItems(items[]ListViewItem, ids HashSet[string]) {
        for item in items {
            if String.IsNullOrEmpty(item.Id) || item.Id!!.Contains('\0') || !ids.Add(item.Id!!) {
                throw ArgumentException("List item IDs must be nonempty and unique.")
            }
            if !String.IsNullOrEmpty(input.Query) && !(item.Label ?? item.Id!!).Contains(
                input.Query!!,
                StringComparison.OrdinalIgnoreCase
            ) &&
                !(item.Caption ?? "").Contains(input.Query!!, StringComparison.OrdinalIgnoreCase) {
                continue
            }
            entries.Add(ListViewEntry{Id: item.Id!!, Item: item})
        }
    }

    private func Handle(id string) ElementHandle {
        if !handles.ContainsKey(id) {
            handles.Add(id, ElementHandle())
        }
        return handles[id]
    }

    private func Index(id string?) int32 {
        if id == nil || !indices.ContainsKey(id) {
            return -1
        }
        let index = indices[id]
        return entries[index].Item.Disabled ? -1: index
    }

    private func Next(index int32, key Key) int32 -> RovingFocus.Next[ListViewEntry](
        entries,
        index,
        key,
        AccessibilityOrientation.Vertical,
        false,
        (entry ListViewEntry) -> entry.Header != nil || entry.Item.Disabled
    )

    private func Activate(id string) {
        if Index(id) < 0 || input.Disabled {
            return
        }
        activeId = id
        InvokeInputCallback(input.OnActiveChange, id)
        rootHandle.Focus()
        rootHandle.SetFocusTarget(Handle(id))
        if !Handle(id).ScrollIntoView() {
            viewport.ScrollToItem(id)
        }
    }

    private func Select(id string, toggle bool, extend bool) {
        let previous = activeId
        Activate(id)
        let values = HashSet[string](StringComparer.Ordinal)
        if input.Multiple && toggle {
            values.UnionWith(selected)
        }
        if input.Multiple && extend {
            let anchor = Index(anchorId) >= 0 ? Index(anchorId): Math.Max(0, Index(previous))
            let target = Index(id)
            for index in Math.Min(anchor, target) ... Math.Max(anchor, target) + 1 {
                let entry = entries[index]
                if entry.Header == nil && !entry.Item.Disabled {
                    values.Add(entry.Id)
                }
            }
        } else {
            if !values.Add(id) {
                values.Remove(id)
            }
            anchorId = id
        }
        let ordered = List[string]()
        for entry in entries {
            if values.Contains(entry.Id) {
                ordered.Add(entry.Id)
            }
        }
        if let callback = input.OnSelectionChange {
            InvokeInputCallback(callback, ordered.ToArray())
        }
    }

    private func BuildRow(snapshot ListViewInput, entry ListViewEntry) Blob {
        if let header = entry.Header {
            return Container{
                Height: snapshot.RowHeight!!,
                Padding: theme.ControlPadding,
                Accessibility: Accessibility{Role: AccessibilityRole.Heading, Name: header},
                Text{Content: header, Color: theme.MutedTextColor, FontWeight: theme.LabelFontWeight}
            }
        }
        let item = entry.Item
        let id = entry.Id
        var trailing = item.Trailing
        if trailing == nil && item.Count != nil {
            trailing = Text{Content: item.Count!!.ToString(), Color: theme.MutedTextColor}
        }
        var root = (
            ListRow{
                Title: item.Label ?? id,
                Caption: item.Caption,
                Leading: item.Leading,
                Trailing: trailing,
                Actions: item.Actions,
                ShowActionsOnHover: false,
                Selected: selected.Contains(id),
                TitleFontWeight: item.Unread ? theme.HeadingFontWeight: theme.FontWeight,
                TextColor: item.Muted ? theme.MutedTextColor: theme.TextColor,
                MinHeight: snapshot.RowHeight,
                PaddingVertical: 0
            }.Build() as Container
        )!!
        if let configure = snapshot.ConfigureRow {
            let originalAccessibilityName = (root.Accessibility?.Name ?? "")
            let originalAccessibilityOnAction = root.Accessibility?.OnAction
            let originalAccessibilityPositionInSet = root.Accessibility?.PositionInSet
            let originalAccessibilityRole = (root.Accessibility?.Role ?? AccessibilityRole(0))
            let originalAccessibilitySelected = root.Accessibility?.Selected
            let originalAccessibilitySizeOfSet = root.Accessibility?.SizeOfSet
            let originalDisabled = root.Disabled
            let originalFocusable = root.Focusable
            let originalHandle = root.Handle
            let originalOnClick = root.OnClick
            let originalOnPointerDown = root.OnPointerDown
            let originalTabStop = root.TabStop
            configure.Invoke(snapshot, item, root)
            if (root.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("ListView owns Accessibility.Name; set ListViewInput.AccessibilityName instead of changing it in ConfigureRow")
            }
            if root.Accessibility?.OnAction != originalAccessibilityOnAction {
                throw InvalidOperationException("ListView owns Accessibility.OnAction; configure ListViewInput instead of changing it in ConfigureRow")
            }
            if root.Accessibility?.PositionInSet != originalAccessibilityPositionInSet {
                throw InvalidOperationException("ListView owns Accessibility.PositionInSet; configure ListViewInput instead of changing it in ConfigureRow")
            }
            if (root.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("ListView owns Accessibility.Role; configure ListViewInput instead of changing it in ConfigureRow")
            }
            if root.Accessibility?.Selected != originalAccessibilitySelected {
                throw InvalidOperationException("ListView owns Accessibility.Selected; configure ListViewInput instead of changing it in ConfigureRow")
            }
            if root.Accessibility?.SizeOfSet != originalAccessibilitySizeOfSet {
                throw InvalidOperationException("ListView owns Accessibility.SizeOfSet; configure ListViewInput instead of changing it in ConfigureRow")
            }
            if root.Disabled != originalDisabled {
                throw InvalidOperationException("ListView owns Disabled; set ListViewInput.Disabled instead of changing it in ConfigureRow")
            }
            if root.Focusable != originalFocusable {
                throw InvalidOperationException("ListView owns Focusable; configure ListViewInput instead of changing it in ConfigureRow")
            }
            if root.Handle != originalHandle {
                throw InvalidOperationException("ListView owns Handle; configure ListViewInput instead of changing it in ConfigureRow")
            }
            if root.OnClick != originalOnClick {
                throw InvalidOperationException("ListView owns OnClick; set ListViewInput.OnClick instead of changing it in ConfigureRow")
            }
            if root.OnPointerDown != originalOnPointerDown {
                throw InvalidOperationException("ListView owns OnPointerDown; configure ListViewInput instead of changing it in ConfigureRow")
            }
            if root.TabStop != originalTabStop {
                throw InvalidOperationException("ListView owns TabStop; configure ListViewInput instead of changing it in ConfigureRow")
            }
        }
        root.Handle = Handle(id)
        root.Height = snapshot.RowHeight!!
        root.Focusable = false
        root.TabStop = false
        root.Disabled = item.Disabled || snapshot.Disabled
        theme.ApplyInteraction(root, InteractionFamily.Row, selected.Contains(id))
        root.OnPointerDown = (e PointerEvent) -> {
            modifiers = e.Modifiers
            fromChild = e.IsFromInteractiveChild
            presses = e.ClickCount
        }
        root.OnClick = () -> {
            if !fromChild {
                Select(id, modifiers.HasPrimary, modifiers.Shift)
                if presses == 2 {
                    InvokeInputCallback(input.OnClick, id)
                }
            }
        }
        let rootAccessibility = if let configured = root.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        rootAccessibility.Role = AccessibilityRole.ListItem
        rootAccessibility.Name = item.Label ?? id
        rootAccessibility.Selected = selected.Contains(id)
        rootAccessibility.PositionInSet = entry.PositionInSet
        rootAccessibility.SizeOfSet = indices.Count
        rootAccessibility.Actions = []AccessibilityAction{
                AccessibilityAction.Focus,
                AccessibilityAction.Select,
                AccessibilityAction.Activate
            }
        rootAccessibility.OnAction = (request AccessibilityActionRequest) -> {
                if item.Disabled || snapshot.Disabled {
                    return false
                }
                if request.Action == AccessibilityAction.Focus {
                    Activate(id)
                } else if request.Action == AccessibilityAction.Select {
                    Select(id, false, false)
                } else if request.Action == AccessibilityAction.Activate {
                    InvokeInputCallback(input.OnClick, id)
                } else {
                    return false
                }
                return true
            }
        root.Accessibility = rootAccessibility
        return root
    }

    private func KeyDown(e KeyEvent) {
        if input.Disabled || Index(activeId) < 0 {
            return
        }
        let primary = e.Modifiers.HasPrimary
        if primary && e.Key == Key.A && input.Multiple {
            let ids = List[string]()
            for entry in entries {
                if entry.Header == nil && !entry.Item.Disabled {
                    ids.Add(entry.Id)
                }
            }
            if let callback = input.OnSelectionChange {
                InvokeInputCallback(callback, ids.ToArray())
            }
        } else if e.Key == Key.Up || e.Key == Key.Down || e.Key == Key.Home || e.Key == Key.End {
            let next = Next(Index(activeId), e.Key)
            if next >= 0 {
                if primary && !e.Modifiers.Shift {
                    Activate(entries[next].Id)
                } else {
                    Select(entries[next].Id, primary, e.Modifiers.Shift)
                }
            }
        } else if e.Key == Key.Space {
            Select(activeId!!, primary, e.Modifiers.Shift)
        } else if e.Key == Key.Enter {
            InvokeInputCallback(input.OnClick, activeId!!)
        } else {
            typeAhead.ActiveId = activeId
            typeAhead.HandleKey(e)
            return
        }
        e.PreventDefault()
        e.StopPropagation()
    }
}
