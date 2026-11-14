package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Data
import System
import System.Collections.Generic
import System.Diagnostics

internal struct VirtualProbeItem : IEquatable[VirtualProbeItem] {
    internal var Id int32
    internal var Revision int32

    shared {
        internal var Comparisons int32
    }

    public func Equals(other VirtualProbeItem) bool {
        Comparisons++
        return Id == other.Id && Revision == other.Revision
    }
}

internal enum VirtualProbeKind {
    List;
    Grid;
    Rows
}

internal class VirtualProbeSemantics : AccessibilityAdapter {
    internal var Tree AccessibilityTree?
    public func Update(tree AccessibilityTree) {
        Tree = tree
    }
}

internal class VirtualMountFailure : Cell {
    public override func Build() Blob -> throw InvalidOperationException("Virtual row mount failed")
}

internal data struct VirtualProbeMessageInput {
    var Header bool
    var Handle ElementHandle
}

internal class VirtualProbeMessage : Cell[VirtualProbeMessageInput] {
    internal var Height float64 = 20.0

    protected override func Build(input VirtualProbeMessageInput) Blob {
        let row = Container{}
        if input.Header {
            row.Children.Add(Container{Key: "history-header", Height: 44, FlexShrink: 0})
        }
        row.Children.Add(Container{Key: "message", Handle: input.Handle, Height: Height, FlexShrink: 0})
        return row
    }
}

internal class VirtualProbeHost : Cell {
    internal var Items List[VirtualProbeItem] = List[VirtualProbeItem]()
    internal let Builds List[int32] = List[int32]()
    internal let Handles List[ElementHandle] = List[ElementHandle]()
    internal let Handle ElementHandle = ElementHandle{}
    internal var KeyCalls int32
    internal var Pin bool
    internal var Failure int32
    internal var Version int64?
    internal var State VirtualRowsState[VirtualProbeItem]?
    internal var FillHeight bool
    internal var Width float64 = 100.0
    internal var VariableHeights bool
    internal var MessageRows bool
    internal var HeaderId int32 = -1
    internal let Messages Dictionary[int32, VirtualProbeMessage] = Dictionary[int32, VirtualProbeMessage]()
    private let kind VirtualProbeKind
    private let key((VirtualProbeItem) -> string)
    private let build((VirtualProbeItem) -> Blob)

    internal init(kind VirtualProbeKind, count int32) {
        this.kind = kind
        for i in 0 ... count {
            Items.Add(VirtualProbeItem{Id: i})
        }
        for i in 0 ... 2000 {
            Handles.Add(ElementHandle{})
        }
        key = Key
        build = BuildItem
        if kind == VirtualProbeKind.Rows {
            Handle.MetricsChanged += metrics -> {
                if !metrics.IsMounted { return }
                let follow = metrics.ScrollOffset.Y >= metrics.ScrollRange.Y - 0.5
                if Pin != follow {
                    Pin = follow
                    Rebuild()
                }
            }
        }
    }

    internal func Mounted() int32 {
        var count int32
        for handle in Handles {
            if handle.IsMounted {
                count++
            }
        }
        return count
    }

    private func Key(item VirtualProbeItem) string {
        KeyCalls++
        return "row-${item.Id}"
    }

    private func BuildItem(item VirtualProbeItem) Blob {
        Builds.Add(item.Id)
        if MessageRows {
            return Cell.Mount[VirtualProbeMessageInput, VirtualProbeMessage](
                "row-${item.Id}",
                VirtualProbeMessageInput{Header: item.Id == HeaderId, Handle: Handles[item.Id]},
                () -> {
                    let row = VirtualProbeMessage()
                    Messages[item.Id] = row
                    return row
                }
            )
        }
        if item.Id == 2 {
            if Failure == 1 {
                throw InvalidOperationException("Virtual row build failed")
            }
            if Failure == 2 {
                return Cell.Mount[VirtualMountFailure]()
            }
        }
        let width float64 = if kind == VirtualProbeKind.Grid {
            17.0
        } else {
            75.0
        }
        let height float64 = if kind == VirtualProbeKind.Rows {
            VariableHeights ? 20.0 + float64(item.Id % 3) * 10.0: 20.0
        } else {
            13.0
        }
        return Container{
            Handle: item.Id < Handles.Count ? Handles[item.Id]: nil,
            Width: width,
            Height: height,
            Text{Content: "row ${item.Id}:${item.Revision}"},
        }
    }

    private func List() Virtual {
        if kind == VirtualProbeKind.Rows {
            return VirtualRows(Items, 20.0, key, build, followEnd: Pin, version: Version, state: State)
        }
        if kind == VirtualProbeKind.Grid {
            let grid = VirtualItems(Items, 20.0, 20.0, key, build)
            grid.FlexDirection = FlexDirection.Row
            grid.FlexWrap = FlexWrap.Wrap
            return grid
        }
        return VirtualItems(Items, 100.0, 20.0, key, build)
    }

