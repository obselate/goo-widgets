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
    /// Preserves the host-provided row order.
    None;
    /// Requests increasing values for the column.
    Ascending;
    /// Requests decreasing values for the column.
    Descending
}

/// Row selection policy.
public enum DataGridSelection {
    /// Disables row selection.
    None;
    /// Permits one selected row.
    Single;
    /// Permits a set of selected rows.
    Multiple
}

/// One host-owned sort, ordered from highest to lowest priority.
public data struct DataGridSortColumn {
    /// Stable ID of the column to sort. It must identify a current column.
    var ColumnId string?
    /// Requested direction for this column. None leaves its order unchanged.
    var Direction DataGridSort
}

/// One stable column definition used by headers, filters, and body cells.
public data struct DataGridColumn {
    /// Required stable, nonempty column ID, unique in the grid.
    var Id string?
    /// Header label. Nil falls back to the column ID.
    var Label string?
    /// Fixed logical width; nil participates in flex distribution.
    var Width float64?
    /// With no fixed Width, grows to the natural width of headers and realized cells without shrinking on scroll.
    var AutoWidth bool
    /// Representative content measured for automatic width. Nil uses the header measurement.
    var AutoWidthContent Blob?
    /// Positive relative flex weight. Nil resolves to 1.
    var Flex float64?
    /// Width bounds. Nil resolves to 60 and 1000000.
    var Minimum float64?
    /// Maximum column width in logical pixels. Nil leaves the width unbounded.
    var Maximum float64?
    /// Enables header activation to request a sort change. The host applies row ordering.
    var Sortable bool
    /// Aligns default header and cell text. Defaults to left.
    var Alignment TextAlign
    /// Nil resolves to true; resizing requires the callback for the selected sizing mode.
    var Resizable bool?
    /// Arbitrary header and filter content. Filtering stays in the application.
    var Header Blob?
    /// Caller-built filter content below this column header. Nil omits the filter.
    var Filter Blob?
    /// Enables editing unless the row or CanEdit overrides it. False is the default.
    var Editable bool
    /// Uses a native multiline editor. False uses a single-line field.
    var Multiline bool
    /// Editor placement. Inline preserves the row height.
    var EditPresentation DataGridEditPresentation
    /// Receives this column, the edit context and the prepared editor. Preserve its handle, draft binding and lifecycle routing.
    /// Hosts must not change state in this callback.
    var CreateEditor Func[DataGridColumn, DataGridEditContext, Blob, Blob]?
}

/// A stable row. Applications may use Id to look up domain objects in cell/detail factories.
public data struct DataGridRow {
    /// Required stable, nonempty row ID, unique in the grid.
    var Id string?
    /// Accessible row label. Nil falls back to the row ID.
    var Label string?
    /// Host-owned data passed unchanged to row and cell factories.
    var Tag object?
    /// Host-owned source index passed unchanged to factories.
    var SourceIndex int32
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Optional row-wide editing override. Nil uses each column's Editable value.
    var Editable bool?
    /// Excludes this row from selection. Navigation requires OnGroupExpandedChange.
    var IsGroup bool
    /// Text values indexed by column ID. Nil supplies empty cell text.
    var Values IReadOnlyDictionary[string, string]?
    /// Advertises a lazily built detail supplied by CreateDetail.
    var HasDetail bool
    /// Expanded row content. Nil supplies no default detail.
    var Detail Blob?
}

