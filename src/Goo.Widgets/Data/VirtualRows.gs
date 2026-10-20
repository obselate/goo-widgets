package Goo.Widgets.Data

import Goo
import Goo.Widgets
import System
import System.Collections.Generic

/// Creates a vertically scrolling virtual list whose rows take the content width and their own measured height.
/// A change that only removes rows from the start and adds rows at the end, such as streaming output, updates
/// the list in place: unchanged rows are compared, and keys are read and rows are built only for the added rows.
/// Set PinToBottom on the result to keep the end in view until the reader scrolls away from it.
/// Positions use float32. Whole-pixel placement is exact up to 16,777,216 px of content and drifts beyond it.
/// @param items Immutable row values. Replace changed values and rebuild the owning Cell after a change.
/// The list can be the same instance on each build.
/// @param estimatedItemHeight A finite, positive estimate used until a row is measured.
/// @param itemKey Returns a stable, nonempty key, unique in the collection. Equal items have equal keys.
/// @param itemBuilder Builds one row. Keep the same builder between builds so unchanged rows are reused.
/// @typeparam T The immutable row value type.
/// @returns A Virtual element with two rows of overscan on each side and bounded measurement work.
public func VirtualRows[T](
    items IReadOnlyList[T],
    estimatedItemHeight float64,
    itemKey((T) -> string),
    itemBuilder((T) -> Blob)
) Virtual {
    if items == nil {
        throw ArgumentNullException("items")
    }
    let estimate = virtualItemExtent(estimatedItemHeight, "estimatedItemHeight")
    if itemKey == nil {
        throw ArgumentNullException("itemKey")
    }
    if itemBuilder == nil {
        throw ArgumentNullException("itemBuilder")
    }
    let theme = Theme.Read()
    return Virtual(VirtualRowsSource[T](items, estimate, itemKey, itemBuilder, nil)){
        OverflowX = Overflow.Hidden,
        ScrollbarY = theme.Scrollbar,
    }
}

internal class VirtualRowsSource[T] : VirtualSource {
    internal let Items IReadOnlyList[T]
    internal let Estimate float32
    internal let Key((T) -> string)
    internal let Build((T) -> Blob)
    internal let Height Func[T, float64]?
    internal var Get Func[int32, T]?
    internal var Index Func[string, int32]?
    internal var Count int32
    internal var Version int64
    internal var StableItems bool
    internal var Identity object?
    internal var AutoHeight bool

    internal init(
        items IReadOnlyList[T],
        estimate float32,
        key((T) -> string),
        build((T) -> Blob),
        height Func[T, float64]?
    ) {
        Items = items
        Estimate = estimate
        Key = key
        Build = build
        Height = height
    }

    public func State(current VirtualState?) VirtualState {
        let state = (current as VirtualRowsState[T]) ?? VirtualRowsState[T]()
        state.Pending = this
        return state
    }
}

internal data struct VirtualRowsWindow {
    internal var Start int32
    internal var Count int32
    internal var ContentH float32
    internal var ViewportH float32
}

internal class VirtualRowsState[T] : VirtualState {
    private let equality EqualityComparer[T] = EqualityComparer[T].Default
    private var current Dictionary[string, T] = Dictionary[string, T](StringComparer.Ordinal)
    private var next Dictionary[string, T] = Dictionary[string, T](StringComparer.Ordinal)
    private let measurements List[VirtualRowMeasurement] = List[VirtualRowMeasurement](128)
    private let droppedRows List[VirtualRow[T]] = List[VirtualRow[T]]()
    private var appendedRows int32
    private var metadata VirtualRowMetadata[T]?
    private var source VirtualRowsSource[T]?
    private var window VirtualRowsWindow
    private var pendingWidth float32
    private var pendingMetadata VirtualRowMetadata[T]?
    private var pendingWindow VirtualRowsWindow
    private var contextVersion int64 = -1
    private var pendingContextVersion int64
    private var anchorKey string = ""
    private var anchorIndex int32
    private var pendingAnchorKey string = ""
    private var pendingAnchorIndex int32
    internal var Pending VirtualRowsSource[T]?

