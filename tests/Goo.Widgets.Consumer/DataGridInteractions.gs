package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import Hexa.NET.SDL3
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
    internal var Empty bool
    internal var Loading bool
    internal var Version int64
    private let wideColumns[]DataGridColumn = [12]DataGridColumn
    internal let Cells Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    internal var RowCalls int32
    internal var ActiveIndex int32 = -1
    internal var SelectedIndices[]int32 = []int32{}
    internal var SelectedIds[]string = []string{}
    internal var Root Container?
    internal let FullWidthIds HashSet[string] = HashSet[string]()
    internal var HeaderClicks int32
    internal var Header Button?
    internal var WidthCase int32
    internal let WidthA ElementHandle = ElementHandle()
    internal let WidthB ElementHandle = ElementHandle()
    internal let VerticalThumb ElementHandle = ElementHandle()

    internal init() {
        for index in 0 ... wideColumns.Length {
            wideColumns[index] = DataGridColumn{Id: index.ToString(), Minimum: 150}
        }
        for index in 0 ... Rows.Length {
            let id = index.ToString()
            let values = Dictionary[string, string]()
            values.Add("value", "one two three four five six seven eight")
            Rows[index] = DataGridRow{Id: id, IsGroup: index == 0, Values: values}
        }
    }

    private func At(index int32) DataGridRow {
        RowCalls++
        return DataGridRow{Id: index.ToString(), IsGroup: index == 0}
    }

    private func Index(id string) int32 -> int32.TryParse(id, out var index) ? index: -1

    private func Height(row DataGridRow) float64 -> int32.Parse(row.Id!!) % 2 == 0 ? 32.0: 92.0

    private func Content(input DataGridInput, row DataGridRow, column DataGridColumn) Blob {
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
            OnClick: () -> HeaderClicks++,
            Text{Content: "Group"}
        }
        Header = header
        return header
    }

    public override func Build() Blob -> Cell.Mount[DataGridInput, DataGrid](
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
                    Text{Content: "A much wider value first realized after scrolling", TextWrap: TextWrap.NoWrap}: nil,
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
            Width: WidthCase > 0 ? (WidthCase == 1 ? 800: 700): (Compact ? 120: 220),
            ScrollbarVisibilityY: WidthCase > 0 ? ScrollbarVisibility.Hidden: ScrollbarVisibility.Auto,
            ScrollbarY: VirtualColumns ? Scrollbar{
                Thickness: 10,
                Inset: 0,
                Thumb: Container{Handle: VerticalThumb, BackgroundColor: "#a1a1aa"}
            }: nil,
            CreateHeader: WidthCase == 0 ? nil: (input DataGridInput, column DataGridColumn, content Blob) ->
                Container{Handle: column.Id == "a" ? WidthA: WidthB, Width: Percent(100), content},
            Selection: DataGridSelection.Multiple,
            SelectedIds: SelectedIds,
            OnSelectionIndicesChange: (indices[]int32) -> SelectedIndices = indices,
            OnSelectionChange: (ids[]string) -> {
                SelectedIds = ids
                Rebuild()
                Require(ids.Length == SelectedIndices.Length, "Selection IDs ran before source indices")
                for index in 0 ... ids.Length {
                    Require(
                        SelectedIndices[index] == int32.Parse(ids[index]),
                        "Selection source index did not match its ID"
                    )
                }
            },
            OnActiveRowIndexChange: (index int32) -> ActiveIndex = index,
            CreateCellContent: Wrap ? nil: Content,
            CreateFullWidthRow: FullWidth,
            CreateRoot: (input DataGridInput, root Container) -> {
                Root = root
                return root
            },
            CreateRow: (input DataGridInput, row DataGridRow, root Container) -> {
                RowBlobs[row.Id!!] = root
                return root
            }
        }
    )
}

