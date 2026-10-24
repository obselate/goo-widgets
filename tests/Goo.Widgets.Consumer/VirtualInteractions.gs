package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Data
import System
import System.Collections.Generic
import System.Diagnostics

internal data struct VirtualProbeItem {
    var Id int32
    var Revision int32
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

internal class VirtualProbeHost : Cell {
    internal let Items List[VirtualProbeItem] = List[VirtualProbeItem]()
    internal let Builds List[int32] = List[int32]()
    internal let Handles List[ElementHandle] = List[ElementHandle]()
    internal let Handle ElementHandle = ElementHandle{}
    internal var KeyCalls int32
    internal var Pin bool
    internal var Failure int32
    private let kind VirtualProbeKind
    private let key Func[VirtualProbeItem, string]
    private let build Func[VirtualProbeItem, Blob]

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
            20.0
        } else {
            13.0
        }
        return Container{
            Handle: Handles[item.Id],
            Width: width,
            Height: height,
            Text{Content: "row ${item.Id}:${item.Revision}"},
        }
    }

    private func List() Virtual {
        if kind == VirtualProbeKind.Rows {
            return VirtualRows(Items, 20.0, key, build, followEnd: Pin)
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
        list.Width = 100
        list.Height = 60
        let root = Container{}
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
                    host.Handle.ScrollToItem("row-0") && host.Handle.ScrollToItem("row-1")
                    && !host.Handle.ScrollToItem("row-2"),
                    "Canceled streaming changed committed row keys."
                )
                Require(host.Handles[0].IsMounted && host.Handles[1].IsMounted && !host.Handles[2].IsMounted, "Canceled streaming changed mounted children.")
                host.Failure = 0
                host.Rebuild()
                PumpFrames(window, 2)
                Require(
                    !host.Handle.ScrollToItem("row-0") && host.Handle.ScrollToItem("row-1")
                    && host.Handle.ScrollToItem("row-2"),
                    "Streaming did not recover after cancellation."
                )
                Require(!host.Handles[0].IsMounted && host.Handles[1].IsMounted && host.Handles[2].IsMounted, "Streaming retry mounted incorrect children.")
            }
        )
    }
}

func RunVirtual(name string, host VirtualProbeHost, body Action[Window, VirtualProbeSemantics]) {
    let semantics = VirtualProbeSemantics{}
    let window = Window{Title: name, Width: 400, Height: 300, Root: host}
    window.AccessibilityAdapter = semantics
    window.SmoothScrolling = false
    window.Open()
    try {
        PumpFrames(window, 6)
        body(window, semantics)
        Console.WriteLine("PASS: " + name)
    } finally {
        window.RequestClose()
        let closing = Stopwatch.StartNew()
        while window.IsOpen && closing.Elapsed.TotalSeconds < 10.0 {
            PumpFrames(window, 1)
        }
    }
    Require(!window.IsOpen, name + " window did not close.")
}

func WaitVirtual(window Window, ready Func[bool]) {
    let waiting = Stopwatch.StartNew()
    while !ready() && window.IsOpen && waiting.Elapsed.TotalSeconds < 10.0 {
        window.Pump(0.016)
    }
    Require(ready(), "Virtual layout did not publish the expected mount or scroll metrics.")
}

func VirtualInteractions() {
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
            PumpFrames(window, 2)
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
            PumpFrames(window, 2)
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
            PumpFrames(window, 2)
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
            PumpFrames(window, 2)
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
            PumpFrames(window, 2)
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