    public override func Realize(viewport VirtualViewport, output VirtualOutput) {
        next.Clear()
        measurements.Clear()
        pendingAnchorKey = ""
        pendingMetadata = nil
        guard let input = Pending ?? source else {
            throw InvalidOperationException("VirtualRows source is unavailable")
        }
        if viewport.Direction != FlexDirection.Column || viewport.Wrap != FlexWrap.NoWrap {
            throw InvalidOperationException("VirtualRows supports only Column direction without wrapping")
        }
        let items = input.Items
        let count = input.Get == nil ? items.Count: input.Count
        let size = viewport.Size
        let offset = viewport.ScrollOffset
        let width = float32(size.Width)
        pendingWidth = width
        let height = float32(size.Height)
        let gap = Gap(viewport)
        let sameBuilder = Pending == nil || Object.Equals(source?.Build, input.Build)
        let old = metadata
        let sameContext = contextVersion == viewport.ContextVersion
        pendingContextVersion = viewport.ContextVersion
        var anchor = ""
        var oldIndex = 0
        var before = 0.0
        if let previous = old {
            if previous.Count > 0 {
                oldIndex = AnchorIndex(previous, float32(offset.Y))
                anchor = if source?.Get != nil {
                    oldIndex == anchorIndex ? anchorKey: ""
                } else {
                    previous.Row(oldIndex).Key
                }
                before = previous.Prefix(oldIndex)
            }
        }
        var data VirtualRowMetadata[T]
        var shifted = false
        var stable = false
        if let previous = source {
            if let previousData = old {
                stable = input.StableItems && Object.ReferenceEquals(previous.Items, items) && Object.Equals(
                    previous.Identity,
                    input.Identity
                ) &&
                    Object.Equals(previous.Height, input.Height) &&
                    previous.Version == input.Version &&
                    previous.AutoHeight == input.AutoHeight &&
                    previousData.Count == count &&
                    previousData.Estimate == input.Estimate &&
                    previousData.Gap == gap
            }
        }
        if stable {
            data = old!!
        } else if input.Get != nil {
            data = VirtualRowMetadata[T](input, width, gap)
        } else if Pending == nil && old != nil {
            data = if old.Width == width && old.Gap == gap {
                old
            } else {
                Snapshot(old.Items(), input, width, gap, sameBuilder)
            }
        } else if let rows = Shift(old, input, width, gap, sameBuilder) {
            data = rows
            shifted = true
        } else {
            data = Snapshot(items, input, width, gap, sameBuilder)
        }
        pendingMetadata = data
        if sameContext && Object.ReferenceEquals(old, data) && data.Width == width && width > 0.0F {
            for i in 0 ... viewport.ChildCount {
                if measurements.Count == 128 {
                    break
                }
                if NeedsMeasurement(viewport.Child(i), data, out var index, out var measured) {
                    measurements.Add(VirtualRowMeasurement{Index: index, Height: measured, Previous: data.Height(index)})
                }
            }
        }
        var scroll = offset.Y
        let atEnd = measurements.Count > 0 &&
            window.ContentH > window.ViewportH &&
            offset.Y >= float64(window.ContentH - window.ViewportH) - 0.01
        if viewport.Pinned || atEnd {
            scroll = Math.Max(0.0, float64(Window(data, 0.0, height, true).ContentH) - float64(height))
        } else if anchor != "" && data.Count > 0 {
            let nextIndex = if data.TryIndex(anchor, out var found) {
                found
            } else {
                if shifted {
                    0
                } else {
                    Math.Min(oldIndex, data.Count - 1)
                }
            }
            scroll = Math.Max(0.0, scroll + Prefix(data, nextIndex, true) - before)
        }
        let target = Window(data, scroll, height, true)
        pendingAnchorIndex = input.Get == nil ? -1: Find(data, Math.Max(0.0, scroll), true)
        if target.Count > 4096 {
            throw InvalidOperationException("VirtualRows viewport exceeds the 4096-row realization budget")
        }
        let focused = FocusedIndex(viewport, data)
        if focused >= 0 && focused < target.Start {
            AddRow(focused, data, input, sameBuilder && sameContext, output)
        }
        for index in target.Start ... target.Start + target.Count {
            AddRow(index, data, input, sameBuilder && sameContext, output)
        }
        if focused >= target.Start + target.Count {
            AddRow(focused, data, input, sameBuilder && sameContext, output)
        }
        output.ContentSize = LayoutSize{Width: float64(width), Height: float64(target.ContentH)}
        output.ItemCount = data.Count
        output.ScrollOffset = Point{X: offset.X, Y: scroll}
        pendingWindow = target
    }

    public override func NeedsRealize(viewport VirtualViewport) bool {
        if contextVersion != viewport.ContextVersion {
            return true
        }
        guard let data = metadata else {
            return false
        }
        let size = viewport.Size
        if data.Width != float32(size.Width) || data.Gap != Gap(viewport) {
            return true
        }
        let target = Window(data, viewport.ScrollOffset.Y, float32(size.Height), false)
        if target.Start != window.Start || target.Count != window.Count
        || target.ContentH != window.ContentH || target.ViewportH != window.ViewportH {
            return true
        }
        let focused = FocusedIndex(viewport, data)
        let expected = target.Count +
            (
            if focused >= 0 && (focused < target.Start || focused >= target.Start + target.Count) {
                1
            } else {
                0
            }
        )
        if current.Count != expected {
            return true
        }
        for i in 0 ... viewport.ChildCount {
            if NeedsMeasurement(viewport.Child(i), data, out var index, out var measured) {
                return true
            }
        }
        return false
    }

