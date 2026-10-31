package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Icons

/// A selectable tag/filter chip with leading element support and customizable primitive factories.
public data struct Chip {
    /// Text label displayed by the chip. Nil resolves to an empty string.
    var Label string?
    /// Optional leading element placed before the text label.
    var Leading Blob?
    var Tone Tone
    /// Whether the chip is in its selected active state.
    var Selected bool
    /// Whether the chip rejects input and uses disabled styling.
    var Disabled bool
    /// Accessible name for accessibility tools. Nil resolves to the resolved label.
    var AccessibilityName string?
    /// Action invoked when the chip button is activated.
    var OnClick Action?
    var OnRemove Action?
    var RemoveAccessibilityName string?
    var Invalid bool
    /// Background color in normal unselected state. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Background color in selected state. Nil uses the nearest theme.
    var SelectedBackgroundColor Color?
    /// Text and icon color in normal unselected state. Nil uses the nearest theme.
    var TextColor Color?
    /// Text and icon color in selected state. Nil uses the nearest theme.
    var SelectedTextColor Color?
    /// Border color in normal unselected state. Nil uses the nearest theme.
    var BorderColor Color?
    /// Border color in selected state. Nil uses the nearest theme.
    var SelectedBorderColor Color?
    /// Hover background color in normal unselected state. Nil uses the nearest theme.
    var HoverBackgroundColor Color?
    /// Hover background color in selected state. Nil uses the nearest theme.
    var SelectedHoverBackgroundColor Color?
    /// Active press background color in normal unselected state. Nil uses the nearest theme.
    var ActiveBackgroundColor Color?
    /// Active press background color in selected state. Nil uses the nearest theme.
    var SelectedActiveBackgroundColor Color?
    /// Focus outline border color. Nil uses the nearest theme.
    var FocusBorderColor Color?
    /// Fixed height. Nil uses the theme control height.
    var Height float64?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Content gap. Explicit zero is preserved.
    var Gap float64?
    /// Font size of the text label. Zero uses the nearest theme caption font size.
    var FontSize float64
    /// Font weight of the text label. Zero uses the nearest theme caption font weight.
    var FontWeight int32
    /// Border width. Nil uses the nearest theme border width; explicit zero is preserved.
    var BorderWidth float64?
    /// Corner border radius. Nil uses the nearest theme radius; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration in milliseconds. Nil uses theme motion. Explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing function for state changes. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Normal root opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Opacity applied when disabled. Nil resolves to 0.5; explicit zero is preserved.
    var DisabledOpacity float64?
    /// Optional font family name for the text label.
    var FontFamily string?
    /// Visual transform applied to the root button. Nil resolves to identity.
    var Transform PanelTransform?
    /// Pressed transform. Nil uses the identity transform.
    var ActiveTransform PanelTransform?
    /// Custom factory for creating the label Text primitive from resolved props.
    var CreateText Func[Chip, Text]?
    /// Custom factory for creating the root Button primitive from resolved props, original leading, and final text.
    var CreateRoot Func[Chip, Blob?, Text, Button]?

