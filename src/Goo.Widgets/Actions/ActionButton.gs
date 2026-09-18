package Goo.Widgets.Actions

import Goo

/// A semantic button with resolved visual defaults and customizable primitive factories.
public data struct ActionButton {
    /// Visible button text and the default accessible name. Nil resolves to an empty string.
    var Content string?
    /// Accessible name. Nil resolves to the resolved content.
    var AccessibilityName string?
    /// Action invoked by Goo button activation.
    var OnClick Action?
    /// Whether the button rejects input.
    var Disabled bool
    /// Default background color. Nil resolves to #fafafa.
    var BackgroundColor Color?
    /// Default inherited text color. Nil resolves to #09090b.
    var TextColor Color?
    /// Border color. Nil resolves to the background color.
    var BorderColor Color?
    /// Hover background color. Nil resolves to #e4e4e7.
    var HoverBackgroundColor Color?
    /// Active background color. Nil resolves to #d4d4d8.
    var ActiveBackgroundColor Color?
    /// Focus border color. Nil resolves to #d4d4d8.
    var FocusBorderColor Color?
    /// Whether focused state uses the configured focus border color.
    var ShowFocusHighlight bool
    /// Disabled background color. Nil resolves to #27272a.
    var DisabledBackgroundColor Color?
    /// Disabled inherited text color. Nil resolves to #71717a.
    var DisabledTextColor Color?
    /// Fixed button height. Zero resolves to 36.0.
    var Height float64
    /// Minimum button width. Zero resolves to 88.0.
    var MinWidth float64
    /// Left and right button padding. Zero resolves to 16.0.
    var PaddingHorizontal float64
    /// Text font size. Zero resolves to 14.0.
    var FontSize float64
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
    /// Text font weight. Zero resolves to 600.
    var FontWeight int32
    /// Optional text font family.
    var FontFamily string?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Active pressed transform. Nil resolves to PanelTransform{Scale: 0.98}.
    var ActiveTransform PanelTransform?
    /// Creates Text from resolved props. Nil uses the default Text composition.
    var CreateText Func[ActionButton, Text]?
    /// Creates the final Button from resolved props and exact final Text.
    var CreateRoot Func[ActionButton, Text, Button]?

    /// Builds a fresh Goo button tree after resolving props and factories.
    public func Build() Blob {
        let createText = CreateText
        let createRoot = CreateRoot
        let content = Content ?? ""
        let background = BackgroundColor ?? Color.Parse("#fafafa")
        let resolved = this with{
            Content = content,
            AccessibilityName = AccessibilityName ?? content,
            BackgroundColor = background,
            TextColor = TextColor ?? Color.Parse("#09090b"),
            BorderColor = BorderColor ?? background,
            HoverBackgroundColor = HoverBackgroundColor ?? Color.Parse("#e4e4e7"),
            ActiveBackgroundColor = ActiveBackgroundColor ?? Color.Parse("#d4d4d8"),
            FocusBorderColor = FocusBorderColor ?? Color.Parse("#d4d4d8"),
            DisabledBackgroundColor = DisabledBackgroundColor ?? Color.Parse("#27272a"),
            DisabledTextColor = DisabledTextColor ?? Color.Parse("#71717a"),
            Height = if Height == 0.0 {
                36.0
            } else {
                Height
            },
            MinWidth = if MinWidth == 0.0 {
                88.0
            } else {
                MinWidth
            },
            PaddingHorizontal = if PaddingHorizontal == 0.0 {
                16.0
            } else {
                PaddingHorizontal
            },
            FontSize = if FontSize == 0.0 {
                14.0
            } else {
                FontSize
            },
            BorderWidth = BorderWidth ?? 1.0,
            BorderRadius = BorderRadius ?? 6.0,
            TransitionMs = TransitionMs ?? 150.0,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            FontWeight = if FontWeight == 0 {
                600
            } else {
                FontWeight
            },
            Transform = Transform ?? PanelTransform{},
            ActiveTransform = ActiveTransform ?? PanelTransform{Scale: 0.98},
            CreateText = nil,
            CreateRoot = nil,
        }

        let text = if let createText = createText {
            createText(resolved)
        } else {
            let value = Text{Content: resolved.Content!!, FontSize: resolved.FontSize, FontWeight: resolved.FontWeight,}
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }
        if let createRoot = createRoot {
            return createRoot(resolved, text)
        }

        return Button{
            Height: resolved.Height,
            MinWidth: resolved.MinWidth,
            PaddingLeft: resolved.PaddingHorizontal,
            PaddingRight: resolved.PaddingHorizontal,
            BorderWidth: resolved.BorderWidth!!,
            BorderRadius: resolved.BorderRadius!!,
            BorderColor: resolved.BorderColor!!,
            BackgroundColor: resolved.BackgroundColor!!,
            Color: resolved.TextColor!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            Cursor: Cursor.Pointer,
            Focusable: true,
            Disabled: resolved.Disabled,
            OnClick: resolved.OnClick,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            Hover: Style{BackgroundColor: resolved.HoverBackgroundColor!!},
            Active: Style{BackgroundColor: resolved.ActiveBackgroundColor!!, Transform: resolved.ActiveTransform!!},
            Focus: if resolved.ShowFocusHighlight {
                Style{BorderColor: resolved.FocusBorderColor!!}
            } else {
                Style{}
            },
            DisabledStyle: Style{
                BackgroundColor: resolved.DisabledBackgroundColor!!,
                Color: resolved.DisabledTextColor!!,
            },
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: resolved.AccessibilityName!!,},
            text,
        }
    }
}