    override func Build() Blob {
        let list = List()
        list.Handle = Handle
        list.Width = Width
        list.Height = FillHeight ? Percent(100): 60
        let root = Container{Height: FillHeight ? Percent(100): Length.Auto}
        root.Children.Add(list)
        return root
    }
}

func FindVirtualList(node AccessibilityNode?) AccessibilityNode? {
    guard let node = node else {
        return nil
    }
    if node.SizeOfSet != nil {
        return node
    }
    for child in node.Children {
        if let found = FindVirtualList(child) {
            return found
        }
    }
    return nil
}

func VirtualContracts() {
    let items = List[int32]()
    var rejected int32
    for extent in []float64{1e-100, 0.0, Double.NaN, Double.MaxValue, Double.PositiveInfinity, Double.NegativeInfinity} {
        try {
            VirtualItems(items, extent, 20.0, (item int32) -> item.ToString(), (item int32) -> Container{})
        } catch (error ArgumentOutOfRangeException) {
            if error.ParamName == "itemWidth" {
                rejected++
            }
        }
        try {
            VirtualItems(items, 20.0, extent, (item int32) -> item.ToString(), (item int32) -> Container{})
        } catch (error ArgumentOutOfRangeException) {
            if error.ParamName == "itemHeight" {
                rejected++
            }
        }
        try {
            VirtualRows(items, extent, (item int32) -> item.ToString(), (item int32) -> Container{})
        } catch (error ArgumentOutOfRangeException) {
            if error.ParamName == "estimatedItemHeight" {
                rejected++
            }
        }
    }
    Require(rejected == 18, "Virtual lists accepted an item extent that is not finite and positive in float32.")
    let tiny = float64(Single.Epsilon)
    VirtualItems(items, tiny, tiny, (item int32) -> item.ToString(), (item int32) -> Container{})
    VirtualRows(items, tiny, (item int32) -> item.ToString(), (item int32) -> Container{})
    Console.WriteLine("PASS: virtual list item extent validation")
}

func VirtualRollbackInteractions() {
    for failure in []int32{1, 2} {
        let host = VirtualProbeHost(VirtualProbeKind.Rows, 2)
        host.State = VirtualRowsState[VirtualProbeItem]()
        RunVirtual(
            "VirtualRows rollback ${failure}",
            host,
            (window Window, semantics VirtualProbeSemantics) -> {
                host.Items.RemoveAt(0)
                host.Items.Add(VirtualProbeItem{Id: 2})
                host.Failure = failure
                host.Rebuild()
                var rejected = false
                try {
                    PumpFrames(window, 1)
                } catch (error InvalidOperationException) {
                    rejected = true
                }
                Require(rejected, "The virtual row failure was not raised.")
                Require(
                    host.Handle.ScrollOffsetOf("row-0") != nil && host.Handle.ScrollOffsetOf("row-1") != nil
                    && host.Handle.ScrollOffsetOf("row-2") == nil,
                    "Canceled streaming changed committed row keys."
                )
                Require(host.Handles[0].IsMounted && host.Handles[1].IsMounted && !host.Handles[2].IsMounted, "Canceled streaming changed mounted children.")
                host.Failure = 0
                host.Rebuild()
                PumpFrames(window, 2)
                Require(
                    host.Handle.ScrollOffsetOf("row-0") == nil && host.Handle.ScrollOffsetOf("row-1") != nil
                    && host.Handle.ScrollOffsetOf("row-2") != nil,
                    "Streaming did not recover after cancellation."
                )
                Require(!host.Handles[0].IsMounted && host.Handles[1].IsMounted && host.Handles[2].IsMounted, "Streaming retry mounted incorrect children.")
            }
        )
    }
}

func RunVirtual(name string, host VirtualProbeHost, body Action[Window, VirtualProbeSemantics]) {
    let semantics = VirtualProbeSemantics{}
    let window = Window{Title: name, Size: LayoutSize(400, 300), Root: host}
    window.AccessibilityAdapter = semantics
    window.SmoothScrolling = false
    RunNativeWindow(window, () -> {
        window.Open()
        PumpFrames(window, 6)
        body(window, semantics)
        Console.WriteLine("PASS: " + name)
    })
}