func DataGridHeightInteractions() {
    let host = DataGridHeightHost()
    let window = Window{Title: "DataGrid mixed heights", Width: 400, Height: 300, Root: host, SmoothScrolling: false}
    Theme.Attach(window, Theme.Default)
    window.Open()
    try {
        PumpFrames(window, 12)
        Require(Math.Abs(host.Viewport.ScrollRange.Y + host.Viewport.ContentBox.Height - 6200.0) < .1, "Mixed heights did not seed the full extent")
        Require(host.FullWidthIds.Count < 12, "Full-width factory ran for off-screen rows")
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
        host.Root!!.OnKeyDown?.Invoke(KeyEvent{Key: Key.Home})
        PumpFrames(window, 4)
        Require(
            host.Root!!.Accessibility!!.Relationships!!.ActiveDescendant == host.RowBlobs["1"].Handle,
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
        PumpFrames(window, 8)
        Require(
            host.RowBlobs["1999990"].Handle!!.IsMounted && Math.Abs(host.Viewport.ScrollOffset.Y - 65999670.0) <= 4.0,
            "Indexed grid exceeded float32 distant offset precision"
        )
        Require(host.Viewport.ScrollToItem("500000"), "Indexed grid rejected a pixel-exact offset")
        PumpFrames(window, 8)
        Require(Math.Abs(host.Viewport.ScrollOffset.Y - 16500000.0) < .1, "Indexed offset below float32 limit was not exact")
        host.Root!!.OnKeyDown?.Invoke(KeyEvent{Key: Key.Home})
        for step in 0 ... 4 {
            host.Root!!.OnKeyDown?.Invoke(KeyEvent{Key: Key.Down})
            PumpFrames(window, 2)
        }
        for step in 0 ... 3 {
            host.Root!!.OnKeyDown?.Invoke(KeyEvent{Key: Key.Down, Modifiers: KeyModifiers{Shift: true}})
            PumpFrames(window, 2)
        }
        host.Root!!.OnKeyDown?.Invoke(KeyEvent{Key: Key.Up, Modifiers: KeyModifiers{Shift: true}})
        PumpFrames(window, 2)
        Require(
            host.SelectedIndices.Length == 3 && Array.IndexOf(host.SelectedIndices, 5) >= 0 &&
                Array.IndexOf(host.SelectedIndices, 6) >= 0 && Array.IndexOf(host.SelectedIndices, 7) >= 0,
            "Shift range did not shrink to rows 5, 6, 7"
        )
        host.Root!!.OnKeyDown?.Invoke(KeyEvent{Key: Key.End})
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
        host.Version++
        host.Rebuild()
        WaitVirtual(window, () -> host.Header?.Handle?.IsMounted == true &&
            Math.Abs(host.Header!!.Handle!!.BorderBox.Width - grownWidth) < .1)
        Require(
            Math.Abs(host.Header!!.Handle!!.BorderBox.Width - grownWidth) < .1,
            "Source width did not resolve before the wide row was realized"
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
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
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
    FindSemantics(semantics.Tree!!.Root, "Name")!!.Bounds.Width,
    FindSemantics(semantics.Tree!!.Root, "State")!!.Bounds.Width,
    FindSemantics(semantics.Tree!!.Root, "Owner")!!.Bounds.Width
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

func DataGridInteractions() {
    RunContracts(DataGridContracts)
    DataGridHeightInteractions()
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
    window.Open()
    try {
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
        Require(host.SortDirection == DataGridSort.None, "Grid sort did not cycle to None")
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
                .ActiveDescendant == FindSemantics(semantics.Tree!!.Root, "Host delta")!!.Id,
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
        SendKey(id, SDLScancode.Home)
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
        SendKey(id, SDLScancode.End)
        PumpFrames(window, 20)
        let grid = FindSemantics(semantics.Tree!!.Root, "Inventory grid")!!
        let last = FindSemantics(semantics.Tree!!.Root, "Host host-1499")!!
        Require(
            grid.Focused && grid.Relationships.ActiveDescendant == last.Id,
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
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine(
        "PASS: DataGrid shared columns, controlled sort/selection, range/disabled input, captured and fitted resize, measured detail, horizontal overflow and 1500-row virtualization"
    )
}
