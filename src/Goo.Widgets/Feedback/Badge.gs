package Goo.Widgets.Feedback

import Goo
import Goo.Widgets

/// A placement-neutral status badge. Nil Content renders a dot; non-nil Content renders a pill.
/// Factories receive resolved props and may replace the final Goo primitives.
public data struct Badge {
    /// Badge text. Nil selects dot mode; an empty string remains content mode.
    var Content string?
    /// Background color. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Text color. Nil uses the nearest theme.
    var TextColor Color?
    /// Border color. Nil uses the nearest theme.
    var BorderColor Color?
    /// Dot diameter. Zero uses the nearest theme spacing.
    var DotSize float64
    /// Content height. Nil uses caption size plus two spacing units.
    var Height float64?
    /// Minimum width. Nil uses the resolved height.
    var MinWidth float64?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Border width. Zero leaves the border unpainted.
    var BorderWidth float64
    /// Radius. Nil uses half the active height. Explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration in milliseconds. Nil uses theme motion. Explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Font family. Nil inherits Goo's font choice.
    var FontFamily string?
    /// Font size. Zero uses the nearest theme caption font size.
    var FontSize float64
    /// Font weight. Zero uses the nearest theme caption font weight.
    var FontWeight int32
    /// Accessible name. Content is the content-mode fallback; a nameless dot is decorative.
    var AccessibilityName string?
    /// Root opacity. Nil resolves to 1.
    var Opacity float64?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Creates the final Text from resolved props. Nil uses Badge's composition.
    var CreateText Func[Badge, Text]?
    /// Creates the final Container from resolved props and optional Text. Nil uses Badge's composition.
    var CreateRoot Func[Badge, Text?, Container]?

    /// Builds a fresh Goo tree, resolving props before invoking either primitive factory.
    public func Build() Blob {
        let theme = Theme.Read()
        let createText = CreateText
        let createRoot = CreateRoot
        let isDot = Content == nil
        let dotSize = if DotSize == 0.0 {
            theme.Spacing * 2.0
        } else {
            DotSize
        }
        let height = Height ?? theme.CaptionFontSize + theme.Spacing * 2.0
        let minWidth = MinWidth ?? height
        let padding = PaddingHorizontal ?? theme.Spacing * 1.5
        var resolvedName string? = AccessibilityName
        if resolvedName == nil && !isDot {
            resolvedName = Content
        }
        let resolved = this with{
            BackgroundColor = BackgroundColor ?? theme.PanelColor,
            TextColor = TextColor ?? theme.TextColor,
            BorderColor = BorderColor ?? theme.BorderColor,
            FontFamily = FontFamily ?? theme.FontFamily,
            DotSize = dotSize,
            Height = height,
            MinWidth = minWidth,
            PaddingHorizontal = padding,
            BorderRadius = BorderRadius ??
            (
                if isDot {
                    dotSize / 2.0
                } else {
                    height / 2.0
                }
            ),
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            FontSize = if FontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                theme.CaptionFontWeight
            } else {
                FontWeight
            },
            AccessibilityName = resolvedName,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateText = nil,
            CreateRoot = nil,
        }

        var text Text? = nil
        if !isDot {
            if let createText = createText {
                text = createText(resolved)
            } else {
                text = Text{
                    Content: resolved.Content!!,
                    Color: resolved.TextColor!!,
                    FontSize: resolved.FontSize,
                    FontWeight: resolved.FontWeight,
                }
                if let fontFamily = resolved.FontFamily {
                    text.FontFamily = fontFamily
                }
            }
        }
        if let createRoot = createRoot {
            return createRoot(resolved, text)
        }

        var semantics = Accessibility{Role: AccessibilityRole.None, Hidden: true}
        if let accessibilityName = resolved.AccessibilityName {
            semantics = Accessibility{Role: AccessibilityRole.Status, Name: accessibilityName,}
        }
        if isDot {
            return Container{
                Width: resolved.DotSize,
                Height: resolved.DotSize,
                BorderRadius: resolved.BorderRadius!!,
                BorderWidth: resolved.BorderWidth,
                BorderColor: resolved.BorderColor!!,
                BackgroundColor: resolved.BackgroundColor!!,
                Opacity: resolved.Opacity!!,
                Transform: resolved.Transform!!,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
                Accessibility: semantics,
            }
        }
        return Container{
            LineHeight: theme.LineHeight,
            Height: resolved.Height!!,
            MinWidth: resolved.MinWidth!!,
            Padding: Edges{Right: resolved.PaddingHorizontal!!, Left: resolved.PaddingHorizontal!!},
            BorderRadius: resolved.BorderRadius!!,
            BorderWidth: resolved.BorderWidth,
            BorderColor: resolved.BorderColor!!,
            BackgroundColor: resolved.BackgroundColor!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Accessibility: semantics,
            text!!,
        }
    }
}
