package Goo.Widgets.Charts

import Goo
import Goo.Widgets
import System

/// A horizontal quantitative bar with proportional segments and an empty track.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
public data struct StackedBar {
    /// Stable, labeled, nonnegative entries. Nil resolves to an empty series.
    var Series[]?ChartSeries
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Bar height. Nil resolves to 16 logical pixels.
    var Height Length?
    /// Track and segment clipping radius. Nil resolves to 4.
    var BorderRadius float64?
    /// Empty track fill. Nil uses the nearest theme.
    var TrackColor Color?
    /// Whether to include the default customizable legend.
    var ShowLegend bool
    /// Accessible group name. Nil resolves to Chart.
    var AccessibilityName string?
    /// Optional segment activation.
    var OnClick Action[string]?
    /// Optional hover identity; nil means the pointer left a segment.
    var OnHover Action[string?]?
    /// Configures the fresh segment before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Name, Accessibility.Role, Focusable, Key, KeyBindings (required entries), OnClick, OnPointerEnter, OnPointerLeave.
    var ConfigureSegment Action[StackedBar, ChartSegment, Container]?
    /// Receives the resolved chart, segment, and prepared legend label.
    /// Return a fresh element or the supplied default.
    var CreateLabel Func[StackedBar, ChartSegment, Text, Text]?
    /// Configures the fresh legend before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Key.
    var ConfigureLegend Action[StackedBar, Container]?
    /// Configures the fresh root before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Description, Accessibility.Name, Accessibility.Role.
    var ConfigureRoot Action[StackedBar, Container]?

    /// Builds a fresh chart tree; normalization avoids overflow even for very large finite quantities.
    public func Build() Blob {
        let theme = Theme.Read()
        let defaultHeight Length = 16.0
        let resolved = this with{
            Width = Width ?? Percent(100),
            Height = Height ?? defaultHeight,
            BorderRadius = BorderRadius ?? theme.ControlRadius!!,
            TrackColor = TrackColor ?? theme.BorderColor,
            AccessibilityName = AccessibilityName ?? theme.Text("Chart")
        }
        let height = resolved.Height!!
        if height.HasMagnitude && (!Double.IsFinite(height.Magnitude) || height.Magnitude <= 0.0)
            || !Double.IsFinite(resolved.BorderRadius!!) || resolved.BorderRadius!! < 0.0 {
            throw ArgumentOutOfRangeException("Bar height/radius")
        }
        let segments = ChartParts.Resolve(Series ?? []ChartSeries{}, theme)
        let plot = Container{
            Key: "plot",
            Width: Percent(100),
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
                FocusStyle: Style{BasedOn: theme.FocusStyle, OutlineOffset: -theme.FocusRingWidth},
                HoverStyle: Style{BackgroundColor: segment.Series.Color!!},
                ActiveStyle: Style{BackgroundColor: segment.Series.Color!!},
                TransitionMs: theme.TransitionMs,
                TransitionEasing: Easing.EaseOut,
                TransitionProperties: theme.InteractionTransitions,
                Cursor: OnClick == nil ? Cursor.Default: Cursor.Pointer
            }
            ConfigureSegment?.Invoke(resolved, segment, bar)
            theme.ApplyInteraction(bar, InteractionFamily.Button)
            bar.Width = Percent(segment.Fraction * 100.0)
            bar.Height = Percent(100)
            bar.MinWidth = 0
            bar.FlexShrink = 0
            ChartParts.Wire(bar, segment, OnClick, OnHover)
            plot.Children.Add(bar)
        }
        var root = Container{Width: resolved.Width!!, Gap: theme.Spacing * 3.0}
        root.Children.Clear()
        root.Children.Add(plot)
        if ShowLegend {
            var legend = ChartParts.Legend(resolved, segments, CreateLabel, theme)
            ConfigureLegend?.Invoke(resolved, legend)
            legend.Key = "legend"
            root.Children.Add(legend)
        }
        ConfigureRoot?.Invoke(resolved, root)
        let rootAccessibility = if let configured = root.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        rootAccessibility.Role = AccessibilityRole.Group
        rootAccessibility.Name = resolved.AccessibilityName!!
        rootAccessibility.Description = ChartParts.Summary(segments, theme)
        root.Accessibility = rootAccessibility
        return root
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w StackedBar) Blob -> w.Build()