/// Controlled data and composition for a virtualized grid. Replace changed arrays/maps and rebuild the host.
public data struct DataGridInput {
    /// Column descriptors in display order. Nil supplies no columns. IDs must be nonempty and unique.
    var Columns[]?DataGridColumn
    /// Host-owned rows in display order. Nil supplies no rows unless the indexed source is used. IDs must be unique.
    var Rows[]?DataGridRow
    /// Lazy indexed rows. Supply RowIndex and replace RowAt or increment RowVersion after data changes.
    /// Hosts must not change state in this callback.
    var RowAt Func[int32, DataGridRow]?
    /// Nonnegative row count for RowAt. Used only when RowAt supplies the indexed source.
    var RowCount int32
    /// Returns the current index of a stable row ID, or -1 when absent.
    /// Hosts must not change state in this callback.
    var RowIndex Func[string, int32]?
    /// Indexed-source revision. Change this after source edits so retained rows are refreshed.
    var RowVersion int64
    /// Advertises detail controls without enumerating lazy rows.
    var HasRowDetails bool
    /// Controlled pixel preferences; fit mode keeps definition-flex columns flexible.
    var ColumnWidths IReadOnlyDictionary[string, float64]?
    /// Receives the column ID and new width in logical pixels during a resize. Nil disables ordinary column resizing.
    var OnColumnWidthChange Action[string, float64]?
    /// Pointer-up or keyboard commit; cancellation keeps prior change requests but does not commit.
    var OnColumnWidthCommit Action[string, float64]?
    /// Fits columns to the measured root content width, excluding a reserved vertical scrollbar.
    var FitColumnsToViewport bool
    /// Builds only visible center columns while retaining pinned columns.
    var VirtualizeColumns bool
    /// Receives all resolved widths atomically. Columns without a definition width or AutoWidth remain flexible.
    var OnFittedColumnWidthsChange Action[IReadOnlyDictionary[string, float64]]?
    /// Receives the complete fitted column-width map in logical pixels after a resize completes. Nil ignores the commit.
    var OnFittedColumnWidthsCommit Action[IReadOnlyDictionary[string, float64]]?
    /// ID of the single sorted column. Nil means no single-column sort.
    var SortColumnId string?
    /// Controlled single-column sort direction. The host supplies rows in the requested order.
    var SortDirection DataGridSort
    /// Receives the column ID and requested sort direction after header activation. Nil ignores the request.
    var OnSort Action[string, DataGridSort]?
    /// Controlled multi-column sorts in precedence order. Nil uses the single-column sort fields.
    var Sorts[]?DataGridSortColumn
    /// Receives the new ordered sort descriptors after header input. Nil ignores the request.
    var OnSortsChange Action[[]DataGridSortColumn]?
    /// Column IDs pinned at the leading edge. Nil pins no columns.
    var PinnedColumns[]?string
    /// Controlled column IDs in display order. Nil uses the descriptor order.
    var ColumnOrder[]?string
    /// Receives a new array of column IDs in requested display order after a reorder. Nil ignores the request.
    var OnColumnOrderChange Action[[]string]?
    /// Content below the main body. Nil omits the footer.
    var Footer Blob?
    /// Selects row-height metrics when RowHeight is nil. Standard uses the current theme control height.
    var Density Density
    /// Receives the row ID on row activation. Nil ignores the request.
    var OnClick Action[string]?
    /// Row-selection policy. None disables selection, Single permits one ID, and Multiple permits a set.
    var Selection DataGridSelection
    /// Controlled selected item IDs. Nil means an empty selection.
    var SelectedIds[]?string
    /// Receives a new array of selected IDs after user input. An empty array clears selection. Nil ignores the request.
    var OnSelectionChange Action[[]string]?
    /// Selects every eligible row without materializing indexed IDs. SelectedIds is ignored while true.
    /// A later explicit selection request sends OnSelectionChange and the owner clears this value.
    var AllSelected bool
    /// Runs on Ctrl+A for indexed sources in Multiple mode. The owner sets AllSelected and rebuilds.
    /// No row IDs are read. Nil leaves indexed select-all unhandled.
    var OnSelectAll Action?
    /// Requests copying the controlled selected rows on Ctrl+C or Ctrl+Insert.
    var OnCopy Action?
    /// Runs before OnSelectionChange with source indices in the same order. Missing IDs have index -1.
    var OnSelectionIndicesChange Action[[]int32]?
    /// Nil keeps the grid's active row. A valid ID controls its focus outline and active descendant.
    var ActiveRowId string?
    /// Receives the new keyboard-active row ID after navigation. Nil ignores the notification.
    var OnActiveRowChange Action[string]?
    /// Receives the active source index without a host ID lookup.
    var OnActiveRowIndexChange Action[int32]?
    /// Nil keeps the current column. A valid ID controls horizontal keyboard navigation.
    var ActiveColumnId string?
    /// Runs after a pointer or keyboard gesture changes the current column.
    var OnActiveColumnChange Action[string]?
    /// When set, the host owns selection and its range anchor. Arguments are ID, toggle, extend.
    var OnSelectionRequest Action[string, bool, bool]?
    /// Adds a leading composed checkbox. The row's semantics expose selection once.
    var ShowSelection bool
    /// Selection column width. Nil uses the theme's control height.
    var SelectionColumnWidth float64?
    /// Optional row-header content. Its pointer gestures use the row selection policy.
    /// Hosts must not change state in this callback.
    var CreateRowHeader Func[DataGridInput, DataGridRow, Blob]?
    /// Row-header width in logical pixels. Nil uses the theme control height.
    var RowHeaderWidth float64?
    /// Controlled expanded row IDs. Nil collapses all details.
    var ExpandedIds[]?string
    /// Receives the row ID and requested expanded state after a detail toggle. Nil ignores the request.
    var OnExpandedChange Action[string, bool]?
    /// Host-owned expanded group IDs. Nil collapses every group. Groups remain outside row selection.
    var ExpandedGroupIds[]?string
    /// Sends the group ID and requested expanded state on expander, double-click or Left/Right.
    var OnGroupExpandedChange Action[string, bool]?
    /// Expansion control width. Nil uses the theme's control height; zero hides the control.
    var ExpandColumnWidth float64?
    /// Padding inside details, after the leading control columns. Nil uses theme control padding; zero is preserved.
    var DetailPadding float64?
    /// Detail surface color. Nil uses the nearest theme.
    var DetailBackground Color?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Root layout width. Nil fills the available width.
    var Width Length?
    /// Scroll viewport layout height. Nil uses 300 logical pixels.
    var Height Length?
    /// Positive row height in logical pixels. Nil uses the theme control height scaled by Density.
    var RowHeight float64?
    /// Height of AutoRowHeight rows before measurement. Nil uses RowHeight. Must be at least RowHeight.
    /// Keep it constant, because a new value discards measured heights.
    var EstimatedRowHeight float64?
    /// Measures visible cell content at the resolved column widths. RowHeight is the minimum.
    var AutoRowHeight bool
    /// Caps the measured cells area, excluding expanded details.
    var MaximumRowHeight float64?
    /// Supplies finite positive cell heights. Replace this delegate when heights change.
    /// Hosts must not change state in this callback.
    var RowHeightProvider Func[DataGridRow, float64]?
    /// Positive column-header height in logical pixels. Nil uses the theme control height.
    var HeaderHeight float64?
    /// Positive filter-row height in logical pixels. Nil uses the theme control height.
    var FilterHeight float64?
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Grid background. Nil uses the theme panel color.
    var BackgroundColor Color?
    /// Cell text color. Nil uses the theme text color.
    var TextColor Color?
    /// Selected row fill. Nil uses the theme selection color.
    var SelectedColor Color?
    /// Keyboard focus outline color for the active row's cells.
    var FocusColor Color?
    /// Caller-owned handle attached to the composed root. Nil uses the widget-owned root handle.
    var RootHandle ElementHandle?
    /// Caller-owned handle attached to the scroll viewport. Nil uses the widget-owned handle.
    var ViewportHandle ElementHandle?
    /// Receives the routed key event. Nil adds no key handler.
    var OnKeyDown((KeyEvent) -> void)?
    /// Receives typed text routed through the grid. Nil adds no text-input handler.
    var OnTextInput Action[string]?
    /// Nil preserves built-in keyboard navigation and activation.
    var UseDefaultKeyboard bool?
    /// Horizontal scrollbar appearance. Nil uses the nearest theme scrollbar.
    var ScrollbarX Scrollbar?
    /// Horizontal scrollbar visibility policy. Nil uses Goo default visibility.
    var ScrollbarVisibilityX ScrollbarVisibility?
    /// Vertical scrollbar appearance. Nil uses the nearest theme scrollbar.
    var ScrollbarY Scrollbar?
    /// Vertical scrollbar visibility policy. Nil uses Goo default visibility.
    var ScrollbarVisibilityY ScrollbarVisibility?
    /// Base style for the resizehandle part. Nil uses the prepared widget style. Required behavior and layout are applied by the widget.
    var ResizeHandleStyle Style?
    /// Receives the widget input, the column descriptor, and the prepared container, and returns the replacement container. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateResizeHandle Func[DataGridInput, DataGridColumn, Container, Container]?
    /// Base style for the header part. Nil uses the prepared widget style. Required behavior and layout are applied by the widget.
    var HeaderStyle Style?
    /// Content shown when no rows exist. Nil uses the default empty-state content.
    var EmptyContent Blob?
    /// Replaces content inside the shared-width cell slot.
    /// Hosts must not change state in this callback.
    var CreateCell Func[DataGridInput, DataGridRow, DataGridColumn, Blob, Blob]?
    /// Receives the widget input, the row descriptor, and the column descriptor, and returns the replacement content. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateCellContent Func[DataGridInput, DataGridRow, DataGridColumn, Blob]?
    /// Replaces content inside the sortable header button.
    /// Hosts must not change state in this callback.
    var CreateHeader Func[DataGridInput, DataGridColumn, Blob, Blob]?
    /// Receives the widget input, the column descriptor, and the prepared content, and returns the replacement content. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateFilter Func[DataGridInput, DataGridColumn, Blob, Blob]?
    /// Receives the widget input, the row descriptor, and the prepared button, and returns the replacement button. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateSelection Func[DataGridInput, DataGridRow, Button, Button]?
    /// Receives the widget input and the row descriptor, and returns the replacement content. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateDetail Func[DataGridInput, DataGridRow, Blob]?
    /// Required slots, width, identity, and semantics are reapplied.
    /// A returned OnClick handler runs after the grid's selection handler.
    /// Hosts must not change state in this callback.
    var CreateRow Func[DataGridInput, DataGridRow, Container, Container]?
    /// Lazily replaces the cell slots with full-width content. Nil keeps the normal cells.
    /// Set IsGroup on group headers to exclude them from selection.
    /// Hosts must not change state in this callback.
    var CreateFullWidthRow Func[DataGridInput, DataGridRow, Blob?]?
    /// Receives the resolved input and prepared root, and returns the root container. Grid identity, focus, input routing, and accessibility are reapplied. Nil keeps the default root.
    /// Hosts must not change state in this callback.
    var CreateRoot Func[DataGridInput, Container, Container]?
    /// Raw cell text getter. Nil reads Values by column ID, with empty text for missing values.
    /// Hosts must not change state in this callback.
    var GetCellValue Func[DataGridRow, DataGridColumn, string]?
    /// Required editing setter, called after validation. Replace host rows/maps or increment RowVersion.
    var SetCellValue Action[DataGridEdit]?
    /// Overrides row and column editing defaults. Disabled, group and full-width cells always reject editing.
    /// Hosts must not change state in this callback.
    var CanEdit Func[DataGridRow, DataGridColumn, bool]?
    /// Overrides a column's editor placement for one cell. Nil uses the column's EditPresentation.
    /// Hosts must not change state in this callback.
    var GetEditPresentation Func[DataGridRow, DataGridColumn, DataGridEditPresentation]?
    /// Runs once before mounting an editor. Nil permits editing. False refuses without lifecycle events.
    var OnEditBegin Func[DataGridEdit, bool]?
    /// Validates each commit attempt. Nil accepts. A nonempty ErrorMessage retains the editor and draft.
    var OnEditCommit Func[DataGridEdit, DataGridEditResult]?
    /// Reports a discarded draft before the editor closes. Nil ignores cancellation.
    /// Hosts must not change state when this callback runs during Build.
    var OnEditCancel Action[DataGridEdit, DataGridEditCancelReason]?
    /// Reports one closed session after its setter or cancellation callback. Nil ignores closure.
    /// Hosts must not change state when this callback runs during Build.
    var OnEditEnd Action[DataGridEdit, DataGridEditOutcome]?
    /// Exact begin chords. Nil uses Enter and, outside Multiple selection, Space. An empty array disables key entry.
    var BeginEditKeys[]?DataGridEditKey
    /// Exact commit chord. Nil uses unmodified Enter. Escape and Tab retain their lifecycle roles.
    var CommitEditKey DataGridEditKey?
}

