package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import Hexa.NET.SDL3
import Goo.Widgets.Inputs
import System
import System.Collections.Generic

internal class DataGridProbe : DataGrid {
    internal func Render(input DataGridInput) Blob -> base.Build(input)
}

internal class DataGridHeightHost : Cell {
    internal let Viewport ElementHandle = ElementHandle()
    internal let Rows[]DataGridRow = [100]DataGridRow
    internal let RowBlobs Dictionary[string, Container] = Dictionary[string, Container]()
    internal var Auto bool
    internal var Indexed bool
    internal var Wrap bool
    internal var Compact bool
    internal var AutoColumns bool
    internal var VirtualColumns bool
    internal var SourceWidth bool
    internal var ShortSourceWidth bool
    internal var GridBuilds int32
    internal var Empty bool
    internal var Loading bool
    internal var Version int64
    private let wideColumns[]DataGridColumn = [12]DataGridColumn
    internal let Cells Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    internal var RowCalls int32
    internal var ActiveIndex int32 = -1
    internal var Active string?
    internal var SelectedIndices[]int32 = []int32{}
    internal var SelectedIds[]string = []string{}
    internal var Root Container?
    internal let FullWidthIds HashSet[string] = HashSet[string]()
    internal var Navigation bool
    internal var Single bool
    internal var AllSelected bool
    internal var SelectAllRequests int32
    internal var SelectAllEnabled bool = true
    internal var CopyRequests int32
    internal var RowBuilds int32
    internal var Column string?
    internal var GroupExpansion bool
    internal let RowHeaders Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    internal let NavigationHeaders Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    internal var Sorts[]DataGridSortColumn = []DataGridSortColumn{}
    internal var Order[]string = []string{}
    internal var Pinned[]string = []string{}
    internal var FocusTarget string = ""
    internal var HeaderClicks int32
    internal var ContextRequests int32
    internal var ContextSelected bool
    internal var InteractiveEditor bool
    internal let Editor ElementHandle = ElementHandle()
    internal var EditorCopyRequests int32
    internal var Header Button?
    internal var WidthCase int32
    internal let WidthA ElementHandle = ElementHandle()
    internal let WidthB ElementHandle = ElementHandle()
    internal let VerticalThumb ElementHandle = ElementHandle()

    internal init() {
        for index in 0 ... wideColumns.Length {
            wideColumns[index] = DataGridColumn{Id: index.ToString(), Minimum: 150, Sortable: true}
        }
        for index in 0 ... Rows.Length {
            let id = index.ToString()
            let values = Dictionary[string, string]()
            values.Add("value", "one two three four five six seven eight")
            Rows[index] = DataGridRow{Id: id, IsGroup: index == 0, Values: values}
        }
    }

    private func CaptureRow(input DataGridInput, row DataGridRow, root Container) Container {
        RowBlobs[row.Id!!] = root
        RowBuilds++
        if Navigation {
            root.OnPointerDown = (e PointerEvent) -> {
                if e.Button == PointerButton.Secondary {
                    ContextRequests++
                    ContextSelected = AllSelected || Array.IndexOf(SelectedIds, row.Id!!) >= 0
                }
            }
        }
        return root
    }

    private func RowHeader(input DataGridInput, row DataGridRow) Blob {
        let handle = ElementHandle()
        RowHeaders[row.Id!!] = handle
        return Text{Handle: handle, Content: row.Id!!}
    }

    private func NavigationHeader(input DataGridInput, column DataGridColumn, content Blob) Blob {
        let handle = ElementHandle()
        NavigationHeaders[column.Id!!] = handle
        return Container{Handle: handle, content}
    }

    private func At(index int32) DataGridRow {
        RowCalls++
        return DataGridRow{Id: index.ToString(), IsGroup: index == 0}
    }

    private func Index(id string) int32 -> int32.TryParse(id, out var index) ? index: -1

    private func Height(row DataGridRow) float64 -> int32.Parse(row.Id!!) % 2 == 0 ? 32.0: 92.0

    private func Content(input DataGridInput, row DataGridRow, column DataGridColumn) Blob {
        if InteractiveEditor && row.Id == "1" && column.Id == "0" {
            return TextEntry{
                Handle: Editor,
                Value: "editable value",
                Width: Percent(100),
                Height: 32,
                KeyBindings: []KeyBinding{
                    KeyBinding{Key: Key.C, Modifiers: KeyModifiers{Ctrl: true}, Action: () -> EditorCopyRequests++},
                    KeyBinding{Key: Key.Insert, Modifiers: KeyModifiers{Ctrl: true}, Action: () -> EditorCopyRequests++}
                }
            }
        }
        if VirtualColumns {
            let handle = ElementHandle()
            Cells[row.Id!!+ ":" + column.Id!!] = handle
            return Text{Handle: handle, Content: column.Id!!, TextWrap: TextWrap.NoWrap}
        }
        if AutoColumns {
            return Text{
                Content: row.Id == "50" ? "A much wider value first realized after scrolling": "x",
                TextWrap: TextWrap.NoWrap
            }
        }
        return Container{Height: Height(row), Text{Content: row.Id!!}}
    }

    private func FullWidth(input DataGridInput, row DataGridRow) Blob? {
        FullWidthIds.Add(row.Id!!)
        if !row.IsGroup {
            return nil
        }
        let header = Button{
            Handle: ElementHandle(),
            Width: Percent(100),
            Height: 32,
            TabStop: !Navigation,
            OnClick: () -> HeaderClicks++,
            Text{Content: "Group"}
        }
        Header = header
        return header
    }

    public override func Build() Blob {
        let grid = Cell.Mount[DataGridInput, DataGrid](
        "grid",
        DataGridInput{
            Columns: WidthCase > 0 ? []DataGridColumn{
                DataGridColumn{Id: "a", Label: "A", Minimum: 500, Flex: 1},
                DataGridColumn{Id: "b", Label: "B", Maximum: WidthCase == 1 ? 100: 300, Flex: 1}
            }: VirtualColumns ? wideColumns: []DataGridColumn{
                DataGridColumn{
                    Id: "value",
                    Width: AutoColumns ? nil: (Compact ? 100: 200),
                    AutoWidth: AutoColumns,
                    AutoWidthContent: SourceWidth ?
                    Text{Content: ShortSourceWidth ? "x": "A much wider value first realized after scrolling", TextWrap: TextWrap.NoWrap}: nil,
                    Minimum: AutoColumns ? 0: 60,
                    Maximum: 400
                }
            },
            Rows: Empty ? []DataGridRow{}: Rows,
            EmptyContent: Empty ? Text{Content: Loading ? "Loading rows...": "No rows"}: nil,
            RowAt: Indexed ? At: nil,
            RowIndex: Indexed ? Index: nil,
            RowCount: Indexed ? 2000000: 0,
            RowVersion: Version,
            VirtualizeColumns: VirtualColumns,
            RowHeight: Indexed ? 33: 32,
            EstimatedRowHeight: Auto ? 64: nil,
            AutoRowHeight: Auto,
            MaximumRowHeight: 80,
            RowHeightProvider: Auto || Indexed || AutoColumns ? nil: Height,
            ViewportHandle: Viewport,
            Height: 232,
            Width: Navigation ? 500: WidthCase > 0 ? (WidthCase == 1 ? 800: 700): (SourceWidth ? 1000: Compact ? 120: 220),
            ScrollbarVisibilityY: WidthCase > 0 ? ScrollbarVisibility.Hidden: ScrollbarVisibility.Auto,
            ScrollbarY: VirtualColumns ? Scrollbar{
                Thickness: 10,
                Inset: 0,
                Thumb: Container{Handle: VerticalThumb, BackgroundColor: "#a1a1aa"}
            }: nil,
            CreateHeader: Navigation ? NavigationHeader: WidthCase == 0 ? nil: (input DataGridInput, column DataGridColumn, content Blob) ->
                Container{Handle: column.Id == "a" ? WidthA: WidthB, Width: Percent(100), content},
            Selection: Single ? DataGridSelection.Single: DataGridSelection.Multiple,
            AllSelected: AllSelected,
            OnSelectAll: SelectAllEnabled ? () -> {
                SelectAllRequests++
                AllSelected = true
                Rebuild()
            }: nil,
            OnCopy: () -> CopyRequests++,
            ActiveColumnId: Column,
            OnActiveColumnChange: (id string) -> {
                Column = id
                Rebuild()
            },
            SelectedIds: SelectedIds,
            OnSelectionIndicesChange: (indices[]int32) -> SelectedIndices = indices,
            OnSelectionChange: (ids[]string) -> {
                SelectedIds = ids
                AllSelected = false
                Rebuild()
                Require(ids.Length == SelectedIndices.Length, "Selection IDs ran before source indices")
                for index in 0 ... ids.Length {
                    Require(
                        SelectedIndices[index] == int32.Parse(ids[index]),
                        "Selection source index did not match its ID"
                    )
                }
            },
            ExpandedGroupIds: GroupExpansion ? []string{"0"}: []string{},
            OnGroupExpandedChange: Navigation ? (id string, expanded bool) -> {
                GroupExpansion = expanded
                Rebuild()
            }: nil,
            CreateRowHeader: Navigation ? RowHeader: nil,
            OnActiveRowIndexChange: (index int32) -> ActiveIndex = index,
            Sorts: Sorts,
            OnSortsChange: Navigation ? (sorts[]DataGridSortColumn) -> {
                Sorts = sorts
                Rebuild()
            }: nil,
            PinnedColumns: Pinned,
            ColumnOrder: Order,
            OnColumnOrderChange: Navigation ? (order[]string) -> {
                Order = order
                Rebuild()
            }: nil,
            ActiveRowId: Active,
            CreateCellContent: Wrap ? nil: Content,
            CreateFullWidthRow: FullWidth,
            CreateRoot: (input DataGridInput, root Container) -> {
                GridBuilds++
                Root = root
                return root
            },
            CreateRow: CaptureRow
        }
    )
        if !Navigation {
            return grid
        }
        return Container{
            FlexDirection: FlexDirection.Column,
            Button{Height: 24, OnFocus: (e FocusEvent) -> { FocusTarget = "before" }, Text{Content: "Before"}},
            grid,
            Button{Height: 24, OnFocus: (e FocusEvent) -> { FocusTarget = "after" }, Text{Content: "After"}}
        }
    }
}

internal class DataGridInitialHost : Cell {
    internal let Viewport ElementHandle = ElementHandle()
    internal let Header ElementHandle = ElementHandle()
    internal var First Container?
    internal var Rows[]DataGridRow = [100]DataGridRow
    internal var ContentInset float64
    private let columns[]DataGridColumn = [5]DataGridColumn

    internal init() {
        let names = []string{"Memory", "Initial", "Final", "Delta", "Peak"}
        for index in 0 ... columns.Length {
            columns[index] = DataGridColumn{
                Id: "c" + index.ToString(), Label: names[index], Minimum: index == 0 ? 120: 56,
                Sortable: true, Alignment: index == 0 ? TextAlign.Left: TextAlign.Right,
                Flex: index == 0 ? 1.0: nil, Width: index == 0 ? nil: 96.0
            }
        }
        for index in 0 ... Rows.Length {
            let values = Dictionary[string, string]()
            values.Add("c0", index == 0 ? "Allocator blocks": "Driver heap budget " + index.ToString())
            for column in 1 ... 5 { values.Add("c" + column.ToString(), "2.5 MiB") }
            Rows[index] = DataGridRow{Id: "summary-row-" + index.ToString(), Values: values}
        }
    }

    public override func Build() Blob -> Container{
        Height: Percent(100), FlexDirection: FlexDirection.Column,
        Container{Height: 526, FlexShrink: 0},
        Cell.Mount[DataGridInput, DataGrid]("Memory", DataGridInput{
            Columns: columns, Rows: Rows, SortColumnId: "c0", SortDirection: DataGridSort.Ascending,
            Selection: DataGridSelection.Single, FitColumnsToViewport: true,
            Density: Density.Compact, Height: Length.Auto, AccessibilityName: "Memory",
            ViewportHandle: Viewport,
            CreateHeader: (input DataGridInput, column DataGridColumn, content Blob) ->
                Container{Handle: column.Id == "c0" ? Header: nil, content},
            CreateCell: (input DataGridInput, row DataGridRow, column DataGridColumn, content Blob) ->
                Container{Padding: Edges{Top: row.Id == "summary-row-0" ? ContentInset: 0}, content},
            CreateRow: (input DataGridInput, row DataGridRow, root Container) -> {
                if row.Id == "summary-row-0" { First = root }
                return root
            },
            CreateRoot: (input DataGridInput, root Container) -> {
                root.FlexGrow = 1
                root.FlexBasis = 0
                return root
            }
        })
    }
}

