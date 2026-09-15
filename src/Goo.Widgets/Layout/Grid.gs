package Goo.Widgets

import Goo
import System
import System.Collections.Generic

/// The sizing rule for a grid track.
public enum GridUnit {
    Auto;
    Fixed;
    Fraction
}

/// One immutable row or column definition. Fraction weights share space above their minima.
public data struct GridTrack {
    /// Sizing rule. The default track fits its content.
    var Unit GridUnit
    /// Fixed size or positive fractional weight.
    var Value float64
    /// Minimum size. Defaults to zero.
    var Minimum float64
    /// Maximum size. Nil means unbounded.
    var Maximum float64?
    shared {
        /// Fits measured content within optional bounds.
        public func Auto(minimum float64 = 0.0, maximum float64? = nil) GridTrack -> GridTrack{
            Minimum: minimum,
            Maximum: maximum
        }

        /// Reserves a fixed logical size.
        public func Fixed(size float64) GridTrack -> GridTrack{Unit: GridUnit.Fixed, Value: size}

        /// Shares remaining space with other fractional tracks.
        public func Fraction(
            weight float64 = 1.0,
            minimum float64 = 0.0,
            maximum float64? = nil
        ) GridTrack -> GridTrack{Unit: GridUnit.Fraction, Value: weight, Minimum: minimum, Maximum: maximum}
    }
}

/// A stable grid slot containing arbitrary content. The slot fills its tracks; its contents use normal Goo alignment.
public data struct GridItem {
    /// Required unique identity, retained across placement changes.
    var Id string?
    /// Zero-based row.
    var Row int32
    /// Zero-based column.
    var Column int32
    /// Number of rows occupied. Nil resolves to one.
    var RowSpan int32?
    /// Number of columns occupied. Nil resolves to one.
    var ColumnSpan int32?
    /// Arbitrary child content.
    var Content Blob?
}

/// A measured two-dimensional panel. All slots share one set of tracks, including spanning headers and form rows.
public data struct Grid {
    /// Column definitions. Empty resolves to one auto column.
    var Columns[]GridTrack = []GridTrack{}
    /// Row definitions. Empty resolves to one auto row.
    var Rows[]GridTrack = []GridTrack{}
    /// Explicitly placed, uniquely keyed slots; overlap is allowed in declaration paint order.
    var Items[]GridItem = []GridItem{}
    /// Horizontal gap in logical pixels.
    var ColumnGap float64
    /// Vertical gap in logical pixels.
    var RowGap float64
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Root height. Nil resolves to intrinsic height.
    var Height Length?
    /// Customizes the root. The measured layout and keyed slot children are reapplied.
    var CreateRoot Func[Grid, Container, Container]?

    /// Builds a fresh immutable layout policy and a normal retained subtree.
    public func Build() Blob {
        let columns = Columns
        let rows = Rows
        let resolved = this with{
            Columns = columns.Length == 0 ? []GridTrack{GridTrack.Auto()}: columns,
            Rows = rows.Length == 0 ? []GridTrack{GridTrack.Auto()}: rows,
            Width = Width ?? Length.Percent(100),
            Height = Height ?? Length.Auto,
        }
        let policy = GridPolicy(resolved)
        var root = Container{Width: resolved.Width!!, Height: resolved.Height!!, MinWidth: 0, MinHeight: 0}
        if let create = CreateRoot {
            root = create(resolved, root)
        }
        root.Layout = policy
        root.Children.Clear()
        for item in resolved.Items {
            let slot = Container{Key: item.Id!!, MinWidth: 0, MinHeight: 0}
            if let content = item.Content {
                slot.Children.Add(content)
            }
            root.Children.Add(slot)
        }
        return root
    }
}

// The policy owns defensive copies: later host edits to its input arrays cannot change an in-flight layout.
internal class GridPolicy : LayoutAlgorithm {
    private let columns[]GridTrack
    private let rows[]GridTrack
    private let items[]GridItem
    private let columnGap float64
    private let rowGap float64
    private let columnOrder[]int32
    private let rowOrder[]int32

