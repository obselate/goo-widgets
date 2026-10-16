package Goo.Widgets.Data

import Goo
import System
import System.Collections.Generic

/// Creates a virtual collection whose items all have one size. It follows the element's flex direction and
/// wrap: a column or a row without wrap, or a wrapped grid.
/// @param items The complete collection. Rebuild the owning Cell after a value changes.
/// @param itemWidth The finite, positive width of each item.
/// @param itemHeight The finite, positive height of each item.
/// @param itemKey Returns a stable, nonempty key, unique in the collection.
/// @param itemBuilder Builds one item. An item that is equal to its previous value is not built again.
/// @typeparam T The item value type.
/// @returns A Virtual element that mounts only the items near the viewport.
public func VirtualItems[T](
    items IReadOnlyList[T],
    itemWidth float64,
    itemHeight float64,
    itemKey((T) -> string),
    itemBuilder((T) -> Blob)
) Virtual {
    if items == nil {
        throw ArgumentNullException("items")
    }
    let width = virtualItemExtent(itemWidth, "itemWidth")
    let height = virtualItemExtent(itemHeight, "itemHeight")
    if itemKey == nil {
        throw ArgumentNullException("itemKey")
    }
    if itemBuilder == nil {
        throw ArgumentNullException("itemBuilder")
    }
    return Virtual(VirtualItemsSource[T](items, width, height, itemKey, itemBuilder))
}

internal func virtualItemExtent(value float64, name string) float32 {
    if Double.IsNaN(value) || Double.IsInfinity(value) || value <= 0.0 {
        throw ArgumentOutOfRangeException(name)
    }
    let extent = float32(value)
    if Single.IsInfinity(extent) || extent <= 0.0F {
        throw ArgumentOutOfRangeException(name)
    }
    return extent
}

internal class VirtualItemsSource[T] : VirtualSource {
    internal let Items IReadOnlyList[T]
    internal let Width float32
    internal let Height float32
    internal let Key((T) -> string)
    internal let Build((T) -> Blob)

    internal init(items IReadOnlyList[T], width float32, height float32, key((T) -> string), build((T) -> Blob)) {
        Items = items
        Width = width
        Height = height
        Key = key
        Build = build
    }

    public func State(current VirtualState?) VirtualState {
        let state = (current as VirtualItemsState[T]) ?? VirtualItemsState[T]()
        state.Pending = this
        return state
    }
}

internal data struct VirtualItemsWindow {
    internal var Start int32
    internal var Count int32
    internal var Total int32
    internal var ContentW float32
    internal var ContentH float32
    internal var Columns int32
    internal var Rows int32
    internal var ItemW float32
    internal var ItemH float32
    internal var RowGap float32
    internal var ColumnGap float32
    internal var Direction FlexDirection
    internal var Wrap FlexWrap
}

internal class VirtualItemsState[T] : VirtualState {
    private let equality EqualityComparer[T] = EqualityComparer[T].Default
    private var current Dictionary[string, T] = Dictionary[string, T](StringComparer.Ordinal)
    private var next Dictionary[string, T] = Dictionary[string, T](StringComparer.Ordinal)
    private var source VirtualItemsSource[T]?
    private var window VirtualItemsWindow
    private var pendingWindow VirtualItemsWindow
    private var hasWindow bool
    internal var Pending VirtualItemsSource[T]?

    public override func Realize(viewport VirtualViewport, output VirtualOutput) {
        next.Clear()
        guard let input = Pending ?? source else {
            throw InvalidOperationException("VirtualItems source is unavailable")
        }
        let target = Window(viewport, input)
        for offset in 0 ... target.Count {
            let index = target.Start + offset
            let item = input.Items[index]
            let key = input.Key(item)
            var content Blob?
            var unchanged = false
            if !String.IsNullOrEmpty(key) {
                if current.TryGetValue(key, out var previous) {
                    unchanged = equality.Equals(previous, item)
                }
            }
            if !unchanged {
                content = input.Build(item)
                if content == nil {
                    throw InvalidOperationException("VirtualItems item builder returned nil")
                }
            }
            let place = Place(target, index)
            output.Add(
                VirtualItem{
                    Key: key,
                    Index: index,
                    X: float64(place.X),
                    Y: float64(place.Y),
                    Width: float64(target.ItemW),
                    Height: float64(target.ItemH),
                    Content: content,
                }
            )
            next.Add(key, item)
        }
        output.ContentSize = LayoutSize{Width: float64(target.ContentW), Height: float64(target.ContentH)}
        output.ItemCount = target.Total
        pendingWindow = target
    }

    public override func NeedsRealize(viewport VirtualViewport) bool {
        guard let input = source else {
            return false
        }
        return !hasWindow || !Same(window, Window(viewport, input))
    }

    public override func OffsetOf(viewport VirtualViewport, key string) Point? {
        guard let input = source else {
            return nil
        }
        for i in 0 ... input.Items.Count {
            if input.Key(input.Items[i]) == key {
                let place = Place(Window(viewport, input), i)
                return Point{X: float64(place.X), Y: float64(place.Y)}
            }
        }
        return nil
    }

    public override func Commit() {
        let old = current
        current = next
        next = old
        next.Clear()
        if let input = Pending {
            source = input
        }
        Pending = nil
        window = pendingWindow
        hasWindow = true
    }

    public override func Cancel() {
        next.Clear()
        Pending = nil
    }

    public override func Dispose() {
        Cancel()
        current.Clear()
        source = nil
    }