func DataGridHeightInteractions() {
    let measured = DataGridInitialHost()
    let initial = Window{Title: "DataGrid initial measurement", Width: 1540, Height: 960, Root: measured, SmoothScrolling: false}
    Theme.Attach(initial, Theme.Default)
    RunNativeWindow(initial, () -> {
        initial.Open()
        WaitVirtual(initial, () -> measured.Header.IsMounted && measured.First?.Handle?.IsMounted == true)
        PumpFrames(initial, 12)
        Require(measured.Viewport.ScrollOffset.Y == 0.0 &&
            measured.First!!.Handle!!.BorderBox.Y == measured.Viewport.ContentBox.Y,
            "DataGrid did not mount at the body top")
        measured.Rows = (measured.Rows.Clone() as []DataGridRow)!!
        measured.ContentInset = 6.0
        measured.Rows[0] = measured.Rows[0] with{Values = Dictionary[string, string](measured.Rows[0].Values!!)}
        measured.Rebuild()
        PumpFrames(initial, 12)
        let first = measured.First!!.Handle!!.BorderBox
        let body = measured.Viewport.ContentBox
        Require(
            measured.Viewport.ScrollOffset.Y == 0.0 && first.Y == body.Y,
            "DataGrid initial measurement moved the top: scroll=" + measured.Viewport.ScrollOffset.Y.ToString() +
                " row=" + first.Y.ToString() + " body=" + body.Y.ToString()
        )
        Console.WriteLine("PASS: DataGrid initial measured rows stay at zero with the first row at the body top")
    })
    let host = DataGridHeightHost()
    let window = Window{Title: "DataGrid mixed heights", Width: 400, Height: 300, Root: host, SmoothScrolling: false}
    Theme.Attach(window, Theme.Default)
    RunNativeWindow(window, () -> {
        window.Open()
        PumpFrames(window, 12)
        Require(Math.Abs(host.Viewport.ScrollRange.Y + host.Viewport.ContentBox.Height - 6200.0) < .1, "Mixed heights did not seed the full extent")
        Require(host.FullWidthIds.Count < 12, "Full-width factory ran for off-screen rows")
        Require(!host.RowBlobs.ContainsKey("50"), "Controlled reveal target was already realized")
        Require(host.Root!!.Handle!!.Focus(), "Controlled reveal could not focus the grid")
        host.Active = "50"
        host.Rebuild()
        PumpFrames(window, 8)
        let revealed = host.RowBlobs["50"].Handle!!.BorderBox
        let view = host.Viewport.ContentBox
        Require(
            host.RowBlobs["50"].Handle!!.IsMounted &&
                Math.Abs(revealed.Y + revealed.Height - view.Y - view.Height) < .1,
            "Controlled reveal placed an unrealized row at the top instead of the bottom edge"
        )
        host.Active = nil
        Require(host.Viewport.JumpTo(0.0, 3100.0), "Mixed heights rejected scrolling")
        PumpFrames(window, 8)
        Require(Math.Abs(host.Viewport.ScrollOffset.Y - 3100.0) < .1, "Mixed heights changed a valid scroll offset")
        Require(
            host.RowBlobs["50"].Handle!!.IsMounted && !host.RowBlobs["0"].Handle!!.IsMounted && Math.Abs(
                host.RowBlobs["50"].Handle!!.BorderBox.Y - host.Viewport.ContentBox.Y
            ) < .1,
            "Mixed heights realized the wrong visible range"
        )
        Require(host.Viewport.ScrollToItem("50"), "Mixed heights rejected scroll into view")
        PumpFrames(window, 8)
        Require(Math.Abs(host.Viewport.ScrollOffset.Y - 3100.0) < .1, "Mixed heights used fixed row offsets")
        Require(host.Viewport.ScrollToItem("0"), "Group header was not virtualized")
        WaitVirtual(window, () -> host.Header?.Handle?.IsMounted == true &&
            Math.Abs(host.Header!!.Handle!!.BorderBox.Width - 200.0) < .1)
        Require(Math.Abs(host.Header!!.Handle!!.BorderBox.Width - 200.0) < .1, "Group header did not span the columns")
        CompositeClick(window, host.Header!!.Handle!!)
        PumpFrames(window, 4)
        Require(host.HeaderClicks == 1, "Group header content was disabled")
        host.Root!!.Handle!!.Focus()
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        PumpFrames(window, 4)
        Require(
            host.Root!!.Accessibility!!.Relationships!!.ActiveDescendant == GridElement(host.RowBlobs["1"], "value")!!.Handle,
            "Grid navigation did not skip the group header"
        )
        host.Auto = true
        host.Rebuild()
        PumpFrames(window, 12)
        Require(host.Viewport.ScrollToItem("2"), "Measured heights rejected scroll into view")
        PumpFrames(window, 8)
        Require(
            Math.Abs(host.Viewport.ScrollOffset.Y - 112.0) < .1,
            "Measured height cap did not update cumulative offsets"
        )
        host.Indexed = true
        host.Auto = false
        host.Rebuild()
        PumpFrames(window, 12)
        Require(host.RowCalls < 200, "Indexed measurement read more than the visible row budget")
        Require(Math.Abs(host.Viewport.ScrollRange.Y - 65999800.0) <= 4.0, "Two-million-row extent exceeded float32 precision")
        Require(host.Viewport.ScrollToItem("1999990"), "Indexed grid could not scroll to an unrealized ID")
        WaitVirtual(window, () -> host.RowBlobs.ContainsKey("1999990") && host.RowBlobs["1999990"].Handle!!.IsMounted)
        Require(
            host.RowBlobs["1999990"].Handle!!.IsMounted && Math.Abs(host.Viewport.ScrollOffset.Y - 65999670.0) <= 4.0,
            "Indexed grid exceeded float32 distant offset precision"
        )
        Require(host.Viewport.ScrollToItem("500000"), "Indexed grid rejected a pixel-exact offset")
        PumpFrames(window, 8)
        Require(Math.Abs(host.Viewport.ScrollOffset.Y - 16500000.0) < .1, "Indexed offset below float32 limit was not exact")
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        for step in 0 ... 4 {
            GridKey(window, Key.Down)
            PumpFrames(window, 2)
        }
        for step in 0 ... 3 {
            GridKey(window, Key.Down, KeyModifiers{Shift: true})
            PumpFrames(window, 2)
        }
        GridKey(window, Key.Up, KeyModifiers{Shift: true})
        PumpFrames(window, 2)
        Require(
            host.SelectedIndices.Length == 4 && Array.IndexOf(host.SelectedIndices, 5) >= 0 &&
                Array.IndexOf(host.SelectedIndices, 6) >= 0 && Array.IndexOf(host.SelectedIndices, 8) >= 0,
            "Shift range reversal removed a previously selected row"
        )
        GridKey(window, Key.End, KeyModifiers{Ctrl: true})
        PumpFrames(window, 8)
        Require(host.ActiveIndex == 1999999, "Indexed navigation did not report its active source index")
        Require(
            host.SelectedIndices.Length == 1 && host.SelectedIndices[0] == 1999999,
            "Indexed selection did not report its source indices"
        )
        host.RowCalls = 0
        host.Rebuild()
        PumpFrames(window, 8)
        Require(host.RowCalls < 200, "Indexed rebuild exceeded the visible row budget")
        host.Auto = true
        host.RowCalls = 0
        host.Rebuild()
        PumpFrames(window, 12)
        Require(host.RowCalls < 200, "Indexed height measurement exceeded the visible row budget")
        host.Indexed = false
        host.Auto = true
        host.Wrap = true
        host.Rebuild()
        PumpFrames(window, 12)
        Require(host.Viewport.ScrollToItem("1"), "Grid did not recover after replacing the indexed source")
        PumpFrames(window, 8)
        let wide = host.RowBlobs["1"].Handle!!.BorderBox.Height
        host.Compact = true
        host.Rebuild()
        PumpFrames(window, 12)
        let narrow = host.RowBlobs["1"].Handle!!.BorderBox.Height
        Require(narrow > wide && narrow <= 80.0, "Wrapped text did not remeasure at the changed column width")
        host.AutoColumns = true
        host.Auto = false
        host.Wrap = false
        host.Compact = false
        host.Rebuild()
        PumpFrames(window, 12)
        Require(host.Viewport.ScrollToItem("0"), "Auto columns rejected the group header")
        WaitVirtual(window, () -> host.Header?.Handle?.IsMounted == true &&
            host.Header!!.Handle!!.BorderBox.Width > 30.0 && host.Header!!.Handle!!.BorderBox.Width < 300.0)
        let initialWidth = host.Header!!.Handle!!.BorderBox.Width
        Require(initialWidth > 30.0 && initialWidth < 300.0, "Auto columns did not measure the header lazily")
        Require(host.Viewport.ScrollToItem("50"), "Auto columns rejected a distant row")
        WaitVirtual(window, () -> host.RowBlobs.ContainsKey("50") &&
            host.RowBlobs["50"].Handle?.IsMounted == true &&
            host.RowBlobs["50"].Handle!!.BorderBox.Width > initialWidth)
        Require(host.Viewport.ScrollToItem("0"), "Auto columns lost the group header")
        WaitVirtual(window, () -> host.Header?.Handle?.IsMounted == true &&
            host.Header!!.Handle!!.BorderBox.Width > initialWidth)
        let grownWidth = host.Header!!.Handle!!.BorderBox.Width
        Require(grownWidth > initialWidth && grownWidth <= 400.0, "Auto columns did not grow to realized cell content")
        Require(host.Viewport.ScrollToItem("75"), "Auto columns rejected later short content")
        WaitVirtual(window, () -> host.RowBlobs.ContainsKey("75") && host.RowBlobs["75"].Handle?.IsMounted == true)
        Require(host.Viewport.ScrollToItem("0"), "Auto columns lost their earlier width")
        WaitVirtual(window, () -> host.Header?.Handle?.IsMounted == true &&
            Math.Abs(host.Header!!.Handle!!.BorderBox.Width - grownWidth) < .1)
        Require(
            Math.Abs(host.Header!!.Handle!!.BorderBox.Width - grownWidth) < .1,
            "Auto columns shrank after scrolling to shorter content"
        )
        host.SourceWidth = true
        window.Width = 1200
        host.Version++
        host.Rebuild()
        WaitVirtual(window, () -> host.Header?.Handle?.IsMounted == true &&
            Math.Abs(host.Header!!.Handle!!.BorderBox.Width - grownWidth) < .1)
        Require(
            Math.Abs(host.Header!!.Handle!!.BorderBox.Width - grownWidth) < .1,
            "Source width did not resolve before the wide row was realized"
        )
        PumpFrames(window, 12)
        host.GridBuilds = 0
        host.Version++
        host.Rebuild()
        PumpFrames(window, 12)
        Require(
            host.GridBuilds == 1 && Math.Abs(host.Header!!.Handle!!.BorderBox.Width - grownWidth) < .1,
            "Equal source width caused another grid rebuild or width change"
        )
        host.ShortSourceWidth = true
        host.Version++
        host.Rebuild()
        PumpFrames(window, 12)
        Require(
            host.Header!!.Handle!!.BorderBox.Width < grownWidth && host.GridBuilds == 3,
            "Shorter source width did not apply in one further grid rebuild"
        )
        host.AutoColumns = false
        host.SourceWidth = false
        host.VirtualColumns = true
        host.Version++
        host.Rebuild()
        PumpFrames(window, 12)
        Require(!host.Cells.ContainsKey("1:11"), "Grid built an offscreen column")
        let horizontal = host.Viewport
        let headers = ((host.Root!!.Children[0] as Container)!!).Handle!!
        let grid = host.Root!!.Handle!!.ContentBox
        let thumb = host.VerticalThumb.BorderBox
        Require(
            horizontal.ScrollRange.Y > 0.0 && host.VerticalThumb.IsMounted &&
                Math.Abs(thumb.X + thumb.Width - grid.X - grid.Width) < .1,
            "Grid vertical scrollbar was outside the visible right edge"
        )
        let height = host.RowBlobs["1"].Handle!!.BorderBox.Height
        let extent = horizontal.ScrollRange.X
        Require(extent > 1500.0, "Column virtualization lost the horizontal extent")
        Require(horizontal.JumpTo(extent, 0.0), "Grid rejected horizontal scrolling")
        PumpFrames(window, 12)
        Require(
            Math.Abs(headers.ScrollOffset.X - horizontal.ScrollOffset.X) < .1,
            "Grid header did not follow the body horizontal offset"
        )
        Require(
            host.Cells["1:11"].IsMounted && !host.Cells["1:0"].IsMounted,
            "Grid did not replace clipped columns after horizontal scrolling"
        )
        Require(
            Math.Abs(horizontal.ScrollRange.X - extent) < .1 && Math.Abs(
                host.RowBlobs["1"].Handle!!.BorderBox.Height - height
            ) < .1,
            "Column virtualization changed the table extent or row height"
        )
        let right = host.Cells["1:11"].BorderBox
        Require(
            right.X >= horizontal.ContentBox.X && right.X < horizontal.ContentBox.X + horizontal.ContentBox.Width,
            "Leading column spacer misaligned the final column"
        )
        Require(horizontal.JumpTo(0.0, 0.0), "Grid rejected returning to the first column")
        PumpFrames(window, 12)
        Require(host.Cells["1:0"].IsMounted && !host.Cells["1:11"].IsMounted, "Grid did not restore the first column")
        host.Empty = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(
            Math.Abs(horizontal.ScrollRange.X - extent) < .1 && horizontal.ScrollRange.Y == 0,
            "Empty grid lost the column extent or created vertical overflow"
        )
        Require(horizontal.JumpTo(extent, 0), "Empty grid rejected horizontal scrolling")
        PumpFrames(window, 8)
        Require(
            headers.ScrollOffset.X == extent && horizontal.ScrollOffset.X == extent,
            "Empty grid header did not follow horizontal scrolling"
        )
        CaptureIssueProof(window, "datagrid-empty")
        host.Loading = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(horizontal.ScrollRange.Y == 0, "Loading content created vertical overflow")
        CaptureIssueProof(window, "datagrid-loading")
        host.Empty = false
        host.VirtualColumns = false
        window.Width = 1000
        host.WidthCase = 1
        host.Rebuild()
        PumpFrames(window, 12)
        let headerPadding = 2.0 * Theme.Read(window).ControlPadding
        Require(
            Math.Abs(host.WidthA.BorderBox.Width + headerPadding - (host.Root!!.Handle!!.ContentBox.Width - 100.0)) < .1 &&
                Math.Abs(host.WidthB.BorderBox.Width + headerPadding - 100.0) < .1,
            "Mixed star bounds left unused viewport space"
        )
        host.WidthCase = 2
        host.Rebuild()
        PumpFrames(window, 12)
        Require(
            Math.Abs(host.WidthA.BorderBox.Width + headerPadding - 500.0) < .1 &&
                Math.Abs(host.WidthB.BorderBox.Width + headerPadding - (host.Root!!.Handle!!.ContentBox.Width - 500.0)) < .1,
            "Mixed star bounds overflowed the viewport"
        )
    })
    Console.WriteLine(
        "PASS: DataGrid mixed offsets, bounded visible rows, scroll into view, measured cap and lazy group headers"
    )
}