    internal init(input Grid) {
        columns = CopyTracks(input.Columns)
        rows = CopyTracks(input.Rows)
        items = [input.Items.Length]GridItem
        Array.Copy(input.Items, items, items.Length)
        columnGap = input.ColumnGap
        rowGap = input.RowGap
        if !Double.IsFinite(columnGap) || columnGap < 0.0 || !Double.IsFinite(rowGap) || rowGap < 0.0 {
            throw ArgumentOutOfRangeException("Grid gaps")
        }
        let keys = HashSet[string](StringComparer.Ordinal)
        for item in items {
            if String.IsNullOrEmpty(item.Id) || !keys.Add(item.Id!!) {
                throw ArgumentException("Grid items require unique, nonempty IDs.")
            }
            let rs = item.RowSpan ?? 1
            let cs = item.ColumnSpan ?? 1
            if rs < 1 || cs < 1 || item.Row < 0 || item.Column < 0 || rs > rows.Length || cs > columns.Length
            || item.Row > rows.Length - rs || item.Column > columns.Length - cs {
                throw ArgumentOutOfRangeException("Grid item placement")
            }
        }
        columnOrder = Order(true)
        rowOrder = Order(false)
    }

    private func Order(horizontal bool)[]int32 {
        let order = List[int32]()
        for index in 0 ... items.Length {
            order.Add(index)
        }
        order.Sort(
            (a int32, b int32) -> {
                let first = horizontal ? items[a].ColumnSpan ?? 1: items[a].RowSpan ?? 1
                let second = horizontal ? items[b].ColumnSpan ?? 1: items[b].RowSpan ?? 1
                return first == second ? a.CompareTo(b): first.CompareTo(second)
            }
        )
        return order.ToArray()
    }

    private func CopyTracks(source[]GridTrack)[]GridTrack {
        let result = [source.Length]GridTrack
        Array.Copy(source, result, source.Length)
        var weightScale = 0.0
        for track in result {
            let maximum = track.Maximum ?? Double.PositiveInfinity
            if !Double.IsFinite(track.Minimum) || track.Minimum < 0.0 || Double.IsNaN(maximum) ||
                maximum < track.Minimum
            || !Double.IsFinite(track.Value) ||
                track.Value < 0.0 ||
                (track.Unit == GridUnit.Fraction && track.Value == 0.0)
            || (track.Unit != GridUnit.Auto && track.Unit != GridUnit.Fixed && track.Unit != GridUnit.Fraction) {
                throw ArgumentOutOfRangeException("Grid track")
            }
            if track.Unit == GridUnit.Fraction {
                weightScale = Math.Max(weightScale, track.Value)
            }
        }
        if weightScale > 0.0 {
            for index in 0 ... result.Length {
                if result[index].Unit == GridUnit.Fraction {
                    result[index] = result[index]with{Value = result[index].Value / weightScale}
                }
            }
        }
        return result
    }

    public func Measure(context LayoutContext, available LayoutSize) LayoutSize {
        let widths = MeasureColumns(context, available.Width)
        let heights = MeasureRows(context, widths, available.Height)
        return LayoutSize{
            Width: Math.Min(available.Width, Total(widths, columnGap)),
            Height: Math.Min(available.Height, Total(heights, rowGap))
        }
    }

    public func Arrange(context LayoutContext, finalSize LayoutSize) {
        let widths = MeasureColumns(context, finalSize.Width)
        let heights = MeasureRows(context, widths, finalSize.Height)
        for index in 0 ... items.Length {
            let item = items[index]
            context.ArrangeChild(
                index,
                ElementRect{
                    X: Offset(widths, item.Column, columnGap),
                    Y: Offset(heights, item.Row, rowGap),
                    Width: Span(widths, item.Column, item.ColumnSpan ?? 1, columnGap),
                    Height: Span(heights, item.Row, item.RowSpan ?? 1, rowGap),
                }
            )
        }
    }

    private func MeasureColumns(context LayoutContext, available float64)[]float64 {
        let sizes = Initial(columns)
        // Short spans establish intrinsic sizes before larger spans distribute a remaining deficit.
        for index in columnOrder {
            let item = items[index]
            if Double.IsFinite(available) && HasFraction(columns, item.Column, item.ColumnSpan ?? 1) {
                continue
            }
            let measured = context.MeasureChild(
                index,
                LayoutSize{Width: Double.PositiveInfinity, Height: Double.PositiveInfinity}
            )
            Grow(
                columns,
                sizes,
                item.Column,
                item.ColumnSpan ?? 1,
                measured.Width,
                columnGap,
                !Double.IsFinite(available)
            )
        }
        Distribute(columns, sizes, available, columnGap)
        return sizes
    }

