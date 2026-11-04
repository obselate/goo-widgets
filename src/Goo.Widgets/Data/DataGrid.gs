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

internal class DataGridRowComparer : IEqualityComparer[DataGridRow] {
    public func Equals(a DataGridRow, b DataGridRow) bool ->
        Object.Equals(a.Id, b.Id) && Object.Equals(a.Label, b.Label) &&
        Object.Equals(a.Tag, b.Tag) && a.SourceIndex == b.SourceIndex &&
        a.Disabled == b.Disabled && a.IsGroup == b.IsGroup &&
        Object.Equals(a.Values, b.Values) && a.HasDetail == b.HasDetail &&
        Object.Equals(a.Detail, b.Detail)

    public func GetHashCode(row DataGridRow) int32 -> row.GetHashCode()
}

/// Shared column sizing, captured resizing, controlled sorting/selection, and measured virtual detail rows.
/// Positions use float32. Whole-pixel placement is exact up to 16,777,216 px of content and drifts beyond it.
public open partial class DataGrid : Cell[DataGridInput], IDisposable {
    private let rowEquality IEqualityComparer[DataGridRow] = DataGridRowComparer()
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
            SelectedColor = value.SelectedColor ?? theme.SelectedFill(
                theme.NativeLook ? theme.AccentColor.WithAlpha(0.15): theme.ActiveColor
            ),
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
                Equality = rowEquality,
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
            BorderRadius: theme.PanelRadius!!,
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

}