func DataGridContracts() {
    using let probe = DataGridProbe()
    var rejected bool
    try {
        probe.Render(DataGridInput{Columns: []DataGridColumn{DataGridColumn{Id: "a"}, DataGridColumn{Id: "a"}}})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Grid accepted duplicate column IDs")
    rejected = false
    try {
        probe.Render(DataGridInput{AutoRowHeight: true, VirtualizeColumns: true})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Grid virtualized columns with unstable automatic row heights")
    let invalidEstimates = []DataGridInput{
        DataGridInput{RowHeight: 32, EstimatedRowHeight: 64},
        DataGridInput{AutoRowHeight: true, RowHeight: 32, EstimatedRowHeight: 16},
    }
    for value in invalidEstimates {
        rejected = false
        try {
            probe.Render(value)
        } catch (error ArgumentOutOfRangeException) {
            rejected = error.ParamName == "EstimatedRowHeight"
        }
        Require(rejected, "Grid accepted an invalid row-height estimate")
    }
    rejected = false
    try {
        probe.Render(DataGridInput{Rows: []DataGridRow{DataGridRow{Id: "a"}, DataGridRow{Id: "a"}}})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Grid accepted duplicate row IDs")
    using let cacheProbe = DataGridProbe()
    let stableRows = []DataGridRow{DataGridRow{Id: "first"}, DataGridRow{Id: "second"}}
    let first = (
        cacheProbe.Render(
            DataGridInput{Rows: stableRows, Selection: DataGridSelection.Single, SelectedIds: []string{"first"}}
        ) as Container
    )!!
    let firstHandle = first.Accessibility!!.Relationships!!.ActiveDescendant
    let invalidRows = []DataGridRow{DataGridRow{Id: "bad"}, DataGridRow{Id: "bad"}}
    for attempt in 0 ... 2 {
        rejected = false
        try {
            cacheProbe.Render(DataGridInput{Rows: invalidRows})
        } catch (error ArgumentException) {
            rejected = true
        }
        Require(rejected, "Grid cached invalid row IDs on attempt " + attempt.ToString())
    }
    let recovered = (
        cacheProbe.Render(
            DataGridInput{Rows: stableRows, Selection: DataGridSelection.Single, SelectedIds: []string{"second"}}
        ) as Container
    )!!
    Require(
        recovered.Accessibility!!.Relationships!!.ActiveDescendant != firstHandle,
        "Grid failed to recover selection after invalid rows"
    )
    rejected = false
    try {
        probe.Render(DataGridInput{Columns: []DataGridColumn{DataGridColumn{Id: "a", Width: Double.NaN}}})
    } catch (error ArgumentOutOfRangeException) {
        rejected = true
    }
    Require(rejected, "Grid accepted non-finite column width")
    let root = (
        probe.Render(
            DataGridInput{
                Columns: []DataGridColumn{
                    DataGridColumn{Id: "a", Width: 5, Minimum: 70},
                    DataGridColumn{Id: "b", Width: 900, Maximum: 150}
                },
                Selection: DataGridSelection.Multiple
            }
        ) as Container
    )!!
    Require(
        root.Accessibility!!.Role == AccessibilityRole.Grid && root.Accessibility!!.MultiSelectable == true,
        "Grid failed controlled grid semantics"
    )
    let rootHandle = ElementHandle()
    let viewport = ElementHandle()
    let horizontal = Scrollbar{}
    let vertical = Scrollbar{}
    let empty = Text{Content: "No files"}
    var hostKeys int32
    var gridKeys int32
    var hostText string = ""
    var gridText string = ""
    var resized float64
    var resizeFactoryCalled bool
    let unrelatedHandle = ElementHandle()
    let custom = (
        probe.Render(
            DataGridInput{
                Columns: []DataGridColumn{DataGridColumn{Id: "name", Sortable: true}},
                OnSort: (id string, direction DataGridSort) -> { },
                OnColumnWidthChange: (id string, width float64) -> resized = width,
                CreateResizeHandle: (input DataGridInput, column DataGridColumn, prepared Container) -> {
                    resizeFactoryCalled = true
                    return Container{
                        Key: "unrelated",
                        Handle: unrelatedHandle,
                        Hover: Style{BackgroundColor: "#18181b"},
                        Focus: Style{BackgroundColor: "#18181b"}
                    }
                },
                RootHandle: rootHandle,
                ViewportHandle: viewport,
                ScrollbarX: horizontal,
                ScrollbarY: vertical,
                ScrollbarVisibilityX: ScrollbarVisibility.Always,
                ScrollbarVisibilityY: ScrollbarVisibility.Always,
                EmptyContent: empty,
                UseDefaultKeyboard: false,
                OnKeyDown: (e KeyEvent) -> gridKeys++,
                OnTextInput: (value string) -> gridText = value,
                CreateRoot: (input DataGridInput, prepared Container) -> {
                    prepared.OnKeyDown = (e KeyEvent) -> hostKeys++
                    prepared.OnTextInput = (value string) -> hostText = value
                    prepared.KeyBindings = []KeyBinding{KeyBinding{Key: Key.F2, Action: () -> { }}}
                    return prepared
                }
            }
        ) as Container
    )!!
    custom.OnKeyDown?.Invoke(KeyEvent{Key: Key.Space})
    custom.OnTextInput?.Invoke("x")
    let scroll = (custom.Children[0] as Container)!!
    let canvas = (scroll.Children[0] as Container)!!
    let body = (custom.Children[1] as Container)!!
    let header = (canvas.Children[0] as Container)!!
    let slot = (header.Children[0] as Container)!!
    let sort = (slot.Children[0] as Button)!!
    let resize = (slot.Children[1] as Container)!!
    resize.OnKeyDown?.Invoke(KeyEvent{Key: Key.Right})
    Require(slot.OnFocus == nil, "Grid header blocked ancestor focus tracking")
    Require(
        custom.Handle == rootHandle && hostKeys == 1 && gridKeys == 1 && hostText == "x" && gridText == "x",
        "Grid replaced host input"
    )
    Require(
        HasKeyBinding(custom, Key.F2) && body.Handle == viewport &&
            ((((body.Children[0] as Container)!!).Children[0] as Container)!!).Children[0] == empty,
        "Grid lost host bindings or empty viewport"
    )
    Require(
        HasKeyBinding(sort, Key.Enter) && HasKeyBinding(sort, Key.Space, true) && resized > 0.0,
        "Grid disabled focused header controls"
    )
    Require(
        resizeFactoryCalled &&
            resize.Key == "resize" &&
            resize.Handle != unrelatedHandle &&
            resize.OnPointerDown != nil &&
            resize.OnKeyDown != nil &&
            resize
            .Accessibility
            ?.Role == AccessibilityRole.Slider,
        "Grid resize factory replaced required behavior"
    )
}

internal class DataGridHost : Cell {
    internal var Root Container?
    internal let RowBlobs Dictionary[string, Container] = Dictionary[string, Container]()
    internal let Headers Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    internal let Cells Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    internal let Checks Dictionary[string, Button] = Dictionary[string, Button]()
    internal var Widths Dictionary[string, float64] = Dictionary[string, float64]()
    internal var Selected[]string = []string{"alpha"}
    internal var Active string?
    internal var Anchor string?
    internal var Controlled bool
    internal var Expanded[]string = []string{}
    internal var SortId string = ""
    internal var SortDirection DataGridSort
    internal var SortCalls int32
    internal var Commits int32
    internal var DetailBuilds int32
    internal var Large bool
    internal var Single bool
    internal var Disabled bool
    internal var SwapColumns bool
    internal var Fit bool
    internal var Compact bool
    internal var Tiny bool
    internal let FilterHandle ElementHandle = ElementHandle()

    private func CaptureRoot(input DataGridInput, prepared Container) Container {
        Root = prepared
        return prepared
    }

    private func CaptureRow(input DataGridInput, row DataGridRow, prepared Container) Container {
        RowBlobs[row.Id!!] = prepared
        return prepared
    }

    private func CaptureHeader(input DataGridInput, column DataGridColumn, content Blob) Blob {
        if !Headers.ContainsKey(column.Id!!) {
            Headers.Add(column.Id!!, ElementHandle())
        }
        return Container{Handle: Headers[column.Id!!], Width: Percent(100), MinWidth: 0, content}
    }

    private func CaptureCell(input DataGridInput, row DataGridRow, column DataGridColumn, content Blob) Blob {
        let key = row.Id!!+ ":" + column.Id!!
        if !Cells.ContainsKey(key) {
            Cells.Add(key, ElementHandle())
        }
        return Container{Handle: Cells[key], Width: Percent(100), MinWidth: 0, content}
    }

    private func CaptureCheck(input DataGridInput, row DataGridRow, prepared Button) Button {
        prepared.Handle = ElementHandle()
        Checks[row.Id!!] = prepared
        return prepared
    }

    private func Detail(input DataGridInput, row DataGridRow) Blob {
        DetailBuilds++
        return Text{
            Content: "Expanded host details use measured text. A longer note wraps at the shared table width and moves the next row without a fixed detail-height estimate.",
            Color: "#a5b4fc",
            FontSize: 16
        }
    }

    private func Width(id string, value float64) {
        Widths = Dictionary[string, float64](Widths)
        Widths[id] = value
        Rebuild()
    }

    private func Commit(id string, value float64) {
        Commits++
    }

    private func FittedWidths(values IReadOnlyDictionary[string, float64]) {
        Widths = Dictionary[string, float64](values)
        Rebuild()
    }

    private func FittedCommit(values IReadOnlyDictionary[string, float64]) {
        Commits++
    }

    private func Sort(id string, direction DataGridSort) {
        SortCalls++
        SortId = id
        SortDirection = direction
        Rebuild()
    }

    private func Selection(ids[]string) {
        Selected = ids
        Rebuild()
    }

    private func ActiveChanged(id string) {
        Active = id
        Rebuild()
    }

    private func Navigate(e KeyEvent) {
        if e.Key != Key.Down {
            return
        }
        let rows = Rows()
        for index in 0 ... rows.Length - 1 {
            if rows[index].Id == Active {
                for next in index + 1 ... rows.Length {
                    if !rows[next].Disabled {
                        Active = rows[next].Id
                        Anchor = Active
                        Rebuild()
                        return
                    }
                }
            }
        }
    }

    private func SelectionRequest(id string, toggle bool, extend bool) {
        let next = List[string]()
        if extend && Anchor != nil {
            if toggle {
                for current in Selected {
                    next.Add(current)
                }
            }
            let rows = Rows()
            var start int32 = -1
            var end int32 = -1
            for index in 0 ... rows.Length {
                if rows[index].Id == Anchor {
                    start = index
                }
                if rows[index].Id == id {
                    end = index
                }
            }
            if start >= 0 && end >= 0 {
                for index in Math.Min(start, end) ... Math.Max(start, end) + 1 {
                    if !rows[index].Disabled && !next.Contains(rows[index].Id!!) {
                        next.Add(rows[index].Id!!)
                    }
                }
            }
        } else {
            if toggle {
                for current in Selected {
                    if current != id {
                        next.Add(current)
                    }
                }
            }
            if !toggle || Array.IndexOf(Selected, id) < 0 {
                next.Add(id)
            }
            Anchor = id
        }
        Selected = next.ToArray()
        Rebuild()
    }

    private func Expand(id string, state bool) {
        Expanded = state ? []string{id}: []string{}
        Rebuild()
    }

    internal func Rows()[]DataGridRow {
        let count = Large ? 1500: 5
        let output = [count]DataGridRow
        let names = []string{"alpha", "beta", "locked", "delta", "echo"}
        for index in 0 ... count {
            let id = Large ? "host-" + index.ToString(): names[index]
            let values = Dictionary[string, string]()
            values.Add("name", id)
            values.Add("state", index % 2 == 0 ? "Healthy": "Review")
            values.Add("owner", "Platform team")
            output[index] = DataGridRow{
                Id: id,
                Label: "Host " + id,
                Disabled: !Large && id == "locked",
                HasDetail: !Large && id == "alpha",
                Values: values
            }
        }
        if SortDirection == DataGridSort.Descending {
            Array.Reverse(output)
        }
        return output
    }

    public override func Build() Blob {
        let name = DataGridColumn{
            Id: "name",
            Label: "Name",
            Width: Fit ? nil: 170,
            Minimum: 100,
            Maximum: Fit ? 1000000: 300,
            Sortable: true,
            Filter: TextEntry{
                Handle: FilterHandle,
                Value: "",
                Placeholder: "Host filter",
                Width: Percent(100),
                Height: 30,
                Padding: 5,
                Color: "#fafafa",
                BackgroundColor: "#09090b"
            }
        }
        let state = DataGridColumn{
            Id: "state",
            Label: "State",
            Width: Fit ? 160: nil,
            Flex: 1,
            Minimum: 110,
            Maximum: 220,
            Sortable: true
        }
        let owner = DataGridColumn{
            Id: "owner",
            Label: "Owner",
            Width: Fit ? 160: nil,
            Flex: 2,
            Minimum: 140,
            Maximum: 500
        }
        return Container{
            Width: Percent(100),
            Height: Percent(100),
            Padding: 20,
            Gap: 14,
            BackgroundColor: "#111318",
            Text{Key: "title", Content: "DataGrid · controlled inventory", FontSize: 24, Color: "#fafafa"},
            Text{
                Key: "hint",
                Content: "Sort headers, drag column edges, and select rows. Details are measured.",
                Color: "#a1a1aa"
            },
            Cell.Mount[DataGridInput, DataGrid](
                "grid",
                DataGridInput{
                    Columns: SwapColumns ? []DataGridColumn{owner, state, name}: []DataGridColumn{name, state, owner},
                    Rows: Rows(),
                    Height: 300,
                    Width: Fit ? (Tiny ? 350: Compact ? 440: 650): nil,
                    Disabled: Disabled,
                    ColumnWidths: Widths,
                    OnColumnWidthChange: Width,
                    OnColumnWidthCommit: Commit,
                    FitColumnsToViewport: Fit,
                    OnFittedColumnWidthsChange: FittedWidths,
                    OnFittedColumnWidthsCommit: FittedCommit,
                    ScrollbarY: Fit ? Scrollbar{Thickness: 6, Inset: 8, ReserveSpace: true}: nil,
                    SortColumnId: SortId,
                    SortDirection: SortDirection,
                    OnSort: Sort,
                    Selection: Single ? DataGridSelection.Single: DataGridSelection.Multiple,
                    SelectedIds: Selected,
                    OnSelectionChange: Selection,
                    ActiveRowId: Controlled ? Active: nil,
                    OnActiveRowChange: Controlled ? ActiveChanged: nil,
                    OnSelectionRequest: Controlled ? SelectionRequest: nil,
                    UseDefaultKeyboard: !Controlled,
                    OnKeyDown: Controlled ? Navigate: nil,
                    ShowSelection: true,
                    SelectionColumnWidth: 36.0,
                    ExpandedIds: Expanded,
                    OnExpandedChange: Expand,
                    CreateRoot: CaptureRoot,
                    CreateRow: CaptureRow,
                    CreateHeader: CaptureHeader,
                    CreateCell: CaptureCell,
                    CreateSelection: CaptureCheck,
                    CreateDetail: Detail,
                    AccessibilityName: "Inventory grid"
                }
            )
        }
    }
}

func GridElement(root Blob, name string) Blob? {
    if root.Accessibility?.Name == name {
        return root
    }
    if root is Container {
        for child in root.Children {
            let found = GridElement(child, name)
            if found != nil {
                return found
            }
        }
    }
    return nil
}

func GridAligned(host DataGridHost, id string) {
    let header = host.Headers[id].BorderBox
    let cell = host.Cells["alpha:" + id].BorderBox
    Require(
        Math.Abs(header.X - cell.X) < .1 && Math.Abs(header.Width - cell.Width) < .1,
        "Grid header/body columns diverged: " + id
    )
}

func GridColumnWidths(semantics SearchListSemantics)[]float64 -> []float64{
    Math.Round(FindSemantics(semantics.Tree!!.Root, "Name")!!.Bounds.Width, 3),
    Math.Round(FindSemantics(semantics.Tree!!.Root, "State")!!.Bounds.Width, 3),
    Math.Round(FindSemantics(semantics.Tree!!.Root, "Owner")!!.Bounds.Width, 3)
}

func GridModifierKey(key SDLScancode, modifiers SDLKeymod, down bool) {
    var event = SDLEvent{
        Key: SDLKeyboardEvent{
            Type: if down {
                SDLEventType.KeyDown
            } else {
                SDLEventType.KeyUp
            },
            WindowID: OnlyNativeWindow(),
            Scancode: key,
            Mod: uint16(modifiers),
            Down: if down {
                uint8(1)
            } else {
                uint8(0)
            }
        }
    }
    Require(SDL.PushEvent(ref event), "SDL rejected a modifier key")
}

func GridModifiedClick(window Window, handle ElementHandle, modifiers SDLKeymod) {
    let key = if (modifiers & SDLKeymod.Ctrl) != SDLKeymod.None {
        SDLScancode.Lctrl
    } else {
        SDLScancode.Lshift
    }
    GridModifierKey(key, modifiers, true)
    CompositeClick(window, handle)
    GridModifierKey(key, SDLKeymod.None, false)
}

func GridKey(window Window, key Key, modifiers KeyModifiers = default(KeyModifiers)) {
    window.PlatformInput.KeyPress(key, modifiers)
    window.PlatformInput.KeyRelease(key)
    PumpFrames(window, 3)
}

func GridPointer(window Window, handle ElementHandle, modifiers KeyModifiers = default(KeyModifiers),
    button PointerButton = PointerButton.Primary) {
    let box = handle.BorderBox
    let x = float32(box.X + Math.Min(20.0, box.Width / 2.0))
    let y = float32(box.Y + box.Height / 2.0)
    window.PlatformInput.PointerPress(1L, PointerDevice.Mouse, x, y, button, modifiers, 1.0F)
    window.PlatformInput.PointerRelease(1L, PointerDevice.Mouse, x, y, button, modifiers, 1.0F)
    PumpFrames(window, 4)
}

func DataGridNavigationInteractions() {
    let host = DataGridHeightHost()
    host.Navigation = true
    host.VirtualColumns = true
    host.Indexed = true
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "DataGrid navigation",
        Width: 500,
        Height: 320,
        Root: host,
        AccessibilityAdapter: semantics,
        SmoothScrolling: false
    }
    Theme.Attach(window, Theme.Default)
    RunNativeWindow(window, () -> {
        window.Open()
        PumpFrames(window, 12)
        Require(host.Root!!.Handle!!.Focus(), "Navigation grid did not focus")
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        Require(host.Root!!.Accessibility!!.Relationships!!.ActiveDescendant == host.RowBlobs["0"].Handle &&
            host.SelectedIds.Length == 0, "Group corner navigation selected a group")
        GridKey(window, Key.Right)
        Require(host.GroupExpansion, "Right did not expand the current group")
        GridKey(window, Key.Left)
        Require(!host.GroupExpansion, "Left did not collapse the current group")
        GridPointer(window, host.RowBlobs["0"].Handle!!)
        Require(host.GroupExpansion && host.SelectedIds.Length == 0, "Group expander changed row selection")
        host.Root!!.Handle!!.Focus()
        let heldStart = host.ActiveIndex
        let heldBuilds = host.RowBuilds
        let heldRows = host.RowBlobs.Count
        window.PlatformInput.KeyPress(Key.Down, KeyModifiers{})
        try {
            FeedbackWait(window, 750)
        } finally {
            window.PlatformInput.KeyRelease(Key.Down)
        }
        PumpFrames(window, 3)
        let heldSteps = host.ActiveIndex - heldStart
        Require(heldSteps > 1, "Held Down did not repeat row navigation")
        Require(host.RowBuilds - heldBuilds <= heldSteps * 2 + host.RowBlobs.Count - heldRows,
            "Held Down rebuilt unchanged visible rows")
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        GridKey(window, Key.Down)
        Require(host.ActiveIndex == 1 && host.SelectedIds.Length == 1, "Down did not select the first data row")
        let before = host.RowBuilds
        GridKey(window, Key.Down)
        Require(host.RowBuilds - before <= 2, "Down rebuilt " + (host.RowBuilds - before).ToString() + " visible rows")
        GridKey(window, Key.Down, KeyModifiers{Shift: true})
        GridKey(window, Key.Up, KeyModifiers{Shift: true})
        Require(host.SelectedIds.Length == 2 && Array.IndexOf(host.SelectedIds, "3") >= 0, "Range reversal removed selected rows")
        GridKey(window, Key.Down, KeyModifiers{Ctrl: true})
        Require(host.ActiveIndex == 1999999 && host.SelectedIds.Length == 1, "Ctrl+Down did not replace selection at the boundary")
        GridKey(window, Key.Up, KeyModifiers{Ctrl: true})
        Require(host.ActiveIndex == 0 && host.SelectedIds.Length == 1, "Ctrl+Up did not reach the first group without changing selection")
        GridKey(window, Key.Down)
        GridKey(window, Key.PageDown)
        let page = host.ActiveIndex
        Require(page > 1 && page < 10 && host.SelectedIds.Length == 1, "PageDown did not use fully visible slots")
        GridKey(window, Key.PageDown, KeyModifiers{Ctrl: true})
        Require(host.ActiveIndex > page && host.SelectedIds.Length == 1, "Ctrl+PageDown kept the previous selection")
        GridKey(window, Key.PageUp, KeyModifiers{Ctrl: true, Shift: true})
        Require(host.SelectedIds.Length > 1, "Ctrl+Shift+PageUp did not add the anchor range")
        GridKey(window, Key.Right)
        GridKey(window, Key.Home)
        Require(host.Column == "0", "Home did not move to the first cell")
        let active = host.ActiveIndex
        let selection = host.SelectedIds
        GridKey(window, Key.End, KeyModifiers{Shift: true})
        Require(host.Column == "11" && host.ActiveIndex == active &&
            Object.ReferenceEquals(host.SelectedIds, selection) && host.Viewport.ScrollOffset.X > 0.0,
            "Shift+End changed row selection or failed to reveal the last cell")
        GridKey(window, Key.Left, KeyModifiers{Ctrl: true, Shift: true})
        Require(host.Column == "0" && host.Viewport.ScrollOffset.X < .1, "Ctrl+Shift+Left did not reveal the first cell")
        GridKey(window, Key.Right, KeyModifiers{Shift: true})
        Require(host.Column == "1" && Object.ReferenceEquals(host.SelectedIds, selection), "Shift+Right extended row selection")
        GridKey(window, Key.End, KeyModifiers{Ctrl: true})
        Require(host.Column == "11" && host.ActiveIndex == 1999999 && host.SelectedIds.Length == 1, "Ctrl+End did not select the grid corner")
        GridKey(window, Key.Up)
        GridKey(window, Key.End, KeyModifiers{Ctrl: true, Shift: true})
        Require(host.ActiveIndex == 1999999 && host.SelectedIds.Length == 2, "Ctrl+Shift+End did not add the corner range")
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        GridKey(window, Key.Down)
        GridKey(window, Key.Down)
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true, Shift: true})
        Require(host.ActiveIndex == 0 && host.SelectedIds.Length == 2, "Ctrl+Shift+Home did not add the first data row")
        GridKey(window, Key.Down)
        let calls = host.RowCalls
        GridKey(window, Key.A, KeyModifiers{Ctrl: true})
        Require(host.AllSelected && host.SelectAllRequests == 1 && host.RowCalls - calls < 120,
            "Indexed Ctrl+A enumerated rows or failed its controlled request")
        Require(host.RowBlobs["1"].Accessibility!!.Selected == true, "AllSelected did not reach row semantics")
        GridKey(window, Key.Down)
        Require(!host.AllSelected && host.SelectedIds.Length == 1 && host.SelectedIds[0] == "2",
            "Explicit navigation did not replace all-selected state")
        GridKey(window, Key.Space)
        Require(host.SelectedIds.Length == 0, "Space did not toggle a multiple selection")
        GridKey(window, Key.Space)
        Require(host.SelectedIds.Length == 1, "Space did not restore a multiple selection")
        Require(host.Root!!.Handle!!.Focus() && window.PlatformInput.Editor == nil, "Row copy did not focus the grid")
        GridKey(window, Key.C, KeyModifiers{Ctrl: true})
        GridKey(window, Key.Insert, KeyModifiers{Ctrl: true})
        Require(host.CopyRequests == 2, "Copy chords did not request the controlled row copy")
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        GridKey(window, Key.Down)
        GridPointer(window, host.Cells["2:0"])
        Require(host.SelectedIds.Length == 1 && host.SelectedIds[0] == "2", "Indexed primary click failed")
        GridPointer(window, host.Cells["1:0"], KeyModifiers{Ctrl: true})
        Require(host.SelectedIds.Length == 2, "Indexed Ctrl+click did not toggle selection")
        GridPointer(window, host.Cells["2:0"], KeyModifiers{Ctrl: true, Shift: true})
        Require(host.SelectedIds.Length == 2, "Indexed Ctrl+Shift+click did not add the anchor range")
        GridPointer(window, host.Cells["1:0"], KeyModifiers{Ctrl: true}, PointerButton.Secondary)
        Require(host.SelectedIds.Length == 2, "Secondary click on a selected row replaced the set")
        Require(host.ContextRequests == 1 && host.ContextSelected, "Secondary click lost the row context handler")
        GridPointer(window, host.Cells["3:0"], KeyModifiers{Ctrl: true, Shift: true}, PointerButton.Secondary)
        Require(host.SelectedIds.Length == 1 && host.SelectedIds[0] == "3" &&
            host.ContextRequests == 2 && host.ContextSelected, "Secondary click did not select before the context handler")
        host.Root!!.Handle!!.Focus()
        host.Single = true
        host.SelectedIds = []string{"1"}
        host.Active = nil
        host.Rebuild()
        PumpFrames(window, 6)
        GridKey(window, Key.Down, KeyModifiers{Shift: true})
        Require(host.SelectedIds.Length == 1 && host.SelectedIds[0] == "2", "Single mode extended a range")
        GridKey(window, Key.Space)
        Require(host.SelectedIds.Length == 1, "Single mode Space changed selection")
        GridKey(window, Key.A, KeyModifiers{Ctrl: true})
        Require(!host.AllSelected && host.SelectAllRequests == 1, "Single mode accepted select-all")
        GridPointer(window, host.Cells["1:0"])
        GridPointer(window, host.Cells["2:0"], KeyModifiers{Ctrl: true, Shift: true})
        Require(host.SelectedIds.Length == 1 && host.SelectedIds[0] == "2", "Single mode pointer gesture extended a set")
        host.Single = false
        host.SelectAllEnabled = false
        host.Rebuild()
        PumpFrames(window, 4)
        GridKey(window, Key.A, KeyModifiers{Ctrl: true})
        Require(!host.AllSelected && host.SelectAllRequests == 1, "Indexed Ctrl+A without a request callback changed selection")
        host.Indexed = false
        host.Single = false
        host.Active = nil
        host.Rebuild()
        PumpFrames(window, 8)
        GridKey(window, Key.A, KeyModifiers{Ctrl: true})
        Require(host.SelectedIds.Length == 99 && Array.IndexOf(host.SelectedIds, "0") < 0,
            "Array Ctrl+A did not select eligible rows")
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        GridKey(window, Key.Down)
        GridPointer(window, host.RowHeaders["2"])
        Require(host.SelectedIds.Length == 1 && host.SelectedIds[0] == "2", "Row header did not share the row selection policy")
        GridPointer(window, host.NavigationHeaders["0"])
        Require(host.Sorts.Length == 1 && host.Sorts[0].Direction == DataGridSort.Ascending, "Header click did not sort ascending")
        GridPointer(window, host.NavigationHeaders["0"])
        Require(host.Sorts[0].Direction == DataGridSort.Descending, "Header click did not sort descending")
        GridPointer(window, host.NavigationHeaders["1"], KeyModifiers{Shift: true})
        Require(host.Sorts.Length == 2, "Shift header click replaced the sort set")
        GridPointer(window, host.NavigationHeaders["0"], KeyModifiers{Ctrl: true, Shift: true})
        Require(host.Sorts.Length == 2 && host.Sorts[0].Direction == DataGridSort.Descending, "Ctrl+Shift header click changed existing sorts")
        GridPointer(window, host.NavigationHeaders["0"], KeyModifiers{Ctrl: true})
        Require(host.Sorts.Length == 0, "Ctrl header click did not clear sorting")
        host.Pinned = []string{"0", "1"}
        host.Rebuild()
        PumpFrames(window, 6)
        let first = host.NavigationHeaders["0"].BorderBox
        let second = host.NavigationHeaders["1"].BorderBox
        let y = float32(first.Y + first.Height / 2.0)
        window.PlatformInput.PointerPress(1L, PointerDevice.Mouse, float32(second.X + second.Width / 2.0), y,
            PointerButton.Primary, KeyModifiers{}, 1.0F)
        window.PlatformInput.PointerMove(1L, PointerDevice.Mouse, float32(first.X + 2.0), y, KeyModifiers{}, 1.0F)
        PumpFrames(window, 3)
        window.PlatformInput.PointerRelease(1L, PointerDevice.Mouse, float32(first.X + 2.0), y,
            PointerButton.Primary, KeyModifiers{}, 1.0F)
        PumpFrames(window, 6)
        Require(host.Order.Length == 12 && host.Order[0] == "1" && host.Order[1] == "0", "Header drag did not reorder the pinned segment")
        host.Root!!.Handle!!.Focus()
        GridKey(window, Key.Tab)
        Require(host.FocusTarget == "after", "Tab did not leave the grid")
        host.Root!!.Handle!!.Focus()
        GridKey(window, Key.Tab, KeyModifiers{Shift: true})
        Require(host.FocusTarget == "before", "Shift+Tab did not leave the grid")
        host.Root!!.Handle!!.Focus()
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        GridKey(window, Key.Down)
        GridKey(window, Key.Down, KeyModifiers{Ctrl: true, Shift: true})
        Require(host.SelectedIds.Length == 99, "Ctrl+Shift+Down did not add the boundary range")
        GridKey(window, Key.Up, KeyModifiers{Ctrl: true, Shift: true})
        Require(host.ActiveIndex == 0 && host.SelectedIds.Length == 99, "Ctrl+Shift+Up did not preserve the additive boundary range")
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        GridKey(window, Key.Down)
        GridKey(window, Key.PageDown, KeyModifiers{Shift: true})
        let count = host.SelectedIds.Length
        GridKey(window, Key.PageUp, KeyModifiers{Shift: true})
        Require(count > 1 && host.SelectedIds.Length >= count, "Shift+Page range reversal removed rows")
        host.InteractiveEditor = true
        host.Version++
        host.Rebuild()
        PumpFrames(window, 6)
        Require(host.Editor.Focus(), "Composed cell editor did not focus")
        let editorSelection = host.SelectedIds
        GridKey(window, Key.A, KeyModifiers{Ctrl: true})
        Require(window.PlatformInput.Selection!!.Active.Offset - window.PlatformInput.Selection!!.Anchor.Offset == 14 &&
            Object.ReferenceEquals(editorSelection, host.SelectedIds) && !host.AllSelected &&
                host.SelectAllRequests == 1, "Grid stole native editor select-all")
        GridKey(window, Key.C, KeyModifiers{Ctrl: true})
        GridKey(window, Key.Insert, KeyModifiers{Ctrl: true})
        Require(host.CopyRequests == 2 && host.EditorCopyRequests == 2, "Grid stole composed editor copy bindings")
    })
    Console.WriteLine("PASS DataGrid navigation: held-key repeat, row retention, additive ranges, corners, pages, columns, select-all, groups and copy")
}

