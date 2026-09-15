package Goo.Widgets.Charts

import Goo
import System

/// A small vector donut chart with optional activation and legend composition.
public data struct DonutChart {
    /// Stable, labeled, nonnegative entries. Nil resolves to an empty series.
    var Series[]?ChartSeries
    /// Diameter in logical pixels. Nil resolves to 160.
    var Size float64?
    /// Ring thickness. Nil resolves to 24; must be greater than zero and no larger than half the diameter.
    var Thickness float64?
    /// Empty track fill. Nil resolves to #27272a.
    var TrackColor Color?
    /// Arbitrary center content, clipped to the square inscribed inside the hole.
    var Center Blob?
    /// Whether to include the default customizable legend.
    var ShowLegend bool
    /// Accessible group name. Nil resolves to Chart.
    var AccessibilityName string?
    /// Optional series activation, exposed to pointer, keyboard, and accessibility input.
    var OnActivate Action[string]?
    /// Optional hover identity; nil means the pointer left a segment.
    var OnHover Action[string?]?
    /// Customizes a slice. Path, position, identity, handlers, and semantics are reapplied.
    var CreateSlice Func[DonutChart, ChartSegment, Shape, Shape]?
    /// Customizes each legend label.
    var CreateLabel Func[ChartSegment, Text, Text]?
    /// Customizes the prepared legend.
    var CreateLegend Func[DonutChart, Container, Container]?
    /// Customizes the root. Required children and summary semantics are reapplied.
    var CreateRoot Func[DonutChart, Container, Container]?

    /// Builds fresh vector slices, including a two-arc full circle and an empty track.
    public func Build() Blob {
        let resolved = this with{
            Size = Size ?? 160.0,
            Thickness = Thickness ?? 24.0,
            TrackColor = TrackColor ?? Color.Parse("#27272a"),
            AccessibilityName = AccessibilityName ?? "Chart"
        }
        let size = resolved.Size!!
        let thickness = resolved.Thickness!!
        if !Double.IsFinite(size) || size <= 0.0 || !Double.IsFinite(thickness) ||
            thickness <= 0.0 ||
            thickness > size / 2.0 {
            throw ArgumentOutOfRangeException("Donut size/thickness")
        }
        let segments = ChartParts.Resolve(Series ?? []ChartSeries{})
        let plot = Container{Key: "plot", Width: size, Height: size, Position: PositionType.Relative, FlexShrink: 0}
        plot.Children.Add(
            Shape{
                Key: "track",
                Width: size,
                Height: size,
                Position: PositionType.Absolute,
                Left: 0,
                Top: 0,
                Path: Ring(-Math.PI / 2.0, 1.0, thickness / size),
                BackgroundColor: resolved.TrackColor!!,
                Accessibility: Accessibility{Hidden: true}
            }
        )
        var angle = -Math.PI / 2.0
        for segment in segments {
            if segment.Fraction <= 0.0 {
                continue
            }
            let path = Ring(angle, segment.Fraction, thickness / size)
            var shape = Shape{
                Path: path,
                BackgroundColor: segment.Series.Color!!,
                Focus: Style{Opacity: .7},
                Cursor: OnActivate == nil ? Cursor.Default: Cursor.Pointer
            }
            if let create = CreateSlice {
                shape = create(resolved, segment, shape)
            }
            shape.Path = path
            shape.Width = size
            shape.Height = size
            shape.Position = PositionType.Absolute
            shape.Left = 0
            shape.Top = 0
            ChartParts.Wire(shape, segment, OnActivate, OnHover)
            // Internal keys occupy a separate namespace from host series IDs.
            shape.Key = "series:" + segment.Series.Id!!
            plot.Children.Add(shape)
            angle += segment.Fraction * Math.PI * 2.0
        }
        if let center = Center {
            let side = Math.Max(0, (size / 2.0 - thickness) * Math.Sqrt(2.0))
            plot.Children.Add(
                Container{
                    Key: "center",
                    Position: PositionType.Absolute,
                    Left: (size - side) / 2.0,
                    Top: (size - side) / 2.0,
                    Width: side,
                    Height: side,
                    AlignItems: AlignItems.Center,
                    JustifyContent: JustifyContent.Center,
                    Overflow: Overflow.Hidden,
                    HitTestSelf: false,
                    center
                }
            )
        }
        var root = Container{Gap: 14, AlignItems: AlignItems.Center}
        if let create = CreateRoot {
            root = create(resolved, root)
        }
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.Group,
            Name: resolved.AccessibilityName!!,
            Description: ChartParts.Summary(segments)
        }
        root.Children.Clear()
        root.Children.Add(plot)
        if ShowLegend {
            var legend = ChartParts.Legend(segments, CreateLabel)
            if let create = CreateLegend {
                legend = create(resolved, legend)
            }
            legend.Key = "legend"
            root.Children.Add(legend)
        }
        return root
    }

    private func Ring(start float64, fraction float64, thickness float64) VectorPath {
        let outer = 50.0
        let inner = 50.0 - thickness * 100.0
        let end = start + fraction * Math.PI * 2.0
        let full = fraction == 1.0
        let path = PathBuilder(0, 0, 100, 100)
        path.MoveTo(50.0 + Math.Cos(start) * outer, 50.0 + Math.Sin(start) * outer)
        if full {
            path.ArcTo(
                outer,
                outer,
                0,
                false,
                true,
                50.0 + Math.Cos(start + Math.PI) * outer,
                50.0 + Math.Sin(start + Math.PI) * outer
            )
        }
        path.ArcTo(
            outer,
            outer,
            0,
            !full && fraction > .5,
            true,
            50.0 + Math.Cos(end) * outer,
            50.0 + Math.Sin(end) * outer
        )
        path.LineTo(50.0 + Math.Cos(end) * inner, 50.0 + Math.Sin(end) * inner)
        if inner > 0.0 {
            if full {
                path.ArcTo(
                    inner,
                    inner,
                    0,
                    false,
                    false,
                    50.0 + Math.Cos(start + Math.PI) * inner,
                    50.0 + Math.Sin(start + Math.PI) * inner
                )
            }
            path.ArcTo(
                inner,
                inner,
                0,
                !full && fraction > .5,
                false,
                50.0 + Math.Cos(start) * inner,
                50.0 + Math.Sin(start) * inner
            )
        }
        path.Close()
        return path.Build()
    }
}
