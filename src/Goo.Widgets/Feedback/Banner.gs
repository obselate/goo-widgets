package Goo.Widgets.Feedback

import Goo

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
    /// Background override. Nil selects calm #18181b, loud #422006, or alert #450a0a.
    var BackgroundColor Color?
    /// Text override. Nil selects calm #fafafa, loud #fbbf24, or alert #fca5a5.
    var TextColor Color?
    /// Border override. Nil selects calm #3f3f46, loud #854d0e, or alert #991b1b.
    var BorderColor Color?
    /// Minimum banner height. Zero resolves to 44.0.
    var MinHeight float64
    /// Left and right padding. Zero resolves to 14.0.
    var PaddingHorizontal float64
    /// Top and bottom padding. Zero resolves to 10.0.
    var PaddingVertical float64
    /// Text font size. Zero resolves to 14.0.
    var FontSize float64
    /// Text font weight. Zero resolves to 500.
    var FontWeight int32
    /// Border width. Nil resolves to 1.0; explicit zero is preserved.
    var BorderWidth float64?
    /// Border radius. Nil resolves to 6.0; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration. Nil resolves to 150.0; explicit zero is preserved.
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
        let createText = CreateText
        let createRoot = CreateRoot
        let content = Content ?? ""
        var background = Color.Parse("#18181b")
        var textColor = Color.Parse("#fafafa")
        var border = Color.Parse("#3f3f46")
        if Loud {
            background = Color.Parse("#422006")
            textColor = Color.Parse("#fbbf24")
            border = Color.Parse("#854d0e")
        }
        if Alert {
            background = Color.Parse("#450a0a")
            textColor = Color.Parse("#fca5a5")
            border = Color.Parse("#991b1b")
        }
        let resolved = this with{
            Content = content,
            AccessibilityName = AccessibilityName ?? content,
            BackgroundColor = BackgroundColor ?? background,
            TextColor = TextColor ?? textColor,
            BorderColor = BorderColor ?? border,
            MinHeight = if MinHeight == 0.0 {
                44.0
            } else {
                MinHeight
            },
            PaddingHorizontal = if PaddingHorizontal == 0.0 {
                14.0
            } else {
                PaddingHorizontal
            },
            PaddingVertical = if PaddingVertical == 0.0 {
                10.0
            } else {
                PaddingVertical
            },
            FontSize = if FontSize == 0.0 {
                14.0
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                500
            } else {
                FontWeight
            },
            BorderWidth = BorderWidth ?? 1.0,
            BorderRadius = BorderRadius ?? 6.0,
            TransitionMs = TransitionMs ?? 150.0,
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
            FlexDirection: FlexDirection.Row,
            FlexWrap: FlexWrap.Wrap,
            FlexGrow: 1.0,
            MinHeight: resolved.MinHeight,
            PaddingLeft: resolved.PaddingHorizontal,
            PaddingRight: resolved.PaddingHorizontal,
            PaddingTop: resolved.PaddingVertical,
            PaddingBottom: resolved.PaddingVertical,
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