func WaitVirtual(window Window, ready Func[bool], diagnose Func[string]? = nil) {
    let waiting = Stopwatch.StartNew()
    var pumps int32
    while !ready() && window.IsOpen && waiting.Elapsed.TotalSeconds < 10.0 {
        window.Pump(0.016)
        pumps++
    }
    if !ready() {
        Require(false, "Virtual layout did not publish the expected mount or scroll metrics. " +
            "Window=${window.Title} open=${window.IsOpen} size=${window.NativeWidth}x${window.NativeHeight} " +
            "pump-calls=${pumps} elapsed-ms=${waiting.Elapsed.TotalMilliseconds}. " + diagnose?.Invoke())
    }
}


func VirtualScrollApiInteractions() {
    let resized = VirtualProbeHost(VirtualProbeKind.Rows, 1000)
    resized.FillHeight = true
    resized.Pin = true
    RunVirtual("VirtualRows pinned viewport resize", resized, (window, semantics) -> {
        let before = resized.Handle.ScrollOffset.Y
        window.Size = LayoutSize(window.Size.Width, float64(200) / window.UiScale)
        WaitVirtual(window, () -> resized.Handle.BorderBox.Height < 250.0 &&
            Math.Abs(resized.Handle.ScrollOffset.Y - resized.Handle.ScrollRange.Y) < 0.01)
        Require(resized.Handle.ScrollOffset.Y > before, "A smaller viewport lost the pinned end.")
        window.Size = LayoutSize(window.Size.Width, float64(400) / window.UiScale)
        WaitVirtual(window, () -> resized.Handle.BorderBox.Height > 350.0 &&
            Math.Abs(resized.Handle.ScrollOffset.Y - resized.Handle.ScrollRange.Y) < 0.01)
        Console.WriteLine("Pinned resize: viewport=" + resized.Handle.ContentBox.Height.ToString() +
            " offset=" + resized.Handle.ScrollOffset.Y.ToString() + " range=" + resized.Handle.ScrollRange.Y.ToString())
    })

    let measured = VirtualProbeHost(VirtualProbeKind.Rows, 2)
    measured.MessageRows = true
    measured.Pin = true
    RunVirtual("VirtualRows pinned row measurement", measured, (window, semantics) -> {
        let before = measured.Handle.ScrollOffset.Y
        measured.Messages[1].Height = 64.0
        measured.Messages[1].Rebuild()
        WaitVirtual(window, () -> measured.Handle.ScrollOffset.Y == 24.0)
        Require(measured.Handle.ScrollOffset.Y == measured.Handle.ScrollRange.Y, "Row measurement lost the pinned end.")
        Console.WriteLine("Pinned measurement: before=" + before.ToString() +
            " after=" + measured.Handle.ScrollOffset.Y.ToString())
    })

    let header = VirtualProbeHost(VirtualProbeKind.Rows, 100)
    header.MessageRows = true
    header.HeaderId = 0
    RunVirtual("VirtualRows retained message anchor", header, (window, semantics) -> {
        let before = header.Handles[0].BorderBox.Y - header.Handle.ContentBox.Y
        header.HeaderId = 100
        header.Items[0] = VirtualProbeItem{Id: 0, Revision: 1}
        header.Items.Insert(0, VirtualProbeItem{Id: 100})
        header.Rebuild()
        WaitVirtual(window, () -> header.Handles[0].IsMounted &&
            Math.Abs(header.Handles[0].BorderBox.Y - header.Handle.ContentBox.Y - before) < 0.01 &&
            header.Handle.ScrollOffset.Y > 0.0)
        PumpFrames(window, 3)
        let after = header.Handles[0].BorderBox.Y - header.Handle.ContentBox.Y
        Console.WriteLine("Retained message: before=" + before.ToString() + " after=" + after.ToString())
        Require(Math.Abs(after - before) < 0.01, "Moving the history header moved the retained message.")
    })

    for alignment in []ScrollAlignment{ScrollAlignment.Start, ScrollAlignment.Center, ScrollAlignment.End} {
        let aligned = VirtualProbeHost(VirtualProbeKind.Rows, 1000)
        aligned.VariableHeights = true
        RunVirtual("VirtualRows measured alignment " + alignment.ToString(), aligned, (window, semantics) -> {
            Require(aligned.Handle.ScrollToItem("row-500", alignment), "The aligned item was not found.")
            let fraction = alignment == ScrollAlignment.Center ? 0.5: alignment == ScrollAlignment.End ? 1.0: 0.0
            WaitVirtual(window, () -> aligned.Handles[500].IsMounted &&
                Math.Abs(aligned.Handles[500].BorderBox.Y - aligned.Handle.ContentBox.Y -
                    (aligned.Handle.ContentBox.Height - aligned.Handles[500].BorderBox.Height) * fraction) < 0.01,
                () -> "Alignment=${alignment} expected-mounted=True actual-mounted=${aligned.Handles[500].IsMounted} " +
                    "actual-row-y=${aligned.Handles[500].BorderBox.Y - aligned.Handle.ContentBox.Y} " +
                    "expected-row-y=${(aligned.Handle.ContentBox.Height - aligned.Handles[500].BorderBox.Height) * fraction} " +
                    "row-height=${aligned.Handles[500].BorderBox.Height} viewport-height=${aligned.Handle.ContentBox.Height} " +
                    "scroll-offset=${aligned.Handle.ScrollOffset.Y} scroll-range=${aligned.Handle.ScrollRange.Y} " +
                    "settling=${aligned.Handle.IsScrollSettling}")
            PumpFrames(window, 3)
            let target = aligned.Handle.ScrollOffsetOf("row-500", alignment)!!
            Require(!aligned.Handle.IsScrollSettling && Math.Abs(target.Y - aligned.Handle.ScrollOffset.Y) < 0.01,
                "The measured target did not settle.")
            Console.WriteLine("Alignment " + alignment.ToString() + ": row-y=" +
                (aligned.Handles[500].BorderBox.Y - aligned.Handle.ContentBox.Y).ToString() +
                " target=" + target.Y.ToString() + " settling=" + aligned.Handle.IsScrollSettling.ToString())
            Require(aligned.Handle.JumpTo(0.0, aligned.Handle.ScrollOffset.Y + 7.0), "The partial-row scroll failed.")
            PumpFrames(window, 2)
            let saved = aligned.Handle.VisibleAnchor!!
            Require(aligned.Handle.ScrollToItem("row-700"), "The second item was not found.")
            PumpFrames(window, 2)
            Require(aligned.Handle.RestoreAnchor(saved), "The saved anchor was not found.")
            WaitVirtual(window, () -> aligned.Handle.VisibleAnchor?.Key == saved.Key &&
                Math.Abs(aligned.Handle.VisibleAnchor!!.Offset.Y - saved.Offset.Y) < 0.01,
                () -> "Alignment=${alignment} expected-anchor=${saved.Key} expected-offset=${saved.Offset.Y} " +
                    "actual-anchor=${aligned.Handle.VisibleAnchor?.Key} actual-offset=${aligned.Handle.VisibleAnchor?.Offset.Y} " +
                    "scroll-offset=${aligned.Handle.ScrollOffset.Y} settling=${aligned.Handle.IsScrollSettling}")
            PumpFrames(window, 3)
            Require(aligned.Handle.VisibleAnchor?.Key == saved.Key &&
                Math.Abs(aligned.Handle.VisibleAnchor!!.Offset.Y - saved.Offset.Y) < 0.01,
                "The visible anchor did not round-trip.")
            Console.WriteLine("Anchor restore: key=" + saved.Key + " offset=" + saved.Offset.Y.ToString() +
                " restored=" + aligned.Handle.VisibleAnchor!!.Offset.Y.ToString())
            let offset = aligned.Handle.ScrollOffset
            Require(aligned.Handle.ScrollOffsetOf("missing", alignment) == nil &&
                !aligned.Handle.RestoreAnchor(VirtualScrollAnchor{Key: "missing"}),
                "An unknown item exposed a scroll target or anchor.")
            Require(aligned.Handle.ScrollToItem("missing", alignment) && aligned.Handle.IsScrollSettling &&
                aligned.Handle.ScrollOffset == offset, "An unknown item did not retain a pending scroll request.")
            PumpFrames(window, 3)
            Require(!aligned.Handle.IsScrollSettling && aligned.Handle.ScrollOffset == offset,
                "An unknown item scroll request did not expire without moving the viewport.")
        })
    }
}

