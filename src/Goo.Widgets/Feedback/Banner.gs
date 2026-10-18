package Goo.Widgets.Feedback

import Goo
import Goo.Widgets

/// A semantic status banner with calm, loud, and alert visual tones.
/// Factories receive fully resolved props and may replace the final Goo primitives.
public data struct Banner {
    /// Banner content. Nil resolves to an empty string.
    var Content string?
    /// Accessible name. Nil resolves to the resolved content.
    var AccessibilityName string?
    /// Whether the banner uses the loud tone when Alert is false.
    var Loud bool
    /// Whether the banner uses the alert tone and assertive live semantics.
    var Alert bool
    /// Background override. Nil uses the theme panel.
    var BackgroundColor Color?
    /// Text override. Nil selects the theme text, warning or danger role.
    var TextColor Color?
    /// Border override. Nil selects the theme border, warning or danger role.
    var BorderColor Color?
    /// Minimum height. Nil uses the theme control height.
    var MinHeight float64?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Vertical padding. Explicit zero is preserved.
    var PaddingVertical float64?
    /// Text font size. Zero uses the nearest theme font size.
    var FontSize float64
    /// Text font weight. Zero uses the nearest theme font weight.
    var FontWeight int32
    /// Border width. Nil uses the nearest theme border width; explicit zero is preserved.
    var BorderWidth float64?
    /// Border radius. Nil uses the nearest theme radius; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration. Nil uses theme motion. Explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Root opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Optional text font family.
    var FontFamily string?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Creates Text from resolved props. Nil uses the default Text composition.
    var CreateText Func[Banner, Text]?
    /// Creates the root Container from resolved props and final Text.
    var CreateRoot Func[Banner, Text, Container]?

    /// Builds a fresh Goo banner tree after resolving props and factories.
    public func Build() Blob {
        let theme = Theme.Read()
        let createText = CreateText
        let createRoot = CreateRoot
        let content = Content ?? ""
        let background = theme.PanelColor
        let textColor = if Alert {
            theme.DangerColor
        } else if Loud {
            theme.WarningColor
        } else {
            theme.TextColor
        }
        let border = if Alert {
            theme.DangerColor
        } else if Loud {
            theme.WarningColor
        } else {
            theme.BorderColor
        }
        let resolved = this with{
            Content = content,
            AccessibilityName = AccessibilityName ?? content,
            BackgroundColor = BackgroundColor ?? background,
            TextColor = TextColor ?? textColor,
            BorderColor = BorderColor ?? border,
            MinHeight = MinHeight ?? theme.ControlHeight,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            PaddingVertical = PaddingVertical ?? theme.Spacing * 2.0,
            FontFamily = FontFamily ?? theme.FontFamily,
            FontSize = if FontSize == 0.0 {
                theme.FontSize
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                theme.FontWeight
            } else {
                FontWeight
            },
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.ControlRadius,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateText = nil,
            CreateRoot = nil,
        }

        let text = if let createText = createText {
            createText(resolved)
        } else {
            let value = Text{
                Content: resolved.Content!!,
                Color: resolved.TextColor!!,
                FontSize: resolved.FontSize,
                FontWeight: resolved.FontWeight,
                FlexGrow: 1.0,
            }
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }
        if let createRoot = createRoot {
            return createRoot(resolved, text)
        }

        var role = AccessibilityRole.Status
        var live = AccessibilityLive.Polite
        if resolved.Alert {
            role = AccessibilityRole.Alert
            live = AccessibilityLive.Assertive
        }
        return Container{
            LineHeight: theme.LineHeight,
            FlexDirection: FlexDirection.Row,
            FlexWrap: FlexWrap.Wrap,
            FlexGrow: 1.0,
            MinHeight: resolved.MinHeight!!,
            Padding: Edges(resolved.PaddingVertical!!, resolved.PaddingHorizontal!!),
            BackgroundColor: resolved.BackgroundColor!!,
            BorderColor: resolved.BorderColor!!,
            BorderWidth: resolved.BorderWidth!!,
            BorderRadius: resolved.BorderRadius!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            AlignItems: AlignItems.Center,
            Accessibility: Accessibility{Role: role, Live: live, Name: resolved.AccessibilityName!!},
            text,
        }
    }
}