func DataGridInteractions() {
    RunContracts(DataGridContracts)
    DataGridLogicalEditingFocus()
    DataGridHeightInteractions()
    DataGridNavigationInteractions()
    DataGridEditingInteractions()
    let host = DataGridHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "DataGrid verification",
        Width: 720,
        Height: 450,
        Root: host,
        AccessibilityAdapter: semantics
    }
    Theme.Attach(window, Theme.Default)
    RunNativeWindow(window, () -> {
        window.Open()
        PumpFrames(window, 20)
        let id = OnlyNativeWindow()
        GridAligned(host, "name")
        GridAligned(host, "state")
        let theme = Theme.Read(window)
        let gridX = host.Root!!.Handle!!.ContentBox.X
        let check = host.Checks["alpha"].Handle!!.BorderBox
        Require(
            theme.ControlHeight == 32.0 && Math.Abs(
                host.Headers["name"].BorderBox.X - gridX - theme.ControlPadding - theme.ControlHeight - 36.0
            ) < .1 &&
                Math.Abs(check.X + check.Width / 2.0 - gridX - 18.0) < .1,
            "Explicit 36px selection column did not preserve header/row alignment and centered checkboxes at 32px control height"
        )
        Require(host.DetailBuilds == 0, "Collapsed detail factory ran eagerly")
        CompositeClick(window, host.Headers["name"])
        PumpFrames(window, 8)
        Require(
            host.SortDirection == DataGridSort.Ascending && host.SortCalls == 1,
            "Controlled grid sort request failed"
        )
        CompositeClick(window, host.Headers["name"])
        PumpFrames(window, 10)
        Require(
            host.SortDirection == DataGridSort.Descending &&
                host
                .RowBlobs["echo"]
                .Handle!!
                .BorderBox
                .Y < host
                .RowBlobs["alpha"]
                .Handle!!
                .BorderBox
                .Y,
            "Host sort did not reorder stable virtual rows"
        )
        CompositeClick(window, host.Headers["name"])
        PumpFrames(window, 8)
        Require(host.SortDirection == DataGridSort.Ascending, "Grid sort did not use the two-state cycle")
        CompositeClick(window, host.Cells["beta:name"])
        Require(host.Selected.Length == 1 && host.Selected[0] == "beta", "Grid pointer single replacement failed")
        GridModifiedClick(window, host.Cells["echo:name"], SDLKeymod.Ctrl)
        Require(host.Selected.Length == 2, "Grid Ctrl toggle failed")
        GridModifiedClick(window, host.Cells["beta:name"], SDLKeymod.Shift)
        Require(
            host.Selected.Length == 3 && Array.IndexOf(host.Selected, "locked") < 0,
            "Grid Shift range failed to skip disabled rows"
        )
        CompositeClick(window, host.Cells["locked:name"])
        Require(host.Selected.Length == 3, "Disabled grid row changed selection")
        CompositeClick(window, host.Checks["alpha"].Handle!!)
        Require(host.Selected.Length == 4, "Leading selection control lost controlled toggle")
        host.Root!!.Handle!!.Focus()
        GridKey(window, Key.A, KeyModifiers{Ctrl: true})
        Require(host.Selected.Length == 4 && Array.IndexOf(host.Selected, "locked") < 0, "Ctrl+A selected a disabled row")
        host.Controlled = true
        host.Active = "beta"
        host.Anchor = "beta"
        host.Selected = []string{"alpha"}
        host.Rebuild()
        PumpFrames(window, 8)
        host.Root!!.Handle!!.Focus()
        SendKey(id, SDLScancode.Down)
        PumpFrames(window, 8)
        Require(
            host.Active == "delta" &&
                FindSemantics(semantics.Tree!!.Root, "Inventory grid")!!
                .Relationships
                .ActiveDescendant == FindSemantics(FindSemantics(semantics.Tree!!.Root, "Host delta")!!, "Name")!!.Id,
            "Host keyboard focus did not control the active grid row"
        )
        CaptureIssueProof(window, "datagrid-focus")
        GridModifiedClick(window, host.Cells["echo:name"], SDLKeymod.Shift)
        Require(
            host.Selected.Length == 2 && Array.IndexOf(host.Selected, "delta") >= 0 && Array.IndexOf(
                host.Selected,
                "echo"
            ) >= 0 &&
                host.Anchor == "delta",
            "Host Shift-click did not use the keyboard range anchor"
        )
        GridModifiedClick(window, host.Cells["beta:name"], SDLKeymod.Ctrl | SDLKeymod.Shift)
        Require(
            host.Selected.Length == 3 && Array.IndexOf(host.Selected, "beta") >= 0 && Array.IndexOf(
                host.Selected,
                "locked"
            ) < 0 &&
                host.Active == "beta",
            "Host Ctrl+Shift-click did not add the range or update active focus"
        )
        host.Controlled = false
        host.Active = nil
        host.Anchor = nil
        host.Rebuild()
        PumpFrames(window, 8)
        let alpha = FindSemantics(semantics.Tree!!.Root, "Host alpha")!!
        Require(alpha.RowIndex == 0, "Grid first data row index included presentation headers")
        Require(
            window.PerformAccessibilityAction(alpha.Id, AccessibilityActionRequest(AccessibilityAction.Expand)),
            "Grid detail accessibility expansion failed"
        )
        PumpFrames(window, 15)
        Require(
            host.DetailBuilds > 0 &&
                host
                .RowBlobs["alpha"]
                .Handle!!
                .BorderBox
                .Height > 60.0 &&
                host
                .RowBlobs["beta"]
                .Handle!!
                .BorderBox
                .Y >= (host.RowBlobs["alpha"].Handle!!.BorderBox.Y + host.RowBlobs["alpha"].Handle!!.BorderBox.Height),
            "Measured expanded detail overlapped the next row"
        )
        CaptureIssueProof(window, "datagrid-expanded")
        let resize = GridElement(host.Root!!, "Resize Name")!!.Handle!!
        let box = resize.BorderBox
        let x = float32(box.X + box.Width / 2.0)
        let y = float32(box.Y + 15.0)
        MouseMove(id, x, y)
        MouseButton(id, x, y, true)
        MouseMove(id, x + 80.0F, y + 70.0F)
        PumpFrames(window, 8)
        MouseButton(id, x + 80.0F, y + 70.0F, false)
        PumpFrames(window, 10)
        Require(
            Math.Abs(host.Widths["name"] - 250.0) < .1 && host.Commits == 1 && host.SortCalls == 3,
            "Captured grid drag failed or accidentally sorted"
        )
        GridAligned(host, "name")
        GridAligned(host, "state")
        let cancelBox = GridElement(host.Root!!, "Resize Name")!!.Handle!!.BorderBox
        let cx = float32(cancelBox.X + 3.0)
        MouseMove(id, cx, y)
        MouseButton(id, cx, y, true)
        MouseMove(id, cx - 400.0F, y)
        PumpFrames(window, 8)
        var lost = SDLEvent{Window: SDLWindowEvent{Type: SDLEventType.WindowFocusLost, WindowID: id}}
        SDL.PushEvent(ref lost)
        PumpFrames(window, 6)
        let cancelledWidth = host.Widths["name"]
        MouseMove(id, 5, 5)
        MouseButton(id, 5, 5, false)
        PumpFrames(window, 8)
        Require(
            cancelledWidth == 100.0 && host.Widths["name"] == cancelledWidth && host.Commits == 1,
            "Grid cancel failed to stop drag or minimum clamp"
        )
        GridElement(host.Root!!, "Resize Name")!!.Handle!!.Focus()
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 8)
        Require(host.Widths["name"] == 108.0 && host.Commits == 2, "Grid keyboard column resize failed")
        host.Single = true
        host.Selected = []string{"alpha"}
        host.Rebuild()
        PumpFrames(window, 8)
        host.Root!!.Handle!!.Focus()
        GridKey(window, Key.Home, KeyModifiers{Ctrl: true})
        SendKey(id, SDLScancode.Down)
        SendKey(id, SDLScancode.Down)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 10)
        Require(
            host.Selected.Length == 1 && host.Selected[0] == "delta",
            "Grid keyboard selection did not skip disabled rows"
        )
        host.FilterHandle.Focus()
        SendKey(id, SDLScancode.Home)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 6)
        Require(host.Selected[0] == "delta", "Grid stole keyboard input from a filter")
        host.Widths["name"] = 300.0
        host.Widths["owner"] = 450.0
        host.Rebuild()
        PumpFrames(window, 10)
        let left = host.Headers["name"].BorderBox.X
        host.Root!!.Handle!!.Focus()
        SendKey(id, SDLScancode.Home)
        PumpFrames(window, 8)
        Require(
            Math.Abs(host.Headers["name"].BorderBox.X - left) < .1,
            "Revealing an active grid row shifted the horizontal viewport"
        )
        let ownerResize = GridElement(host.Root!!, "Resize Owner")!!.Handle!!
        ownerResize.Focus()
        ownerResize.ScrollIntoView()
        PumpFrames(window, 12)
        Require(
            host.Headers["owner"].BorderBox.X < 650.0,
            "Shared horizontal viewport failed to reveal the last column"
        )
        GridAligned(host, "name")
        GridAligned(host, "owner")
        CaptureIssueProof(window, "datagrid-horizontal")
        host.SwapColumns = true
        host.Rebuild()
        PumpFrames(window, 10)
        GridAligned(host, "name")
        GridAligned(host, "owner")
        host.Large = true
        host.Expanded = []string{}
        host.Rebuild()
        PumpFrames(window, 15)
        host.Root!!.Handle!!.Focus()
        GridKey(window, Key.End, KeyModifiers{Ctrl: true})
        PumpFrames(window, 20)
        let grid = FindSemantics(semantics.Tree!!.Root, "Inventory grid")!!
        let last = FindSemantics(semantics.Tree!!.Root, "Host host-1499")!!
        Require(grid.RowCount == 1500 && grid.ColumnCount == 4 && last.RowIndex == 1499 && last.ColumnCount == 4,
            "Virtual grid omitted logical row or column metadata")
        let lastName = FindSemantics(last, "Name")!!
        let lastState = FindSemantics(last, "State")!!
        Require(lastName.RowIndex == 1499 && lastName.ColumnIndex == 3 &&
            lastState.RowIndex == 1499 && lastState.ColumnIndex == 2,
            "Grid cell indices did not follow reordered columns and unrealized rows")
        Require(
            grid.Focused && grid.Relationships.ActiveDescendant == lastName.Id,
            "Grid End failed to reveal a virtual active descendant"
        )
        var mounted int32
        for row in host.RowBlobs.Values {
            if row.Handle!!.IsMounted {
                mounted++
            }
        }
        Require(mounted < 30, "Grid realized all 1500 rows")
        CaptureIssueProof(window, "datagrid-virtual-end")
        host.Disabled = true
        host.Rebuild()
        PumpFrames(window, 8)
        CaptureIssueProof(window, "datagrid-disabled")
        Require(
            !window.PerformAccessibilityAction(last.Id, AccessibilityActionRequest(AccessibilityAction.Select)),
            "Disabled grid accepted accessible selection"
        )
        host.Disabled = false
        host.Large = false
        host.SwapColumns = false
        host.Fit = true
        host.Widths = Dictionary[string, float64]()
        host.Rebuild()
        PumpFrames(window, 12)
        let fittedWidth = host.Root!!.Handle!!.ContentBox.Width - 14.0
        let leading = 36.0 + Theme.Read(window).ControlHeight
        let normalWidths = GridColumnWidths(semantics)
        let nameWidth = normalWidths[0]
        let stateWidth = normalWidths[1]
        let ownerWidth = normalWidths[2]
        Require(
            Math.Abs(nameWidth + stateWidth + ownerWidth + leading - fittedWidth) < 1.0 &&
                GridElement(host.Root!!, "Resize Owner") == nil,
            "Fitted grid did not use the measured viewport or exposed the final edge"
        )
        let fittedResize = GridElement(host.Root!!, "Resize Name")!!.Handle!!
        let fittedBox = fittedResize.BorderBox
        let fittedX = float32(fittedBox.X + fittedBox.Width / 2.0)
        let fittedY = float32(fittedBox.Y + 15.0)
        MouseMove(id, fittedX, fittedY)
        MouseButton(id, fittedX, fittedY, true)
        MouseMove(id, fittedX + 40.0F, fittedY)
        PumpFrames(window, 8)
        MouseButton(id, fittedX + 40.0F, fittedY, false)
        PumpFrames(window, 8)
        Require(
            Math.Abs(host.Widths["name"] - nameWidth - 40.0) < 1.0 && Math.Abs(
                host.Widths["state"] - stateWidth + 40.0
            ) < 1.0 &&
                Math.Abs(host.Widths["owner"] - ownerWidth) < 1.0,
            "Fitted grid pointer resize did not transfer width atomically"
        )
        GridElement(host.Root!!, "Resize Name")!!.Handle!!.Focus()
        SendKey(id, SDLScancode.Left)
        PumpFrames(window, 8)
        Require(Math.Abs(host.Widths["name"] - nameWidth - 32.0) < 1.0, "Fitted grid keyboard resize failed")
        let resizeSemantic = FindSemantics(semantics.Tree!!.Root, "Resize Name")!!
        Require(
            window.PerformAccessibilityAction(
                resizeSemantic.Id,
                AccessibilityActionRequest(AccessibilityAction.Increment)
            ),
            "Fitted grid accessibility resize was rejected"
        )
        PumpFrames(window, 8)
        Require(Math.Abs(host.Widths["name"] - nameWidth - 40.0) < 1.0, "Fitted grid accessibility resize failed")
        host.Compact = true
        host.Rebuild()
        PumpFrames(window, 12)
        let compactWidth = host.Root!!.Handle!!.ContentBox.Width - 14.0
        let compactWidths = GridColumnWidths(semantics)
        let compactName = compactWidths[0]
        let compactState = compactWidths[1]
        let compactOwner = compactWidths[2]
        Require(
            Math.Abs(compactName + compactState + compactOwner + leading - compactWidth) < 1.0 &&
                compactName < host.Widths["name"] &&
                compactState < host.Widths["state"],
            "Fitted grid compact resize did not fit flexible and fixed preferences"
        )
        host.Tiny = true
        host.Rebuild()
        PumpFrames(window, 8)
        let tinyWidths = GridColumnWidths(semantics)
        let tinyTotal = tinyWidths[0] + tinyWidths[1] + tinyWidths[2] + leading
        Require(
            tinyTotal > host.Root!!.Handle!!
                .ContentBox
                .Width - 14.0 &&
                tinyWidths[0] >= 100.0 &&
                tinyWidths[1] >= 110.0 &&
                tinyWidths[2] >= 140.0,
            "Fitted grid failed to preserve minimum widths when viewport was too narrow"
        )
    })
    Console.WriteLine(
        "PASS: DataGrid shared columns, controlled sort/selection, range/disabled input, captured and fitted resize, measured detail, horizontal overflow and 1500-row virtualization"
    )
}

