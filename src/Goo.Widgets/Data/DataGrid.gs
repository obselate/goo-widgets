package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import System
import System.Collections.Generic
import System.Globalization

/// Host-owned sorting; None preserves the host's current order.
public enum DataGridSort {
    None;
    Ascending;
    Descending
}

/// Row selection policy.
public enum DataGridSelection {
    None;
    Single;
    Multiple
}

/// One stable column definition used by headers, filters, and body cells.
public data struct DataGridColumn {
    var Id string?
    var Label string?
    /// Fixed logical width; nil participates in flex distribution.
    var Width float64?
    /// Positive relative flex weight. Nil resolves to 1.
    var Flex float64?
    /// Width bounds. Nil resolves to 60 and 1000000.
    var Minimum float64?
    var Maximum float64?
    var Sortable bool
    /// Nil resolves to true; resizing also requires OnColumnWidthChange.
    var Resizable bool?
    /// Arbitrary header and filter content. Filtering stays in the application.
    var Header Blob?
    var Filter Blob?
}

/// A stable row. Applications may use Id to look up domain objects in cell/detail factories.
public data struct DataGridRow {
    var Id string?
    var Label string?
    var Disabled bool
    var Values IReadOnlyDictionary[string, string]?
    /// Advertises a lazily built detail supplied by CreateDetail.
    var HasDetail bool
    var Detail Blob?
}

/// Controlled data and composition for a virtualized grid. Replace changed arrays/maps and rebuild the host.
public data struct DataGridInput {
    var Columns[]?DataGridColumn
    var Rows[]?DataGridRow
    /// Controlled pixel overrides, including flex columns; absent IDs use the column definition.
    var ColumnWidths IReadOnlyDictionary[string, float64]?
    var OnColumnWidthChange Action[string, float64]?
    /// Pointer-up or keyboard commit; cancellation keeps prior change requests but does not commit.
    var OnColumnWidthCommit Action[string, float64]?
    var SortColumnId string?
    var SortDirection DataGridSort
    var OnSort Action[string, DataGridSort]?
    var Selection DataGridSelection
    var SelectedIds[]?string
    var OnSelectionChange Action[[]string]?
    /// Adds a leading composed checkbox. The row's semantics expose selection once.
    var ShowSelection bool
    var ExpandedIds[]?string
    var OnExpandedChange Action[string, bool]?
    var Disabled bool
    var Width Length?
    var Height Length?
    var RowHeight float64?
    var HeaderHeight float64?
    var FilterHeight float64?
    var AccessibilityName string?
    var BackgroundColor Color?
    var TextColor Color?
    var SelectedColor Color?
    var RootHandle ElementHandle?
    var ViewportHandle ElementHandle?
    var OnKeyDown((KeyEvent) -> void)?
    var OnTextInput Action[string]?
    /// Nil preserves built-in keyboard navigation and activation.
    var UseDefaultKeyboard bool?
    var ScrollbarX Scrollbar?
    var ScrollbarVisibilityX ScrollbarVisibility?
    var ScrollbarY Scrollbar?
    var ScrollbarVisibilityY ScrollbarVisibility?
    var ResizeHandleStyle Style?
    var CreateResizeHandle Func[DataGridInput, DataGridColumn, Container, Container]?
    var HeaderStyle Style?
    var EmptyContent Blob?
    /// Replaces content inside the shared-width cell slot.
    var CreateCell Func[DataGridInput, DataGridRow, DataGridColumn, Blob, Blob]?
    /// Replaces content inside the sortable header button.
    var CreateHeader Func[DataGridInput, DataGridColumn, Blob, Blob]?
    var CreateFilter Func[DataGridInput, DataGridColumn, Blob, Blob]?
    var CreateSelection Func[DataGridInput, DataGridRow, Button, Button]?
    var CreateDetail Func[DataGridInput, DataGridRow, Blob]?
    /// Required slots, width, identity, and semantics are reapplied.
    var CreateRow Func[DataGridInput, DataGridRow, Container, Container]?
    var CreateRoot Func[DataGridInput, Container, Container]?
}

