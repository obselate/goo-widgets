package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import System
import System.Collections.Generic

/// A selectable row with a stable identity and optional content slots.
public data struct ListViewItem {
    var Id string?
    var Label string?
    var Caption string?
    var Leading Blob?
    var Trailing Blob?
    var Actions Blob?
    var Count int32?
    var Unread bool
    var Muted bool
    var Disabled bool
}

/// A labeled group. Its header is not selectable.
public data struct ListViewSection {
    var Id string?
    var Label string?
    var Items[]?ListViewItem
}

/// Controlled list contents, selection, focus, and row factories.
public data struct ListViewInput {
    var Items[]?ListViewItem
    var Sections[]?ListViewSection
    var SelectedIds[]?string
    var Multiple bool
    var OnSelectionChange Action[[]string]?
    var OnInvoke Action[string]?
    var ActiveId string?
    var OnActiveChange Action[string]?
    var Query string?
    var Disabled bool
    var Width Length?
    var Height Length?
    var RowHeight float64?
    var AccessibilityName string?
    var CreateRow Func[ListViewInput, ListViewItem, Container, Container]?
    var CreateRoot Func[ListViewInput, Container, Container]?
}

internal data struct ListViewEntry {
    var Id string
    var Item ListViewItem
    var Header string?
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
    private var input ListViewInput
    private var theme Theme
    private var activeId string?
    private var anchorId string?
    private var focused bool
    private var modifiers KeyModifiers
    private var fromChild bool
    private var presses int32

    protected override func Build(value ListViewInput) Blob {
        theme = Theme.Read()
        let height Length = 280
        input = value with{
            Width = value.Width ?? Percent(100),
            Height = value.Height ?? height,
            RowHeight = value.RowHeight ?? theme.ControlHeight,
            AccessibilityName = value.AccessibilityName ?? theme.Text("List")
        }
        if !Double.IsFinite(input.RowHeight!!) || input.RowHeight!!<= 0 {
            throw ArgumentOutOfRangeException("RowHeight")
        }
        entries = List[ListViewEntry]()
        indices = Dictionary[string, int32](StringComparer.Ordinal)
        selected = HashSet[string](input.SelectedIds ?? []string{}, StringComparer.Ordinal)
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
        let searchable = List[string]()
        var hasCaption bool
        for index in 0 ... entries.Count {
            let entry = entries[index]
            if entry.Header == nil {
                indices.Add(entry.Id, index)
                hasCaption = hasCaption || entry.Item.Caption != nil
                if !entry.Item.Disabled {
                    searchable.Add(entry.Id)
                }
            }
        }
        if value.RowHeight == nil && hasCaption {
            input.RowHeight = Math.Max(
                theme.ControlHeight,
                (theme.FontSize + theme.CaptionFontSize) * theme.LineHeight + theme.Spacing
            )
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
        if Index(input.ActiveId) >= 0 {
            activeId = input.ActiveId
        }
        if Index(activeId) < 0 {
            let first = Next(-1, Key.Home)
            activeId = first < 0 ? nil: entries[first].Id
        }
        typeAhead.Items = searchable
        typeAhead.TextForId = (id string) -> {
            let index = indices[id]
            return entries[index].Item.Label ?? id
        }
        typeAhead.OnMatch = Activate
        let snapshot = input
        let key((ListViewEntry) -> string) = (entry ListViewEntry) -> entry.Id
        let build((ListViewEntry) -> Blob) = (entry ListViewEntry) -> BuildRow(snapshot, entry)
        let rows Virtual = Virtual(
            VirtualRowsSource[ListViewEntry](
                entries,
                virtualItemExtent(input.RowHeight!!, "RowHeight"),
                key,
                build,
                nil
            )
        )
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
            BorderRadius: theme.PanelRadius,
            Padding: Edges{Right: theme.RowInset, Left: theme.RowInset},
            Focus: theme.FocusStyle
        }
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.Handle = rootHandle
        root.Focusable = !input.Disabled
        root.Disabled = input.Disabled
        root.OnKeyDown = KeyDown
        root.OnFocus = (e FocusEvent) -> focused = true
        root.OnBlur = (e FocusEvent) -> {
            focused = false
            typeAhead.Reset()
        }
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.List,
            Name: input.AccessibilityName!!,
            MultiSelectable: input.Multiple,
            Relationships: AccessibilityRelationships{ActiveDescendant: activeId == nil ? nil: Handle(activeId!!)}
        }
        root.Children.Clear()
        root.Children.Add(rows)
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
        input.OnActiveChange?.Invoke(id)
        rootHandle.Focus()
        viewport.ScrollToItem(id)
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
        input.OnSelectionChange?.Invoke(ordered.ToArray())
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
        if let create = snapshot.CreateRow {
            root = create(snapshot, item, root)
        }
        root.Handle = Handle(id)
        root.Height = snapshot.RowHeight!!
        root.Focusable = false
        root.TabStop = false
        root.Disabled = item.Disabled || snapshot.Disabled
        root.Opacity = item.Disabled ? .45: 1
        root.Hover = Style{BackgroundColor: theme.HoverColor}
        root.OutlineWidth = activeId == id && focused ? theme.FocusRingWidth: 0.0
        root.OutlineColor = theme.FocusColor
        root.OutlineOffset = -theme.FocusRingWidth
        root.OnPointerDown = (e PointerEvent) -> {
            modifiers = e.Modifiers
            fromChild = e.IsFromInteractiveChild
            presses = e.ClickCount
        }
        root.OnClick = () -> {
            if !fromChild {
                Select(id, modifiers.Ctrl || modifiers.Super, modifiers.Shift)
                if presses == 2 {
                    input.OnInvoke?.Invoke(id)
                }
            }
        }
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.ListItem,
            Name: item.Label ?? id,
            Selected: selected.Contains(id),
            Actions: []AccessibilityAction{
                AccessibilityAction.Focus,
                AccessibilityAction.Select,
                AccessibilityAction.Activate
            },
            OnAction: (request AccessibilityActionRequest) -> {
                if item.Disabled || snapshot.Disabled {
                    return false
                }
                if request.Action == AccessibilityAction.Focus {
                    Activate(id)
                } else if request.Action == AccessibilityAction.Select {
                    Select(id, false, false)
                } else if request.Action == AccessibilityAction.Activate {
                    input.OnInvoke?.Invoke(id)
                } else {
                    return false
                }
                return true
            }
        }
        return root
    }

    private func KeyDown(e KeyEvent) {
        if input.Disabled || Index(activeId) < 0 {
            return
        }
        let primary = e.Modifiers.Ctrl || e.Modifiers.Super
        if primary && e.Key == Key.A && input.Multiple {
            let ids = List[string]()
            for entry in entries {
                if entry.Header == nil && !entry.Item.Disabled {
                    ids.Add(entry.Id)
                }
            }
            input.OnSelectionChange?.Invoke(ids.ToArray())
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
            input.OnInvoke?.Invoke(activeId!!)
        } else {
            typeAhead.ActiveId = activeId
            typeAhead.HandleKey(e)
            return
        }
        e.PreventDefault()
        e.StopPropagation()
    }
}
