package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import System
import System.Collections.Generic
import System.Globalization

public open partial class DataGrid {
    private func Prune(handles Dictionary[string, ElementHandle], ids HashSet[string]) {
        let removed = List[string]()
        for id in handles.Keys {
            if !ids.Contains(id) {
                removed.Add(id)
            }
        }
        for id in removed {
            handles.Remove(id)
        }
    }

    private func PruneRows() {
        let removed = List[string]()
        for id in rowHandles.Keys {
            if (id != activeId && !rowHandles[id].IsMounted) || RawIndex(id) < 0 {
                removed.Add(id)
            }
        }
        for id in removed {
            rowHandles.Remove(id)
        }
    }

    private func Handle(handles Dictionary[string, ElementHandle], id string) ElementHandle {
        if Object.ReferenceEquals(handles, rowHandles) && rowHandles.Count >= 4096 {
            PruneRows()
            if input.RowAt != nil {
                let retained = Dictionary[string, int32](rowHandles.Count, StringComparer.Ordinal)
                for key in rowHandles.Keys {
                    if indices.TryGetValue(key, out var index) {
                        retained.Add(key, index)
                    }
                }
                indices = retained
            }
        }
        if !handles.ContainsKey(id) {
            handles.Add(id, ElementHandle())
        }
        return handles[id]
    }

    private prop RowCount int32 {
        get -> input.RowAt == nil ? rows.Length: input.RowCount
    }

    private func Row(index int32) DataGridRow {
        let row = if let at = input.RowAt {
            at(index)
        } else {
            rows[index]
        }
        if String.IsNullOrEmpty(row.Id) {
            throw ArgumentException("Grid row IDs must be nonempty and unique")
        }
        if indices.TryGetValue(row.Id!!, out var previous) && previous != index {
            throw ArgumentException("Grid row IDs must be nonempty and unique")
        }
        indices[row.Id!!] = index
        return row
    }

    private func RawIndex(id string) int32 {
        if indices.TryGetValue(id, out var cached) {
            return cached
        }
        return input.RowIndex?.Invoke(id) ?? -1
    }

    private func Index(id string?) int32 {
        if id == nil {
            return -1
        }
        let index = RawIndex(id)
        if index < 0 || index >= RowCount {
            return -1
        }
        let row = Row(index)
        return row.Disabled || row.IsGroup ? -1: index
    }

    private func First(last bool) string? {
        for step in 0 ... RowCount {
            let row = Row(last ? RowCount - step - 1: step)
            if !row.Disabled && !row.IsGroup {
                return row.Id
            }
        }
        return nil
    }