    private func Window(viewport VirtualViewport, input VirtualItemsSource[T]) VirtualItemsWindow {
        let count = input.Items.Count
        let direction = viewport.Direction
        let wrap = viewport.Wrap
        if count <= 0 {
            return VirtualItemsWindow{Direction: direction, Wrap: wrap}
        }
        let width = input.Width
        let height = input.Height
        let size = viewport.Size
        let scroll = viewport.ScrollOffset
        let viewportW = float32(size.Width)
        let viewportH = float32(size.Height)
        let rowGap = float32(viewport.RowGap)
        let columnGap = float32(viewport.ColumnGap)
        let rowFlow = direction == FlexDirection.Row || direction == FlexDirection.RowReverse
        let wrapped = wrap != FlexWrap.NoWrap
        var columns = 1
        var rows = 1
        if wrapped && rowFlow {
            columns = Capacity(viewportW, width, columnGap)
            rows = Ceiling(count, columns)
        } else if wrapped {
            rows = Capacity(viewportH, height, rowGap)
            columns = Ceiling(count, rows)
        } else if rowFlow {
            columns = count
        } else {
            rows = count
        }
        // Lines stack on the cross axis when wrapped, and on the main axis when not.
        let vertical = rowFlow == wrapped
        let lineCount = if !wrapped {
            count
        } else {
            if rowFlow {
                rows
            } else {
                columns
            }
        }
        let lineScroll = if vertical {
            float32(scroll.Y)
        } else {
            float32(scroll.X)
        }
        let lineViewport = if vertical {
            viewportH
        } else {
            viewportW
        }
        let stride = if vertical {
            height + rowGap
        } else {
            width + columnGap
        }
        let reverse = wrap == FlexWrap.WrapReverse ||
            (
            !wrapped
            && (direction == FlexDirection.RowReverse || direction == FlexDirection.ColumnReverse)
        )
        var first = 0
        var end = 0
        if stride > 0.0F {
            first = Math.Clamp(int32(MathF.Floor(lineScroll / stride)) - 1, 0, lineCount)
            end = Math.Max(
                first,
                Math.Clamp(int32(MathF.Ceiling((lineScroll + lineViewport) / stride)) + 1, 0, lineCount)
            )
        }
        var start = if reverse {
            lineCount - end
        } else {
            first
        }
        var visible = end - first
        if wrapped {
            let perLine = if rowFlow {
                columns
            } else {
                rows
            }
            visible = Math.Min(count, (start + visible) * perLine) - start * perLine
            start = start * perLine
        }
        return VirtualItemsWindow{
            Start: start,
            Count: visible,
            Total: count,
            ContentW: Span(Math.Min(count, columns), width, columnGap),
            ContentH: Span(Math.Min(count, rows), height, rowGap),
            Columns: columns,
            Rows: rows,
            ItemW: width,
            ItemH: height,
            RowGap: rowGap,
            ColumnGap: columnGap,
            Direction: direction,
            Wrap: wrap,
        }
    }

    private func Place(window VirtualItemsWindow, index int32) Point32 {
        let rowFlow = window.Direction == FlexDirection.Row || window.Direction == FlexDirection.RowReverse
        let wrapped = window.Wrap != FlexWrap.NoWrap
        var column int32
        var row int32
        if wrapped && rowFlow {
            row = index / window.Columns
            column = index % window.Columns
            if window.Direction == FlexDirection.RowReverse {
                column = window.Columns - 1 - column
            }
            if window.Wrap == FlexWrap.WrapReverse {
                row = window.Rows - 1 - row
            }
        } else if wrapped {
            column = index / window.Rows
            row = index % window.Rows
            if window.Direction == FlexDirection.ColumnReverse {
                row = window.Rows - 1 - row
            }
            if window.Wrap == FlexWrap.WrapReverse {
                column = window.Columns - 1 - column
            }
        } else if rowFlow {
            column = if window.Direction == FlexDirection.RowReverse {
                window.Columns - 1 - index
            } else {
                index
            }
        } else {
            row = if window.Direction == FlexDirection.ColumnReverse {
                window.Rows - 1 - index
            } else {
                index
            }
        }
        return Point32{
            X: float32(column) * (window.ItemW + window.ColumnGap),
            Y: float32(row) * (window.ItemH + window.RowGap),
        }
    }

    private func Capacity(viewport float32, item float32, gap float32) int32 {
        let capacity = int32(MathF.Floor((viewport + gap) / (item + gap)))
        return if capacity > 0 {
            capacity
        } else {
            1
        }
    }

    private func Ceiling(value int32, divisor int32) int32 -> value / divisor +
        (
        if value % divisor == 0 {
            0
        } else {
            1
        }
    )

    private func Span(count int32, item float32, gap float32) float32 ->
    if count <= 0 {
        0.0F
    } else {
        float32(count) * item + float32(count - 1) * gap
    }

    private func Same(left VirtualItemsWindow, right VirtualItemsWindow) bool ->
    left.Start == right.Start && left.Count == right.Count && left.Total == right.Total
    && left.ContentW == right.ContentW && left.ContentH == right.ContentH
    && left.Columns == right.Columns && left.Rows == right.Rows
    && left.ItemW == right.ItemW && left.ItemH == right.ItemH
    && left.RowGap == right.RowGap && left.ColumnGap == right.ColumnGap
    && left.Direction == right.Direction && left.Wrap == right.Wrap
}

internal data struct Point32 {
    internal var X float32
    internal var Y float32
}