func VirtualSourceStateInteractions() {
    let firstState = VirtualRowsState[VirtualProbeItem]()
    let secondState = VirtualRowsState[VirtualProbeItem]()
    let host = VirtualProbeHost(VirtualProbeKind.Rows, 1000)
    host.State = firstState
    host.Version = 0
    host.VariableHeights = true
    let first = host.Items
    let second = List[VirtualProbeItem]()
    for index in 1000 ... 2000 { second.Add(VirtualProbeItem{Id: index}) }
    RunVirtual("VirtualRows cached source and anchor", host, (window, semantics) -> {
        Require(host.Handle.ScrollToItem("row-500", ScrollAlignment.Center), "Source A did not scroll.")
        WaitVirtual(window, () -> host.Handles[500].IsMounted && !host.Handle.IsScrollSettling)
        Require(host.Handle.JumpTo(0.0, host.Handle.ScrollOffset.Y + 7.0), "Source A did not scroll within its row.")
        PumpFrames(window, 3)
        let saved = host.Handle.VisibleAnchor!!
        host.State = secondState
        host.Items = second
        host.Rebuild()
        WaitVirtual(window, () -> host.Handles[1000].IsMounted && host.Handle.ScrollOffset.Y == 0.0)
        Require(firstState.Anchor?.Key == saved.Key &&
            Math.Abs(firstState.Anchor!!.Offset.Y - saved.Offset.Y) < 0.01, "Source A did not save its anchor.")
        VirtualProbeItem.Comparisons = 0
        host.Builds.Clear()
        host.State = firstState
        host.Items = first
        host.Rebuild()
        PumpFrames(window, 1)
        Require(host.Handle.VisibleAnchor?.Key == saved.Key &&
            Math.Abs(host.Handle.VisibleAnchor!!.Offset.Y - saved.Offset.Y) < 0.01,
            "Source A did not restore its measured position in one pass.")
        PumpFrames(window, 3)
        Require(VirtualProbeItem.Comparisons == 0,
            "Source A scanned unchanged rows or needed another realization pass.")
        Console.WriteLine("Source A restore: key=" + saved.Key + " offset=" + saved.Offset.Y.ToString() +
            " retained-row-comparisons=" + VirtualProbeItem.Comparisons.ToString())
    })
}

