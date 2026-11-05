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
            cellHandles.Remove(id)
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
            if !row.Disabled && (!row.IsGroup || input.OnGroupExpandedChange != nil) {
                return row.Id
            }
        }
        return nil
    }

    private func BuildCell(snapshot DataGridInput, row DataGridRow, index int32, isSelected bool, height float64) Container {
        let column = columns[index]
        let id = row.Id!!
        var text = ""
        if let values = row.Values {
            if values.TryGetValue(column.Id!!, out var value) { text = value }
        }
        let session = editSession?.Value.RowId == id && editSession?.Value.ColumnId == column.Id ? editSession: nil
        var content Blob
        if session != nil && session.Presentation == DataGridEditPresentation.Inline {
            content = BuildEditor(session, column, height)
        } else {
            content = if let create = snapshot.CreateCellContent {
                create(snapshot, row, column)
            } else {
                Text{
                    Content: text,
                    Color: isSelected ? theme.SelectedText(snapshot.TextColor!!): snapshot.TextColor!!,
                    TextWrap: snapshot.AutoRowHeight ? TextWrap.Wrap: TextWrap.NoWrap,
                    FontFamily: theme.FontFamily, FontSize: theme.FontSize, FontWeight: theme.FontWeight
                }
            }
            if let create = snapshot.CreateCell { content = create(snapshot, row, column, content) }
            if column.AutoWidth && column.Width == nil && column.AutoWidthContent == nil {
                content = MeasureWidth(column.Id!!, content)
            }
        }
        return Container{
            Key: "column:" + column.Id!!,
            Handle: session?.Anchor ?? CellHandle(id, column.Id!!),
            Width: widths[index], FlexShrink: 0, MinWidth: 0,
            Padding: session != nil && session.Presentation == DataGridEditPresentation.Inline ? Edges{}:
                Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
            JustifyContent: JustifyContent.Center, TextAlign: column.Alignment,
            OutlineWidth: editSession == nil && activeId == id && activeColumn == index && hasFocus && !pointerFocus ? theme.FocusRingWidth: 0.0,
            OutlineColor: snapshot.FocusColor!!, OutlineOffset: -theme.FocusRingWidth,
            OnPointerDown: (e PointerEvent) -> {
                if e.Button == PointerButton.Primary && !e.IsFromInteractiveChild { SetActiveColumn(index, false) }
            },
            Overflow: Overflow.Hidden, OnKeyDown: stopGridKeys,
            Transform: PanelTransform{TranslateX: index < pinnedCount ? horizontalOffset: 0},
            ZIndex: index < pinnedCount ? 1: 0,
            BackgroundColor: index < pinnedCount ? (
                isSelected ? snapshot.SelectedColor!!: hoveredId == id ? theme.HoverColor: snapshot.BackgroundColor!!
            ): Color.Transparent,
            Accessibility: Accessibility{
                Role: AccessibilityRole.GridCell, Name: column.Label ?? column.Id!!, Value: text,
                RowIndex: RawIndex(id), ColumnIndex: index + (leading > 0.0 ? 1: 0),
                ReadOnly: !CanEditCell(row, column, false)
            },
            content
        }
    }

    private func BuildRow(snapshot DataGridInput, row DataGridRow, details bool) Blob {
        let id = row.Id!!
        let rowIndex = RawIndex(id)
        let isSelected = !row.Disabled && !row.IsGroup && snapshot.Selection != DataGridSelection.None &&
            (snapshot.AllSelected || selected.Contains(id))
        let isExpanded = expanded.Contains(id) && (row.HasDetail || row.Detail != nil)
        let fullWidth = snapshot.CreateFullWidthRow?.Invoke(snapshot, row)
        let height = if editSession?.Value.RowId == id && editSession?.Presentation == DataGridEditPresentation.Inline {
            editSession!!.RowHeight
        } else if let provider = snapshot.RowHeightProvider {
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
            OutlineWidth: editSession == nil && activeId == id && hasFocus && !pointerFocus ? theme.FocusRingWidth: 0.0,
            OutlineColor: snapshot.FocusColor!!,
            OutlineOffset: -theme.FocusRingWidth,
            BorderRadius: theme.RowInset > 0.0 ? theme.ControlRadius!!: 0.0,
        }
        if snapshot.AutoRowHeight && !(editSession?.Value.RowId == id && editSession?.Presentation == DataGridEditPresentation.Inline) {
            cells.Height = Length.Auto
            cells.MinHeight = height
            cells.AlignItems = AlignItems.Stretch
            if let maximum = snapshot.MaximumRowHeight {
                cells.MaxHeight = maximum
            }
        }
        if let content = fullWidth {
            cells.OnKeyDown = stopGridKeys
            if row.IsGroup && snapshot.OnGroupExpandedChange != nil {
                cells.FlexDirection = FlexDirection.Row
                cells.Children.Add(Button{
                    Width: snapshot.ExpandColumnWidth!!,
                    Height: height,
                    FlexShrink: 0,
                    Focusable: false,
                    TabStop: false,
                    OnClick: () -> input.OnGroupExpandedChange?.Invoke(id, !groupExpanded.Contains(id)),
                    Accessibility: Accessibility{Hidden: true},
                    ControlIcons.Create(groupExpanded.Contains(id) ? ControlIcon.ExpandMore: ControlIcon.ChevronRight, 16, snapshot.TextColor)
                })
                cells.Children.Add(Container{FlexGrow: 1, FlexBasis: 0, MinWidth: 0, content})
            } else {
                cells.Children.Add(content)
            }
        } else {
            if leading > 0.0 {
                let controls = Container{
                    Key: "leading",
                    Width: leading,
                    FlexShrink: 0,
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.GridCell,
                        Name: theme.Text("Row controls"),
                        RowIndex: rowIndex,
                        ColumnIndex: 0
                    }
                }
                if let create = snapshot.CreateRowHeader {
                    controls.Children.Add(Container{
                        Key: "row-header",
                        Width: snapshot.RowHeaderWidth!!,
                        Accessibility: Accessibility{
                            Role: AccessibilityRole.RowHeader,
                            Name: row.Label ?? id,
                            RowIndex: rowIndex,
                            ColumnIndex: 0
                        },
                        create(snapshot, row)
                    })
                }
                if snapshot.ShowSelection && snapshot.Selection != DataGridSelection.None {
                    var check = (
                        Checkbox{
                            Value: isSelected ? AccessibilityChecked.True: AccessibilityChecked.False,
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
                    check.OnPointerDown = (e PointerEvent) -> clickModifiers = e.Modifiers
                    check.OnClick = () -> Select(id, true, clickModifiers.Shift, false)
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
                cells.Children.Add(BuildCell(snapshot, row, index, isSelected, height))
            }
            if let session = editSession {
                let editedColumn = ColumnIndex(session.Value.ColumnId)
                if session.Value.RowId == id && editedColumn >= pinnedCount &&
                    (editedColumn < unpinnedStart || editedColumn >= endColumn) {
                    var left = leading
                    for index in 0 ... editedColumn { left += widths[index] }
                    let retained = BuildCell(snapshot, row, editedColumn, isSelected, height)
                    retained.Position = PositionType.Absolute
                    retained.Left = left
                    cells.Children.Add(retained)
                }
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
        let hostPointerDown = root.OnPointerDown
        root.OnPointerDown = (e PointerEvent) -> {
            clickModifiers = e.Modifiers
            clickFromInteractiveChild = e.IsFromInteractiveChild
            clickCount = e.Button == PointerButton.Primary ? e.ClickCount: 0
            if (e.Button == PointerButton.Primary || e.Button == PointerButton.Secondary) &&
                (!row.IsGroup || input.OnGroupExpandedChange != nil) {
                pointerFocus = true
                if activeId != id {
                    activeId = id
                    input.OnActiveRowIndexChange?.Invoke(RawIndex(id))
                    input.OnActiveRowChange?.Invoke(id)
                }
                if e.Button == PointerButton.Secondary && !row.IsGroup && !IsSelected(id) {
                    Select(id, false, false, false)
                }
            }
            hostPointerDown?.Invoke(e)
        }
        let hostClick = root.OnClick
        root.OnClick = () -> {
            if !clickFromInteractiveChild {
                if row.IsGroup {
                    if clickCount == 2 {
                        input.OnGroupExpandedChange?.Invoke(id, !groupExpanded.Contains(id))
                    }
                } else {
                    Select(id, clickModifiers.Ctrl || clickModifiers.Super, clickModifiers.Shift, false)
                    if clickCount == 2 {
                        if !BeginEdit(id, activeColumn) { Invoke(id) }
                    }
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
        if row.IsGroup && !row.Disabled && !snapshot.Disabled && snapshot.OnGroupExpandedChange != nil {
            actions.Add(AccessibilityAction.Focus)
            actions.Add(groupExpanded.Contains(id) ? AccessibilityAction.Collapse: AccessibilityAction.Expand)
        }
        let semantics = Accessibility{
            Role: AccessibilityRole.Row,
            Name: row.Label ?? id,
            RowIndex: rowIndex,
            ColumnCount: columns.Length + (leading > 0.0 ? 1: 0),
            Selected: snapshot.Selection == DataGridSelection.None || row.IsGroup ? nil: isSelected,
            Expanded: row.IsGroup && snapshot.OnGroupExpandedChange != nil ? groupExpanded.Contains(id):
                (row.HasDetail || row.Detail != nil) ? isExpanded: nil,
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
                        Name: theme.Text("Details for {0}", row.Label ?? id),
                        RowIndex: rowIndex,
                        ColumnIndex: 0
                    },
                    detail
                }
            )
        }
        return root
    }

    private func Activate(id string, reveal bool = true) {
        if NavigationIndex(id) < 0 || input.Disabled {
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
        RevealColumn()
        if activeId == nil || NavigationIndex(activeId) < 0 {
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
        if !input.AllSelected {
            if let request = input.OnSelectionRequest {
                request(id, toggle, extend)
                return
            }
        }
        let next = List[string]()
        if input.Selection == DataGridSelection.Single {
            if !toggle || !selected.Contains(id) {
                next.Add(id)
            }
        } else if extend && Index(anchorId) >= 0 {
            let start = Math.Min(Index(anchorId), Index(id))
            let end = Math.Max(Index(anchorId), Index(id))
            if !input.AllSelected {
                for current in selected {
                    next.Add(current)
                }
            }
            for index in start ... end + 1 {
                let row = Row(index)
                if !row.Disabled && !row.IsGroup && (input.AllSelected || !selected.Contains(row.Id!!)) {
                    next.Add(row.Id!!)
                }
            }
        } else {
            if toggle && !input.AllSelected {
                for current in selected {
                    if current != id {
                        next.Add(current)
                    }
                }
            }
            if !toggle || !IsSelected(id) {
                next.Add(id)
            }
        }
        if !extend && (!toggle || !selected.Contains(id)) {
            anchorId = id
        }
        NotifySelection(next.ToArray())
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
            input.OnClick?.Invoke(id)
        }
    }

    private func RowAction(id string, request AccessibilityActionRequest) bool {
        if NavigationIndex(id) >= 0 && Row(RawIndex(id)).IsGroup && !input.Disabled {
            if request.Action == AccessibilityAction.Focus {
                Activate(id)
                return true
            }
            if request.Action == AccessibilityAction.Expand || request.Action == AccessibilityAction.Collapse {
                input.OnGroupExpandedChange?.Invoke(id, request.Action == AccessibilityAction.Expand)
                return true
            }
            return false
        }
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
                e.Key == Key.Enter ||
                (e.Modifiers.Ctrl || e.Modifiers.Super) &&
                    (e.Key == Key.A || e.Key == Key.C || e.Key == Key.Insert)
        ) {
            e.StopPropagation()
        }
    }

    private func KeyDown(e KeyEvent) {
        if input.Disabled || !hasFocus || e.IsComposing || editSession != nil {
            return
        }
        if IsBeginEditKey(e) && activeId != nil && !e.Repeat && BeginEdit(activeId!!, activeColumn) {
            e.PreventDefault()
            e.StopPropagation()
            return
        }
        let control = e.Modifiers.Ctrl || e.Modifiers.Super
        let current = NavigationIndex(activeId)
        var next = current
        if control && e.Key == Key.A {
            if input.Selection != DataGridSelection.Multiple || e.Repeat {
                return
            }
            if input.RowAt != nil {
                guard let request = input.OnSelectAll else { return }
                request()
            } else {
                let ids = List[string](rows.Length)
                for row in rows {
                    if !row.Disabled && !row.IsGroup {
                        ids.Add(row.Id!!)
                    }
                }
                NotifySelection(ids.ToArray())
            }
        } else if control && (e.Key == Key.C || e.Key == Key.Insert) {
            guard let copy = input.OnCopy else { return }
            e.PreventDefault()
            e.StopPropagation()
            if !e.Repeat {
                copy()
            }
            return
        } else if e.Key == Key.Left || e.Key == Key.Right {
            if activeId != nil && current >= 0 && Row(current).IsGroup {
                input.OnGroupExpandedChange?.Invoke(activeId!!, e.Key == Key.Right)
            } else if e.Modifiers.Alt && activeId != nil {
                Expand(activeId!!, e.Key == Key.Right)
            } else {
                SetActiveColumn(control ? (e.Key == Key.Left ? 0: columns.Length - 1):
                    activeColumn + (e.Key == Key.Left ? -1: 1), true)
            }
        } else if (e.Key == Key.Home || e.Key == Key.End) && !control {
            SetActiveColumn(e.Key == Key.Home ? 0: columns.Length - 1, true)
        } else if e.Key == Key.Down || e.Key == Key.Up {
            if control {
                next = NavigationIndex(First(e.Key == Key.Down))
            } else {
                let delta = e.Key == Key.Down ? 1: -1
                next += delta
                while next >= 0 && next < RowCount && NavigationIndex(Row(next).Id) < 0 {
                    next += delta
                }
            }
            SelectNavigation(next, e.Modifiers.Shift)
        } else if e.Key == Key.Home || e.Key == Key.End {
            SetActiveColumn(e.Key == Key.Home ? 0: columns.Length - 1, false)
            next = NavigationIndex(First(e.Key == Key.End))
            SelectNavigation(next, e.Modifiers.Shift)
        } else if e.Key == Key.PageUp || e.Key == Key.PageDown {
            next = PageDestination(current, e.Key == Key.PageDown ? 1: -1)
            SelectNavigation(next, e.Modifiers.Shift)
        } else if e.Key == Key.Space {
            if !e.Repeat && activeId != nil && input.Selection == DataGridSelection.Multiple {
                Select(activeId!!, true, e.Modifiers.Shift)
            }
        } else if e.Key == Key.Enter {
            if !e.Repeat && activeId != nil {
                Invoke(activeId!!)
            }
        } else {
            return
        }
        e.PreventDefault()
        e.StopPropagation()
    }

    private func NavigationIndex(id string?) int32 {
        if id == nil {
            return -1
        }
        let index = RawIndex(id)
        if index < 0 || index >= RowCount {
            return -1
        }
        let row = Row(index)
        return row.Disabled || row.IsGroup && input.OnGroupExpandedChange == nil ? -1: index
    }

    private func SelectNavigation(index int32, extend bool) {
        if index >= 0 && index < RowCount {
            let row = Row(index)
            if row.IsGroup {
                if extend && Index(anchorId) >= 0 {
                    let delta = Index(anchorId) >= index ? 1: -1
                    var target = index + delta
                    while target >= 0 && target < RowCount && Index(Row(target).Id) < 0 {
                        target += delta
                    }
                    if target >= 0 && target < RowCount {
                        Select(Row(target).Id!!, false, true)
                    }
                }
                Activate(row.Id!!)
            } else {
                Select(row.Id!!, false, extend)
            }
        }
    }

    private func PageDestination(current int32, delta int32) int32 {
        var slots = 0
        let top = viewport.ContentBox.Y
        let bottom = top + viewport.ContentBox.Height
        for handle in rowHandles.Values {
            if handle.IsMounted {
                let bounds = handle.BorderBox
                if bounds.Y >= top - .01 && bounds.Y + bounds.Height <= bottom + .01 {
                    slots++
                }
            }
        }
        var next = int32(Math.Clamp(int64(current) + int64(delta) * Math.Max(1, slots), 0L, int64(Math.Max(0, RowCount - 1))))
        while next >= 0 && next < RowCount && NavigationIndex(Row(next).Id) < 0 {
            next += delta
        }
        return next
    }

    private func IsSelected(id string) bool -> input.AllSelected || selected.Contains(id)

    private func NotifySelection(ids[]string) {
        if let changed = input.OnSelectionIndicesChange {
            let positions = [ids.Length]int32
            for index in 0 ... ids.Length {
                positions[index] = RawIndex(ids[index])
            }
            changed(positions)
        }
        input.OnSelectionChange?.Invoke(ids)
    }

    private func SetActiveColumn(index int32, reveal bool) {
        let next = Math.Clamp(index, 0, Math.Max(0, columns.Length - 1))
        if next != activeColumn {
            activeColumn = next
            input.OnActiveColumnChange?.Invoke(columns[next].Id!!)
        }
        if reveal {
            RevealColumn()
        }
    }

    private func RevealColumn() {
        if columns.Length == 0 || activeColumn < pinnedCount || !viewport.IsMounted {
            return
        }
        var left = leading
        var pinned = leading
        for index in 0 ... activeColumn {
            left += widths[index]
            if index < pinnedCount {
                pinned += widths[index]
            }
        }
        let offset = viewport.ScrollOffset
        let right = left + widths[activeColumn]
        if left < offset.X + pinned {
            viewport.JumpTo(Math.Max(0, left - pinned), offset.Y)
        } else if right > offset.X + viewport.ContentBox.Width {
            viewport.JumpTo(right - viewport.ContentBox.Width, offset.Y)
        }
    }

    private func RowContext(row DataGridRow) VirtualRowContext -> VirtualRowContext{
        Version: rowPresentationVersion,
        State: (!row.Disabled && !row.IsGroup && input.Selection != DataGridSelection.None && IsSelected(row.Id!!) ? 1L: 0L) +
            (expanded.Contains(row.Id!!) ? 2L: 0L) +
            (hoveredId == row.Id ? 4L: 0L) +
            (groupExpanded.Contains(row.Id!!) ? 8L: 0L) +
            (input.OnSelectionChange != nil || input.OnSelectionIndicesChange != nil || input.OnSelectionRequest != nil ? 16L: 0L) +
            ((row.HasDetail || row.Detail != nil) && input.OnExpandedChange != nil ? 32L: 0L) +
            (row.IsGroup && input.OnGroupExpandedChange != nil ? 64L: 0L) +
            (editSession == nil && activeId == row.Id && hasFocus && !pointerFocus ? 128L * (int64(activeColumn) + 1L): 0L) +
            (editSession?.Value.RowId == row.Id ? editSession!!.Revision * 1048576L: 0L)
    }

    private func UpdateRowPresentation() {
        let presentation = input with{
            Rows = nil, RowAt = nil, RowIndex = nil, RowCount = 0,
            SelectedIds = nil, ExpandedIds = nil, ExpandedGroupIds = nil, AllSelected = false,
            ActiveRowId = nil, ActiveColumnId = nil,
            OnActiveRowChange = nil, OnActiveRowIndexChange = nil, OnActiveColumnChange = nil,
            OnSelectionChange = nil, OnSelectionIndicesChange = nil, OnSelectionRequest = nil,
            OnSelectAll = nil, OnCopy = nil, OnKeyDown = nil, OnTextInput = nil, CreateRoot = nil,
            UseDefaultKeyboard = nil, OnClick = nil,
            OnExpandedChange = nil, OnGroupExpandedChange = nil,
            ColumnWidths = nil, OnColumnWidthChange = nil, OnColumnWidthCommit = nil,
            FitColumnsToViewport = false, OnFittedColumnWidthsChange = nil, OnFittedColumnWidthsCommit = nil,
            OnColumnOrderChange = nil, RootHandle = nil, ViewportHandle = nil,
            Width = nil, Height = nil, HeaderHeight = nil, FilterHeight = nil, AccessibilityName = nil,
            HeaderStyle = nil, ResizeHandleStyle = nil, CreateResizeHandle = nil,
            CreateHeader = nil, CreateFilter = nil, EmptyContent = nil,
            ScrollbarX = nil, ScrollbarY = nil, ScrollbarVisibilityX = nil, ScrollbarVisibilityY = nil,
            Sorts = nil, SortColumnId = nil, SortDirection = DataGridSort.None,
            OnSort = nil, OnSortsChange = nil, Footer = nil,
            OnEditBegin = nil, OnEditCommit = nil, OnEditCancel = nil, OnEditEnd = nil,
            BeginEditKeys = nil, CommitEditKey = nil
        }
        var changed = rowPresentation != presentation ||
            rowPresentationTheme != theme ||
            rowPresentationWidths.Length != widths.Length ||
            rowPresentationOffset != (pinnedCount > 0 ? horizontalOffset: 0.0) ||
            rowPresentationFirst != firstColumn || rowPresentationEnd != endColumn
        for index in 0 ... Math.Min(rowPresentationWidths.Length, widths.Length) {
            changed = changed || rowPresentationWidths[index] != widths[index]
        }
        if changed {
            rowPresentationVersion++
            rowPresentation = presentation
            rowPresentationTheme = theme
            rowPresentationWidths = widths
            rowPresentationOffset = pinnedCount > 0 ? horizontalOffset: 0.0
            rowPresentationFirst = firstColumn
            rowPresentationEnd = endColumn
        }
    }

}