internal class DataGridEditHost : Cell {
    internal let Root ElementHandle = ElementHandle()
    internal let Viewport ElementHandle = ElementHandle()
    internal let Before ElementHandle = ElementHandle()
    internal let After ElementHandle = ElementHandle()
    internal let EditorAction ElementHandle = ElementHandle()
    internal let Events List[string] = List[string]()
    internal let RowBlobs Dictionary[string, Container] = Dictionary[string, Container]()
    internal let Cells Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    internal var Rows[]DataGridRow = [1000]DataGridRow
    internal var Columns[]DataGridColumn
    internal var Input DataGridInput
    internal var Context DataGridEditContext
    internal var Builds int32
    internal var Calls int32
    internal var Sets int32
    internal var Invokes int32
    internal var AfterClicks int32
    internal var Reject bool
    internal var Refuse bool
    internal var Reentrant bool
    internal var Reverse bool
    internal var CancelReason DataGridEditCancelReason
    internal var Outcome DataGridEditOutcome

    internal init() {
        Columns = []DataGridColumn{
            DataGridColumn{Id: "name", Label: "Name", Width: 160, Editable: true, CreateEditor: CaptureEditor},
            DataGridColumn{Id: "locked", Label: "Locked", Width: 160, CreateEditor: CaptureEditor},
            DataGridColumn{Id: "notes", Label: "Notes", Width: 160, Editable: true, Multiline: true, CreateEditor: CaptureEditor},
            DataGridColumn{Id: "popup", Label: "Popup", Width: 160, Editable: true, EditPresentation: DataGridEditPresentation.Popover, CreateEditor: CaptureEditor}
        }
        for index in 0 ... Rows.Length {
            let values = Dictionary[string, string]()
            values.Add("name", "Value " + index.ToString())
            values.Add("notes", "Notes " + index.ToString())
            values.Add("popup", "Popup " + index.ToString())
            Rows[index] = DataGridRow{Id: index.ToString(), SourceIndex: index + 1000, Values: values}
        }
        Input = DataGridInput{
            Columns: Columns, Rows: Rows, RootHandle: Root, ViewportHandle: Viewport,
            Width: Percent(100), Height: 240, RowHeight: 32, VirtualizeColumns: true,
            ActiveRowId: "0", ActiveColumnId: "name", Selection: DataGridSelection.Multiple,
            OnSelectionChange: (ids[]string) -> {
                Input = Input with{SelectedIds = ids}
                Rebuild()
            },
            OnActiveRowChange: (id string) -> {
                Input = Input with{ActiveRowId = id}
                Rebuild()
            },
            OnActiveColumnChange: (id string) -> {
                Input = Input with{ActiveColumnId = id}
                Rebuild()
            },
            OnClick: (id string) -> Invokes++,
            SetCellValue: SetValue,
            OnEditBegin: (edit DataGridEdit) -> {
                Events.Add("begin")
                return !Refuse
            },
            OnEditCommit: (edit DataGridEdit) -> {
                Events.Add("validate")
                if Reentrant { Context.Commit() }
                return DataGridEditResult{ErrorMessage: Reject ? "Enter a valid value": nil}
            },
            OnEditCancel: (edit DataGridEdit, reason DataGridEditCancelReason) -> {
                Events.Add("cancel")
                CancelReason = reason
                if Reentrant { Context.Cancel() }
            },
            OnEditEnd: (edit DataGridEdit, outcome DataGridEditOutcome) -> {
                Events.Add("end")
                Outcome = outcome
            },
            CreateRow: (input DataGridInput, row DataGridRow, root Container) -> {
                Builds++
                RowBlobs[row.Id!!] = root
                return root
            },
            CreateCell: (input DataGridInput, row DataGridRow, column DataGridColumn, content Blob) -> {
                let handle = ElementHandle()
                Cells[row.Id!! + ":" + column.Id!!] = handle
                return Container{Handle: handle, content}
            },
            AccessibilityName: "Editing grid"
        }
    }