/// Shared column sizing, captured resizing, controlled sorting/selection, and measured virtual detail rows.
public open class DataGrid : Cell[DataGridInput], IDisposable {
    private let defaultRootHandle ElementHandle = ElementHandle()
    private let defaultViewport ElementHandle = ElementHandle()
    private var rootHandle ElementHandle
    private var viewport ElementHandle
    private let rowHandles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private let resizeHandles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](
        StringComparer.Ordinal
    )
    private var input DataGridInput
    private var columns[]DataGridColumn = []DataGridColumn{}
    private var rows[]DataGridRow = []DataGridRow{}
    private var indices Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
    private var hasDetails bool
    private var selected HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private var expanded HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private var widths[]float64 = []float64{}
    private var available float64
    private var tableWidth float64
    private var leading float64
    private var activeId string?
    private var anchorId string?
    private var hasFocus bool
    private var pointerFocus bool
    private var clickModifiers KeyModifiers
    private var pointer int64 = -1L
    private var resizeId string?
    private var origin float64
    private var originWidth float64
    private var lastWidth float64
    private var disposed bool

    public init() {
        rootHandle = defaultRootHandle
        viewport = defaultViewport
        rootHandle.MetricsChanged += Metrics
    }

    /// Releases the root geometry subscription.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        pointer = -1L
        resizeId = nil
        rootHandle.MetricsChanged -= Metrics
    }

    protected override func Build(value DataGridInput) Blob {
        pointerFocus = false
        let nextRootHandle = value.RootHandle ?? defaultRootHandle
        if nextRootHandle != rootHandle {
            rootHandle.MetricsChanged -= Metrics
            rootHandle = nextRootHandle
            rootHandle.MetricsChanged += Metrics
        }
        viewport = value.ViewportHandle ?? defaultViewport
        let defaultHeight Length = 300
        input = value with{
            Width = value.Width ?? Percent(100),
            Height = value.Height ?? defaultHeight,
            RowHeight = value.RowHeight ?? 36.0,
            HeaderHeight = value.HeaderHeight ?? 38.0,
            FilterHeight = value.FilterHeight ?? 38.0,
            AccessibilityName = value.AccessibilityName ?? "Data grid",
            BackgroundColor = value.BackgroundColor ?? Color.Parse("#18181b"),
            TextColor = value.TextColor ?? Color.Parse("#e4e4e7"),
            SelectedColor = value.SelectedColor ?? Color.Parse("#34334c")
        }
        for height in[]float64{input.RowHeight!!, input.HeaderHeight!!, input.FilterHeight!!} {
            if !Double.IsFinite(height) || height <= 0.0 || height > 1000000.0 {
                throw ArgumentOutOfRangeException("Grid row/header/filter height")
            }
        }
        if input.Selection < DataGridSelection.None || input.Selection > DataGridSelection.Multiple
        || input.SortDirection < DataGridSort.None || input.SortDirection > DataGridSort.Descending {
            throw ArgumentOutOfRangeException("Grid selection/sort policy")
        }
        columns = input.Columns ?? []DataGridColumn{}
        let nextRows = input.Rows ?? []DataGridRow{}
        let rowsChanged = !Object.ReferenceEquals(rows, nextRows)
        let columnIds = HashSet[string](StringComparer.Ordinal)
        for column in columns {
            if String.IsNullOrEmpty(column.Id) || !columnIds.Add(column.Id!!) {
                throw ArgumentException("Grid column IDs must be nonempty and unique")
            }
            let minimum = column.Minimum ?? 60.0
            let maximum = column.Maximum ?? 1000000.0
            let weight = column.Flex ?? 1.0
            if !Double.IsFinite(minimum) || minimum < 0.0 || !Double.IsFinite(maximum) ||
                maximum < minimum ||
                maximum > 1000000.0
            || !Double.IsFinite(weight) || weight <= 0.0 {
                throw ArgumentOutOfRangeException("Grid column bounds/flex")
            }
            if let width = column.Width {
                ValidateWidth(width)
            }
        }
        if let overrides = input.ColumnWidths {
            for pair in overrides {
                ValidateWidth(pair.Value)
            }
        }
        if rowsChanged {
            let nextIndices = Dictionary[string, int32](StringComparer.Ordinal)
            var nextHasDetails bool
            for index in 0 ... nextRows.Length {
                let row = nextRows[index]
                if String.IsNullOrEmpty(row.Id) || !nextIndices.TryAdd(row.Id!!, index) {
                    throw ArgumentException("Grid row IDs must be nonempty and unique")
                }
                nextHasDetails = nextHasDetails || row.HasDetail || row.Detail != nil
            }
            rows = nextRows
            indices = nextIndices
            hasDetails = nextHasDetails
            PruneRows()
        }
        let nextSelected = HashSet[string](input.SelectedIds ?? []string{}, StringComparer.Ordinal)
        let selectionChanged = !selected.SetEquals(nextSelected)
        selected = nextSelected
        if input.Selection == DataGridSelection.Single && selected.Count > 1 {
            throw ArgumentException("Single selection accepts at most one selected ID")
        }
        expanded = HashSet[string](input.ExpandedIds ?? []string{}, StringComparer.Ordinal)
        Prune(resizeHandles, columnIds)
        if input.Disabled || input.OnColumnWidthChange == nil || ColumnIndex(resizeId) < 0
        || !(columns[ColumnIndex(resizeId)].Resizable ?? true) {
            pointer = -1L
            resizeId = nil
        }
        if selectionChanged && input.Selection == DataGridSelection.Single && selected.Count == 1 {
            for row in rows {
                if !row.Disabled && selected.Contains(row.Id!!) {
                    activeId = row.Id
                    break
                }
            }
            Reveal()
        }
        if Index(activeId) < 0 {
            activeId = nil
            for row in rows {
                if !row.Disabled && selected.Contains(row.Id!!) {
                    activeId = row.Id
                    break
                }
            }
            activeId ??= First(false)
        }
        if Index(anchorId) < 0 {
            anchorId = activeId
        }
        let details = hasDetails
        leading = (input.ShowSelection && input.Selection != DataGridSelection.None ? 36.0: 0.0) + (details ? 30.0: 0.0)
        available = rootHandle.ContentBox.Width
        let verticalGutter = if let scrollbar = input.ScrollbarY {
            if scrollbar.ReserveSpace && input.ScrollbarVisibilityY != ScrollbarVisibility.Hidden {
                scrollbar.Thickness + scrollbar.Inset
            } else {
                0.0
            }
        } else {
            0.0
        }
        ResolveWidths(verticalGutter)
        let snapshot = input
        var body Blob = if rows.Length == 0 && input.EmptyContent != nil {
            Container{OverflowY: Overflow.Scroll, input.EmptyContent!!}
        } else {
            VirtualRows(
                rows,
                input.RowHeight!!,
                (row DataGridRow) -> row.Id!!,
                (row DataGridRow) -> BuildRow(snapshot, row, details)
            )
        }
        body.Key = "body"
        body.Handle = viewport
        body.ScrollbarY = input.ScrollbarY
        if let visibility = input.ScrollbarVisibilityY {
            body.ScrollbarVisibilityY = visibility
        }
        body.Width = tableWidth + verticalGutter
        body.FlexGrow = 1
        body.FlexBasis = 0
        body.MinHeight = 0
        let canvas = Container{Width: tableWidth + verticalGutter, Height: Percent(100), FlexShrink: 0, MinHeight: 0}
        canvas.Children.Add(BuildHeader(snapshot, false))
        var filters = input.CreateFilter != nil
        for column in columns {
            filters = filters || column.Filter != nil
        }
        if filters {
            canvas.Children.Add(BuildHeader(snapshot, true))
        }
        canvas.Children.Add(body)
        let scroll = Container{
            FlexGrow: 1,
            FlexBasis: 0,
            MinWidth: 0,
            MinHeight: 0,
            OverflowX: Overflow.Scroll,
            OverflowY: Overflow.Hidden,
            canvas
        }
        scroll.ScrollbarX = input.ScrollbarX
        if let visibility = input.ScrollbarVisibilityX {
            scroll.ScrollbarVisibilityX = visibility
        }
        var root = Container{
            Handle: rootHandle,
            Width: input.Width!!,
            Height: input.Height!!,
            MinWidth: 0,
            MinHeight: 0,
            BackgroundColor: input.BackgroundColor!!,
            BorderRadius: 5
        }
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        if value.RootHandle == nil && root.Handle != nil && root.Handle != rootHandle {
            rootHandle.MetricsChanged -= Metrics
            rootHandle = root.Handle!!
            rootHandle.MetricsChanged += Metrics
        }
        let hostKeys = root.OnKeyDown
        let hostText = root.OnTextInput
        let hostFocus = root.OnFocus
        let hostBlur = root.OnBlur
        root.Handle = rootHandle
        root.FlexDirection = FlexDirection.Column
        root.Disabled = input.Disabled
        root.Focusable = !input.Disabled
        root.OnKeyDown = (e KeyEvent) -> {
            if input.UseDefaultKeyboard ?? true {
                KeyDown(e)
            }
            hostKeys?.Invoke(e)
            input.OnKeyDown?.Invoke(e)
        }
        if hostText != nil || input.OnTextInput != nil {
            root.OnTextInput = (value string) -> {
                hostText?.Invoke(value)
                input.OnTextInput?.Invoke(value)
            }
        }
        root.OnFocus = (e FocusEvent) -> {
            hasFocus = true
            if !pointerFocus {
                Reveal()
            }
            hostFocus?.Invoke(e)
        }
        root.OnBlur = (e FocusEvent) -> {
            hasFocus = false
            hostBlur?.Invoke(e)
        }
        var active ElementHandle?
        if let id = activeId {
            active = Handle(rowHandles, id)
        }
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.Grid,
            Name: input.AccessibilityName!!,
            Description: rows.Length.ToString() + " rows, " + columns.Length.ToString() + " columns",
            MultiSelectable: input.Selection == DataGridSelection.Multiple,
            Relationships: AccessibilityRelationships{ActiveDescendant: active}
        }
        root.Children.Clear()
        root.Children.Add(scroll)
        return root
    }

    private func ValidateWidth(width float64) {
        if !Double.IsFinite(width) || width < 0.0 || width > 1000000.0 {
            throw ArgumentOutOfRangeException("Grid column width")
        }
    }

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
            if !indices.ContainsKey(id) {
                removed.Add(id)
            }
        }
        for id in removed {
            rowHandles.Remove(id)
        }
    }

    private func Handle(handles Dictionary[string, ElementHandle], id string) ElementHandle {
        if !handles.ContainsKey(id) {
            handles.Add(id, ElementHandle())
        }
        return handles[id]
    }

    private func ColumnIndex(id string?) int32 {
        for index in 0 ... columns.Length {
            if columns[index].Id == id {
                return index
            }
        }
        return -1
    }

    private func Index(id string?) int32 {
        if id == nil || !indices.ContainsKey(id) {
            return -1
        }
        let index = indices[id]
        return rows[index].Disabled ? -1: index
    }

    private func First(last bool) string? {
        for step in 0 ... rows.Length {
            let index = last ? rows.Length - step - 1: step
            if !rows[index].Disabled {
                return rows[index].Id
            }
        }
        return nil
    }

    private func Metrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        if Math.Abs(metrics.ContentBox.Width - available) > .01 {
            available = metrics.ContentBox.Width
            Rebuild()
        }
    }

    private func Clamp(index int32, width float64) float64 -> Math.Clamp(
        width,
        columns[index].Minimum ?? 60.0,
        columns[index].Maximum ?? 1000000.0
    )

    private func ResolveWidths(verticalGutter float64) {
        widths = [columns.Length]float64
        let flexible = [columns.Length]bool
        tableWidth = leading
        var maxWeight float64 = 1.0
        for index in 0 ... columns.Length {
            let column = columns[index]
            var fixedWidth = column.Width
            if let overrides = input.ColumnWidths {
                if overrides.TryGetValue(column.Id!!, out var width) {
                    fixedWidth = width
                }
            }
            flexible[index] = fixedWidth == nil
            widths[index] = Clamp(index, fixedWidth ?? (column.Minimum ?? 60.0))
            tableWidth += widths[index]
            maxWeight = Math.Max(maxWeight, column.Flex ?? 1.0)
        }
        var remaining = Math.Max(0.0, available - verticalGutter - tableWidth)
        for pass in 0 ... columns.Length {
            var weight float64
            for index in 0 ... columns.Length {
                if flexible[index] && widths[index] < (columns[index].Maximum ?? 1000000.0) {
                    weight += (columns[index].Flex ?? 1.0) / maxWeight
                }
            }
            if weight <= 0.0 || remaining <= .001 {
                break
            }
            var consumed float64
            for index in 0 ... columns.Length {
                if !flexible[index] {
                    continue
                }
                let addition = Math.Min(
                    (columns[index].Maximum ?? 1000000.0) - widths[index],
                    remaining * ((columns[index].Flex ?? 1.0) / maxWeight) / weight
                )
                widths[index] += addition
                consumed += addition
            }
            remaining -= consumed
        }
        tableWidth = leading
        for width in widths {
            tableWidth += width
        }
        if !Double.IsFinite(tableWidth) || tableWidth > 1000000000.0 {
            throw ArgumentOutOfRangeException("Grid total width")
        }
    }

    private func BuildHeader(snapshot DataGridInput, filter bool) Blob {
        let row = Container{
            Key: filter ? "filters": "header",
            Width: tableWidth,
            Height: filter ? snapshot.FilterHeight!!: snapshot.HeaderHeight!!,
            FlexShrink: 0,
            FlexDirection: FlexDirection.Row,
            BackgroundColor: "#222228",
            BasedOn: snapshot.HeaderStyle,
            Accessibility: Accessibility{Role: AccessibilityRole.Row}
        }
        if leading > 0.0 {
            row.Children.Add(
                Container{
                    Key: "leading",
                    Width: leading,
                    FlexShrink: 0,
                    Accessibility: Accessibility{Role: AccessibilityRole.ColumnHeader, Name: "Row controls"}
                }
            )
        }
        for index in 0 ... columns.Length {
            let column = columns[index]
            let id = column.Id!!
            let label = column.Label ?? id
            var content Blob = filter ? (column.Filter ?? Container{}): (
                column.Header ?? Text{
                    Content: label +
                        (
                        snapshot.SortColumnId == id ? (
                            snapshot.SortDirection == DataGridSort.Ascending ? " ↑": snapshot.SortDirection == DataGridSort.Descending ? " ↓": ""
                        ): ""
                    ),
                    Color: snapshot.TextColor!!,
                    TextWrap: TextWrap.NoWrap,
                    FontSize: 13
                }
            )
            if filter {
                if let create = snapshot.CreateFilter {
                    content = create(snapshot, column, content)
                }
            } else {
                if let create = snapshot.CreateHeader {
                    content = create(snapshot, column, content)
                }
            }
            let slot = Container{
                Key: "column:" + id,
                Width: widths[index],
                FlexShrink: 0,
                MinWidth: 0,
                Position: PositionType.Relative,
                Overflow: Overflow.Hidden,
                OnKeyDown: StopGridKeys
            }
            if filter {
                slot.Padding = 4
                slot.Accessibility = Accessibility{Role: AccessibilityRole.GridCell, Name: "Filter " + label}
                slot.Children.Add(Container{Key: "content", FlexGrow: 1, MinWidth: 0, content})
            } else {
                let sort = Button{
                    Key: "content",
                    FlexGrow: 1,
                    MinWidth: 0,
                    Padding: Edges{Right: 10, Left: 10},
                    BackgroundColor: Color.Transparent,
                    Focusable: column.Sortable && snapshot.OnSort != nil && !snapshot.Disabled,
                    OnClick: () -> Sort(id),
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.ColumnHeader,
                        Name: label,
                        Description: snapshot.SortColumnId == id ? snapshot.SortDirection.ToString(): "Unsorted"
                    },
                    content
                }
                WidgetKeyBindings.BindActivation(sort)
                slot.Children.Add(sort)
                if (column.Resizable ?? true) && snapshot.OnColumnWidthChange != nil {
                    var handle = Container{
                        BackgroundColor: "#3f3f46",
                        Hover: Style{BackgroundColor: "#818cf8"},
                        BasedOn: snapshot.ResizeHandleStyle
                    }
                    if let create = snapshot.CreateResizeHandle {
                        handle = create(snapshot, column, handle)
                    }
                    handle.Key = "resize"
                    handle.Handle = Handle(resizeHandles, id)
                    handle.Position = PositionType.Absolute
                    handle.Right = 0
                    handle.Top = 0
                    handle.Bottom = 0
                    handle.Width = 7
                    handle.Cursor = Cursor.ResizeHorizontal
                    handle.Focusable = !snapshot.Disabled
                    handle.OnPointerDown = (e PointerEvent) -> BeginResize(id, e)
                    handle.OnPointerMove = MoveResize
                    handle.OnPointerUp = EndResize
                    handle.OnPointerCancel = CancelResize
                    handle.OnKeyDown = (e KeyEvent) -> ResizeKey(id, e)
                    handle.Accessibility = Accessibility{
                        Role: AccessibilityRole.Slider,
                        Name: "Resize " + label,
                        Orientation: AccessibilityOrientation.Horizontal,
                        Range: AccessibilityValue{
                            Minimum: column.Minimum ?? 60.0,
                            Maximum: column.Maximum ?? 1000000.0,
                            Now: widths[index]
                        },
                        Actions: []AccessibilityAction{
                            AccessibilityAction.SetValue,
                            AccessibilityAction.Increment,
                            AccessibilityAction.Decrement
                        },
                        OnAction: (request AccessibilityActionRequest) -> ResizeAction(id, request)
                    }
                    slot.Children.Add(handle)
                }
            }
            row.Children.Add(slot)
        }
        return row
    }

    private func BuildRow(snapshot DataGridInput, row DataGridRow, details bool) Blob {
        let id = row.Id!!
        let isSelected = snapshot.Selection != DataGridSelection.None && selected.Contains(id)
        let isExpanded = expanded.Contains(id) && (row.HasDetail || row.Detail != nil)
        let cells = Container{
            Key: "cells",
            Width: tableWidth,
            Height: snapshot.RowHeight!!,
            FlexShrink: 0,
            FlexDirection: FlexDirection.Row
        }
        if leading > 0.0 {
            let controls = Container{
                Key: "leading",
                Width: leading,
                FlexShrink: 0,
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Accessibility: Accessibility{Role: AccessibilityRole.GridCell, Name: "Row controls"}
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
                check.Disabled = row.Disabled || snapshot.Disabled || snapshot.OnSelectionChange == nil
                check.OnClick = () -> Select(id, true, false, false)
                check.Accessibility = Accessibility{Hidden: true}
                controls.Children.Add(Container{Key: "selection", Width: 36, AlignItems: AlignItems.Center, check})
            }
            if details {
                let expand = Button{
                    Width: 26,
                    Height: 26,
                    Padding: 4,
                    BackgroundColor: Color.Transparent,
                    Focusable: false,
                    TabStop: false,
                    Disabled: row.Disabled || snapshot.Disabled || snapshot.OnExpandedChange == nil,
                    OnClick: () -> Expand(id, !isExpanded, false),
                    Accessibility: Accessibility{Hidden: true},
                    MaterialIcons.Create(isExpanded ? "expand_more": "chevron_right", 16, snapshot.TextColor)
                }
                let slot = Container{Key: "expansion", Width: 30, AlignItems: AlignItems.Center}
                if row.HasDetail || row.Detail != nil {
                    slot.Children.Add(expand)
                }
                controls.Children.Add(slot)
            }
            cells.Children.Add(controls)
        }
        for index in 0 ... columns.Length {
            let column = columns[index]
            var text = ""
            if let values = row.Values {
                if values.TryGetValue(column.Id!!, out var found) {
                    text = found
                }
            }
            var content Blob = Text{Content: text, Color: snapshot.TextColor!!, TextWrap: TextWrap.NoWrap, FontSize: 13}
            if let create = snapshot.CreateCell {
                content = create(snapshot, row, column, content)
            }
            cells.Children.Add(
                Container{
                    Key: "column:" + column.Id!!,
                    Width: widths[index],
                    FlexShrink: 0,
                    MinWidth: 0,
                    Padding: Edges{Right: 10, Left: 10},
                    JustifyContent: JustifyContent.Center,
                    Overflow: Overflow.Hidden,
                    OnKeyDown: StopGridKeys,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.GridCell,
                        Name: column.Label ?? column.Id!!,
                        Value: text
                    },
                    content
                }
            )
        }
        var root = Container{
            BackgroundColor: isSelected ? snapshot.SelectedColor!!: Color.Transparent,
            Hover: Style{BackgroundColor: snapshot.SelectedColor!!},
            Opacity: row.Disabled ? .45: 1.0,
            OutlineWidth: activeId == id && hasFocus ? 1.0: 0.0,
            OutlineColor: "#a5b4fc",
            OutlineOffset: -1
        }
        if let create = snapshot.CreateRow {
            root = create(snapshot, row, root)
        }
        root.Key = id
        root.Handle = Handle(rowHandles, id)
        root.Width = tableWidth
        root.FlexDirection = FlexDirection.Column
        root.FlexShrink = 0
        root.MinHeight = snapshot.RowHeight!!
        root.Focusable = false
        root.TabStop = false
        root.Disabled = row.Disabled || snapshot.Disabled
        root.OnPointerDown = (e PointerEvent) -> {
            clickModifiers = e.Modifiers
            if e.Button == PointerButton.Primary {
                activeId = id
                // Default focus runs after this callback; keep the hit row under the pointer.
                pointerFocus = true
            }
        }
        root.OnClick = () -> Select(id, clickModifiers.Ctrl || clickModifiers.Super, clickModifiers.Shift, false)
        let actions = List[AccessibilityAction]()
        if !row.Disabled && !snapshot.Disabled {
            actions.Add(AccessibilityAction.Focus)
            actions.Add(AccessibilityAction.Activate)
            if snapshot.Selection != DataGridSelection.None && snapshot.OnSelectionChange != nil {
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
            Selected: snapshot.Selection == DataGridSelection.None ? nil: isSelected,
            Expanded: (row.HasDetail || row.Detail != nil) ? isExpanded: nil,
            Actions: actions.ToArray()
        }
        if actions.Count > 0 {
            semantics.OnAction = (request AccessibilityActionRequest) -> RowAction(id, request)
        }
        root.Accessibility = semantics
        root.Children.Clear()
        root.Children.Add(cells)
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
                    Padding: 12,
                    BackgroundColor: "#20232c",
                    OnKeyDown: StopGridKeys,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.GridCell,
                        Name: "Details for " + (row.Label ?? id)
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
        activeId = id
        rootHandle.Focus()
        if reveal {
            Reveal()
        }
    }

    private func Reveal() {
        if activeId == nil || Index(activeId) < 0 {
            return
        }
        let handle = Handle(rowHandles, activeId!!)
        if handle.IsMounted {
            handle.ScrollIntoView()
        } else {
            viewport.ScrollToItem(activeId!!)
        }
    }

    private func Select(id string, toggle bool, extend bool, reveal bool = true) {
        if Index(id) < 0 || input.Disabled {
            return
        }
        Activate(id, reveal)
        if input.Selection == DataGridSelection.None || input.OnSelectionChange == nil {
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
            if toggle {
                for current in selected {
                    next.Add(current)
                }
            }
            for index in start ... end + 1 {
                if !rows[index].Disabled && !next.Contains(rows[index].Id!!) {
                    next.Add(rows[index].Id!!)
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
        if !extend {
            anchorId = id
        }
        input.OnSelectionChange!!(next.ToArray())
    }

    private func Expand(id string, state bool, reveal bool = true) {
        if Index(id) < 0 || input.Disabled || !(rows[Index(id)].HasDetail || rows[Index(id)].Detail != nil) {
            return
        }
        Activate(id, reveal)
        input.OnExpandedChange?.Invoke(id, state)
    }

    private func Sort(id string) {
        let index = ColumnIndex(id)
        if index < 0 || input.Disabled || !columns[index].Sortable {
            return
        }
        let current = input.SortColumnId == id ? input.SortDirection: DataGridSort.None
        input.OnSort?.Invoke(
            id,
            current == DataGridSort.None ? DataGridSort.Ascending: current == DataGridSort.Ascending ? DataGridSort.Descending: DataGridSort.None
        )
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
            return true
        }
        if (request.Action == AccessibilityAction.Select || request.Action == AccessibilityAction.Deselect) &&
            input.Selection != DataGridSelection.None &&
            input.OnSelectionChange != nil {
            let desired = request.Action == AccessibilityAction.Select
            if selected.Contains(id) != desired {
                Select(id, input.Selection == DataGridSelection.Multiple || !desired, false)
            }
            return true
        }
        if (request.Action == AccessibilityAction.Expand || request.Action == AccessibilityAction.Collapse) &&
            input.OnExpandedChange != nil
        && (rows[Index(id)].HasDetail || rows[Index(id)].Detail != nil) {
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
            while next >= 0 && next < rows.Length && rows[next].Disabled {
                next += delta
            }
        } else if e.Key == Key.Home {
            next = Index(First(false))
        } else if e.Key == Key.End {
            next = Index(First(true))
        } else if e.Key == Key.Space || e.Key == Key.Enter {
            if activeId != nil {
                Select(activeId!!, e.Key == Key.Space || e.Modifiers.Ctrl || e.Modifiers.Super, e.Modifiers.Shift)
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
        if next >= 0 && next < rows.Length {
            if e.Modifiers.Shift && (e.Key == Key.Down || e.Key == Key.Up || e.Key == Key.Home || e.Key == Key.End) {
                Select(rows[next].Id!!, e.Modifiers.Ctrl || e.Modifiers.Super, true)
            } else {
                Activate(rows[next].Id!!)
            }
        }
    }

    private func RequestWidth(id string, width float64, commit bool) {
        let index = ColumnIndex(id)
        if index < 0 ||
            input.Disabled ||
            !(columns[index].Resizable ?? true) ||
            input.OnColumnWidthChange == nil ||
            !Double.IsFinite(width) {
            return
        }
        lastWidth = Clamp(index, width)
        input.OnColumnWidthChange!!(id, lastWidth)
        if commit {
            input.OnColumnWidthCommit?.Invoke(id, lastWidth)
        }
    }

    private func BeginResize(id string, e PointerEvent) {
        let index = ColumnIndex(id)
        if index < 0 ||
            input.Disabled ||
            input.OnColumnWidthChange == nil ||
            pointer != -1L ||
            e.Button != PointerButton.Primary {
            return
        }
        pointer = e.PointerId
        resizeId = id
        origin = e.WindowPosition.X
        originWidth = widths[index]
        lastWidth = originWidth
        e.Capture()
        e.PreventDefault()
        e.StopPropagation()
        Handle(resizeHandles, id).Focus()
    }

    private func MoveResize(e PointerEvent) {
        if pointer == e.PointerId && resizeId != nil {
            RequestWidth(resizeId!!, originWidth + e.WindowPosition.X - origin, false)
        }
    }

    private func EndResize(e PointerEvent) {
        if pointer != e.PointerId {
            return
        }
        e.ReleaseCapture()
        e.PreventDefault()
        e.StopPropagation()
        pointer = -1L
        if resizeId != nil {
            input.OnColumnWidthCommit?.Invoke(resizeId!!, lastWidth)
        }
        resizeId = nil
    }

    private func CancelResize(e PointerEvent) {
        if pointer == e.PointerId {
            e.ReleaseCapture()
            pointer = -1L
            resizeId = nil
        }
    }

    private func ResizeKey(id string, e KeyEvent) {
        let index = ColumnIndex(id)
        if index < 0 {
            return
        }
        if e.Key != Key.Left && e.Key != Key.Right && e.Key != Key.Home && e.Key != Key.End {
            return
        }
        e.PreventDefault()
        e.StopPropagation()
        RequestWidth(
            id,
            e.Key == Key.Home ? (columns[index].Minimum ?? 60.0): e.Key == Key.End ? (
                columns[index].Maximum ?? 1000000.0
            ): widths[index] +
                (e.Key == Key.Left ? -8.0: 8.0),
            true
        )
    }

    private func ResizeAction(id string, request AccessibilityActionRequest) bool {
        let index = ColumnIndex(id)
        if index < 0 || input.Disabled || input.OnColumnWidthChange == nil {
            return false
        }
        var width = widths[index]
        if request.Action == AccessibilityAction.Increment {
            width += 8.0
        } else if request.Action == AccessibilityAction.Decrement {
            width -= 8.0
        } else if request.Action == AccessibilityAction.SetValue {
            if !Double.TryParse(request.Value, NumberStyles.Float, CultureInfo.InvariantCulture, out width) ||
                !Double.IsFinite(width) {
                return false
            }
        } else {
            return false
        }
        RequestWidth(id, width, true)
        return true
    }
}
