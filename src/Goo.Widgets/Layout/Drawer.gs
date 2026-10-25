package Goo.Widgets.Layout

import Goo
import Goo.Widgets

/// An animated slide-over container panel docked to the start or end edge of its viewport.
/// Supports caller-owned content, custom container factories, and direction-aware transitions.
public data struct Drawer {
    /// Hosted child element placed directly in the drawer container when non-nil.
    var Content Blob?
    /// Whether the drawer is visible and expanded. Build does not invert or mutate this state.
    var Open bool
    /// Whether the drawer docks to and slides from the end edge instead of the start edge.
    var FromEnd bool
    /// Accessible name for the group container. Nil resolves to "Drawer".
    var AccessibilityName string?
    /// Drawer width in logical pixels. Zero or default resolves to 320.0.
    var Width float64
    /// Drawer height. Nil resolves to Percent(100.0).
    var Height Length?
    /// Background color of the drawer panel. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Border color of the drawer panel. Nil uses the nearest theme.
    var BorderColor Color?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Vertical padding. Explicit zero is preserved.
    var PaddingVertical float64?
    /// Border stroke width. Nil resolves to 1.0; explicit zero is preserved.
    var BorderWidth float64?
    /// Corner radius of the drawer panel. Nil resolves to 12.0; explicit zero is preserved.
    var BorderRadius float64?
    /// Panel opacity when Open is true. Nil resolves to 1.0; explicit zero is preserved.
    var OpenOpacity float64?
    /// Panel opacity when Open is false. Nil resolves to 0.0; explicit zero is preserved.
    var ClosedOpacity float64?
    /// Transition duration in milliseconds. Nil uses theme motion. Explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Optional authored shadow. Nil leaves the panel unshadowed.
    var BoxShadow BoxShadow?
    /// Transform applied when Open is true. Nil resolves to the identity transform.
    var OpenTransform PanelTransform?
    /// Closed transform. Nil slides out without scaling.
    var ClosedTransform PanelTransform?
    /// Custom factory for the root Container. Receives resolved props and caller Content.
    var CreateRoot Func[Drawer, Blob?, Container]?

    /// Builds a fresh Goo element tree after resolving props and factories.
    public func Build() Blob {
        let theme = Theme.Read()
        let createRoot = CreateRoot
        let defaultClosedTransform = if FromEnd != theme.RightToLeft {
            PanelTransform{TranslateX: Percent(100.0)}
        } else {
            PanelTransform{TranslateX: Percent(-100.0)}
        }

        let resolved = this with{
            AccessibilityName = AccessibilityName ?? "Drawer",
            Width = if Width == 0.0 {
                320.0
            } else {
                Width
            },
            Height = Height ?? Percent(100.0),
            BackgroundColor = BackgroundColor ?? theme.PanelColor,
            BorderColor = BorderColor ?? theme.BorderColor,
            PaddingHorizontal = PaddingHorizontal ?? theme.PanelPadding,
            PaddingVertical = PaddingVertical ?? theme.PanelPadding,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.PanelRadius,
            OpenOpacity = OpenOpacity ?? 1.0,
            ClosedOpacity = ClosedOpacity ?? 0.0,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            BoxShadow = BoxShadow ?? Goo.BoxShadow{},
            OpenTransform = OpenTransform ?? PanelTransform{},
            ClosedTransform = ClosedTransform ?? defaultClosedTransform,
            CreateRoot = nil,
        }

        if let createRoot = createRoot {
            return createRoot(resolved, Content)
        }

        let opacity = if resolved.Open {
            resolved.OpenOpacity!!
        } else {
            resolved.ClosedOpacity!!
        }
        let transform = if resolved.Open {
            resolved.OpenTransform!!
        } else {
            resolved.ClosedTransform!!
        }

        let root = Container{
            Position: PositionType.Absolute,
            Top: 0.0,
            Direction: theme.Direction,
            Width: resolved.Width,
            Height: resolved.Height!!,
            Padding: Edges(resolved.PaddingVertical!!, resolved.PaddingHorizontal!!),
            BackgroundColor: resolved.BackgroundColor!!,
            BorderColor: resolved.BorderColor!!,
            BorderWidth: resolved.BorderWidth!!,
            BorderRadius: resolved.BorderRadius!!,
            BoxShadow: resolved.BoxShadow!!,
            Opacity: opacity,
            Transform: transform,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            Overflow: Overflow.Hidden,
            Disabled: !resolved.Open,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Group,
                Name: resolved.AccessibilityName!!,
                Hidden: !resolved.Open,
            },
        }

        if resolved.FromEnd {
            root.End = 0.0
        } else {
            root.Start = 0.0
        }

        if let content = Content {
            root.Children.Add(content)
        }

        return root
    }
}