    private func CaptureEditor(column DataGridColumn, context DataGridEditContext, editor Blob) Blob {
        Context = context
        return Container{
            Width: Percent(100), MinWidth: 0, FlexDirection: FlexDirection.Row,
            Container{FlexGrow: 1, FlexBasis: 0, MinWidth: 0, editor},
            Button{Handle: EditorAction, Width: 24, Text{Content: "+"}}
        }
    }

    private func SetValue(edit DataGridEdit) {
        Events.Add("set")
        Sets++
        let index = int32.Parse(edit.RowId)
        let values = Dictionary[string, string](Rows[index].Values!!)
        values[edit.ColumnId] = edit.Draft
        Rows = (Rows.Clone() as[]DataGridRow)!!
        Rows[index] = Rows[index] with{Values = values}
        Input = Input with{Rows = Rows, RowVersion = Input.RowVersion + 1L}
        Rebuild()
    }

    internal func At(index int32) DataGridRow {
        Calls++
        return Rows[Reverse ? Rows.Length - index - 1: index]
    }

    internal func Index(id string) int32 -> int32.TryParse(id, out var index) && index >= 0 && index < Rows.Length ?
        (Reverse ? Rows.Length - index - 1: index): -1

    internal func Refresh() {
        Input = Input with{Rows = Rows, Columns = Columns, RowVersion = Input.RowVersion + 1L}
        Rebuild()
    }

    public override func Build() Blob -> Container{
        Width: Percent(100), Height: Percent(100), FlexDirection: FlexDirection.Column,
        Button{Handle: Before, Height: 24, Text{Content: "Before grid"}},
        Container{FlexGrow: 1, FlexBasis: 0, MinHeight: 0, Cell.Mount[DataGridInput, DataGrid]("editing-grid", Input)},
        Button{Handle: After, Height: 24, OnClick: () -> AfterClicks++, Text{Content: "After grid"}}
    }
}