    public override func OffsetOf(viewport VirtualViewport, key string) Point? {
        guard let data = metadata else {
            return nil
        }
        if !data.TryIndex(key, out var index) {
            return nil
        }
        return Point{X: 0.0, Y: data.Prefix(index)}
    }

    public override func Commit() {
        guard let data = pendingMetadata else {
            throw InvalidOperationException("VirtualRows state was not prepared")
        }
        for i in 0 ... measurements.Count {
            let value = measurements[i]
            data.Measure(value.Index, value.Height)
        }
        data.Width = pendingWidth
        metadata = data
        if let input = Pending {
            source = input
        }
        window = pendingWindow
        contextVersion = pendingContextVersion
        anchorKey = pendingAnchorKey
        anchorIndex = pendingAnchorIndex
        let previous = current
        current = next
        next = previous
        droppedRows.Clear()
        appendedRows = 0
        Cancel()
    }

    public override func Cancel() {
        if let data = metadata {
            if droppedRows.Count > 0 || appendedRows > 0 {
                metadata = data.Rollback(droppedRows, appendedRows)
            }
        }
        droppedRows.Clear()
        appendedRows = 0
        next.Clear()
        measurements.Clear()
        pendingMetadata = nil
        Pending = nil
    }

    public override func Dispose() {
        Cancel()
        current.Clear()
        metadata = nil
        source = nil
    }

    private func AddRow(
        index int32,
        data VirtualRowMetadata[T],
        input VirtualRowsSource[T],
        sameBuilder bool,
        output VirtualOutput
    ) {
        let row = data.Row(index)
        if index == pendingAnchorIndex {
            pendingAnchorKey = row.Key
        }
        var content Blob?
        var unchanged = false
        if sameBuilder {
            if current.TryGetValue(row.Key, out var previous) {
                unchanged = equality.Equals(previous, row.Item)
            }
        }
        if !unchanged {
            content = input.Build(row.Item)
            if content == nil {
                throw InvalidOperationException("VirtualRows item builder returned nil")
            }
        }
        output.Add(
            VirtualItem{
                Key: row.Key,
                Index: index,
                Y: Prefix(data, index, true),
                Width: float64(pendingWidth),
                Content: content,
            }
        )
        next.Add(row.Key, row.Item)
    }

    private func Snapshot(
        items IReadOnlyList[T],
        input VirtualRowsSource[T],
        width float32,
        gap float32,
        sameBuilder bool
    ) VirtualRowMetadata[T] {
        let estimate = input.Estimate
        let key = input.Key
        let old = if source?.Get == nil {
            metadata
        } else {
            nil
        }
        var unchanged = old != nil &&
            old.Count == items.Count &&
            old.Width == width &&
            old.Gap == gap &&
            old.Estimate == estimate &&
            sameBuilder
        if unchanged {
            let previous = old!!
            for i in 0 ... items.Count {
                let row = previous.Row(i)
                if !equality.Equals(row.Item, items[i]) || row.Key != key(items[i]) {
                    unchanged = false
                    break
                }
            }
            if unchanged {
                return previous
            }
        }
        let rows = [items.Count]VirtualRow[T]
        for i in 0 ... items.Count {
            let item = items[i]
            let id = key(item)
            var row = VirtualRow[T]{
                Item: item,
                Key: id,
                Height: if let height = input.Height {
                    virtualItemExtent(height(item), "RowHeightProvider")
                } else {
                    estimate
                }
            }
            if let previous = old {
                if previous.TryIndex(id, out var index) {
                    let retained = previous.Row(index)
                    if previous.Estimate == estimate &&
                        source?.AutoHeight == input.AutoHeight &&
                        (input.Height == nil || sameBuilder) {
                        row.Height = retained.Height
                    }
                    row.Measured = retained.Measured && previous.Width == width && sameBuilder && equality.Equals(
                        retained.Item,
                        item
                    )
                }
            }
            rows[i] = row
        }
        return VirtualRowMetadata[T](rows, width, gap, estimate)
    }