    /// Builds a fresh Goo button tree after resolving props and factories.
    public func Build() Blob {
        let theme = Theme.Read()
        let createText = CreateText
        let createRoot = CreateRoot
        let originalLeading = Leading
        let label = Label ?? ""
        let tone = Invalid ? Tone.Danger: Tone
        let resolved = this with{
            Label = label,
            AccessibilityName = AccessibilityName ?? label,
            Tone = tone,
            BackgroundColor = BackgroundColor ?? theme.ToneFill(tone),
            SelectedBackgroundColor = SelectedBackgroundColor ?? (Invalid ? theme.DangerColor: theme.AccentColor),
            TextColor = TextColor ?? theme.ToneColor(tone),
            SelectedTextColor = SelectedTextColor ?? theme.OnAccentColor,
            BorderColor = BorderColor ?? (tone == Tone.Neutral ? theme.InputBorderColor: theme.ToneColor(tone)),
            SelectedBorderColor = SelectedBorderColor ?? (Invalid ? theme.DangerColor: theme.AccentColor),
            HoverBackgroundColor = HoverBackgroundColor ?? theme.HoverColor,
            SelectedHoverBackgroundColor = SelectedHoverBackgroundColor ?? theme.AccentHoverColor,
            ActiveBackgroundColor = ActiveBackgroundColor ?? theme.PressedColor,
            SelectedActiveBackgroundColor = SelectedActiveBackgroundColor ?? theme.AccentPressedColor,
            FocusBorderColor = FocusBorderColor ?? theme.FocusColor,
            Height = Height ?? theme.ControlHeight,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            Gap = Gap ?? theme.ControlGap,
            FontFamily = FontFamily ?? theme.FontFamily,
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
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.ControlRadius,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            DisabledOpacity = DisabledOpacity ?? 0.5,
            Transform = Transform ?? PanelTransform{},
            ActiveTransform = ActiveTransform ?? PanelTransform{},
            CreateText = nil,
            CreateRoot = nil,
        }

        let text = if let createText = createText {
            createText(resolved)
        } else {
            let value = Text{Content: resolved.Label!!, FontSize: resolved.FontSize, FontWeight: resolved.FontWeight}
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }
        if let createRoot = createRoot {
            let button = createRoot(resolved, originalLeading, text)
            WidgetKeyBindings.BindActivation(button)
            return RemovalRoot(button, resolved)
        }

        let currentBg = if resolved.Selected {
            resolved.SelectedBackgroundColor!!
        } else {
            resolved.BackgroundColor!!
        }
        let currentText = if resolved.Selected {
            resolved.SelectedTextColor!!
        } else {
            resolved.TextColor!!
        }
        let currentBorder = if resolved.Selected {
            resolved.SelectedBorderColor!!
        } else {
            resolved.BorderColor!!
        }
        let currentHoverBg = if resolved.Selected {
            resolved.SelectedHoverBackgroundColor!!
        } else {
            resolved.HoverBackgroundColor!!
        }
        let currentActiveBg = if resolved.Selected {
            resolved.SelectedActiveBackgroundColor!!
        } else {
            resolved.ActiveBackgroundColor!!
        }

        let root = Button{
            LineHeight: theme.LineHeight,
            Height: resolved.Height!!,
            Padding: Edges{Right: resolved.PaddingHorizontal!!, Left: resolved.PaddingHorizontal!!},
            Gap: resolved.Gap!!,
            BorderWidth: resolved.BorderWidth!!,
            BorderRadius: resolved.BorderRadius!!,
            BorderColor: currentBorder,
            BackgroundColor: currentBg,
            Color: currentText,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            Cursor: Cursor.Pointer,
            Focusable: true,
            Disabled: resolved.Disabled,
            OnClick: resolved.OnClick,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            Hover: Style{BackgroundColor: currentHoverBg},
            Active: Style{BackgroundColor: currentActiveBg, Transform: resolved.ActiveTransform!!},
            Focus: Style{OutlineColor: resolved.FocusBorderColor!!, OutlineWidth: theme.FocusRingWidth, OutlineOffset: theme.FocusRingOffset},
            DisabledStyle: Style{Opacity: resolved.DisabledOpacity!!},
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Checkbox,
                Name: resolved.AccessibilityName!!,
                Invalid: resolved.Invalid,
                Checked: if resolved.Selected {
                    AccessibilityChecked.True
                } else {
                    AccessibilityChecked.False
                },
            },
        }

        if let leading = originalLeading {
            root.Children.Add(Container(){leading})
            root.Children.Add(Container(){text})
        } else {
            root.Children.Add(text)
        }
        WidgetKeyBindings.BindActivation(root)
        return RemovalRoot(root, resolved)
    }

    private func RemovalRoot(button Button, input Chip) Blob {
        guard let remove = input.OnRemove else {
            return button
        }
        let theme = Theme.Read()
        let color = input.Selected ? input.SelectedTextColor!!: input.TextColor!!
        let action = Button{
            Key: "remove",
            Width: input.Height!! - 8.0,
            Height: input.Height!! - 8.0,
            MarginEnd: 4.0,
            Padding: 0,
            Focusable: !input.Disabled,
            Disabled: input.Disabled,
            BorderRadius: (input.Height!! - 8.0) / 2.0,
            Color: color,
            Hover: Style{BackgroundColor: theme.HoverColor},
            Focus: theme.FocusStyle,
            DisabledStyle: Style{Opacity: input.DisabledOpacity!!},
            Accessibility: Accessibility{
                Role: AccessibilityRole.Button,
                Name: input.RemoveAccessibilityName ?? theme.Text("Remove {0}", input.Label!!),
            },
            OnClick: remove,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            ControlIcons.Create(ControlIcon.Close, 14, color),
        }
        WidgetKeyBindings.BindActivation(action)
        button.Height = input.Height!! - 2.0 * input.BorderWidth!!
        button.BorderWidth = 0.0
        button.BackgroundColor = Color.Transparent
        button.Hover = Style{}
        button.Padding = 0
        button.PaddingStart = input.PaddingHorizontal!!
        button.PaddingEnd = input.Gap!!
        return Container{
            Height: input.Height!!,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            BackgroundColor: input.Selected ? input.SelectedBackgroundColor!!: input.BackgroundColor!!,
            BorderColor: input.Selected ? input.SelectedBorderColor!!: input.BorderColor!!,
            BorderWidth: input.BorderWidth!!,
            BorderRadius: input.BorderRadius!!,
            button,
            action,
        }
    }
}