func DataGridLogicalEditingFocus() {
    using let embedded = ThemePreferenceHost()
    embedded.Resize(520, 340, 520, 340)
    let host = DataGridEditHost()
    let semantics = SearchListSemantics()
    let window = Window{Root: host, AccessibilityAdapter: semantics}
    Theme.Attach(window, Theme.Default)
    window.Attach(embedded)
    embedded.SetFocused(false)
    ThemeFrames(embedded)
    Require(!window.IsFocused && host.Root.Focus(), "Inactive window rejected grid logical focus")
    ThemeFrames(embedded)
    host.Builds = 0
    window.PlatformInput.KeyPress(Key.Enter, KeyModifiers{})
    window.PlatformInput.KeyRelease(Key.Enter)
    ThemeFrames(embedded)
    Require(window.PlatformInput.Editor?.Text == "Value 0" &&
        window.PlatformInput.Selection?.Active.Offset == 7 && host.Builds == 1,
        "Edit entry required native window focus or rebuilt unrelated rows")
    window.PlatformInput.CommitText(" changed")
    window.PlatformInput.KeyPress(Key.Enter, KeyModifiers{})
    window.PlatformInput.KeyRelease(Key.Enter)
    ThemeFrames(embedded)
    Require(host.Rows[0].Values!!["name"] == "Value 0 changed" && !window.IsFocused &&
        FindSemantics(semantics.Tree!!.Root, "Editing grid")!!.Focused,
        "Explicit commit did not return logical focus without native activation")
    host.Reject = true
    window.PlatformInput.KeyPress(Key.Enter, KeyModifiers{})
    window.PlatformInput.KeyRelease(Key.Enter)
    ThemeFrames(embedded)
    Require(host.After.Focus(), "Outside control rejected logical focus")
    ThemeFrames(embedded)
    Require(host.Sets == 1 && host.Context.EditorHandle.IsMounted &&
        FindSemantics(semantics.Tree!!.Root, "After grid")!!.Focused && !window.IsFocused,
        "Rejected validation closed the edit or moved focus in an inactive window")
    Require(host.Context.EditorHandle.Focus(), "Retained editor rejected logical focus")
    window.PlatformInput.KeyPress(Key.Escape, KeyModifiers{})
    window.PlatformInput.KeyRelease(Key.Escape)
    ThemeFrames(embedded)
    Require(host.Outcome == DataGridEditOutcome.Cancel &&
        FindSemantics(semantics.Tree!!.Root, "Editing grid")!!.Focused && !window.IsFocused,
        "Explicit cancel did not return logical focus without native activation")
    host.Input = host.Input with{ActiveColumnId = "popup"}
    host.Refresh()
    ThemeFrames(embedded)
    window.PlatformInput.KeyPress(Key.Enter, KeyModifiers{})
    window.PlatformInput.KeyRelease(Key.Enter)
    ThemeFrames(embedded)
    Require(window.PlatformInput.Editor?.Text == "Popup 0" && !window.IsFocused,
        "Popup editing required native window activation")
    window.PlatformInput.KeyPress(Key.Escape, KeyModifiers{})
    window.PlatformInput.KeyRelease(Key.Escape)
    ThemeFrames(embedded)
    Require(FindSemantics(semantics.Tree!!.Root, "Editing grid")!!.Focused && !window.IsFocused,
        "Popup cancel did not restore logical focus in an inactive window")
    Console.WriteLine("PASS DataGrid logical editing focus: inactive native window, entry, commit, cancel and validation")
}

