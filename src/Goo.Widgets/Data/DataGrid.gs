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

/// Resolves the default row height from the theme.
public enum DataGridDensity {
    Normal;
    Compact;
    Comfortable
}

/// One host-owned sort, ordered from highest to lowest priority.
public data struct DataGridSortColumn {
    var ColumnId string?
    var Direction DataGridSort
}

/// One stable column definition used by headers, filters, and body cells.
public data struct DataGridColumn {
    var Id string?
    var Label string?
    /// Fixed logical width; nil participates in flex distribution.
    var Width float64?
    /// With no fixed Width, grows to the natural width of headers and realized cells without shrinking on scroll.
    var AutoWidth bool
    var AutoWidthContent Blob?
    /// Positive relative flex weight. Nil resolves to 1.
    var Flex float64?
    /// Width bounds. Nil resolves to 60 and 1000000.
    var Minimum float64?
    var Maximum float64?
    var Sortable bool
    /// Aligns default header and cell text. Defaults to left.
    var Alignment TextAlign
    /// Nil resolves to true; resizing requires the callback for the selected sizing mode.
    var Resizable bool?
    /// Arbitrary header and filter content. Filtering stays in the application.
    var Header Blob?
    var Filter Blob?
}

/// A stable row. Applications may use Id to look up domain objects in cell/detail factories.
public data struct DataGridRow {
    var Id string?
    var Label string?
    /// Host-owned data passed unchanged to row and cell factories.
    var Tag object?
    /// Host-owned source index passed unchanged to factories.
    var SourceIndex int32
    var Disabled bool
    /// Excludes this row from grid selection and navigation without disabling its content.
    var IsGroup bool
    var Values IReadOnlyDictionary[string, string]?
    /// Advertises a lazily built detail supplied by CreateDetail.
    var HasDetail bool
    var Detail Blob?
}

/// Controlled data and composition for a virtualized grid. Replace changed arrays/maps and rebuild the host.
public data struct DataGridInput {
    var Columns[]?DataGridColumn
    var Rows[]?DataGridRow
    /// Lazy indexed rows. Supply RowIndex and replace RowAt or increment RowVersion after data changes.
    var RowAt Func[int32, DataGridRow]?
    var RowCount int32
    /// Returns the current index of a stable row ID, or -1 when absent.
    var RowIndex Func[string, int32]?
    var RowVersion int64
    /// Advertises detail controls without enumerating lazy rows.
    var HasRowDetails bool
    /// Controlled pixel preferences; fit mode keeps definition-flex columns flexible.
    var ColumnWidths IReadOnlyDictionary[string, float64]?
    var OnColumnWidthChange Action[string, float64]?
    /// Pointer-up or keyboard commit; cancellation keeps prior change requests but does not commit.
    var OnColumnWidthCommit Action[string, float64]?
    /// Fits columns to the measured root content width, excluding a reserved vertical scrollbar.
    var FitColumnsToViewport bool
    var VirtualizeColumns bool
    /// Receives all resolved widths atomically. Columns without a definition width or AutoWidth remain flexible.
    var OnFittedColumnWidthsChange Action[IReadOnlyDictionary[string, float64]]?
    var OnFittedColumnWidthsCommit Action[IReadOnlyDictionary[string, float64]]?
    var SortColumnId string?
    var SortDirection DataGridSort
    var OnSort Action[string, DataGridSort]?
    var Sorts[]?DataGridSortColumn
    var OnSortsChange Action[[]DataGridSortColumn]?
    var PinnedColumns[]?string
    var ColumnOrder[]?string
    var OnColumnOrderChange Action[[]string]?
    var Footer Blob?
    var Density DataGridDensity
    var OnRowInvoke Action[string]?
    var Selection DataGridSelection
    var SelectedIds[]?string
    var OnSelectionChange Action[[]string]?
    /// Runs before OnSelectionChange with source indices in the same order. Missing IDs have index -1.
    var OnSelectionIndicesChange Action[[]int32]?
    /// Nil keeps the grid's active row. A valid ID controls its focus outline and active descendant.
    var ActiveRowId string?
    var OnActiveRowChange Action[string]?
    /// Receives the active source index without a host ID lookup.
    var OnActiveRowIndexChange Action[int32]?
    /// When set, the host owns selection and its range anchor. Arguments are ID, toggle, extend.
    var OnSelectionRequest Action[string, bool, bool]?
    /// Adds a leading composed checkbox. The row's semantics expose selection once.
    var ShowSelection bool
    /// Selection column width. Nil uses the theme's control height.
    var SelectionColumnWidth float64?
    var ExpandedIds[]?string
    var OnExpandedChange Action[string, bool]?
    /// Expansion control width. Nil uses the theme's control height; zero hides the control.
    var ExpandColumnWidth float64?
    /// Padding inside details, after the leading control columns. Nil uses theme control padding; zero is preserved.
    var DetailPadding float64?
    /// Detail surface color. Nil uses the nearest theme.
    var DetailBackground Color?
    var Disabled bool
    var Width Length?
    var Height Length?
    var RowHeight float64?
    /// Height of AutoRowHeight rows before measurement. Nil uses RowHeight. Must be at least RowHeight.
    /// Keep it constant, because a new value discards measured heights.
    var EstimatedRowHeight float64?
    /// Measures visible cell content at the resolved column widths. RowHeight is the minimum.
    var AutoRowHeight bool
    /// Caps the measured cells area, excluding expanded details.
    var MaximumRowHeight float64?
    /// Supplies finite positive cell heights. Replace this delegate when heights change.
    var RowHeightProvider Func[DataGridRow, float64]?
    var HeaderHeight float64?
    var FilterHeight float64?
    var AccessibilityName string?
    var BackgroundColor Color?
    var TextColor Color?
    var SelectedColor Color?
    /// Keyboard focus outline color for the active row's cells.
    var FocusColor Color?
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
    var CreateCellContent Func[DataGridInput, DataGridRow, DataGridColumn, Blob]?
    /// Replaces content inside the sortable header button.
    var CreateHeader Func[DataGridInput, DataGridColumn, Blob, Blob]?
    var CreateFilter Func[DataGridInput, DataGridColumn, Blob, Blob]?
    var CreateSelection Func[DataGridInput, DataGridRow, Button, Button]?
    var CreateDetail Func[DataGridInput, DataGridRow, Blob]?
    /// Required slots, width, identity, and semantics are reapplied.
    /// A returned OnClick handler runs after the grid's selection handler.
    var CreateRow Func[DataGridInput, DataGridRow, Container, Container]?
    /// Lazily replaces the cell slots with full-width content. Nil keeps the normal cells.
    /// Set IsGroup on group headers to exclude them from navigation and selection.
    var CreateFullWidthRow Func[DataGridInput, DataGridRow, Blob?]?
    var CreateRoot Func[DataGridInput, Container, Container]?
}

