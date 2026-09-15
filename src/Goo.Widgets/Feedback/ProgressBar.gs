package Goo.Widgets

import Goo

/// A horizontal progress bar with customizable track, fill, and root composition.
/// Factories receive resolved props and may replace the final Goo primitives.
public data struct ProgressBar {
    /// Normalized progress value. Clamped to 0..1 upon build.
    var Value float64
    /// Track background color. Nil resolves to #27272a.
    var TrackColor Color?
    /// Fill indicator color. Nil resolves to #fafafa.
    var FillColor Color?
    /// Border color. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Progress bar width. Zero resolves to 160.
    var Width float64
    /// Progress bar height. Zero resolves to 8.
    var Height float64
    /// Border width. Zero leaves the border unpainted.
    var BorderWidth float64
    /// Corner radius. Zero resolves to half the resolved height.
    var BorderRadius float64
    /// Transition duration in milliseconds. Nil resolves to 150.0; explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Accessible name.
    var AccessibilityName string?
    /// Accessible value text representation (e.g. "45%").
    var AccessibilityValueText string?
    /// Root opacity. Nil resolves to 1.
    var Opacity float64?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Creates the final fill Container from resolved props. Nil uses ProgressBar's composition.
    var CreateFill Func[ProgressBar, Container]?
    /// Creates the final root Container from resolved props and the fill Container. Nil uses ProgressBar's composition.
    var CreateRoot Func[ProgressBar, Container, Container]?

    /// Builds a fresh Goo tree, resolving props before invoking primitive factories.
    public func Build() Blob {
        let createFill = CreateFill
        let createRoot = CreateRoot
        var clampedValue = Value
        if Double.IsNaN(clampedValue) || clampedValue < 0.0 {
            clampedValue = 0.0
        } else if clampedValue > 1.0 {
            clampedValue = 1.0
        }

        let trackColor = TrackColor ?? Color.Parse("#27272a")
        let fillColor = FillColor ?? Color.Parse("#fafafa")
        let borderColor = BorderColor ?? Color.Parse("#3f3f46")
        let width = if Width == 0.0 {
            160.0
        } else {
            Width
        }
        let height = if Height == 0.0 {
            8.0
        } else {
            Height
        }
        let borderRadius = if BorderRadius == 0.0 {
            height / 2.0
        } else {
            BorderRadius
        }

        let resolved = this with{
            Value = clampedValue,
            TrackColor = trackColor,
            FillColor = fillColor,
            BorderColor = borderColor,
            Width = width,
            Height = height,
            BorderRadius = borderRadius,
            TransitionMs = TransitionMs ?? 150.0,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateFill = nil,
            CreateRoot = nil,
        }

        var fill Container? = nil
        if let createFill = createFill {
            fill = createFill(resolved)
        } else {
            fill = Container{
                Width: Length.Percent(resolved.Value * 100.0),
                Height: resolved.Height,
                BorderRadius: resolved.BorderRadius,
                BackgroundColor: resolved.FillColor!!,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
            }
        }

        if let createRoot = createRoot {
            return createRoot(resolved, fill!!)
        }

        var accessibilityRange = AccessibilityValue{Minimum: 0.0, Maximum: 1.0, Now: resolved.Value,}
        if let valueText = resolved.AccessibilityValueText {
            accessibilityRange = AccessibilityValue{Minimum: 0.0, Maximum: 1.0, Now: resolved.Value, Text: valueText,}
        }

        var semantics = Accessibility{Role: AccessibilityRole.ProgressBar, Range: accessibilityRange,}
        if let accessibilityName = resolved.AccessibilityName {
            semantics = Accessibility{
                Role: AccessibilityRole.ProgressBar,
                Name: accessibilityName,
                Range: accessibilityRange,
            }
        }

        return Container{
            Width: resolved.Width,
            Height: resolved.Height,
            BorderRadius: resolved.BorderRadius,
            BorderWidth: resolved.BorderWidth,
            BorderColor: resolved.BorderColor!!,
            BackgroundColor: resolved.TrackColor!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            Overflow: Overflow.Hidden,
            Accessibility: semantics,
            fill!!,
        }
    }
}