    private func Shift(
        old VirtualRowMetadata[T]?,
        input VirtualRowsSource[T],
        width float32,
        gap float32,
        sameBuilder bool
    ) VirtualRowMetadata[T]? {
        guard let data = old else {
            return nil
        }
        let items = input.Items
        if input.Height != nil ||
            !sameBuilder ||
            data.Width != width ||
            data.Gap != gap ||
            data.Estimate != input.Estimate ||
            items.Count == 0 {
            return nil
        }
        var dropped = 0
        while dropped < data.Count && !equality.Equals(data.Row(dropped).Item, items[0]) {
            dropped++
        }
        let first = data.Count - dropped
        if first == 0 || first > items.Count {
            return nil
        }
        for i in 1 ... first {
            if !equality.Equals(data.Row(dropped + i).Item, items[i]) {
                return nil
            }
        }
        let added = [items.Count - first]VirtualRow[T]
        let seen = HashSet[string](added.Length, StringComparer.Ordinal)
        for i in 0 ... added.Length {
            let item = items[first + i]
            let id = input.Key(item)
            if String.IsNullOrEmpty(id) || !seen.Add(id) {
                throw InvalidOperationException("VirtualRows keys must be nonempty and unique across the collection")
            }
            if data.Contains(id) {
                if !data.TryIndex(id, out var position) || position >= dropped {
                    throw InvalidOperationException(
                        "VirtualRows keys must be nonempty and unique across the collection"
                    )
                }
            }
            added[i] = VirtualRow[T]{Item: item, Key: id, Height: input.Estimate}
        }
        for i in 0 ... dropped {
            droppedRows.Add(data.Row(i))
        }
        data.DropFirst(dropped)
        for row in added {
            data.Append(row)
        }
        appendedRows += added.Length
        return data
    }

    private func Prefix(data VirtualRowMetadata[T], count int32, pending bool) float64 {
        var result = data.Prefix(count)
        if pending {
            for i in 0 ... measurements.Count {
                let value = measurements[i]
                if value.Index < count {
                    result += float64(value.Height) - float64(value.Previous)
                }
            }
        }
        return result
    }

    private func AnchorIndex(data VirtualRowMetadata[T], scroll float32) int32 {
        // Match the float32 coordinates used by layout and ScrollToItem at exact row boundaries.
        var low = 0
        var high = data.Count - 1
        while low < high {
            let middle = low + (high - low + 1) / 2
            if float32(data.Prefix(middle)) <= scroll {
                low = middle
            } else {
                high = middle - 1
            }
        }
        return low
    }

    private func Find(data VirtualRowMetadata[T], offset float64, pending bool) int32 {
        if !pending || measurements.Count == 0 {
            return data.Find(offset)
        }
        var low = 0
        var high = data.Count
        while low < high {
            let middle = low + (high - low) / 2 + (high - low) % 2
            if Prefix(data, middle, true) <= offset {
                low = middle
            } else {
                high = middle - 1
            }
        }
        return Math.Min(low, Math.Max(0, data.Count - 1))
    }

    private func Window(data VirtualRowMetadata[T], scroll float64, height float32, pending bool) VirtualRowsWindow {
        let count = data.Count
        let start = if count == 0 {
            0
        } else {
            Math.Max(0, Find(data, Math.Max(0.0, scroll), pending) - 2)
        }
        let end = if count == 0 {
            0
        } else {
            let last = Find(data, Math.Max(0.0, scroll + float64(height)), pending)
            last + Math.Min(3, count - last)
        }
        let total = Math.Max(
            0.0,
            Prefix(data, count, pending) - (
                if count > 0 {
                    float64(data.Gap)
                } else {
                    0.0
                }
            )
        )
        if !Double.IsFinite(total) || total > float64(Single.MaxValue) {
            throw InvalidOperationException("VirtualRows content extent exceeds finite layout coordinates")
        }
        return VirtualRowsWindow{
            Start: start,
            Count: Math.Max(0, end - start),
            ContentH: float32(total),
            ViewportH: height
        }
    }

    private func Gap(viewport VirtualViewport) float32 -> Math.Max(0.0F, float32(viewport.RowGap))

    private func NeedsMeasurement(
        child VirtualChild,
        data VirtualRowMetadata[T],
        out index int32,
        out height float32
    ) bool {
        index = -1
        height = 0.0F
        if !child.Measured || !data.TryIndex(child.Key, out index) {
            return false
        }
        height = float32(child.Size.Height)
        if !Single.IsFinite(height) || height < 0.0F {
            throw InvalidOperationException("Virtual row measured an invalid height")
        }
        return Math.Abs(data.Height(index) - height) > 0.01F
    }

    private func FocusedIndex(viewport VirtualViewport, data VirtualRowMetadata[T]) int32 {
        let child = viewport.FocusedChild
        if child < 0 {
            return -1
        }
        return if data.TryIndex(viewport.Child(child).Key, out var index) {
            index
        } else {
            -1
        }
    }
}