internal class DataGridRowComparer : IEqualityComparer[DataGridRow] {
    public func Equals(a DataGridRow, b DataGridRow) bool ->
        Object.Equals(a.Id, b.Id) && Object.Equals(a.Label, b.Label) &&
        Object.Equals(a.Tag, b.Tag) && a.SourceIndex == b.SourceIndex &&
        a.Disabled == b.Disabled && a.IsGroup == b.IsGroup && a.Editable == b.Editable &&
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
    private let rowFocusHandles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
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
    private var activeColumn int32
    private var rowPresentation DataGridInput
    private var rowPresentationTheme Theme
    private var rowPresentationVersion int64
    private var rowPresentationWidths[]float64 = []float64{}
    private var rowPresentationOffset float64
    private var rowPresentationFirst int32
    private var rowPresentationEnd int32
    private let buildRow((DataGridRow) -> Blob)
    private let rowKey((DataGridRow) -> string) = (row DataGridRow) -> row.Id!!
    private let rowContext Func[DataGridRow, VirtualRowContext]
    private var hoveredId string?
    private var pressedId string?
    private var anchorId string?
    private var groupExpanded HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private var hasFocus bool
    private var pointerFocus bool
    private var clickModifiers KeyModifiers
    private var clickFromInteractiveChild bool
    private var clickCount int32
    private var reorderOrigin float64
    private var reordered bool
    private var reorderColumn string?
    private var reorderTarget int32 = -1
    private var reorderPointer int64 = -1L
    private var reorderPosition float64
    private var reorderScroll WindowTimer?
    private var window Window?
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

