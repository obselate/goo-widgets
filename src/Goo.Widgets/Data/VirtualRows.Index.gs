package Goo.Widgets.Data

import Goo
import System
import System.Collections.Generic

// Prefix sums of row extents over a fixed number of slots, stored as a Fenwick tree.
internal class VirtualRowIndex {
    private var sums[]float64 = []float64{}
    private let capacity int32
    private let uniform float64
    private let deltas Dictionary[int32, float64] = Dictionary[int32, float64]()

    internal init(count int32, extent float64) {
        capacity = count
        uniform = extent
    }

    internal init(extents[]float64) {
        capacity = extents.Length
        var same = true
        let first = extents.Length == 0 ? 0.0: extents[0]
        for extent in extents {
            same = same && extent == first
        }
        uniform = same ? first: 0.0
        if !same {
            sums = [capacity + 1]float64
            for i in 1 ... sums.Length {
                sums[i] += extents[i - 1]
                let parent = i + (i & -i)
                if parent < sums.Length {
                    sums[parent] += sums[i]
                }
            }
        }
    }

    internal prop Capacity int32 {
        get -> capacity
    }

    internal func Prefix(count int32) float64 {
        var index = Math.Clamp(count, 0, Capacity)
        var result = float64(index) * uniform
        if sums.Length == 0 && deltas.Count == 0 {
            return result
        }
        while index > 0 {
            result += if sums.Length > 0 {
                sums[index]
            } else {
                deltas.TryGetValue(index, out var delta) ? delta: 0.0
            }
            index -= index & -index
        }
        return result
    }

    internal func Add(slot int32, delta float64) {
        if delta == 0.0 {
            return
        }
        if sums.Length == 0 {
            var next = slot + 1
            while next <= capacity {
                let previous = deltas.TryGetValue(next, out var value) ? value: 0.0
                deltas[next] = previous + delta
                if next > capacity - (next & -next) {
                    break
                }
                next += next & -next
            }
            return
        }
        var next = slot + 1
        while next < sums.Length {
            sums[next] += delta
            if next > capacity - (next & -next) {
                break
            }
            next += next & -next
        }
    }

    internal func Find(offset float64) int32 {
        if sums.Length == 0 && deltas.Count == 0 {
            return uniform > 0.0 ? int32(
                Math.Min(float64(Capacity), Math.Floor(Math.Max(0.0, offset) / uniform))
            ): Capacity
        }
        var index = 0
        var bit = 1
        while bit <= Capacity / 2 {
            bit *= 2
        }
        var remaining = Math.Max(0.0, offset)
        while bit > 0 {
            let next = index + bit
            if next <= Capacity {
                let delta = if sums.Length > 0 {
                    sums[next]
                } else {
                    deltas.TryGetValue(next, out var value) ? value: 0.0
                }
                let extent = delta + float64(next & -next) * uniform
                if extent <= remaining {
                    index = next
                    remaining -= extent
                }
            }
            bit /= 2
        }
        return index
    }
}

internal data struct VirtualRow[T] {
    internal var Item T
    internal var Key string
    internal var Height float32
    internal var Measured bool
}

// The rows of a vertical virtual list with their keys and measured heights. Rows can be dropped from the
// start and appended at the end in time proportional to the change; the slot buffer is compacted or grown
// when the end reaches its capacity.
internal class VirtualRowMetadata[T] {
    private var rows[]VirtualRow[T] = []VirtualRow[T]{}
    private var slots Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
    private var index VirtualRowIndex
    private var head int32
    private var count int32
    internal var Width float32
    internal let Gap float32
    internal let Estimate float32
    private var get Func[int32, T]?
    private var key Func[T, string]?
    private var find Func[string, int32]?
    private let measured Dictionary[int32, float32] = Dictionary[int32, float32]()

    internal init(source VirtualRowsSource[T], width float32, gap float32) {
        Width = width
        Gap = gap
        Estimate = source.Estimate
        count = source.Count
        get = source.Get
        key = source.Key
        find = source.Index
        index = VirtualRowIndex(count, float64(Estimate) + float64(gap))
    }