    private func MeasureRows(context LayoutContext, widths[]float64, available float64)[]float64 {
        let sizes = Initial(rows)
        for index in rowOrder {
            let item = items[index]
            if Double.IsFinite(available) && HasFraction(rows, item.Row, item.RowSpan ?? 1) {
                continue
            }
            let measured = context.MeasureChild(
                index,
                LayoutSize{
                    Width: Span(widths, item.Column, item.ColumnSpan ?? 1, columnGap),
                    Height: Double.PositiveInfinity
                }
            )
            Grow(rows, sizes, item.Row, item.RowSpan ?? 1, measured.Height, rowGap, !Double.IsFinite(available))
        }
        Distribute(rows, sizes, available, rowGap)
        return sizes
    }

    private func Initial(tracks[]GridTrack)[]float64 {
        let sizes = [tracks.Length]float64
        for index in 0 ... tracks.Length {
            let track = tracks[index]
            sizes[index] = track.Unit == GridUnit.Fixed ? Math.Clamp(
                track.Value,
                track.Minimum,
                track.Maximum ?? Double.PositiveInfinity
            ): track.Minimum
        }
        return sizes
    }

    private func HasFraction(tracks[]GridTrack, start int32, count int32) bool {
        for index in start ... start + count {
            if tracks[index].Unit == GridUnit.Fraction {
                return true
            }
        }
        return false
    }

    private func Grow(
        tracks[]GridTrack,
        sizes[]float64,
        start int32,
        count int32,
        desired float64,
        gap float64,
        intrinsicFractions bool
    ) {
        var remaining = desired - Span(sizes, start, count, gap)
        for pass in 0 ... count {
            if remaining <= .001 {
                break
            }
            var eligible int32
            for index in start ... start + count {
                if (
                    tracks[index].Unit == GridUnit.Auto ||
                        (intrinsicFractions && tracks[index].Unit == GridUnit.Fraction)
                )
                && sizes[index] < (tracks[index].Maximum ?? Double.PositiveInfinity) {
                    eligible++
                }
            }
            if eligible == 0 {
                break
            }
            let share = remaining / float64(eligible)
            var added = 0.0
            for index in start ... start + count {
                if tracks[index].Unit != GridUnit.Auto &&
                    !(intrinsicFractions && tracks[index].Unit == GridUnit.Fraction) {
                    continue
                }
                let delta = Math.Min(share, (tracks[index].Maximum ?? Double.PositiveInfinity) - sizes[index])
                sizes[index] += delta
                added += delta
            }
            remaining -= added
        }
    }

    private func Distribute(tracks[]GridTrack, sizes[]float64, available float64, gap float64) {
        if !Double.IsFinite(available) {
            return
        }
        var remaining = available - Total(sizes, gap)
        for pass in 0 ... tracks.Length {
            if remaining <= .001 {
                break
            }
            var weight = 0.0
            for index in 0 ... tracks.Length {
                if tracks[index].Unit == GridUnit.Fraction &&
                    sizes[index] < (tracks[index].Maximum ?? Double.PositiveInfinity) {
                    weight += tracks[index].Value
                }
            }
            if weight <= 0.0 {
                break
            }
            var added = 0.0
            for index in 0 ... tracks.Length {
                if tracks[index].Unit != GridUnit.Fraction {
                    continue
                }
                let delta = Math.Min(
                    remaining * tracks[index].Value / weight,
                    (tracks[index].Maximum ?? Double.PositiveInfinity) - sizes[index]
                )
                sizes[index] += delta
                added += delta
            }
            remaining -= added
        }
    }

    private func Total(sizes[]float64, gap float64) float64 -> Span(sizes, 0, sizes.Length, gap)

    private func Span(sizes[]float64, start int32, count int32, gap float64) float64 {
        var result = float64(Math.Max(0, count - 1)) * gap
        for index in start ... start + count {
            result += sizes[index]
        }
        return result
    }

    private func Offset(sizes[]float64, count int32, gap float64) float64 {
        var result = float64(count) * gap
        for index in 0 ... count {
            result += sizes[index]
        }
        return result
    }
}
