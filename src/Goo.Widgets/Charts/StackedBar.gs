package Goo.Widgets.Charts

import Goo
import System

/// A horizontal quantitative bar with proportional segments and an empty track.
public data struct StackedBar {
    /// Stable, labeled, nonnegative entries. Nil resolves to an empty series.
    var Series[]?ChartSeries
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Bar height in logical pixels. Nil resolves to 16.
    var Height float64?
    /// Track and segment clipping radius. Nil resolves to 4.
    var BorderRadius float64?
    /// Empty track fill. Nil resolves to #27272a.
    var TrackColor Color?
    /// Whether to include the default customizable legend.
    var ShowLegend bool
    /// Accessible group name. Nil resolves to Chart.
    var AccessibilityName string?
    /// Optional segment activation.
    var OnActivate Action[string]?
    /// Optional hover identity; nil means the pointer left a segment.
    var OnHover Action[string?]?
    /// Customizes each segment. Proportion, identity, handlers, and semantics are reapplied.
    var CreateSegment Func[StackedBar, ChartSegment, Container, Container]?
    /// Customizes each legend label.
    var CreateLabel Func[ChartSegment, Text, Text]?
    /// Customizes the prepared legend.
    var CreateLegend Func[StackedBar, Container, Container]?
    /// Customizes the root. Required children and summary semantics are reapplied.
    var CreateRoot Func[StackedBar, Container, Container]?

    /// Builds a fresh chart tree; normalization avoids overflow even for very large finite quantities.
    public func Build() Blob {
        let resolved = this with{
            Width = Width ?? Length.Percent(100),
            Height = Height ?? 16.0,
            BorderRadius = BorderRadius ?? 4.0,
            TrackColor = TrackColor ?? Color.Parse("#27272a"),
            AccessibilityName = AccessibilityName ?? "Chart"
        }
        if !Double.IsFinite(resolved.Height!!) || resolved.Height!!<= 0.0 || !Double.IsFinite(
            resolved.BorderRadius!!
        ) ||
            resolved.BorderRadius!!< 0.0 {
            throw ArgumentOutOfRangeException("Bar height/radius")
        }
        let segments = ChartParts.Resolve(Series ?? []ChartSeries{})
        let plot = Container{
            Key: "plot",
            Width: Length.Percent(100),
            Height: resolved.Height!!,
            FlexShrink: 0,
            FlexDirection: FlexDirection.Row,
            BackgroundColor: resolved.TrackColor!!,
            BorderRadius: resolved.BorderRadius!!,
            Overflow: Overflow.Hidden
        }
        for segment in segments {
            if segment.Fraction <= 0.0 {
                continue
            }
            var bar = Container{
                BackgroundColor: segment.Series.Color!!,
                Focus: Style{Opacity: .7},
                Cursor: OnActivate == nil ? Cursor.Default: Cursor.Pointer
            }
            if let create = CreateSegment {
                bar = create(resolved, segment, bar)
            }
            bar.Width = Length.Percent(segment.Fraction * 100.0)
            bar.Height = Length.Percent(100)
            bar.MinWidth = 0
            bar.FlexShrink = 0
            ChartParts.Wire(bar, segment, OnActivate, OnHover)
            plot.Children.Add(bar)
        }
        var root = Container{Width: resolved.Width!!, Gap: 12}
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
}