    // Throws when keys are empty or repeated.
    internal init(values[]VirtualRow[T], width float32, gap float32, estimate float32) {
        Width = width
        Gap = gap
        Estimate = estimate
        rows = values
        count = values.Length
        slots = Dictionary[string, int32](values.Length, StringComparer.Ordinal)
        for i in 0 ... values.Length {
            let key = values[i].Key
            if String.IsNullOrEmpty(key) || !slots.TryAdd(key, i) {
                throw InvalidOperationException("VirtualRows keys must be nonempty and unique across the collection")
            }
        }
        index = VirtualRowIndex(Extents(values, values.Length))
    }

    internal prop Count int32 {
        get -> count
    }

    internal func Row(position int32) VirtualRow[T] {
        if let itemAt = get {
            let item = itemAt(position)
            let known = measured.TryGetValue(position, out var height)
            return VirtualRow[T]{Item: item, Key: key!!(item), Height: known ? height: Estimate, Measured: known}
        }
        return rows[head + position]
    }

    internal func TryIndex(key string, out position int32) bool {
        if let lookup = find {
            position = lookup(key)
            return position >= 0 && position < count
        }
        if slots.TryGetValue(key, out var slot) {
            position = slot - head
            return true
        }
        position = -1
        return false
    }

    internal func Contains(key string) bool -> slots.ContainsKey(key)

    // The row values in order.
    internal func Items()[]T {
        let result = [count]T
        for i in 0 ... count {
            result[i] = rows[head + i].Item
        }
        return result
    }

    // The total extent of the first `rowCount` rows, including the gap after each.
    internal func Prefix(rowCount int32) float64 -> index.Prefix(head + Math.Clamp(rowCount, 0, count)) - index.Prefix(
        head
    )

    // The row containing `offset`, clamped to the rows.
    internal func Find(offset float64) int32 {
        if count == 0 {
            return 0
        }
        let slot = index.Find(Math.Max(0.0, offset) + index.Prefix(head))
        return Math.Clamp(slot - head, 0, count - 1)
    }

    internal func Measure(position int32, height float32) {
        if get != nil {
            let previous = measured.TryGetValue(position, out var known) ? known: Estimate
            index.Add(position, float64(height) - float64(previous))
            measured[position] = height
            return
        }
        let slot = head + position
        var row = rows[slot]
        index.Add(slot, float64(height) - float64(row.Height))
        row.Height = height
        row.Measured = true
        rows[slot] = row
    }

    internal func Rollback(dropped List[VirtualRow[T]], appended int32) VirtualRowMetadata[T] {
        let retained = count - appended
        let values = [dropped.Count + retained]VirtualRow[T]
        dropped.CopyTo(values)
        Array.Copy(rows, head, values, dropped.Count, retained)
        return VirtualRowMetadata[T](values, Width, Gap, Estimate)
    }

    internal func DropFirst(rowCount int32) {
        let dropped = Math.Clamp(rowCount, 0, count)
        for i in 0 ... dropped {
            slots.Remove(rows[head + i].Key)
            rows[head + i] = VirtualRow[T]{}
        }
        head += dropped
        count -= dropped
        if count == 0 {
            Compact(rows.Length)
        }
    }

    // Appends a row whose key the caller has checked is new.
    internal func Append(row VirtualRow[T]) {
        if head + count == rows.Length {
            Compact(
                if count * 2 <= rows.Length {
                    rows.Length
                } else {
                    Math.Max(16, rows.Length * 2)
                }
            )
        }
        let slot = head + count
        rows[slot] = row
        slots.Add(row.Key, slot)
        index.Add(slot, float64(row.Height) + float64(Gap))
        count++
    }

    private func Compact(capacity int32) {
        let next = [capacity]VirtualRow[T]
        Array.Copy(rows, head, next, 0, count)
        rows = next
        head = 0
        slots.Clear()
        for i in 0 ... count {
            slots.Add(rows[i].Key, i)
        }
        index = VirtualRowIndex(Extents(rows, count))
    }

    private func Extents(values[]VirtualRow[T], used int32)[]float64 {
        let extents = [values.Length]float64
        for i in 0 ... used {
            extents[i] = float64(values[i].Height) + float64(Gap)
        }
        return extents
    }
}

internal data struct VirtualRowMeasurement {
    internal var Index int32
    internal var Height float32
}
