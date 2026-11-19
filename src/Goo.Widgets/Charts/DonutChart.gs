package Goo.Widgets.Charts

import Goo
import Goo.Widgets
import System

/// A small vector donut chart with optional activation and legend composition.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
/// Root configuration targets the returned outermost layout element.
public data struct DonutChart {
    /// Stable, labeled, nonnegative entries. Nil resolves to an empty series.
    var Series[]?ChartSeries
    /// Diameter in logical pixels. Nil resolves to 160.
    var Size float64?
    /// Ring thickness. Nil resolves to 24; must be greater than zero and no larger than half the diameter.
    var Thickness float64?
    /// Empty track fill. Nil uses the nearest theme.
    var TrackColor Color?
    /// Arbitrary center content, clipped to the square inscribed inside the hole.
    var Center Blob?
    /// Whether to include the default customizable legend.
    var ShowLegend bool
    /// Accessible group name. Nil resolves to Chart.
    var AccessibilityName string?
    /// Optional series activation, exposed to pointer, keyboard, and accessibility input.
    var OnClick Action[string]?
    /// Optional hover identity; nil means the pointer left a segment.
    var OnHover Action[string?]?
    /// Configures the fresh slice before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Name, Accessibility.Role, Focusable, Key, KeyBindings (required entries), OnClick, OnPointerEnter, OnPointerLeave.
    var ConfigureSlice Action[DonutChart, ChartSegment, Shape]?
    /// Receives the resolved chart, segment, and prepared legend label.
    /// Return a fresh element or the supplied default.
    var CreateLabel Func[DonutChart, ChartSegment, Text, Text]?
    /// Configures the fresh legend before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Key.
    var ConfigureLegend Action[DonutChart, Container]?
    /// Configures the fresh root before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Description, Accessibility.Name, Accessibility.Role.
    var ConfigureRoot Action[DonutChart, Container]?

    /// Builds fresh vector slices, including a two-arc full circle and an empty track.
    public func Build() Blob {
        let theme = Theme.Read()
        let resolved = this with{
            Size = Size ?? 160.0,
            Thickness = Thickness ?? 24.0,
            TrackColor = TrackColor ?? theme.BorderColor,
            AccessibilityName = AccessibilityName ?? theme.Text("Chart")
        }
        let size = resolved.Size!!
        let thickness = resolved.Thickness!!
        if !Double.IsFinite(size) || size <= 0.0 || !Double.IsFinite(thickness) ||
            thickness <= 0.0 ||
            thickness > size / 2.0 {
            throw ArgumentOutOfRangeException("Donut size/thickness")
        }
        let segments = ChartParts.Resolve(Series ?? []ChartSeries{}, theme)
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
                Fill: VectorPaint(resolved.TrackColor!!),
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
                Fill: VectorPaint(segment.Series.Color!!),
                FocusStyle: Style{BoxShadow: BoxShadow{Spread: theme.FocusRingWidth, Color: theme.FocusColor}},
                TransitionMs: theme.TransitionMs,
                TransitionEasing: Easing.EaseOut,
                TransitionProperties: theme.InteractionTransitions,
                Cursor: OnClick == nil ? Cursor.Default: Cursor.Pointer
            }
            if let configure = ConfigureSlice {
                let originalAccessibilityName = (shape.Accessibility?.Name ?? "")
                let originalAccessibilityRole = (shape.Accessibility?.Role ?? AccessibilityRole(0))
                let originalFocusable = shape.Focusable
                let originalKey = shape.Key
                let originalOnClick = shape.OnClick
                let originalOnPointerEnter = shape.OnPointerEnter
                let originalOnPointerLeave = shape.OnPointerLeave
                configure.Invoke(resolved, segment, shape)
                if (shape.Accessibility?.Name ?? "") != originalAccessibilityName {
                    throw InvalidOperationException("DonutChart owns Accessibility.Name; set DonutChart.AccessibilityName instead of changing it in ConfigureSlice")
                }
                if (shape.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                    throw InvalidOperationException("DonutChart owns Accessibility.Role; configure DonutChart instead of changing it in ConfigureSlice")
                }
                if shape.Focusable != originalFocusable {
                    throw InvalidOperationException("DonutChart owns Focusable; configure DonutChart instead of changing it in ConfigureSlice")
                }
                if shape.Key != originalKey {
                    throw InvalidOperationException("DonutChart owns Key; configure DonutChart instead of changing it in ConfigureSlice")
                }
                if shape.OnClick != originalOnClick {
                    throw InvalidOperationException("DonutChart owns OnClick; set DonutChart.OnClick instead of changing it in ConfigureSlice")
                }
                if shape.OnPointerEnter != originalOnPointerEnter {
                    throw InvalidOperationException("DonutChart owns OnPointerEnter; configure DonutChart instead of changing it in ConfigureSlice")
                }
                if shape.OnPointerLeave != originalOnPointerLeave {
                    throw InvalidOperationException("DonutChart owns OnPointerLeave; configure DonutChart instead of changing it in ConfigureSlice")
                }
            }
            theme.ApplyInteraction(shape, InteractionFamily.Button)
            shape.Path = path
            shape.Width = size
            shape.Height = size
            shape.Position = PositionType.Absolute
            shape.Left = 0
            shape.Top = 0
            ChartParts.Wire(shape, segment, OnClick, OnHover)
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
        var root = Container{Gap: theme.Spacing * 3.0, AlignItems: AlignItems.Center}
        root.Children.Clear()
        root.Children.Add(plot)
        if ShowLegend {
            var legend = ChartParts.Legend(resolved, segments, CreateLabel, theme)
            if let configure = ConfigureLegend {
                let originalKey = legend.Key
                configure.Invoke(resolved, legend)
                if legend.Key != originalKey {
                    throw InvalidOperationException("DonutChart owns Key; configure DonutChart instead of changing it in ConfigureLegend")
                }
            }
            legend.Key = "legend"
            root.Children.Add(legend)
        }
        if let configure = ConfigureRoot {
            let originalAccessibilityDescription = (root.Accessibility?.Description ?? "")
            let originalAccessibilityName = (root.Accessibility?.Name ?? "")
            let originalAccessibilityRole = (root.Accessibility?.Role ?? AccessibilityRole(0))
            configure.Invoke(resolved, root)
            if (root.Accessibility?.Description ?? "") != originalAccessibilityDescription {
                throw InvalidOperationException("DonutChart owns Accessibility.Description; configure DonutChart instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("DonutChart owns Accessibility.Name; set DonutChart.AccessibilityName instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("DonutChart owns Accessibility.Role; configure DonutChart instead of changing it in ConfigureRoot")
            }
        }
        let rootAccessibility = if let configured = root.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        rootAccessibility.Role = AccessibilityRole.Group
        rootAccessibility.Name = resolved.AccessibilityName!!
        rootAccessibility.Description = ChartParts.Summary(segments, theme)
        root.Accessibility = rootAccessibility
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

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w DonutChart) Blob -> w.Build()