/// Shared column sizing, captured resizing, controlled sorting/selection, and measured virtual detail rows.
/// Positions use float32. Whole-pixel placement is exact up to 16,777,216 px of content and drifts beyond it.
public open class DataGrid : Cell[DataGridInput], IDisposable {
    private let defaultRootHandle ElementHandle = ElementHandle()
    private let defaultViewport ElementHandle = ElementHandle()
    private let horizontalViewport ElementHandle = ElementHandle()
    private var rootHandle ElementHandle
    private var viewport ElementHandle
    private var virtualRows VirtualRowsSource[DataGridRow]?
    private let rowHandles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private let resizeHandles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](
        StringComparer.Ordinal
    )
    private var input DataGridInput
    private var theme Theme
    private var columns[]DataGridColumn = []DataGridColumn{}
    private var rows[]DataGridRow = []DataGridRow{}
    private var indices Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
    private var hasDetails bool
    private var selected HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private var expanded HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private var widths[]float64 = []float64{}
    private var autoWidths Dictionary[string, float64]?
    private var autoWidthLayout DataGridAutoWidthLayout?
    private var available float64
    private var tableWidth float64
    private var leading float64
    private var horizontalOffset float64
    private var firstColumn int32
    private var endColumn int32
    private var beforeColumns float64
    private var afterColumns float64
    private var activeId string?
    private var hoveredId string?
    private var anchorId string?
    private var anchorSelection HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private var hasFocus bool
    private var pointerFocus bool
    private var clickModifiers KeyModifiers
    private var clickFromInteractiveChild bool
    private var clickCount int32
    private var reorderOrigin float64
    private var reordered bool
    private var pinnedCount int32
    private var pointer int64 = -1L
    private var resizeId string?
    private var origin float64
    private var originWidth float64
    private var lastWidth float64
    private var resizeWidths[]float64 = []float64{}
    private var lastFittedWidths Dictionary[string, float64]?
    private var disposed bool
    private let stopGridKeys Action[KeyEvent]
    private let moveResize Action[PointerEvent]
    private let endResize Action[PointerEvent]
    private let cancelResize Action[PointerEvent]

    public init() {
        rootHandle = defaultRootHandle
        viewport = defaultViewport
        stopGridKeys = StopGridKeys
        moveResize = MoveResize
        endResize = EndResize
        cancelResize = CancelResize
        rootHandle.MetricsChanged += Metrics
        viewport.MetricsChanged += HorizontalMetrics
        horizontalViewport.MetricsChanged += HeaderMetrics
    }

    /// Releases geometry subscriptions.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        pointer = -1L
        resizeId = nil
        rootHandle.MetricsChanged -= Metrics
        viewport.MetricsChanged -= HorizontalMetrics
        horizontalViewport.MetricsChanged -= HeaderMetrics
    }

    protected override func Build(value DataGridInput) Blob {
        theme = Theme.Read()
        let sourceChanged = !Object.Equals(input.RowAt, value.RowAt) ||
            input.RowVersion != value.RowVersion ||
            input.RowCount != value.RowCount
        let nextRootHandle = value.RootHandle ?? defaultRootHandle
        if nextRootHandle != rootHandle {
            rootHandle.MetricsChanged -= Metrics
            rootHandle = nextRootHandle
            rootHandle.MetricsChanged += Metrics
        }
        let nextViewport = value.ViewportHandle ?? defaultViewport
        if nextViewport != viewport {
            viewport.MetricsChanged -= HorizontalMetrics
            viewport = nextViewport
            viewport.MetricsChanged += HorizontalMetrics
        }
        let defaultHeight Length = 300
        input = value with{
            Width = value.Width ?? Percent(100),
            Height = value.Height ?? defaultHeight,
            RowHeight = value.RowHeight ??
                theme.ControlHeight * (
                value.Density == DataGridDensity.Compact ? 0.8: value.Density == DataGridDensity.Comfortable ? 1.25: 1.0
            ),
            HeaderHeight = value.HeaderHeight ?? theme.ControlHeight,
            FilterHeight = value.FilterHeight ?? theme.ControlHeight,
            SelectionColumnWidth = value.SelectionColumnWidth ?? theme.ControlHeight,
            ExpandColumnWidth = value.ExpandColumnWidth ?? theme.ControlHeight,
            DetailPadding = value.DetailPadding ?? theme.ControlPadding,
            DetailBackground = value.DetailBackground ?? theme.SunkenColor,
            AccessibilityName = value.AccessibilityName ?? theme.Text("Data grid"),
            BackgroundColor = value.BackgroundColor ?? theme.PanelColor,
            TextColor = value.TextColor ?? theme.TextColor,
            SelectedColor = value.SelectedColor ?? theme.SelectedFill(theme.ActiveColor),
            FocusColor = value.FocusColor ?? theme.FocusColor,
            ScrollbarX = value.ScrollbarX ?? theme.Scrollbar,
            ScrollbarY = value.ScrollbarY ?? theme.Scrollbar,
        }
        for height in[]float64{input.RowHeight!!, input.HeaderHeight!!, input.FilterHeight!!} {
            if !Double.IsFinite(height) || height <= 0.0 || height > 1000000.0 {
                throw ArgumentOutOfRangeException("Grid row/header/filter height")
            }
        }
        if let estimate = input.EstimatedRowHeight {
            if !input.AutoRowHeight || !Double.IsFinite(estimate) || estimate < input.RowHeight!! {
                throw ArgumentOutOfRangeException("EstimatedRowHeight")
            }
        }
        if let maximum = input.MaximumRowHeight {
            if !Double.IsFinite(maximum) || maximum < input.RowHeight!!|| maximum > 1000000.0 {
                throw ArgumentOutOfRangeException("MaximumRowHeight")
            }
        }
        if input.AutoRowHeight && input.VirtualizeColumns {
            throw ArgumentException("Column virtualization requires stable row heights")
        }
        if input.AutoRowHeight && input.RowHeightProvider != nil {
            throw ArgumentException("AutoRowHeight and RowHeightProvider are mutually exclusive")
        }
        ValidateWidth(input.SelectionColumnWidth!!)
        ValidateWidth(input.ExpandColumnWidth!!)
        ValidateWidth(input.DetailPadding!!)
        if input.Selection < DataGridSelection.None || input.Selection > DataGridSelection.Multiple
        || input.SortDirection < DataGridSort.None || input.SortDirection > DataGridSort.Descending {
            throw ArgumentOutOfRangeException("Grid selection/sort policy")
        }
        columns = input.Columns ?? []DataGridColumn{}
        if sourceChanged {
            for column in columns {
                if column.AutoWidthContent != nil {
                    autoWidths?.Remove(column.Id!!)
                }
            }
        }
        let nextRows = input.Rows ?? (input.RowAt != nil ? rows: []DataGridRow{})
        let rowsChanged = !Object.ReferenceEquals(rows, nextRows)
        if input.RowAt != nil && (input.RowIndex == nil || input.RowCount < 0) {
            throw ArgumentException("Indexed rows require RowIndex and a nonnegative count")
        }
        if input.RowAt != nil && input.RowHeightProvider != nil {
            throw ArgumentException("Indexed rows use RowHeight or AutoRowHeight")
        }
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
        if input.ColumnOrder != nil || input.PinnedColumns != nil {
            let ordered = List[DataGridColumn](columns.Length)
            let used = HashSet[string](StringComparer.Ordinal)
            for id in input.PinnedColumns ?? []string{} {
                if !columnIds.Contains(id) || !used.Add(id) {
                    throw ArgumentException("Invalid pinned column ID")
                }
                ordered.Add(columns[ColumnIndex(id)])
            }
            pinnedCount = ordered.Count
            for id in input.ColumnOrder ?? []string{} {
                if !columnIds.Contains(id) {
                    throw ArgumentException("Invalid column order ID")
                }
                if used.Add(id) {
                    ordered.Add(columns[ColumnIndex(id)])
                }
            }
            for column in columns {
                if used.Add(column.Id!!) {
                    ordered.Add(column)
                }
            }
            columns = ordered.ToArray()
        } else {
            pinnedCount = 0
        }
        if let overrides = input.ColumnWidths {
            for pair in overrides {
                ValidateWidth(pair.Value)
            }
        }
        if input.RowAt != nil {
            hasDetails = input.HasRowDetails
            if sourceChanged {
                indices.Clear()
                PruneRows()
            }
        } else if rowsChanged || sourceChanged {
            let nextIndices = Dictionary[string, int32](nextRows.Length, StringComparer.Ordinal)
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
        let controlledActiveChanged = input.ActiveRowId != nil &&
            input.ActiveRowId != activeId &&
            Index(input.ActiveRowId) >= 0
        if controlledActiveChanged {
            activeId = input.ActiveRowId
        }
        expanded = HashSet[string](input.ExpandedIds ?? []string{}, StringComparer.Ordinal)
        Prune(resizeHandles, columnIds)
        if input.Disabled || !CanResize(ColumnIndex(resizeId))
        || !(columns[ColumnIndex(resizeId)].Resizable ?? true) {
            pointer = -1L
            resizeId = nil
        }
        if input.ActiveRowId == nil &&
            selectionChanged &&
            input.Selection == DataGridSelection.Single &&
            selected.Count == 1 {
            for id in selected {
                if Index(id) >= 0 {
                    activeId = id
                    break
                }
            }
            Reveal()
        }
        if Index(activeId) < 0 {
            activeId = nil
            for id in selected {
                if Index(id) >= 0 {
                    activeId = id
                    break
                }
            }
            activeId ??= First(false)
        }
        if Index(anchorId) < 0 {
            anchorId = activeId
            anchorSelection = HashSet[string](selected, StringComparer.Ordinal)
        }
        if controlledActiveChanged && hasFocus && !pointerFocus {
            Reveal()
        }
        let details = hasDetails && input.ExpandColumnWidth > 0.0
        leading = (
            input.ShowSelection && input.Selection != DataGridSelection.None ? input.SelectionColumnWidth!!: 0.0
        ) +
            (details ? input.ExpandColumnWidth!!: 0.0)
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
        ResolveVisibleColumns()
        let snapshot = input
        virtualRows = nil
        var body Blob = if RowCount == 0 {
            Container{
                OverflowY: Overflow.Scroll,
                Container{
                    Width: tableWidth,
                    FlexGrow: 1,
                    MinHeight: 0,
                    Container{
                        Width: Math.Max(0, Math.Min(tableWidth, available - verticalGutter)),
                        FlexGrow: 1,
                        Transform: PanelTransform{TranslateX: horizontalOffset},
                        AlignItems: AlignItems.Center,
                        JustifyContent: JustifyContent.Center,
                        input.EmptyContent ?? Text{Content: theme.Text("No rows"), Color: theme.MutedTextColor, FontSize: theme.FontSize}
                    }
                }
            }
        } else {
            let key((DataGridRow) -> string) = (row DataGridRow) -> row.Id!!
            let build((DataGridRow) -> Blob) = (row DataGridRow) -> BuildRow(snapshot, row, details)
            let source = VirtualRowsSource[DataGridRow](
                rows,
                virtualItemExtent(input.EstimatedRowHeight ?? input.RowHeight!!, "EstimatedRowHeight"),
                key,
                build,
                snapshot.RowHeightProvider
            ){
                Get = input.RowAt == nil ? nil: Row,
                Index = RawIndex,
                Count = RowCount,
                AutoHeight = input.AutoRowHeight,
                Version = input.RowVersion,
                StableItems = true,
                Identity = input.RowAt,
                ContentWidth = tableWidth
            }
            virtualRows = source
            Virtual(source)
        }
        body.Key = "body"
        body.Handle = viewport
        body.ScrollbarY = input.ScrollbarY
        body.OverflowX = Overflow.Scroll
        body.ScrollbarX = input.ScrollbarX
        if let visibility = input.ScrollbarVisibilityX {
            body.ScrollbarVisibilityX = visibility
        }
        if let visibility = input.ScrollbarVisibilityY {
            body.ScrollbarVisibilityY = visibility
        }
        body.Width = Percent(100)
        body.FlexGrow = 1
        body.FlexBasis = 0
        body.MinWidth = 0
        body.MinHeight = 0
        let canvas = Container{Width: tableWidth + verticalGutter, FlexShrink: 0}
        canvas.Children.Add(BuildHeader(snapshot, false))
        var filters = input.CreateFilter != nil
        for column in columns {
            filters = filters || column.Filter != nil
        }
        if filters {
            canvas.Children.Add(BuildHeader(snapshot, true))
        }
        let headers = Container{
            Handle: horizontalViewport,
            Width: Percent(100),
            FlexShrink: 0,
            MinWidth: 0,
            OverflowX: Overflow.Scroll,
            OverflowY: Overflow.Hidden,
            ScrollbarVisibilityX: ScrollbarVisibility.Hidden,
            OnFocus: (e FocusEvent) -> e.StopPropagation(),
            OnBlur: (e FocusEvent) -> e.StopPropagation(),
            canvas
        }
        var root = Container{
            LineHeight: theme.LineHeight,
            Handle: rootHandle,
            Width: input.Width!!,
            Height: input.Height!!,
            MinWidth: 0,
            MinHeight: 0,
            BackgroundColor: input.BackgroundColor!!,
            BorderWidth: 1,
            BorderColor: theme.BorderColor,
            BorderRadius: theme.PanelRadius,
            Padding: Edges{Right: theme.RowInset, Left: theme.RowInset},
            Overflow: Overflow.Hidden
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
        let hostPointer = root.OnPointerDown
        root.Handle = rootHandle
        root.FlexDirection = FlexDirection.Column
        root.Disabled = input.Disabled
        root.Focusable = !input.Disabled
        root.OnKeyDown = (e KeyEvent) -> {
            if e.Key == Key.Tab ||
                e.Key == Key.Left ||
                e.Key == Key.Right ||
                e.Key == Key.Up ||
                e.Key == Key.Down ||
                e.Key == Key.Home ||
                e.Key == Key.End ||
                e.Key == Key.PageUp ||
                e.Key == Key.PageDown {
                pointerFocus = false
            }
            if input.UseDefaultKeyboard ?? true {
                KeyDown(e)
            }
            hostKeys?.Invoke(e)
            input.OnKeyDown?.Invoke(e)
        }
        root.OnPointerDown = (e PointerEvent) -> {
            pointerFocus = true
            hostPointer?.Invoke(e)
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
            pointerFocus = false
            hostBlur?.Invoke(e)
        }
        var active ElementHandle?
        if let id = activeId {
            active = Handle(rowHandles, id)
        }
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.Grid,
            Name: input.AccessibilityName!!,
            Description: theme.Text("{0} rows, {1} columns", RowCount, columns.Length),
            MultiSelectable: input.Selection == DataGridSelection.Multiple,
            Relationships: AccessibilityRelationships{ActiveDescendant: active}
        }
        root.Children.Clear()
        root.Children.Add(headers)
        root.Children.Add(body)
        if let footer = input.Footer {
            root.Children.Add(
                Container{
                    Key: "footer",
                    FlexShrink: 0,
                    Padding: Edges{Left: theme.ControlPadding, Right: theme.ControlPadding, Top: theme.Spacing * 2, Bottom: theme.Spacing * 2},
                    BorderWidth: Edges{Top: 1},
                    BorderColor: theme.BorderColor,
                    Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: theme.Text("Grid summary")},
                    footer
                }
            )
        }
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

    private func ColumnIndex(id string?) int32 {
        for index in 0 ... columns.Length {
            if columns[index].Id == id {
                return index
            }
        }
        return -1
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

    private func Metrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        if Math.Abs(metrics.ContentBox.Width - available) > .01 {
            available = metrics.ContentBox.Width
            Rebuild()
        }
    }

    private func HeaderMetrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted || !viewport.IsMounted
        || metrics.ScrollOffset.X == horizontalOffset {
            return
        }
        viewport.JumpTo(metrics.ScrollOffset.X, viewport.ScrollOffset.Y)
        horizontalOffset = viewport.ScrollOffset.X
        if metrics.ScrollOffset.X != horizontalOffset {
            horizontalViewport.JumpTo(horizontalOffset, 0)
        }
        if pinnedCount > 0 {
            Rebuild()
        }
    }

    private func HorizontalMetrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        if metrics.ScrollOffset.X != horizontalOffset {
            horizontalOffset = metrics.ScrollOffset.X
            horizontalViewport.JumpTo(horizontalOffset, 0)
            if pinnedCount > 0 {
                Rebuild()
            }
        }
        if !input.VirtualizeColumns {
            return
        }
        let previousFirst = firstColumn
        let previousEnd = endColumn
        ResolveVisibleColumns()
        if previousFirst != firstColumn || previousEnd != endColumn {
            Rebuild()
        }
    }

    private func ResolveVisibleColumns() {
        firstColumn = 0
        endColumn = columns.Length
        beforeColumns = 0.0
        afterColumns = 0.0
        if !input.VirtualizeColumns || !viewport.IsMounted {
            return
        }
        let left = viewport.ScrollOffset.X
        let right = left + viewport.ContentBox.Width
        var position = leading
        for index in 0 ... columns.Length {
            let end = position + widths[index]
            if index >= pinnedCount && end <= left {
                firstColumn = index + 1
                beforeColumns += widths[index]
            } else if index >= pinnedCount && position >= right {
                endColumn = Math.Min(endColumn, index)
                afterColumns += widths[index]
            }
            position = end
        }
    }

    private func Clamp(index int32, width float64) float64 -> Math.Clamp(
        width,
        columns[index].Minimum ?? 60.0,
        columns[index].Maximum ?? 1000000.0
    )

    private func ResolveWidths(verticalGutter float64) {
        widths = [columns.Length]float64
        if input.FitColumnsToViewport {
            ResolveFittedWidths(verticalGutter)
            return
        }
        let flexible = [columns.Length]bool
        tableWidth = leading
        var maxWeight float64 = 1.0
        for index in 0 ... columns.Length {
            let column = columns[index]
            var fixedWidth = column.Width
            if column.AutoWidth && fixedWidth == nil {
                fixedWidth = autoWidths != nil && autoWidths!!.TryGetValue(column.Id!!, out var measured) ?
                measured: (column.Minimum ?? 60.0)
            }
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
            var space = remaining
            for index in 0 ... columns.Length {
                if flexible[index] {
                    weight += (columns[index].Flex ?? 1.0) / maxWeight
                    space += widths[index]
                }
            }
            if weight <= 0.0 {
                break
            }
            var violation = 0.0
            for index in 0 ... columns.Length {
                if flexible[index] {
                    let share = space * ((columns[index].Flex ?? 1.0) / maxWeight) / weight
                    violation += Clamp(index, share) - share
                }
            }
            for index in 0 ... columns.Length {
                if !flexible[index] {
                    continue
                }
                let share = space * ((columns[index].Flex ?? 1.0) / maxWeight) / weight
                let width = Clamp(index, share)
                if (violation == 0.0) || (violation < 0.0 && width < share) || (violation > 0.0 && width > share) {
                    remaining -= width - widths[index]
                    widths[index] = width
                    flexible[index] = false
                }
            }
        }
        tableWidth = leading
        for width in widths {
            tableWidth += width
        }
        if !Double.IsFinite(tableWidth) || tableWidth > 1000000000.0 {
            throw ArgumentOutOfRangeException("Grid total width")
        }
    }

    private func ResolveFittedWidths(verticalGutter float64) {
        let flexible = [columns.Length]bool
        var total float64
        for index in 0 ... columns.Length {
            let column = columns[index]
            var requested = column.Width
            if column.AutoWidth && requested == nil {
                requested = autoWidths != nil && autoWidths!!.TryGetValue(column.Id!!, out var measured) ?
                measured: (column.Minimum ?? 60.0)
            }
            if let overrides = input.ColumnWidths {
                if overrides.TryGetValue(column.Id!!, out var width) {
                    requested = width
                }
            }
            flexible[index] = column.Width == nil && !column.AutoWidth
            widths[index] = Clamp(index, requested ?? (column.Minimum ?? 60.0))
            total += widths[index]
        }
        let target = Math.Max(0.0, available - verticalGutter - leading)
        var remaining = target - total
        if remaining > 0.0 {
            remaining = DistributeWidth(remaining, flexible, true, true)
            remaining = DistributeWidth(remaining, flexible, false, true)
        } else {
            remaining = DistributeWidth(remaining, flexible, true, false)
            remaining = DistributeWidth(remaining, flexible, false, false)
        }
        tableWidth = leading
        for width in widths {
            tableWidth += width
        }
        if !Double.IsFinite(tableWidth) || tableWidth > 1000000000.0 {
            throw ArgumentOutOfRangeException("Grid total width")
        }
    }

    private func DistributeWidth(delta float64, flexible[]bool, selected bool, grow bool) float64 {
        var remaining = delta
        for pass in 0 ... columns.Length {
            var weight float64
            for index in 0 ... columns.Length {
                if flexible[index] != selected {
                    continue
                }
                let capacity = if grow {
                    (columns[index].Maximum ?? 1000000.0) - widths[index]
                } else {
                    widths[index] - (columns[index].Minimum ?? 60.0)
                }
                if capacity > .001 {
                    weight += grow ? (selected ? (columns[index].Flex ?? 1.0): 1.0): capacity
                }
            }
            if weight <= 0.0 || Math.Abs(remaining) <= .001 {
                break
            }
            var consumed float64
            for index in 0 ... columns.Length {
                if flexible[index] != selected {
                    continue
                }
                let capacity = if grow {
                    (columns[index].Maximum ?? 1000000.0) - widths[index]
                } else {
                    widths[index] - (columns[index].Minimum ?? 60.0)
                }
                if capacity <= .001 {
                    continue
                }
                let share = grow ? (selected ? (columns[index].Flex ?? 1.0): 1.0): capacity
                let amount = Math.Min(capacity, Math.Abs(remaining) * share / weight)
                widths[index] += grow ? amount: -amount
                consumed += amount
            }
            remaining += grow ? -consumed: consumed
        }
        return remaining
    }

    private func BuildHeader(snapshot DataGridInput, filter bool) Blob {
        let row = Container{
            Key: filter ? "filters": "header",
            Width: tableWidth,
            Height: filter ? snapshot.FilterHeight!!: snapshot.HeaderHeight!!,
            FlexShrink: 0,
            FlexDirection: FlexDirection.Row,
            BackgroundColor: theme.RaisedColor,
            BorderWidth: Edges{Bottom: 1},
            BorderColor: theme.BorderColor,
            BasedOn: snapshot.HeaderStyle,
            Accessibility: Accessibility{Role: AccessibilityRole.Row}
        }
        if leading > 0.0 {
            row.Children.Add(
                Container{
                    Key: "leading",
                    Width: leading,
                    FlexShrink: 0,
                    Accessibility: Accessibility{Role: AccessibilityRole.ColumnHeader, Name: theme.Text("Row controls")}
                }
            )
        }
        for index in 0 ... columns.Length {
            let column = columns[index]
            let id = column.Id!!
            let label = column.Label ?? id
            let direction = filter ? DataGridSort.None: SortDirection(id)
            var content Blob = filter ? (column.Filter ?? Container{}): (
                column.Header ??
                    Text{
                    Content: label,
                    Color: theme.MutedTextColor,
                    TextWrap: TextWrap.NoWrap,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.LabelFontSize,
                    FontWeight: theme.LabelFontWeight,
                }
            )
            if !filter && column.Header == nil && direction != DataGridSort.None {
                content = Container{
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    Gap: theme.Spacing,
                    content,
                    MaterialIcons.Create(direction == DataGridSort.Ascending ? "arrow_upward": "arrow_downward", 14, theme.MutedTextColor)
                }
            }
            if filter {
                if let create = snapshot.CreateFilter {
                    content = create(snapshot, column, content)
                }
            } else {
                if let create = snapshot.CreateHeader {
                    content = create(snapshot, column, content)
                }
            }
            if !filter && column.AutoWidth && column.Width == nil {
                content = MeasureWidth(id, content, column.AutoWidthContent)
            }
            let slot = Container{
                Key: "column:" + id,
                Width: widths[index],
                FlexShrink: 0,
                MinWidth: 0,
                Position: PositionType.Relative,
                Overflow: Overflow.Hidden,
                OnKeyDown: stopGridKeys
            }
            if filter {
                slot.Padding = theme.Spacing
                slot.Accessibility = Accessibility{Role: AccessibilityRole.GridCell, Name: theme.Text("Filter {0}", label)}
                slot.Children.Add(Container{Key: "content", FlexGrow: 1, MinWidth: 0, content})
            } else {
                let sort = Button{
                    Key: "content",
                    FlexGrow: 1,
                    MinWidth: 0,
                    Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
                    AlignItems: column.Alignment == TextAlign.Right ? AlignItems.FlexEnd: column.Alignment == TextAlign.Center ? AlignItems.Center: AlignItems.FlexStart,
                    TextAlign: column.Alignment,
                    Focus: Style{OutlineWidth: 2.0, OutlineColor: theme.FocusColor, OutlineOffset: -2.0},
                    BackgroundColor: Color.Transparent,
                    Focusable: column.Sortable &&
                        (snapshot.OnSort != nil || snapshot.OnSortsChange != nil) &&
                        !snapshot.Disabled ||
                        snapshot.OnColumnOrderChange != nil &&
                        !snapshot.Disabled,
                    OnClick: () -> Sort(id),
                    OnPointerDown: (e PointerEvent) -> {
                        reorderOrigin = e.WindowPosition.X
                        reordered = false
                        if snapshot.OnColumnOrderChange != nil &&
                            e.Button == PointerButton.Primary &&
                            !snapshot.Disabled {
                            e.Capture()
                        }
                    },
                    OnPointerUp: (e PointerEvent) -> Reorder(id, e),
                    OnKeyDown: (e KeyEvent) -> {
                        if e.Modifiers.Alt && (e.Key == Key.Left || e.Key == Key.Right) {
                            MoveColumn(id, e.Key == Key.Left ? -1: 1)
                            e.PreventDefault()
                            e.StopPropagation()
                        }
                    },
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.ColumnHeader,
                        Name: label,
                        Description: direction.ToString()
                    },
                    content
                }
                WidgetKeyBindings.BindActivation(sort)
                slot.Children.Add(sort)
                if (column.Resizable ?? true) && CanResize(index) {
                    var handle = Container{
                        BackgroundColor: Color.Transparent,
                        BorderWidth: Edges{Right: 1},
                        BorderColor: resizeId == id ? theme.FocusColor: Color.Transparent,
                        Hover: Style{BorderColor: theme.FocusColor},
                        Focus: Style{OutlineWidth: 2.0, OutlineColor: theme.FocusColor, OutlineOffset: -2.0},
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
                    handle.OnPointerMove = moveResize
                    handle.OnPointerUp = endResize
                    handle.OnPointerCancel = cancelResize
                    handle.OnKeyDown = (e KeyEvent) -> ResizeKey(id, e)
                    handle.Accessibility = Accessibility{
                        Role: AccessibilityRole.Slider,
                        Name: theme.Text("Resize {0}", label),
                        Orientation: AccessibilityOrientation.Horizontal,
                        Range: AccessibilityValue{
                            Minimum: ResizeMinimum(index),
                            Maximum: ResizeMaximum(index),
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
            if index < pinnedCount {
                slot.Transform = PanelTransform{TranslateX: horizontalOffset}
                slot.ZIndex = 1
                slot.BackgroundColor = theme.RaisedColor
            }
            row.Children.Add(slot)
        }
        return row
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
            OutlineWidth: activeId == id && hasFocus && !pointerFocus ? 2.0: 0.0,
            OutlineColor: snapshot.FocusColor!!,
            OutlineOffset: -2
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
                        MaterialIcons.Create(isExpanded ? "expand_more": "chevron_right", 16, snapshot.TextColor)
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
            BorderRadius: theme.RowInset > 0.0 ? theme.ControlRadius: 0.0,
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

    private func SortDirection(id string) DataGridSort {
        if let sorts = input.Sorts {
            for sort in sorts {
                if sort.ColumnId == id {
                    return sort.Direction
                }
            }
            return DataGridSort.None
        }
        return input.SortColumnId == id ? input.SortDirection: DataGridSort.None
    }

    private func Sort(id string) {
        if reordered {
            reordered = false
            return
        }
        let index = ColumnIndex(id)
        if index < 0 || input.Disabled || !columns[index].Sortable {
            return
        }
        let current = SortDirection(id)
        let next = current == DataGridSort.None ? DataGridSort.Ascending: current == DataGridSort.Ascending ? DataGridSort.Descending: DataGridSort.None
        if input.OnSortsChange != nil {
            let sorts = List[DataGridSortColumn]()
            var found = false
            for sort in input.Sorts ?? []DataGridSortColumn{} {
                if sort.ColumnId == id {
                    found = true
                    if next != DataGridSort.None {
                        sorts.Add(DataGridSortColumn{ColumnId: id, Direction: next})
                    }
                } else {
                    sorts.Add(sort)
                }
            }
            if !found && next != DataGridSort.None {
                sorts.Add(DataGridSortColumn{ColumnId: id, Direction: next})
            }
            input.OnSortsChange?.Invoke(sorts.ToArray())
        } else {
            input.OnSort?.Invoke(id, next)
        }
    }

    private func MoveColumn(id string, delta int32) {
        let index = ColumnIndex(id)
        let target = index + delta
        if input.Disabled ||
            input.OnColumnOrderChange == nil ||
            index < pinnedCount ||
            target < pinnedCount ||
            target >= columns.Length {
            return
        }
        let order = [columns.Length]string
        for i in 0 ... columns.Length {
            order[i] = columns[i].Id!!
        }
        order[index] = columns[target].Id!!
        order[target] = id
        input.OnColumnOrderChange?.Invoke(order)
    }

    private func Reorder(id string, e PointerEvent) {
        e.ReleaseCapture()
        if input.Disabled || e.Button != PointerButton.Primary || Math.Abs(e.WindowPosition.X - reorderOrigin) < 8 ||
            input.OnColumnOrderChange == nil {
            return
        }
        let index = ColumnIndex(id)
        var target = pinnedCount
        var x = rootHandle.ContentBox.X + leading - horizontalOffset
        for i in 0 ... columns.Length {
            if e.WindowPosition.X >= x + widths[i] / 2 {
                target = i
            }
            x += widths[i]
        }
        if index < pinnedCount || target == index {
            return
        }
        let order = List[string](columns.Length)
        for column in columns {
            if column.Id != id {
                order.Add(column.Id!!)
            }
        }
        order.Insert(Math.Clamp(target, pinnedCount, order.Count), id)
        reordered = true
        input.OnColumnOrderChange?.Invoke(order.ToArray())
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

    private func CanResize(index int32) bool -> index >= 0 &&
        (
        input.FitColumnsToViewport ?
        index < columns.Length - 1 && input.OnFittedColumnWidthsChange != nil:
        input.OnColumnWidthChange != nil
    )

    private func ResizeMinimum(index int32) float64 {
        let minimum = columns[index].Minimum ?? 60.0
        if !input.FitColumnsToViewport {
            return minimum
        }
        var capacity float64
        for next in index + 1 ... columns.Length {
            capacity += (columns[next].Maximum ?? 1000000.0) - widths[next]
        }
        return Math.Max(minimum, widths[index] - capacity)
    }

    private func ResizeMaximum(index int32) float64 {
        let maximum = columns[index].Maximum ?? 1000000.0
        if !input.FitColumnsToViewport {
            return maximum
        }
        var capacity float64
        for next in index + 1 ... columns.Length {
            capacity += widths[next] - (columns[next].Minimum ?? 60.0)
        }
        return Math.Min(maximum, widths[index] + capacity)
    }

    private func RequestWidth(id string, width float64, commit bool, source[]float64) {
        let index = ColumnIndex(id)
        if index < 0 || input.Disabled || !(columns[index].Resizable ?? true) || !CanResize(index) || !Double.IsFinite(
            width
        ) {
            return
        }
        if input.FitColumnsToViewport {
            let next = [columns.Length]float64
            for column in 0 ... columns.Length {
                next[column] = source[column]
            }
            let requested = Math.Clamp(width, ResizeMinimum(index), ResizeMaximum(index))
            var delta = requested - source[index]
            next[index] = requested
            for column in index + 1 ... columns.Length {
                if delta > 0.0 {
                    let take = Math.Min(delta, next[column] - (columns[column].Minimum ?? 60.0))
                    next[column] -= take
                    delta -= take
                } else if delta < 0.0 {
                    let give = Math.Min(-delta, (columns[column].Maximum ?? 1000000.0) - next[column])
                    next[column] += give
                    delta += give
                }
            }
            let resolved = Dictionary[string, float64](StringComparer.Ordinal)
            for column in 0 ... columns.Length {
                resolved.Add(columns[column].Id!!, next[column])
            }
            lastWidth = requested
            lastFittedWidths = resolved
            input.OnFittedColumnWidthsChange!!(resolved)
            if commit {
                input.OnFittedColumnWidthsCommit?.Invoke(resolved)
            }
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
        if index < 0 || input.Disabled || !CanResize(index) || pointer != -1L || e.Button != PointerButton.Primary {
            return
        }
        pointer = e.PointerId
        resizeId = id
        origin = e.WindowPosition.X
        originWidth = widths[index]
        lastWidth = originWidth
        resizeWidths = [columns.Length]float64
        for column in 0 ... columns.Length {
            resizeWidths[column] = widths[column]
        }
        lastFittedWidths = nil
        e.Capture()
        e.PreventDefault()
        e.StopPropagation()
        Handle(resizeHandles, id).Focus()
        Rebuild()
    }

    private func MoveResize(e PointerEvent) {
        if pointer == e.PointerId && resizeId != nil {
            RequestWidth(resizeId!!, originWidth + e.WindowPosition.X - origin, false, resizeWidths)
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
            if input.FitColumnsToViewport {
                if let resolved = lastFittedWidths {
                    input.OnFittedColumnWidthsCommit?.Invoke(resolved)
                }
            } else {
                input.OnColumnWidthCommit?.Invoke(resizeId!!, lastWidth)
            }
        }
        resizeId = nil
        lastFittedWidths = nil
        Rebuild()
    }

    private func CancelResize(e PointerEvent) {
        if pointer == e.PointerId {
            e.ReleaseCapture()
            pointer = -1L
            resizeId = nil
            lastFittedWidths = nil
            Rebuild()
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
            e.Key == Key.Home ? ResizeMinimum(index): e.Key == Key.End ? (ResizeMaximum(index)): widths[index] +
                (e.Key == Key.Left ? -8.0: 8.0),
            true,
            widths
        )
    }

    private func ResizeAction(id string, request AccessibilityActionRequest) bool {
        let index = ColumnIndex(id)
        if index < 0 || input.Disabled || !CanResize(index) {
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
        RequestWidth(id, width, true, widths)
        return true
    }

    private func MeasureWidth(id string, content Blob, measurement Blob? = nil) Blob {
        let handle = ElementHandle()
        handle.MetricsChanged += (metrics ElementMetrics) -> {
            if disposed || !metrics.IsMounted {
                return
            }
            let index = ColumnIndex(id)
            if index < 0 || !columns[index].AutoWidth {
                return
            }
            let width = Clamp(index, metrics.BorderBox.Width + theme.ControlPadding * 2.0)
            autoWidths ??= Dictionary[string, float64](StringComparer.Ordinal)
            let values = autoWidths!!
            let previous = values.TryGetValue(id, out var known) ? known: (columns[index].Minimum ?? 60.0)
            if width > previous + .1 {
                values[id] = width
                Rebuild()
            }
        }
        autoWidthLayout ??= DataGridAutoWidthLayout()
        let wrapper = Container{
            Width: Percent(100),
            MinWidth: 0,
            FlexGrow: 1,
            Layout: autoWidthLayout,
            Container{Width: Percent(100), MinWidth: 0, JustifyContent: JustifyContent.Center, content},
            Container{Handle: handle}
        }
        if measurement != nil {
            wrapper.Children.Add(
                Container{Overflow: Overflow.Hidden, Accessibility: Accessibility{Hidden: true}, measurement}
            )
        }
        return wrapper
    }
}

internal class DataGridAutoWidthLayout : LayoutAlgorithm {
    public func Measure(context LayoutContext, available LayoutSize) LayoutSize -> context.MeasureChild(0, available)

    public func Arrange(context LayoutContext, finalSize LayoutSize) {
        let natural = context.MeasureChild(
            context.ChildCount == 3 ? 2: 0,
            LayoutSize{Width: Double.PositiveInfinity, Height: Double.PositiveInfinity}
        )
        context.MeasureChild(0, finalSize)
        context.ArrangeChild(0, ElementRect{Width: finalSize.Width, Height: finalSize.Height})
        context.ArrangeChild(1, ElementRect{Width: natural.Width, Height: 0})
        if context.ChildCount == 3 {
            context.ArrangeChild(2, ElementRect{Width: natural.Width, Height: 0})
        }
    }
}
