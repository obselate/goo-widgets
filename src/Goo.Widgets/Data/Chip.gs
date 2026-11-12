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
    /// Semantic color family resolved through the nearest theme. The default is Neutral.
    var Tone Tone
    /// Whether the chip is in its selected active state.
    var Selected bool
    /// Whether the chip rejects input and uses disabled styling.
    var Disabled bool
    /// Accessible name for accessibility tools. Nil resolves to the resolved label.
    var AccessibilityName string?
    /// Action invoked when the chip button is activated.
    var OnClick Action?
    /// Requests removal when the remove action is activated. Nil hides the action.
    var OnRemove Action?
    /// Accessible name of the remove action. Nil uses localized removal text.
    var RemoveAccessibilityName string?
    /// Marks the value invalid without changing the caller-owned value.
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
    var Height Length?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Content gap. Explicit zero is preserved.
    var Gap float64?
    /// Font size of the text label. Nil uses the nearest theme caption font size.
    var FontSize float64?
    /// Font weight of the text label. Nil uses the nearest theme caption font weight.
    var FontWeight int32?
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
    /// Custom factory for creating the label Text primitive from resolved props. Nil uses one line that ends with an ellipsis when the chip is too narrow.
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
        let defaultHeight Length = theme.ControlHeight
        let resolved = this with{
            Label = label,
            AccessibilityName = AccessibilityName ?? label,
            Tone = tone,
            BackgroundColor = BackgroundColor ?? theme.ToneFill(tone),
            SelectedBackgroundColor = SelectedBackgroundColor ?? (Invalid ? theme.DangerColor: theme.AccentColor),
            TextColor = TextColor ?? theme.ToneColor(tone),
            SelectedTextColor = SelectedTextColor ?? theme.SelectedText(theme.OnAccentColor, SelectedBackgroundColor ?? (Invalid ? theme.DangerColor: theme.AccentColor)),
            BorderColor = BorderColor ?? (tone == Tone.Neutral ? theme.InputBorderColor: theme.ToneColor(tone)),
            SelectedBorderColor = SelectedBorderColor ?? (Invalid ? theme.DangerColor: theme.AccentColor),
            HoverBackgroundColor = HoverBackgroundColor ?? theme.HoverColor,
            SelectedHoverBackgroundColor = SelectedHoverBackgroundColor ?? theme.AccentHoverColor,
            ActiveBackgroundColor = ActiveBackgroundColor ?? theme.PressedColor,
            SelectedActiveBackgroundColor = SelectedActiveBackgroundColor ?? theme.AccentPressedColor,
            FocusBorderColor = FocusBorderColor ?? theme.FocusColor,
            Height = Height ?? defaultHeight,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            Gap = Gap ?? theme.ControlGap,
            FontFamily = FontFamily ?? theme.FontFamily,
            FontSize = FontSize ?? theme.CaptionFontSize,
            FontWeight = FontWeight ?? theme.CaptionFontWeight,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.ControlRadius!!,
            TransitionMs = theme.ReducedMotion ? 0.0: TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            DisabledOpacity = DisabledOpacity ?? theme.DisabledOpacity,
            Transform = Transform ?? PanelTransform{},
            ActiveTransform = ActiveTransform ?? PanelTransform{},
            CreateText = nil,
            CreateRoot = nil,
        }

        let text = if let createText = createText {
            createText(resolved)
        } else {
            let value = Text{
                Content: resolved.Label!!,
                FontSize: resolved.FontSize!!,
                FontWeight: resolved.FontWeight!!,
                TextWrap: TextWrap.NoWrap,
                TextTrimming: TextTrimming.Ellipsis,
                MinWidth: 0.0,
                FlexShrink: 1.0,
            }
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }

        let root = if let createRoot = createRoot { createRoot(resolved, originalLeading, text) } else { Button{
            LineHeight: theme.LineHeight,
            Height: resolved.Height!!,
            Padding: Edges{Right: resolved.PaddingHorizontal!!, Left: resolved.PaddingHorizontal!!},
            Gap: resolved.Gap!!,
            BorderWidth: resolved.BorderWidth!!,
            BorderRadius: resolved.BorderRadius!!,
            BorderColor: Selected ? resolved.SelectedBorderColor!!: resolved.BorderColor!!,
            BackgroundColor: Selected ? resolved.SelectedBackgroundColor!!: resolved.BackgroundColor!!,
            Color: Selected ? resolved.SelectedTextColor!!: resolved.TextColor!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            Cursor: Cursor.Pointer,
            Focusable: true,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            TransitionProperties: ActiveTransform == nil ? theme.InteractionTransitions: theme.PressTransitions,
            HoverStyle: Selected ? Style{BackgroundColor: resolved.SelectedHoverBackgroundColor!!}:
                HoverBackgroundColor == nil ? nil: Style{BackgroundColor: HoverBackgroundColor!!},
            ActiveStyle: Style{BackgroundColor: Selected ? resolved.SelectedActiveBackgroundColor!!: resolved.ActiveBackgroundColor!!, Transform: resolved.ActiveTransform!!},
            FocusStyle: FocusBorderColor == nil ? nil: Style{OutlineColor: FocusBorderColor!!},
            DisabledStyle: Style{Opacity: resolved.DisabledOpacity!!},
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            FlexShrink: 1.0,
            MinWidth: 0.0,
        } }

        if createRoot == nil {
            if let leading = originalLeading {
                root.Children.Add(Container(){leading})
                root.Children.Add(Container{FlexShrink: 1.0, MinWidth: 0.0, text})
            } else { root.Children.Add(text) }
        }
        theme.ApplyInteraction(root, InteractionFamily.Toggle, Selected)
        root.Disabled = Disabled
        root.Focusable = !Disabled
        root.Accessibility = Accessibility{Role: AccessibilityRole.Checkbox, Name: resolved.AccessibilityName!!, Invalid: Invalid,
            Checked: Selected ? AccessibilityChecked.True: AccessibilityChecked.False}
        root.OnClick = Disabled ? nil: root.OnClick ?? OnClick
        WidgetKeyBindings.BindActivation(root)
        return RemovalRoot(root, resolved)
    }

    private func RemovalRoot(button Button, input Chip) Blob {
        guard let remove = input.OnRemove else {
            return button
        }
        let theme = Theme.Read()
        let color = input.Disabled ? theme.DisabledTextColor: input.Selected ? input.SelectedTextColor!!: input.TextColor!!
        let height = input.Height!!.HasMagnitude && !input.Height!!.IsPercent ? input.Height!!.Magnitude: theme.ControlHeight
        let action = Button{
            Key: "remove",
            Width: height - 8.0,
            Height: height - 8.0,
            MarginEnd: 4.0,
            Padding: 0,
            Focusable: !input.Disabled,
            Disabled: input.Disabled,
            BorderRadius: (height - 8.0) / 2.0,
            Color: color,
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            DisabledStyle: Style{BackgroundColor: Color.Transparent, Opacity: 1.0},
            Accessibility: Accessibility{
                Role: AccessibilityRole.Button,
                Name: input.RemoveAccessibilityName ?? theme.Text("Remove {0}", input.Label!!),
            },
            OnClick: remove,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            ControlIcons.Create(ControlIcon.Close, 14, color),
        }
        theme.ApplyInteraction(action, InteractionFamily.Button)
        WidgetKeyBindings.BindActivation(action)
        button.Height = input.Height!!.HasMagnitude && !input.Height!!.IsPercent
            ? height - 2.0 * input.BorderWidth!!: Percent(100)
        button.BorderWidth = 0.0
        button.BackgroundColor = Color.Transparent
        button.HoverStyle = Style{}
        button.ActiveStyle = Style{BackgroundColor: Color.Transparent}
        button.DisabledStyle = Style{BackgroundColor: Color.Transparent, Color: theme.DisabledTextColor, Opacity: 1.0}
        button.Padding = 0
        button.PaddingStart = input.PaddingHorizontal!!
        button.PaddingEnd = input.Gap!!
        return Container{
            Disabled: input.Disabled,
            DisabledStyle: Style{BackgroundColor: theme.SunkenColor, Color: theme.DisabledTextColor, Opacity: input.DisabledOpacity!!},
            Height: input.Height!!,
            FlexDirection: FlexDirection.Row,
            FlexShrink: 1.0,
            MinWidth: 0.0,
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

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w Chip) Blob -> w.Build()