func VirtualInteractions() {
    VirtualScrollApiInteractions()
    VirtualSourceStateInteractions()
    let stable = VirtualProbeHost(VirtualProbeKind.Rows, 100000)
    RunVirtual("VirtualRows versioned source", stable, (window, semantics) -> {
        stable.Items[0] = VirtualProbeItem{Id: 0, Revision: 1}
        stable.Version = 0
        stable.Builds.Clear()
        stable.Rebuild()
        PumpFrames(window, 2)
        Require(stable.Builds.Count == 1, "Enabling a version missed an in-place edit.")
        VirtualProbeItem.Comparisons = 0
        stable.KeyCalls = 0
        stable.Builds.Clear()
        stable.Rebuild()
        PumpFrames(window, 2)
        Require(
            VirtualProbeItem.Comparisons < 100 && stable.KeyCalls == 0 && stable.Builds.Count == 0,
            "An unchanged versioned source scanned or rebuilt its rows."
        )
        stable.Items.Add(VirtualProbeItem{Id: 100000})
        stable.Version = 1
        stable.Rebuild()
        PumpFrames(window, 2)
        Require(stable.KeyCalls == 1 && stable.Handle.ScrollRange.Y == 1999960.0, "Versioned append did not update the row set.")
        stable.Items.Insert(0, VirtualProbeItem{Id: 100001})
        stable.Version = 2
        stable.Rebuild()
        PumpFrames(window, 2)
        Require(stable.Builds.Count == 1 && stable.Builds[0] == 100001 && stable.Handle.ScrollRange.Y == 1999980.0, "Versioned prepend did not update the first row.")
        stable.Builds.Clear()
        stable.Items[0] = VirtualProbeItem{Id: 100001, Revision: 1}
        stable.Version = 3
        stable.Rebuild()
        PumpFrames(window, 2)
        Require(stable.Builds.Count == 1 && stable.Builds[0] == 100001, "Versioned replacement did not rebuild its row.")
        stable.Items = List[VirtualProbeItem](stable.Items)
        stable.Items[0] = VirtualProbeItem{Id: 100001, Revision: 2}
        stable.Builds.Clear()
        stable.Rebuild()
        PumpFrames(window, 2)
        Require(stable.Builds.Count == 1, "A new collection with the same version missed an edit.")
        stable.Version = nil
        stable.Items[0] = VirtualProbeItem{Id: 100001, Revision: 3}
        stable.Builds.Clear()
        stable.Rebuild()
        PumpFrames(window, 2)
        Require(stable.Builds.Count == 1, "Omitting the version did not restore in-place edit detection.")
    })
    VirtualRollbackInteractions()
    let list = VirtualProbeHost(VirtualProbeKind.List, 1000)
    RunVirtual(
        "VirtualItems list",
        list,
        (window Window, semantics VirtualProbeSemantics) -> {
            Require(
                list.Mounted() > 0 && list.Mounted() <= 5 && list.Builds.Count <= 5
                && list.Handle.ScrollRange.Y == 19940.0 && list.Handles[0].IsMounted,
                "The list did not bound its mounted items."
            )
            let root = FindVirtualList(semantics.Tree?.Root)!!
            Require(
                root.SizeOfSet == 1000 && root.Children[0].PositionInSet == 0,
                "The list reported a wrong item set."
            )
            list.Builds.Clear()
            PumpFrames(window, 2)
            Require(list.Builds.Count == 0, "A frame without a change built items.")
            Require(list.Handle.JumpTo(0.0, 10000.0), "The list rejected a jump.")
            WaitVirtual(window, () -> list.Handles[500].IsMounted)
            Require(
                list.Mounted() > 0 && list.Mounted() <= 5 && list.Builds.Count <= 5
                && !list.Handles[0].IsMounted && list.Handles[500].IsMounted
                && FindVirtualList(semantics.Tree?.Root)!!.Children[0].PositionInSet == 499,
                "A scroll did not move the mounted items."
            )
            list.Builds.Clear()
            list.Items[500] = VirtualProbeItem{Id: 500, Revision: 1}
            list.Rebuild()
            PumpFrames(window, 2)
            Require(list.Builds.Count == 1 && list.Builds[0] == 500, "A changed item did not rebuild alone.")
            list.Items.Add(VirtualProbeItem{Id: 1000})
            list.Rebuild()
            PumpFrames(window, 2)
            Require(
                list.Handle.ScrollRange.Y == 19960.0 && FindVirtualList(semantics.Tree?.Root)!!.SizeOfSet == 1001,
                "An added item did not grow the list."
            )
        }
    )

    let grid = VirtualProbeHost(VirtualProbeKind.Grid, 1000)
    RunVirtual(
        "VirtualItems grid",
        grid,
        (window Window, semantics VirtualProbeSemantics) -> {
            Require(
                grid.Mounted() > 0 && grid.Mounted() <= 25 && grid.Builds.Count <= 25
                && grid.Handle.ScrollRange.Y == 3940.0,
                "The grid did not bound its mounted items."
            )
            var mounted = false
            let onMounted Action[ElementMetrics] = metrics -> {
                mounted = metrics.IsMounted
            }
            grid.Handles[500].MetricsChanged += onMounted
            try {
                Require(grid.Handle.JumpTo(0.0, 2000.0), "The grid rejected a jump.")
                grid.Builds.Clear()
                WaitVirtual(window, () -> mounted)
            } finally {
                grid.Handles[500].MetricsChanged -= onMounted
            }
            Require(
                grid.Mounted() > 0 && grid.Mounted() <= 25 && grid.Builds.Count <= 25 && grid.Handles[500].IsMounted,
                "A scroll did not move the mounted grid items."
            )
        }
    )

    let widened = VirtualProbeHost(VirtualProbeKind.Grid, 122)
    RunVirtual("VirtualItems grid wider at end", widened, (window, semantics) -> {
        Require(widened.Handle.ScrollToItem("row-121", ScrollAlignment.End), "The grid rejected the reveal target.")
        WaitVirtual(window, () -> widened.Handles[121].IsMounted && !widened.Handle.IsScrollSettling)
        widened.Width = 120.0
        widened.Rebuild()
        PumpFrames(window, 2)
        Require(widened.Items.Count == 122 && widened.Handles[121].IsMounted &&
            widened.Handle.ScrollOffset.Y == widened.Handle.ScrollRange.Y,
            "Widening the grid lost the last item.")
        let target = widened.Handles[121].BorderBox
        let viewport = widened.Handle.ContentBox
        Require(target.Y >= viewport.Y && target.Y + target.Height <= viewport.Y + viewport.Height,
            "The reveal target is outside the widened viewport.")
    })

    let rows = VirtualProbeHost(VirtualProbeKind.Rows, 1000)
    RunVirtual(
        "VirtualRows measured rows",
        rows,
        (window Window, semantics VirtualProbeSemantics) -> {
            Require(
                rows.Mounted() > 0 && rows.Mounted() <= 8 && rows.Builds.Count <= 8
                && rows.Handle.ScrollRange.Y == 19940.0 && rows.Handles[0].IsMounted,
                "The rows did not bound their mounted items."
            )
            Require(rows.Handle.JumpTo(0.0, 10000.0), "The rows rejected a jump.")
            WaitVirtual(window, () -> rows.Handles[500].IsMounted)
            Require(
                rows.Handles[500].IsMounted && !rows.Handles[0].IsMounted,
                "A scroll did not move the mounted rows."
            )
            rows.Builds.Clear()
            rows.Items[501] = VirtualProbeItem{Id: 501, Revision: 1}
            rows.Rebuild()
            PumpFrames(window, 2)
            Require(rows.Builds.Count == 1 && rows.Builds[0] == 501, "A changed row did not rebuild alone.")
            rows.Items.Add(VirtualProbeItem{Id: 1000})
            rows.Rebuild()
            PumpFrames(window, 2)
            Require(
                rows.Handle.ScrollRange.Y == 19960.0 && rows.Handles[500].IsMounted
                && FindVirtualList(semantics.Tree?.Root)!!.SizeOfSet == 1001,
                "An added row did not grow the list."
            )
        }
    )

    let anchor = VirtualProbeHost(VirtualProbeKind.Rows, 1000)
    RunVirtual(
        "VirtualRows dropped anchor",
        anchor,
        (window Window, semantics VirtualProbeSemantics) -> {
            Require(anchor.Handle.JumpTo(0.0, 10010.0), "The rows rejected a jump.")
            WaitVirtual(window, () -> anchor.Handles[500].IsMounted)
            Require(anchor.Handles[500].IsMounted, "A scroll did not move the mounted rows.")
            // The reader's row and every row before it leave the list, so the oldest remaining row takes its place.
            anchor.Items.RemoveRange(0, 600)
            for id in 1000 ... 1600 {
                anchor.Items.Add(VirtualProbeItem{Id: id})
            }
            anchor.Rebuild()
            PumpFrames(window, 2)
            Require(
                anchor.Handles[600].IsMounted && anchor.Handle.ScrollOffset.Y == 10.0,
                "A dropped anchor row did not show the oldest remaining row."
            )
        }
    )

    let top = VirtualProbeHost(VirtualProbeKind.Rows, 1000)
    RunVirtual(
        "VirtualRows top reorder",
        top,
        (window Window, semantics VirtualProbeSemantics) -> {
            Require(top.Handles[0].IsMounted && top.Handle.ScrollOffset.Y == 0.0, "The rows did not start at the top.")
            top.Items.Reverse()
            top.Rebuild()
            PumpFrames(window, 2)
            Require(
                top.Handles[999].IsMounted && !top.Handles[0].IsMounted && top.Handle.ScrollOffset.Y == 0.0,
                "A reorder at the top moved the list away from the new first row."
            )
        }
    )

    let prepend = VirtualProbeHost(VirtualProbeKind.Rows, 1000)
    RunVirtual(
        "VirtualRows prepend at top",
        prepend,
        (window Window, semantics VirtualProbeSemantics) -> {
            Require(prepend.Handle.ScrollOffset.Y == 0.0 && prepend.Handles[0].IsMounted, "The rows did not start at the top.")
            let before = prepend.Handles[0].BorderBox.Y - prepend.Handle.ContentBox.Y
            CaptureIssueProof(window, "virtualrows-prepend-before")
            for index in 0 ... 50 {
                prepend.Items.Insert(index, VirtualProbeItem{Id: 1000 + index})
            }
            prepend.Rebuild()
            PumpFrames(window, 2)
            let after = prepend.Handles[0].BorderBox.Y - prepend.Handle.ContentBox.Y
            Console.WriteLine(
                "Prepend 50 at zero: key=row-0 mounted=" + prepend.Handles[0].IsMounted.ToString() +
                    " before-y=" + before.ToString() + " after-y=" + after.ToString() +
                    " scroll=" + prepend.Handle.ScrollOffset.Y.ToString()
            )
            CaptureIssueProof(window, "virtualrows-prepend-after")
            Require(
                prepend.Handles[0].IsMounted && Math.Abs(after - before) < .1 &&
                    prepend.Handle.ScrollOffset.Y == 1000.0 && !prepend.Handles[1000].IsMounted,
                "Prepending at zero did not keep the first visible row in place."
            )
        }
    )

    let pin = VirtualProbeHost(VirtualProbeKind.Rows, 1000)
    pin.Pin = true
    RunVirtual(
        "VirtualRows pinned end",
        pin,
        (window Window, semantics VirtualProbeSemantics) -> {
            Require(
                pin.Handle.ScrollOffset.Y == 19940.0 && pin.Handles[999].IsMounted,
                "A pinned list did not open at its end."
            )
            pin.Items.RemoveRange(0, 10)
            for id in 1000 ... 1010 {
                pin.Items.Add(VirtualProbeItem{Id: id})
            }
            pin.Rebuild()
            WaitVirtual(window, () -> pin.Handles[1009].IsMounted)
            Require(
                pin.Handle.ScrollOffset.Y == 19940.0 && pin.Handles[1009].IsMounted,
                "A pinned list did not follow new rows."
            )
            // A reader who scrolls back stays on their rows while the list changes.
            Require(pin.Handle.ScrollTo(0.0, 5000.0), "The rows rejected a scroll.")
            WaitVirtual(window, () -> !pin.Pin && pin.Handle.ScrollOffset.Y == 5000.0)
            Require(pin.Handle.ScrollOffset.Y == 5000.0, "The reader's scroll did not apply.")
            pin.Items.RemoveRange(0, 10)
            for id in 1010 ... 1020 {
                pin.Items.Add(VirtualProbeItem{Id: id})
            }
            pin.Rebuild()
            WaitVirtual(window, () -> pin.Handle.ScrollOffset.Y == 4800.0)
            Require(pin.Handle.ScrollOffset.Y == 4800.0, "A reader who scrolled back did not stay on their rows.")
            // Returning to the end pins the list again.
            Require(pin.Handle.JumpTo(0.0, 19940.0), "The rows rejected a jump.")
            WaitVirtual(window, () -> pin.Pin && pin.Handles[1019].IsMounted)
            pin.Items.RemoveRange(0, 10)
            for id in 1020 ... 1030 {
                pin.Items.Add(VirtualProbeItem{Id: id})
            }
            pin.Rebuild()
            WaitVirtual(window, () -> pin.Handles[1029].IsMounted)
            Require(
                pin.Handle.ScrollOffset.Y == 19940.0 && pin.Handles[1029].IsMounted,
                "A return to the end did not pin the list."
            )
            // A list that empties after the reader scrolled back follows its new rows.
            Require(pin.Handle.JumpTo(0.0, 0.0), "The rows rejected a jump.")
            WaitVirtual(window, () -> !pin.Pin && pin.Handle.ScrollOffset.Y == 0.0)
            pin.Items.Clear()
            pin.Rebuild()
            WaitVirtual(window, () -> pin.Pin && pin.Handle.ScrollRange.Y == 0.0)
            for id in 1030 ... 1100 {
                pin.Items.Add(VirtualProbeItem{Id: id})
            }
            pin.Rebuild()
            WaitVirtual(window, () -> pin.Handles[1099].IsMounted)
            Require(
                pin.Handle.ScrollOffset.Y == 1340.0 && pin.Handles[1099].IsMounted,
                "An emptied list did not follow its new rows."
            )
        }
    )

    let shift = VirtualProbeHost(VirtualProbeKind.Rows, 1000)
    RunVirtual(
        "VirtualRows shift",
        shift,
        (window Window, semantics VirtualProbeSemantics) -> {
            Require(shift.Handle.JumpTo(0.0, 10000.0), "The rows rejected a jump.")
            WaitVirtual(window, () -> shift.Handles[500].IsMounted)
            Require(shift.Handles[500].IsMounted, "A scroll did not move the mounted rows.")
            // Dropping ten entries and adding ten keeps the same rows in view without rebuilding them, and reads
            // keys only for the added entries.
            shift.Builds.Clear()
            shift.KeyCalls = 0
            shift.Items.RemoveRange(0, 10)
            for id in 1000 ... 1010 {
                shift.Items.Add(VirtualProbeItem{Id: id})
            }
            shift.Rebuild()
            PumpFrames(window, 2)
            Require(
                shift.KeyCalls == 10 && shift.Builds.Count == 0 && shift.Handles[500].IsMounted
                && shift.Handle.ScrollRange.Y == 19940.0 && shift.Handle.ScrollOffset.Y == 9800.0,
                "A shift of the rows was not applied in place."
            )
            // A list that keeps no retained row replaces them all.
            shift.Items.Clear()
            for id in 1500 ... 1503 {
                shift.Items.Add(VirtualProbeItem{Id: id})
            }
            shift.Rebuild()
            PumpFrames(window, 2)
            Require(
                shift.Handle.ScrollRange.Y == 0.0 && shift.Handles[1500].IsMounted && !shift.Handles[500].IsMounted,
                "A list without a retained row did not replace its rows."
            )
            // Appending past the slot capacity compacts the rows, and the newest entry is still reachable by key.
            for id in 1503 ... 1600 {
                shift.Items.Add(VirtualProbeItem{Id: id})
                shift.Rebuild()
                PumpFrames(window, 1)
            }
            Require(
                shift.Handle.ScrollRange.Y == 1940.0 && shift.Handle.ScrollToItem("row-1599"),
                "Appended rows are not reachable by key."
            )
            WaitVirtual(window, () -> shift.Handles[1599].IsMounted)
            Require(
                shift.Handles[1599].IsMounted && shift.Handle.ScrollOffset.Y == 1940.0,
                "ScrollToItem did not show the newest row."
            )
            // A repeated key fails the build and leaves the rows usable.
            shift.Items.Add(VirtualProbeItem{Id: 1599})
            shift.Rebuild()
            var rejected = false
            try {
                PumpFrames(window, 1)
            } catch (error InvalidOperationException) {
                rejected = true
            }
            shift.Items.RemoveAt(shift.Items.Count - 1)
            shift.Items.Add(VirtualProbeItem{Id: 1600})
            shift.Rebuild()
            PumpFrames(window, 2)
            Require(rejected && shift.Handle.ScrollRange.Y == 1960.0, "A repeated key did not leave the rows usable.")
            // A list that restores earlier rows rebuilds the rows instead.
            shift.Items.Clear()
            for id in 0 ... 5 {
                shift.Items.Add(VirtualProbeItem{Id: id})
            }
            shift.Rebuild()
            PumpFrames(window, 2)
            Require(
                shift.Handle.ScrollRange.Y == 40.0 && shift.Handles[0].IsMounted,
                "Restored rows did not rebuild the list."
            )
        }
    )
}