    /// Creates retained input handlers and subscribes to grid geometry. Dispose the grid to release its subscriptions.
    public init() {
        rootHandle = defaultRootHandle
        viewport = defaultViewport
        stopGridKeys = StopGridKeys
        moveResize = MoveResize
        endResize = EndResize
        cancelResize = CancelResize
        buildRow = (row DataGridRow) -> BuildRow(input, row, hasDetails && input.ExpandColumnWidth > 0.0)
        rowContext = RowContext
        rootHandle.MetricsChanged += Metrics
        viewport.MetricsChanged += HorizontalMetrics
        horizontalViewport.MetricsChanged += HeaderMetrics
    }

    /// Releases geometry subscriptions.
    public func Dispose() {
        if disposed {
            return
        }
        if editSession != nil { CancelEdit(DataGridEditCancelReason.Unavailable, false) }
        disposed = true
        reorderScroll?.Dispose()
        pointer = -1L
        resizeId = nil
        rootHandle.MetricsChanged -= Metrics
        viewport.MetricsChanged -= HorizontalMetrics
        horizontalViewport.MetricsChanged -= HeaderMetrics
    }

    protected override func Build(value DataGridInput) Blob {
        theme = Theme.Read()
        window = Theme.Key.Window
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
            RowHeight = value.RowHeight ?? (value.Density == Density.Touch ?
                theme.WithDensity(Density.Touch).ControlHeight:
                theme.ControlHeight * (value.Density == Density.Compact ? 0.8:
                    value.Density == Density.Comfortable ? 1.25: 1.0)),
            HeaderHeight = value.HeaderHeight ?? theme.ControlHeight,
            FilterHeight = value.FilterHeight ?? theme.ControlHeight,
            SelectionColumnWidth = value.SelectionColumnWidth ?? theme.ControlHeight,
            ExpandColumnWidth = value.ExpandColumnWidth ?? theme.ControlHeight,
            DetailPadding = value.DetailPadding ?? theme.ControlPadding,
            RowHeaderWidth = value.RowHeaderWidth ?? theme.ControlHeight,
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
        ValidateWidth(input.RowHeaderWidth!!)
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
            let pinned = HashSet[string](StringComparer.Ordinal)
            for id in input.PinnedColumns ?? []string{} {
                if !columnIds.Contains(id) || !pinned.Add(id) {
                    throw ArgumentException("Invalid pinned column ID")
                }
            }
            for id in input.ColumnOrder ?? []string{} {
                if pinned.Contains(id) && used.Add(id) {
                    ordered.Add(columns[ColumnIndex(id)])
                }
            }
            for id in input.PinnedColumns ?? []string{} {
                if used.Add(id) {
                    ordered.Add(columns[ColumnIndex(id)])
                }
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
        if input.Disabled || pinnedCount == 0 { pressedId = nil }
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
            NavigationIndex(input.ActiveRowId) >= 0
        if controlledActiveChanged {
            activeId = input.ActiveRowId
        }
        expanded = HashSet[string](input.ExpandedIds ?? []string{}, StringComparer.Ordinal)
        groupExpanded = HashSet[string](input.ExpandedGroupIds ?? []string{}, StringComparer.Ordinal)
        if input.ActiveColumnId != nil && ColumnIndex(input.ActiveColumnId) >= 0 {
            activeColumn = ColumnIndex(input.ActiveColumnId)
        }
        activeColumn = Math.Clamp(activeColumn, 0, Math.Max(0, columns.Length - 1))
        SynchronizeEdit(true)
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
        if NavigationIndex(activeId) < 0 {
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
        }
        if controlledActiveChanged && hasFocus && !pointerFocus {
            Reveal()
        }
        let details = hasDetails && input.ExpandColumnWidth > 0.0
        leading = (
            input.ShowSelection && input.Selection != DataGridSelection.None ? input.SelectionColumnWidth!!: 0.0
        ) +
            (details ? input.ExpandColumnWidth!!: 0.0) +
            (input.CreateRowHeader != nil ? input.RowHeaderWidth!!: 0.0)
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
        UpdateRowPresentation()
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
            let source = VirtualRowsSource[DataGridRow](
                rows,
                virtualItemExtent(input.EstimatedRowHeight ?? input.RowHeight!!, "EstimatedRowHeight"),
                rowKey,
                buildRow,
                snapshot.RowHeightProvider
            ){
                Equality = rowEquality,
                Context = rowContext,
                Get = input.RowAt == nil ? nil: Row,
                Index = RawIndex,
                RetainedKey = editSession?.Value.RowId,
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
        root.TabStop = editSession == nil
        root.OnKeyDown = (e KeyEvent) -> {
            pointerFocus = false
            if input.UseDefaultKeyboard ?? true {
                KeyDown(e)
            }
            hostKeys?.Invoke(e)
            InvokeInputCallback(input.OnKeyDown, e)
        }
        root.OnPointerDown = (e PointerEvent) -> {
            pointerFocus = true
            hostPointer?.Invoke(e)
        }
        if input.SetCellValue != nil || hostText != nil || input.OnTextInput != nil {
            root.OnTextInput = (text string) -> {
                if editSession == nil && (input.UseDefaultKeyboard ?? true) && activeId != nil &&
                    text.Length > 0 && !Char.IsControl(text[0]) {
                    BeginEdit(activeId!!, activeColumn, text)
                }
                hostText?.Invoke(text)
                InvokeInputCallback(input.OnTextInput, text)
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
        let active ElementHandle? = editSession != nil || activeId == nil ? nil:
            columns.Length == 0 || NavigationIndex(activeId) < 0 || Row(NavigationIndex(activeId)).IsGroup ?
                Handle(rowHandles, activeId!!): CellHandle(activeId!!, columns[activeColumn].Id!!)
        root.FocusTarget = editSession == nil && activeId != nil ? Handle(rowFocusHandles, activeId!!): nil
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.Grid,
            Name: input.AccessibilityName!!,
            Description: theme.Text("{0} rows, {1} columns", RowCount, columns.Length),
            RowCount: RowCount,
            ColumnCount: columns.Length + (leading > 0.0 ? 1: 0),
            MultiSelectable: input.Selection == DataGridSelection.Multiple,
            Relationships: AccessibilityRelationships{ActiveDescendant: active}
        }
        root.Children.Clear()
        root.Children.Add(headers)
        root.Children.Add(body)
        if let session = editSession {
            if session.Presentation == DataGridEditPresentation.Popover {
                root.Children.Add(BuildEditPopover(session))
            } else if session.Error != nil {
                root.Children.Add(EditError(session))
            }
        }
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
