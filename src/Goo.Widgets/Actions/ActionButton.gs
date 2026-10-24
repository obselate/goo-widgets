package Goo.Widgets.Actions

import Goo
import Goo.Widgets

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
    /// Background. Nil uses the theme panel.
    var BackgroundColor Color?
    /// Text. Nil uses the theme text.
    var TextColor Color?
    /// Border. Nil uses the theme input border.
    var BorderColor Color?
    /// Hovered surface.
    var HoverBackgroundColor Color?
    /// Pressed surface.
    var ActiveBackgroundColor Color?
    /// Keyboard focus outline color.
    var FocusBorderColor Color?
    /// Disabled surface.
    var DisabledBackgroundColor Color?
    /// Disabled text.
    var DisabledTextColor Color?
    /// Fixed height. Nil uses the theme control height.
    var Height float64?
    /// Minimum width. Explicit zero is preserved.
    var MinWidth float64?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Text size.
    var FontSize float64?
    /// Border width. Nil uses the nearest theme border width; explicit zero is preserved.
    var BorderWidth float64?
    /// Border radius. Nil uses the nearest theme radius; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration. Nil uses theme motion.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Root opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Text weight.
    var FontWeight int32?
    /// Optional text font family.
    var FontFamily string?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Pressed transform. Nil uses the identity transform.
    var ActiveTransform PanelTransform?
    /// Creates Text from resolved props. Nil uses the default Text composition.
    var CreateText Func[ActionButton, Text]?
    /// Creates the final Button from resolved props and exact final Text.
    var CreateRoot Func[ActionButton, Text, Button]?

    /// Builds a fresh Goo button tree after resolving props and factories.
    public func Build() Blob {
        let theme = Theme.Read()
        let createText = CreateText
        let createRoot = CreateRoot
        let content = Content ?? ""
        let background = BackgroundColor ?? theme.PanelColor
        let resolved = this with{
            Content = content,
            AccessibilityName = AccessibilityName ?? content,
            BackgroundColor = background,
            TextColor = TextColor ?? theme.TextColor,
            BorderColor = BorderColor ?? theme.InputBorderColor,
            HoverBackgroundColor = HoverBackgroundColor ?? theme.HoverColor,
            ActiveBackgroundColor = ActiveBackgroundColor ?? theme.PressedColor,
            FocusBorderColor = FocusBorderColor ?? theme.FocusColor,
            DisabledBackgroundColor = DisabledBackgroundColor ?? theme.PanelColor,
            DisabledTextColor = DisabledTextColor ?? theme.FaintTextColor,
            Height = Height ?? theme.ControlHeight,
            MinWidth = MinWidth ?? theme.ControlMinWidth,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            FontSize = FontSize ?? theme.FontSize,
            FontFamily = FontFamily ?? theme.FontFamily,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.ControlRadius,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            FontWeight = FontWeight ?? theme.FontWeight,
            Transform = Transform ?? PanelTransform{},
            ActiveTransform = ActiveTransform ?? PanelTransform{},
            CreateText = nil,
            CreateRoot = nil,
        }

        let text = if let createText = createText {
            createText(resolved)
        } else {
            let value = Text{
                Content: resolved.Content!!,
                FontSize: resolved.FontSize!!,
                FontWeight: resolved.FontWeight!!,
            }
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }
        if let createRoot = createRoot {
            let button = createRoot(resolved, text)
            WidgetKeyBindings.BindActivation(button)
            return button
        }

        let root = Button{
            LineHeight: theme.LineHeight,
            Height: resolved.Height!!,
            MinWidth: resolved.MinWidth!!,
            Padding: Edges{Right: resolved.PaddingHorizontal!!, Left: resolved.PaddingHorizontal!!},
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
            Focus: Style{OutlineColor: resolved.FocusBorderColor!!, OutlineWidth: 2.0, OutlineOffset: 2.0},
            DisabledStyle: Style{
                BackgroundColor: resolved.DisabledBackgroundColor!!,
                Color: resolved.DisabledTextColor!!,
            },
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: resolved.AccessibilityName!!,},
            text,
        }
        WidgetKeyBindings.BindActivation(root)
        return root
    }
}