func DataGridEditingInteractions() {
    let host = DataGridEditHost()
    let semantics = SearchListSemantics()
    let window = Window{Title: "DataGrid cell editing", Width: 520, Height: 340, Root: host, SmoothScrolling: false, AccessibilityAdapter: semantics}
    Theme.Attach(window, Theme.Default)
    RunNativeWindow(window, () -> {
        window.Open()
        Require(window.RequestActivation() == WindowOperationResult.Accepted, "Editing window activation failed")
        PumpFrames(window, 12)
        Require(host.Root.Focus(), "Editing grid did not focus")
        PumpFrames(window, 3)
        host.Builds = 0
        GridKey(window, Key.Enter)
        WaitVirtual(window, () -> window.PlatformInput.Editor != nil && window.PlatformInput.Selection != nil)
        Require(host.Events.Count == 1 && host.Events[0] == "begin" && host.Context.EditorHandle.IsMounted,
            "Enter did not begin one editable cell")
        Require(host.Builds == 1, "Edit entry did not rebuild exactly one row: " + host.Builds.ToString())
        Console.WriteLine("PASS DataGrid edit entry: rebuilt exactly 1 row")
        Require(window.PlatformInput.Editor!!.Text == "Value 0" && window.PlatformInput.Selection!!.Active.Offset == 7,
            "Edit entry did not retain the value and place the caret at its end")
        Require(FindSemantics(semantics.Tree!!.Root, "Editing grid")!!.Relationships.ActiveDescendant == nil,
            "Edit focus retained a navigation active descendant")
        window.PlatformInput.CommitText(" changed")
        PumpFrames(window, 3)
        GridKey(window, Key.Enter)
        Require(String.Join(",", host.Events) == "begin,validate,set,end" && host.Sets == 1 &&
            host.Rows[0].Values!!["name"] == "Value 0 changed" && host.Outcome == DataGridEditOutcome.Commit,
            "Commit order, value or count failed")
        Require(FindSemantics(semantics.Tree!!.Root, "Editing grid")!!.Focused, "Commit did not return grid focus")
        host.Events.Clear()
        GridKey(window, Key.Space)
        Require(host.Events.Count == 0 && host.Input.SelectedIds!!.Length == 1,
            "Multiple-selection Space began editing instead of selection")
        GridKey(window, Key.Right)
        GridKey(window, Key.Enter)
        Require(host.Invokes == 1 && host.Events.Count == 0, "Read-only Enter did not invoke the row")
        let locked = FindSemantics(FindSemantics(semantics.Tree!!.Root, "0")!!, "Locked")!!
        Require(locked.ReadOnly == true, "Non-editable cell did not expose ReadOnly")
        GridKey(window, Key.Home)
        host.Refuse = true
        GridKey(window, Key.Enter)
        Require(String.Join(",", host.Events) == "begin" && host.Invokes == 2, "Refused entry mounted or ended a session")
        host.Refuse = false
        host.Events.Clear()
        Require(window.PlatformInput.CommitText("!"), "Navigation text was not accepted")
        PumpFrames(window, 4)
        Require(window.PlatformInput.Editor!!.Text == "Value 0 changed!" &&
            window.PlatformInput.Selection!!.Active.Offset == 16, "Printable entry did not append once")
        host.Reentrant = true
        GridKey(window, Key.Escape)
        Require(String.Join(",", host.Events) == "begin,cancel,end" && host.Sets == 1 &&
            host.CancelReason == DataGridEditCancelReason.Escape, "Escape cancellation was duplicated or called the setter")
        host.Events.Clear()
        host.Reject = true
        GridKey(window, Key.Enter)
        window.PlatformInput.CommitText(" rejected")
        PumpFrames(window, 3)
        GridKey(window, Key.Enter)
        Require(String.Join(",", host.Events) == "begin,validate" && host.Sets == 1 &&
            window.PlatformInput.Editor!!.Text.EndsWith(" rejected"), "Rejected edit lost its draft or closed")
        let invalid = FindSemantics(semantics.Tree!!.Root, "Edit Name")!!
        Require(invalid.Invalid == true && invalid.Relationships.ErrorMessage.Count == 1 &&
            invalid.Relationships.DescribedBy.Count == 1 &&
            FindSemantics(semantics.Tree!!.Root, "Enter a valid value")!!.Live == AccessibilityLive.Polite,
            "Validation error relationships or announcement were absent")
        host.Reject = false
        GridKey(window, Key.Tab)
        Require(host.Context.Edit.ColumnId == "notes" && window.PlatformInput.Editor!!.IsMultiline,
            "Tab did not skip the read-only cell")
        GridKey(window, Key.Enter, KeyModifiers{Shift: true})
        PumpFrames(window, 2)
        Require(window.PlatformInput.Editor!!.Text == "Notes 0\n", "Multiline Shift+Enter did not insert a newline")
        CaptureIssueProof(window, "datagrid-editing-inline")
        GridKey(window, Key.Escape)
        host.Input = host.Input with{BeginEditKeys = []DataGridEditKey{DataGridEditKey{Key: Key.F2, Modifiers: KeyModifiers{Ctrl: true}}},
            CommitEditKey = DataGridEditKey{Key: Key.F3}, ActiveColumnId = "notes"}
        host.Refresh()
        PumpFrames(window, 5)
        host.Events.Clear()
        GridKey(window, Key.F2)
        Require(host.Events.Count == 0, "Configured begin chord ignored modifiers")
        GridKey(window, Key.F2, KeyModifiers{Ctrl: true})
        GridKey(window, Key.Enter)
        GridKey(window, Key.Enter, KeyModifiers{Shift: true})
        Require(window.PlatformInput.Editor!!.Text == "Notes 0\n\n", "Custom commit chord blocked multiline Enter")
        GridKey(window, Key.F3)
        Require(host.Rows[0].Values!!["notes"] == "Notes 0\n\n", "Configured commit chord did not commit")
        host.Input = host.Input with{BeginEditKeys = nil, CommitEditKey = nil, ActiveColumnId = "name"}
        host.Refresh()
        PumpFrames(window, 4)
        GridKey(window, Key.Enter)
        host.Events.Clear()
        window.PlatformInput.SetComposition("preedit", 0, 7)
        GridKey(window, Key.Escape)
        Require(host.Events.Count == 0 && window.PlatformInput.Editor != nil, "Composition Escape ended the edit")
        window.PlatformInput.SetComposition("committed", 0, 9)
        GridKey(window, Key.Enter)
        Require(host.Events.Count == 0 && window.PlatformInput.Editor != nil, "Composition Enter committed the cell")
        window.PlatformInput.CommitText("committed")
        PumpFrames(window, 3)
        GridKey(window, Key.A, KeyModifiers{Ctrl: true})
        window.PlatformInput.Execute(TextCommand{Kind: TextCommandKind.Paste, Text: "replacement"})
        PumpFrames(window, 3)
        Require(window.PlatformInput.Editor!!.Text == "replacement", "Native select-all or paste was intercepted")
        GridKey(window, Key.Z, KeyModifiers{Ctrl: true})
        Require(window.PlatformInput.Editor!!.Text != "replacement", "Native undo was intercepted")
        Require(host.EditorAction.Focus(), "Custom editor action did not focus")
        PumpFrames(window, 4)
        Require(host.Events.Count == 0, "Moving within a custom editor committed")
        Require(host.Context.EditorHandle.Focus(), "Native editor did not regain focus")
        Require(host.After.Focus(), "Outside control did not focus")
        PumpFrames(window, 5)
        Require(String.Join(",", host.Events) == "validate,set,end" &&
            FindSemantics(semantics.Tree!!.Root, "After grid")!!.Focused, "Outside focus did not commit without stealing focus")
        host.Input = host.Input with{ActiveColumnId = "popup"}
        host.Refresh()
        PumpFrames(window, 4)
        host.Root.Focus()
        GridKey(window, Key.Enter)
        WaitVirtual(window, () -> window.PlatformInput.Editor?.Text == host.Context.Edit.Draft)
        Require(host.Context.Edit.ColumnId == "popup" && FindSemantics(semantics.Tree!!.Root, "Cell editor") != nil,
            "Popover editor did not mount")
        host.Events.Clear()
        window.PlatformInput.CommitText(" draft")
        PumpFrames(window, 3)
        Require(window.PlatformInput.Editor?.Text == "Popup 0 draft", "Popup entry did not append at the caret: " + (window.PlatformInput.Editor?.Text ?? "none"))
        let selection = window.PlatformInput.Selection!!
        let editor = host.Context.EditorHandle
        host.Calls = 0
        host.Viewport.JumpTo(500, 20000)
        PumpFrames(window, 8)
        Require(editor.IsMounted, "Scrolling unmounted the popup editor")
        Require(host.Events.Count == 0, "Scrolling emitted edit events: " + String.Join(",", host.Events))
        Require(window.PlatformInput.Editor?.Text == "Popup 0 draft", "Scrolling changed popup focus or text: " + (window.PlatformInput.Editor?.Text ?? "none"))
        Require(window.PlatformInput.Selection?.Active == selection.Active, "Scrolling changed the popup caret")
        var mounted int32
        for row in host.RowBlobs.Values { if row.Handle!!.IsMounted { mounted++ } }
        Require(mounted < 20 && host.RowBlobs["0"].Handle!!.IsMounted, "Edited-row retention realized intervening rows")
        host.Viewport.JumpTo(0, 0)
        PumpFrames(window, 8)
        Require(window.PlatformInput.Editor!!.Text == "Popup 0 draft" && host.Events.Count == 0, "Returning to an edited anchor changed the session")
        GridKey(window, Key.Tab, KeyModifiers{Ctrl: true})
        Require(FindSemantics(semantics.Tree!!.Root, "After grid")!!.Focused, "Popover Ctrl+Tab did not leave its focus scope")
        host.Input = host.Input with{ActiveRowId = "0", ActiveColumnId = "name", RowAt = host.At, RowIndex = host.Index, RowCount = host.Rows.Length}
        host.Refresh()
        PumpFrames(window, 6)
        host.Root.Focus()
        GridKey(window, Key.Enter)
        host.Events.Clear()
        window.PlatformInput.CommitText(" indexed")
        PumpFrames(window, 3)
        host.Calls = 0
        host.Reverse = true
        host.Refresh()
        PumpFrames(window, 8)
        Require(host.Events.Count == 0 && host.Context.EditorHandle.IsMounted && host.Calls < 80,
            "Indexed reorder lost the draft or enumerated the source")
        host.Viewport.JumpTo(400, 0)
        PumpFrames(window, 8)
        Require(host.Context.EditorHandle.IsMounted && host.Events.Count == 0 && host.Calls < 120,
            "Inline row or column virtualization discarded an edit")
        GridKey(window, Key.Enter)
        Require(host.Rows[0].Values!!["name"].EndsWith(" indexed") && host.Context.Edit.SourceIndex == 999,
            "Indexed commit used the display index as identity")
        Require(FindSemantics(semantics.Tree!!.Root, "Editing grid")!!.Focused &&
            host.RowBlobs["0"].Handle!!.IsMounted && host.Viewport.ScrollOffset.Y > 30000,
            "Off-screen commit did not reveal and focus the edited cell")
        host.Input = host.Input with{ActiveRowId = "1", ActiveColumnId = "name"}
        host.Refresh()
        PumpFrames(window, 5)
        host.Root.Focus()
        GridKey(window, Key.Enter)
        host.Events.Clear()
        let changed = Dictionary[string, string](host.Rows[1].Values!!)
        changed["name"] = "external"
        host.Rows = (host.Rows.Clone() as[]DataGridRow)!!
        host.Rows[1] = host.Rows[1] with{Values = changed}
        host.Refresh()
        PumpFrames(window, 5)
        Require(String.Join(",", host.Events) == "cancel,end" && host.CancelReason == DataGridEditCancelReason.SourceChanged,
            "External raw-value change did not cancel once")
        host.Root.Focus()
        GridKey(window, Key.Enter)
        host.Events.Clear()
        host.Input = host.Input with{CanEdit = (row DataGridRow, column DataGridColumn) -> false}
        host.Refresh()
        PumpFrames(window, 5)
        Require(String.Join(",", host.Events) == "cancel,end" && host.CancelReason == DataGridEditCancelReason.Unavailable,
            "Loss of editing eligibility did not cancel once")
        host.Reverse = false
        host.Input = host.Input with{RowAt = nil, RowIndex = nil, RowCount = 0, CanEdit = nil,
            ActiveRowId = "0", ActiveColumnId = "name", Selection = DataGridSelection.Single}
        host.Refresh()
        PumpFrames(window, 5)
        host.Root.Focus()
        host.Events.Clear()
        GridKey(window, Key.Space)
        Require(String.Join(",", host.Events) == "begin", "Single-selection Space did not begin editing")
        let end = window.PlatformInput.Selection!!.Active.Offset
        GridKey(window, Key.Left)
        Require(window.PlatformInput.Selection!!.Active.Offset == end - 1 && host.Input.ActiveColumnId == "name",
            "Grid navigation intercepted an editor arrow")
        GridKey(window, Key.Escape)
        host.Events.Clear()
        host.Root.Focus()
        let invokes = host.Invokes
        GridPointer(window, host.Cells["0:name"])
        GridPointer(window, host.Cells["0:name"])
        Require(String.Join(",", host.Events) == "begin" && host.Invokes == invokes,
            "Double-click did not begin editing or invoked the row")
        GridKey(window, Key.Escape)
        host.Events.Clear()
        host.Input = host.Input with{ColumnOrder = []string{"popup", "name", "notes", "locked"}, PinnedColumns = []string{"name"}}
        host.Refresh()
        PumpFrames(window, 5)
        host.Root.Focus()
        GridKey(window, Key.Enter)
        window.PlatformInput.CommitText(" retained")
        PumpFrames(window, 3)
        host.Input = host.Input with{ColumnOrder = []string{"notes", "popup", "name", "locked"}}
        host.Refresh()
        PumpFrames(window, 4)
        Require(window.PlatformInput.Editor!!.Text.EndsWith(" retained") && host.Context.Edit.ColumnId == "name",
            "Pinned-column reordering lost the edit")
        GridKey(window, Key.Tab)
        Require(host.Context.Edit.ColumnId == "notes", "Edit traversal ignored pinned visual column order")
        GridKey(window, Key.Escape)
        host.Input = host.Input with{ColumnOrder = nil, PinnedColumns = nil, ActiveRowId = "0", ActiveColumnId = "name"}
        host.Refresh()
        PumpFrames(window, 4)
        host.Root.Focus()
        GridKey(window, Key.Enter)
        GridKey(window, Key.Tab, KeyModifiers{Shift: true})
        Require(FindSemantics(semantics.Tree!!.Root, "Before grid")!!.Focused, "Shift+Tab at the first editable cell was trapped")
        host.Input = host.Input with{ActiveRowId = "999", ActiveColumnId = "popup"}
        host.Refresh()
        PumpFrames(window, 5)
        host.Root.Focus()
        GridKey(window, Key.Enter)
        WaitVirtual(window, () -> window.PlatformInput.Editor?.Text == host.Context.Edit.Draft)
        GridKey(window, Key.Tab)
        Require(FindSemantics(semantics.Tree!!.Root, "After grid")!!.Focused, "Tab at the final editable cell was trapped")
        host.Input = host.Input with{ActiveRowId = "0", ActiveColumnId = "popup"}
        host.Refresh()
        PumpFrames(window, 5)
        host.Root.Focus()
        GridKey(window, Key.Enter)
        WaitVirtual(window, () -> window.PlatformInput.Editor?.Text == host.Context.Edit.Draft)
        GridKey(window, Key.Tab)
        Require(host.Context.Edit.RowId == "1" && host.Context.Edit.ColumnId == "name",
            "Forward edit traversal did not wrap to the next row")
        GridKey(window, Key.Tab, KeyModifiers{Shift: true})
        WaitVirtual(window, () -> window.PlatformInput.Editor?.Text == host.Context.Edit.Draft)
        Require(host.Context.Edit.RowId == "0" && host.Context.Edit.ColumnId == "popup",
            "Reverse edit traversal did not wrap to the previous row")
        GridKey(window, Key.Escape)
        host.Viewport.JumpTo(0, 20000)
        PumpFrames(window, 5)
        Require(!host.RowBlobs["0"].Handle!!.IsMounted, "A closed edit retained its row")
        host.Input = host.Input with{ActiveRowId = "0", ActiveColumnId = "name"}
        host.Refresh()
        PumpFrames(window, 4)
        host.Root.Focus()
        host.Events.Clear()
        let setter = host.Input.SetCellValue
        host.Input = host.Input with{SetCellValue = nil}
        host.Refresh()
        PumpFrames(window, 4)
        GridKey(window, Key.Enter)
        Require(host.Events.Count == 0, "Missing setter allowed editing")
        host.Input = host.Input with{SetCellValue = setter}
        host.Rows = (host.Rows.Clone() as[]DataGridRow)!!
        host.Rows[0] = host.Rows[0] with{Editable = false}
        host.Refresh()
        PumpFrames(window, 4)
        GridKey(window, Key.Enter)
        Require(host.Events.Count == 0, "Column default overrode the row veto")
        host.Input = host.Input with{CanEdit = (row DataGridRow, column DataGridColumn) -> true,
            GetCellValue = (row DataGridRow, column DataGridColumn) -> "raw value"}
        host.Refresh()
        PumpFrames(window, 4)
        GridKey(window, Key.Enter)
        Require(host.Context.Edit.OriginalValue == "raw value" && window.PlatformInput.Editor!!.Text == "raw value",
            "CanEdit or the raw getter did not override row and display defaults")
        GridKey(window, Key.Escape)
        host.Rows[0] = host.Rows[0] with{Editable = true}
        host.Input = host.Input with{CanEdit = nil, GetCellValue = nil, ActiveColumnId = "locked"}
        host.Refresh()
        PumpFrames(window, 4)
        GridKey(window, Key.Enter)
        Require(host.Context.Edit.ColumnId == "locked" && window.PlatformInput.Editor != nil,
            "Row editing override did not permit a non-editable column")
        GridKey(window, Key.Escape)
        host.Events.Clear()
        host.Input = host.Input with{ActiveColumnId = "name",
            CanEdit = (row DataGridRow, column DataGridColumn) -> true,
            CreateFullWidthRow = (input DataGridInput, row DataGridRow) -> row.Id == "0" ? (Text{Content: "Full-width row"} as Blob): nil}
        host.Refresh()
        PumpFrames(window, 4)
        GridKey(window, Key.Enter)
        Require(host.Events.Count == 0, "Full-width row accepted an edit")
        host.Input = host.Input with{CreateFullWidthRow = nil, CanEdit = nil}
        host.Refresh()
        PumpFrames(window, 4)
        GridKey(window, Key.Enter)
        host.Events.Clear()
        let originalRows = host.Rows
        host.Rows = []DataGridRow{originalRows[1]}
        host.Refresh()
        PumpFrames(window, 5)
        Require(String.Join(",", host.Events) == "cancel,end" && host.CancelReason == DataGridEditCancelReason.SourceChanged,
            "Row removal did not cancel the session")
        host.Rows = originalRows
        host.Input = host.Input with{ActiveRowId = "0", ActiveColumnId = "popup"}
        host.Refresh()
        PumpFrames(window, 4)
        host.Root.Focus()
        GridKey(window, Key.Enter)
        WaitVirtual(window, () -> window.PlatformInput.Editor?.Text == host.Context.Edit.Draft)
        host.Reject = true
        GridKey(window, Key.Enter)
        let clicks = host.AfterClicks
        GridPointer(window, host.After)
        Require(host.AfterClicks == clicks + 1 && host.Context.EditorHandle.IsMounted,
            "Rejected popup validation blocked the outside control or removed its editor")
        Require(host.Context.EditorHandle.Focus(), "Retained popup editor rejected logical focus")
        PumpFrames(window, 3)
        host.Input = host.Input with{Height = Percent(100)}
        host.Refresh()
        PumpFrames(window, 4)
        for width in []int32{320, 700, 2560} {
            window.UiScale = 1.5F
            window.Width = width
            window.Height = width == 2560 ? 1440: 480
            WaitVirtual(window, () -> window.Width == width && Math.Abs(host.Root.BorderBox.Width - float64(width) / 1.5) < 1)
            host.Viewport.JumpTo(host.Viewport.ScrollRange.X, 0)
            PumpFrames(window, 8)
            CaptureIssueProof(window, "datagrid-editing-150-" + width.ToString())
            let popup = FindSemantics(semantics.Tree!!.Root, "Cell editor")!!.Bounds
            let error = FindSemantics(semantics.Tree!!.Root, "Enter a valid value")!!.Bounds
            Require(popup.X >= 0 && popup.Y >= 0 && popup.X + popup.Width <= float64(width) / 1.5 + 1 &&
                popup.Y + popup.Height <= float64(window.Height) / 1.5 + 1 && error.Width <= popup.Width &&
                host.After.BorderBox.Y + host.After.BorderBox.Height <= float64(window.Height) / 1.5 + 1,
                "Scaled editor or error left the viewport: width=" + width.ToString() +
                " popup=" + popup.ToString() + " error=" + error.ToString() + " after=" + host.After.BorderBox.ToString())
        }
        host.Reject = false
        GridKey(window, Key.Escape)
        host.Input = host.Input with{ActiveColumnId = "notes",
            GetEditPresentation = (row DataGridRow, column DataGridColumn) -> DataGridEditPresentation.Popover}
        host.Refresh()
        PumpFrames(window, 4)
        host.Root.Focus()
        GridKey(window, Key.Enter)
        WaitVirtual(window, () -> window.PlatformInput.Editor?.Text == host.Context.Edit.Draft)
        Require(window.PlatformInput.Editor!!.IsMultiline &&
            FindSemantics(semantics.Tree!!.Root, "Cell editor")!!.Relationships.LabelledBy.Count == 1,
            "Per-cell presentation did not mount a related multiline popup")
        GridKey(window, Key.Down)
        Require(host.Input.ActiveRowId == "0", "Multiline navigation changed the grid row")
        GridKey(window, Key.Escape)
        host.Input = host.Input with{ActiveColumnId = "name", GetEditPresentation = nil,
            BeginEditKeys = []DataGridEditKey{DataGridEditKey{Key: Key.Escape}},
            CommitEditKey = DataGridEditKey{Key: Key.Down}}
        host.Refresh()
        PumpFrames(window, 4)
        host.Root.Focus()
        host.Events.Clear()
        GridKey(window, Key.Escape)
        Require(String.Join(",", host.Events) == "begin", "Escape could not be configured as a begin key")
        GridKey(window, Key.Down)
        Require(String.Join(",", host.Events) == "begin,validate,set,end" && host.Input.ActiveRowId == "0",
            "A navigation commit chord moved the active cell")
        host.Input = host.Input with{BeginEditKeys = nil, CommitEditKey = nil, AutoRowHeight = true, VirtualizeColumns = false,
            CreateCellContent = (input DataGridInput, row DataGridRow, column DataGridColumn) -> Container{Height: 84, Text{Content: "Tall content"}}}
        host.Refresh()
        PumpFrames(window, 8)
        let rowHeight = host.RowBlobs["0"].Handle!!.BorderBox.Height
        GridKey(window, Key.Enter)
        Require(rowHeight >= 84 && Math.Abs(host.RowBlobs["0"].Handle!!.BorderBox.Height - rowHeight) < 1,
            "Inline editing changed the measured row height")
        GridKey(window, Key.Escape)
    })
    Console.WriteLine("PASS DataGrid editing: one-row entry, values, lifecycle, chords, native text, validation, focus, popup, retained rows and indexed source changes")
}