    private func BuildRow(snapshot DataGridInput, row DataGridRow, details bool) Blob {
        let id = row.Id!!
        let isSelected = !row.IsGroup && snapshot.Selection != DataGridSelection.None && selected.Contains(id)
        let isExpanded = expanded.Contains(id) && (row.HasDetail || row.Detail != nil)
        let fullWidth = snapshot.CreateFullWidthRow?.Invoke(snapshot, row)
        let height = if let provider = snapshot.RowHeightProvider {
            float64(virtualItemExtent(provider(row), "RowHeightProvider"))
        } else {
            snapshot.RowHeight!!
        }
        let cells = Container{
            Key: "cells",
            Width: Percent(100),
            Height: height,
            FlexShrink: 0,
            FlexDirection: FlexDirection.Row,
            OutlineWidth: activeId == id && hasFocus && !pointerFocus ? theme.FocusRingWidth: 0.0,
            OutlineColor: snapshot.FocusColor!!,
            OutlineOffset: -theme.FocusRingWidth,
            BorderRadius: theme.RowInset > 0.0 ? theme.ControlRadius!!: 0.0,
        }
        if snapshot.AutoRowHeight {
            cells.Height = Length.Auto
            cells.MinHeight = height
            cells.AlignItems = AlignItems.Stretch
            if let maximum = snapshot.MaximumRowHeight {
                cells.MaxHeight = maximum
            }
        }
        if let content = fullWidth {
            cells.OnKeyDown = stopGridKeys
            cells.Children.Add(content)
        } else {
            if leading > 0.0 {
                let controls = Container{
                    Key: "leading",
                    Width: leading,
                    FlexShrink: 0,
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    Accessibility: Accessibility{Role: AccessibilityRole.GridCell, Name: theme.Text("Row controls")}
                }
                if snapshot.ShowSelection && snapshot.Selection != DataGridSelection.None {
                    var check = (
                        Checkbox{
                            State: isSelected ? AccessibilityChecked.True: AccessibilityChecked.False,
                            Size: 18
                        }.Build() as Button
                    )!!
                    if let create = snapshot.CreateSelection {
                        check = create(snapshot, row, check)
                    }
                    check.Focusable = false
                    check.TabStop = false
                    check.Disabled = row.Disabled ||
                        snapshot.Disabled ||
                        (
                        snapshot.OnSelectionRequest == nil &&
                            snapshot.OnSelectionChange == nil &&
                            snapshot.OnSelectionIndicesChange == nil
                    )
                    check.OnClick = () -> Select(id, true, false, false)
                    check.Accessibility = Accessibility{Hidden: true}
                    controls.Children.Add(
                        Container{
                            Key: "selection",
                            Width: snapshot.SelectionColumnWidth!!,
                            AlignItems: AlignItems.Center,
                            check
                        }
                    )
                }
                if details {
                    let expand = Button{
                        Width: Math.Min(theme.ControlHeight, snapshot.ExpandColumnWidth!!),
                        Height: Math.Min(theme.ControlHeight, snapshot.RowHeight!!),
                        Padding: theme.Spacing,
                        BackgroundColor: Color.Transparent,
                        Focusable: false,
                        TabStop: false,
                        Disabled: row.Disabled || snapshot.Disabled || snapshot.OnExpandedChange == nil,
                        OnClick: () -> Expand(id, !isExpanded, false),
                        Accessibility: Accessibility{Hidden: true},
                        ControlIcons.Create(isExpanded ? ControlIcon.ExpandMore: ControlIcon.ChevronRight, 16, snapshot.TextColor)
                    }
                    let slot = Container{
                        Key: "expansion",
                        Width: snapshot.ExpandColumnWidth!!,
                        AlignItems: AlignItems.Center
                    }
                    if row.HasDetail || row.Detail != nil {
                        slot.Children.Add(expand)
                    }
                    controls.Children.Add(slot)
                }
                cells.Children.Add(controls)
            }
            let unpinnedStart = Math.Max(firstColumn, pinnedCount)
            for step in 0 ... pinnedCount + endColumn - unpinnedStart {
                let index = step < pinnedCount ? step: unpinnedStart + step - pinnedCount
                if step == pinnedCount && beforeColumns > 0.0 {
                    cells.Children.Add(Container{Key: "before-columns", Width: beforeColumns, FlexShrink: 0})
                }
                let column = columns[index]
                var text = ""
                if let values = row.Values {
                    if values.TryGetValue(column.Id!!, out var found) {
                        text = found
                    }
                }
                var content Blob = if let create = snapshot.CreateCellContent {
                    create(snapshot, row, column)
                } else {
                    Text{
                        Content: text,
                        Color: isSelected ? theme.SelectedText(snapshot.TextColor!!): snapshot.TextColor!!,
                        TextWrap: snapshot.AutoRowHeight ? TextWrap.Wrap: TextWrap.NoWrap,
                        FontFamily: theme.FontFamily,
                        FontSize: theme.FontSize,
                        FontWeight: theme.FontWeight,
                    }
                }
                if let create = snapshot.CreateCell {
                    content = create(snapshot, row, column, content)
                }
                if column.AutoWidth && column.Width == nil && column.AutoWidthContent == nil {
                    content = MeasureWidth(column.Id!!, content)
                }
                cells.Children.Add(
                    Container{
                        Key: "column:" + column.Id!!,
                        Width: widths[index],
                        FlexShrink: 0,
                        MinWidth: 0,
                        Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
                        JustifyContent: JustifyContent.Center,
                        TextAlign: column.Alignment,
                        Overflow: Overflow.Hidden,
                        OnKeyDown: stopGridKeys,
                        Transform: PanelTransform{TranslateX: index < pinnedCount ? horizontalOffset: 0},
                        ZIndex: index < pinnedCount ? 1: 0,
                        BackgroundColor: index < pinnedCount ? (
                            isSelected ? snapshot.SelectedColor!!: hoveredId == id ? theme.HoverColor: snapshot.BackgroundColor!!
                        ): Color.Transparent,
                        Accessibility: Accessibility{
                            Role: AccessibilityRole.GridCell,
                            Name: column.Label ?? column.Id!!,
                            Value: text
                        },
                        content
                    }
                )
            }
            if afterColumns > 0.0 {
                cells.Children.Add(Container{Key: "after-columns", Width: afterColumns, FlexShrink: 0})
            }
        }
        var root = Container{
            BackgroundColor: isSelected ? snapshot.SelectedColor!!: Color.Transparent,
            Hover: Style{BackgroundColor: isSelected ? snapshot.SelectedColor!!: theme.HoverColor},
            BorderRadius: theme.RowInset > 0.0 ? theme.ControlRadius!!: 0.0,
            Opacity: row.Disabled ? .45: 1.0
        }
        if pinnedCount > 0 {
            root.OnPointerEnter = (e PointerEvent) -> {
                hoveredId = id
                Rebuild()
            }
            root.OnPointerLeave = (e PointerEvent) -> {
                hoveredId = nil
                Rebuild()
            }
        }
        if let create = snapshot.CreateRow {
            root = create(snapshot, row, root)
        }
        root.Key = id
        root.Handle = Handle(rowHandles, id)
        root.Width = tableWidth
        root.FlexDirection = FlexDirection.Column
        root.FlexShrink = 0
        root.MinHeight = height
        root.Focusable = false
        root.TabStop = false
        root.Disabled = row.Disabled || snapshot.Disabled
        root.OnPointerDown = (e PointerEvent) -> {
            clickModifiers = e.Modifiers
            clickFromInteractiveChild = e.IsFromInteractiveChild
            clickCount = e.Button == PointerButton.Primary ? e.ClickCount: 0
            if e.Button == PointerButton.Primary && !row.IsGroup {
                pointerFocus = true
                if activeId != id {
                    activeId = id
                    input.OnActiveRowIndexChange?.Invoke(RawIndex(id))
                    input.OnActiveRowChange?.Invoke(id)
                }
            }
        }
        let hostClick = root.OnClick
        root.OnClick = () -> {
            if !clickFromInteractiveChild {
                Select(id, clickModifiers.Ctrl || clickModifiers.Super, clickModifiers.Shift, false)
                if clickCount == 2 {
                    Invoke(id)
                }
            }
            hostClick?.Invoke()
        }
        let actions = List[AccessibilityAction]()
        if !row.Disabled && !row.IsGroup && !snapshot.Disabled {
            actions.Add(AccessibilityAction.Focus)
            actions.Add(AccessibilityAction.Activate)
            if snapshot.Selection != DataGridSelection.None &&
                (
                snapshot.OnSelectionRequest != nil ||
                    snapshot.OnSelectionChange != nil ||
                    snapshot.OnSelectionIndicesChange != nil
            ) {
                actions.Add(AccessibilityAction.Select)
                actions.Add(AccessibilityAction.Deselect)
            }
            if (row.HasDetail || row.Detail != nil) && snapshot.OnExpandedChange != nil {
                actions.Add(isExpanded ? AccessibilityAction.Collapse: AccessibilityAction.Expand)
            }
        }
        let semantics = Accessibility{
            Role: AccessibilityRole.Row,
            Name: row.Label ?? id,
            Selected: snapshot.Selection == DataGridSelection.None || row.IsGroup ? nil: isSelected,
            Expanded: (row.HasDetail || row.Detail != nil) ? isExpanded: nil,
            Actions: actions.ToArray()
        }
        if actions.Count > 0 {
            semantics.OnAction = (request AccessibilityActionRequest) -> RowAction(id, request)
        }
        root.Accessibility = semantics
        root.Children.Clear()
        root.Children.Add(cells)
        if isSelected && theme.Selection == SelectionStyle.Indicator {
            root.Children.Add(theme.SelectionBar())
        }
        if isExpanded {
            let detail = if snapshot.CreateDetail != nil {
                snapshot.CreateDetail!!(snapshot, row)
            } else {
                row.Detail ?? Container{}
            }
            root.Children.Add(
                Container{
                    Key: "detail",
                    Width: tableWidth,
                    Padding: Edges{
                        Left: leading + snapshot.DetailPadding!!,
                        Right: snapshot.DetailPadding!!,
                        Top: snapshot.DetailPadding!!,
                        Bottom: snapshot.DetailPadding!!
                    },
                    BackgroundColor: snapshot.DetailBackground!!,
                    OnKeyDown: stopGridKeys,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.GridCell,
                        Name: theme.Text("Details for {0}", row.Label ?? id)
                    },
                    detail
                }
            )
        }
        return root
    }

    private func Activate(id string, reveal bool = true) {
        if Index(id) < 0 || input.Disabled {
            return
        }
        let changed = activeId != id
        activeId = id
        rootHandle.Focus()
        if reveal {
            Reveal()
        }
        if changed {
            input.OnActiveRowIndexChange?.Invoke(RawIndex(id))
            input.OnActiveRowChange?.Invoke(id)
        }
    }

    private func Reveal() {
        if activeId == nil || Index(activeId) < 0 {
            return
        }
        let handle = Handle(rowHandles, activeId!!)
        if handle.IsMounted {
            let row = handle.BorderBox
            let view = viewport.ContentBox
            let offset = viewport.ScrollOffset
            if row.Y < view.Y {
                viewport.JumpTo(offset.X, Math.Max(0.0, offset.Y + row.Y - view.Y))
            } else if row.Y + row.Height > view.Y + view.Height {
                viewport.JumpTo(offset.X, offset.Y + row.Y + row.Height - view.Y - view.Height)
            }
        } else if let row = virtualRows?.Current?.BoundsOf(activeId!!) {
            let view = viewport.ContentBox
            let offset = viewport.ScrollOffset
            if row.Y < offset.Y {
                viewport.JumpTo(offset.X, row.Y)
            } else if row.Y + row.Height > offset.Y + view.Height {
                viewport.JumpTo(offset.X, row.Y + row.Height - view.Height)
            }
        }
    }

    private func Select(id string, toggle bool, extend bool, reveal bool = true) {
        if Index(id) < 0 || input.Disabled {
            return
        }
        Activate(id, reveal)
        if input.Selection == DataGridSelection.None ||
            (
            input.OnSelectionRequest == nil && input.OnSelectionChange == nil && input.OnSelectionIndicesChange == nil
        ) {
            return
        }
        if let request = input.OnSelectionRequest {
            request(id, toggle, extend)
            return
        }
        let next = List[string]()
        if input.Selection == DataGridSelection.Single {
            if !toggle || !selected.Contains(id) {
                next.Add(id)
            }
        } else if extend && Index(anchorId) >= 0 {
            let start = Math.Min(Index(anchorId), Index(id))
            let end = Math.Max(Index(anchorId), Index(id))
            for current in anchorSelection {
                next.Add(current)
            }
            for index in start ... end + 1 {
                let row = Row(index)
                if !row.Disabled && !row.IsGroup && !anchorSelection.Contains(row.Id!!) {
                    next.Add(row.Id!!)
                }
            }
        } else {
            if toggle {
                for current in selected {
                    if current != id {
                        next.Add(current)
                    }
                }
            }
            if !toggle || !selected.Contains(id) {
                next.Add(id)
            }
        }
        if !extend && (!toggle || !selected.Contains(id)) {
            anchorId = id
            anchorSelection = HashSet[string](next, StringComparer.Ordinal)
        }
        if let changed = input.OnSelectionIndicesChange {
            let positions = [next.Count]int32
            for index in 0 ... next.Count {
                positions[index] = RawIndex(next[index])
            }
            changed(positions)
        }
        input.OnSelectionChange?.Invoke(next.ToArray())
    }

    private func Expand(id string, state bool, reveal bool = true) {
        if Index(id) < 0 || input.Disabled || !(Row(Index(id)).HasDetail || Row(Index(id)).Detail != nil) {
            return
        }
        Activate(id, reveal)
        input.OnExpandedChange?.Invoke(id, state)
    }

    private func Invoke(id string) {
        if !input.Disabled && Index(id) >= 0 {
            input.OnRowInvoke?.Invoke(id)
        }
    }

    private func RowAction(id string, request AccessibilityActionRequest) bool {
        if Index(id) < 0 || input.Disabled {
            return false
        }
        if request.Action == AccessibilityAction.Focus {
            Activate(id)
            return true
        }
        if request.Action == AccessibilityAction.Activate {
            Select(id, false, false)
            Invoke(id)
            return true
        }
        if (request.Action == AccessibilityAction.Select || request.Action == AccessibilityAction.Deselect) &&
            input.Selection != DataGridSelection.None &&
            (
            input.OnSelectionRequest != nil || input.OnSelectionChange != nil || input.OnSelectionIndicesChange != nil
        ) {
            let desired = request.Action == AccessibilityAction.Select
            if selected.Contains(id) != desired {
                Select(id, input.Selection == DataGridSelection.Multiple || !desired, false)
            }
            return true
        }
        if (request.Action == AccessibilityAction.Expand || request.Action == AccessibilityAction.Collapse) &&
            input.OnExpandedChange != nil
        && (Row(Index(id)).HasDetail || Row(Index(id)).Detail != nil) {
            Expand(id, request.Action == AccessibilityAction.Expand)
            return true
        }
        return false
    }

    private func StopGridKeys(e KeyEvent) {
        if (
            e.Key == Key.Down ||
                e.Key == Key.Up ||
                e.Key == Key.Home ||
                e.Key == Key.End ||
                e.Key == Key.PageUp ||
                e.Key == Key.PageDown ||
                e.Key == Key.Left ||
                e.Key == Key.Right ||
                e.Key == Key.Space ||
                e.Key == Key.Enter
        ) {
            e.StopPropagation()
        }
    }

    private func KeyDown(e KeyEvent) {
        if input.Disabled || !hasFocus {
            return
        }
        var next = Index(activeId)
        if e.Key == Key.Down || e.Key == Key.Up {
            let delta = e.Key == Key.Down ? 1: -1
            next += delta
            while next >= 0 && next < RowCount && (Row(next).Disabled || Row(next).IsGroup) {
                next += delta
            }
        } else if e.Key == Key.Home {
            next = Index(First(false))
        } else if e.Key == Key.End {
            next = Index(First(true))
        } else if e.Key == Key.PageUp || e.Key == Key.PageDown {
            let delta = e.Key == Key.PageDown ? 1: -1
            var remaining = viewport.ContentBox.Height
            var moved = false
            while next >= 0 && next < RowCount {
                let candidate = next + delta
                if candidate < 0 || candidate >= RowCount {
                    break
                }
                let row = Row(delta > 0 ? next: candidate)
                let height = if rowHandles.TryGetValue(row.Id!!, out var handle) && handle.IsMounted {
                    handle.BorderBox.Height
                } else {
                    input.RowHeightProvider?.Invoke(row) ?? input.RowHeight!!
                }
                if moved && height > remaining {
                    break
                }
                remaining -= height
                next = candidate
                moved = true
            }
            while next >= 0 && next < RowCount && (Row(next).Disabled || Row(next).IsGroup) {
                next += delta
            }
        } else if e.Key == Key.Space || e.Key == Key.Enter {
            if activeId != nil {
                Select(activeId!!, e.Key == Key.Space || e.Modifiers.Ctrl || e.Modifiers.Super, e.Modifiers.Shift)
                if e.Key == Key.Enter && !e.Repeat {
                    Invoke(activeId!!)
                }
            }
        } else if e.Key == Key.Left || e.Key == Key.Right {
            if activeId != nil {
                Expand(activeId!!, e.Key == Key.Right)
            }
        } else {
            return
        }
        e.PreventDefault()
        e.StopPropagation()
        if next >= 0 && next < RowCount {
            if e.Key == Key.Down ||
                e.Key == Key.Up ||
                e.Key == Key.Home ||
                e.Key == Key.End ||
                e.Key == Key.PageUp ||
                e.Key == Key
                .PageDown {
                if (e.Modifiers.Ctrl || e.Modifiers.Super) && !e.Modifiers.Shift {
                    Activate(Row(next).Id!!)
                } else {
                    Select(Row(next).Id!!, e.Modifiers.Ctrl || e.Modifiers.Super, e.Modifiers.Shift)
                }
            } else {
                Activate(Row(next).Id!!)
            }
        }
    }

}
