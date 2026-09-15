package Goo.Widgets.Data

import Goo

/// A selectable tag/filter chip with leading element support and customizable primitive factories.
public data struct Chip {
    /// Text label displayed by the chip. Nil resolves to an empty string.
    var Label string?
    /// Optional leading element placed before the text label.
    var Leading Blob?
    /// Whether the chip is in its selected active state.
    var Selected bool
    /// Whether the chip rejects input and uses disabled styling.
    var Disabled bool
    /// Accessible name for accessibility tools. Nil resolves to the resolved label.
    var AccessibilityName string?
    /// Action invoked when the chip button is activated.
    var OnClick Action?
    /// Background color in normal unselected state. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Background color in selected state. Nil resolves to #fafafa.
    var SelectedBackgroundColor Color?
    /// Text and icon color in normal unselected state. Nil resolves to #fafafa.
    var TextColor Color?
    /// Text and icon color in selected state. Nil resolves to #09090b.
    var SelectedTextColor Color?
    /// Border color in normal unselected state. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Border color in selected state. Nil resolves to #fafafa.
    var SelectedBorderColor Color?
    /// Hover background color in normal unselected state. Nil resolves to #27272a.
    var HoverBackgroundColor Color?
    /// Hover background color in selected state. Nil resolves to #e4e4e7.
    var SelectedHoverBackgroundColor Color?
    /// Active press background color in normal unselected state. Nil resolves to #3f3f46.
    var ActiveBackgroundColor Color?
    /// Active press background color in selected state. Nil resolves to #d4d4d8.
    var SelectedActiveBackgroundColor Color?
    /// Focus outline border color. Nil resolves to #d4d4d8.
    var FocusBorderColor Color?
    /// Whether focused state uses the configured focus border color.
    var ShowFocusHighlight bool
    /// Fixed height of the chip. Zero resolves to 28.0.
    var Height float64
    /// Left and right horizontal padding. Zero resolves to 10.0.
    var PaddingHorizontal float64
    /// Spacing between leading element and text label. Zero resolves to 6.0.
    var Gap float64
    /// Font size of the text label. Zero resolves to 12.0.
    var FontSize float64
    /// Font weight of the text label. Zero resolves to 600.
    var FontWeight int32
    /// Border width. Nil resolves to 1.0; explicit zero is preserved.
    var BorderWidth float64?
    /// Corner border radius. Nil resolves to 14.0; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration in milliseconds. Nil resolves to 150.0; explicit zero is preserved.
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
    /// Visual transform applied during active press. Nil resolves to PanelTransform{Scale: 0.98}.
    var ActiveTransform PanelTransform?
    /// Custom factory for creating the label Text primitive from resolved props.
    var CreateText Func[Chip, Text]?
    /// Custom factory for creating the root Button primitive from resolved props, original leading, and final text.
    var CreateRoot Func[Chip, Blob?, Text, Button]?

    /// Builds a fresh Goo button tree after resolving props and factories.
    public func Build() Blob {
        let createText = CreateText
        let createRoot = CreateRoot
        let originalLeading = Leading
        let label = Label ?? ""
        let resolved = this with{
            Label = label,
            AccessibilityName = AccessibilityName ?? label,
            BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
            SelectedBackgroundColor = SelectedBackgroundColor ?? Color.Parse("#fafafa"),
            TextColor = TextColor ?? Color.Parse("#fafafa"),
            SelectedTextColor = SelectedTextColor ?? Color.Parse("#09090b"),
            BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
            SelectedBorderColor = SelectedBorderColor ?? Color.Parse("#fafafa"),
            HoverBackgroundColor = HoverBackgroundColor ?? Color.Parse("#27272a"),
            SelectedHoverBackgroundColor = SelectedHoverBackgroundColor ?? Color.Parse("#e4e4e7"),
            ActiveBackgroundColor = ActiveBackgroundColor ?? Color.Parse("#3f3f46"),
            SelectedActiveBackgroundColor = SelectedActiveBackgroundColor ?? Color.Parse("#d4d4d8"),
            FocusBorderColor = FocusBorderColor ?? Color.Parse("#d4d4d8"),
            Height = if Height == 0.0 {
                28.0
            } else {
                Height
            },
            PaddingHorizontal = if PaddingHorizontal == 0.0 {
                10.0
            } else {
                PaddingHorizontal
            },
            Gap = if Gap == 0.0 {
                6.0
            } else {
                Gap
            },
            FontSize = if FontSize == 0.0 {
                12.0
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                600
            } else {
                FontWeight
            },
            BorderWidth = BorderWidth ?? 1.0,
            BorderRadius = BorderRadius ?? 14.0,
            TransitionMs = TransitionMs ?? 150.0,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            DisabledOpacity = DisabledOpacity ?? 0.5,
            Transform = Transform ?? PanelTransform{},
            ActiveTransform = ActiveTransform ?? PanelTransform{Scale: 0.98},
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
            return createRoot(resolved, originalLeading, text)
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
            Height: resolved.Height,
            PaddingLeft: resolved.PaddingHorizontal,
            PaddingRight: resolved.PaddingHorizontal,
            Gap: resolved.Gap,
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
            Focus: if resolved.ShowFocusHighlight {
                Style{BorderColor: resolved.FocusBorderColor!!}
            } else {
                Style{}
            },
            DisabledStyle: Style{Opacity: resolved.DisabledOpacity!!},
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Checkbox,
                Name: resolved.AccessibilityName!!,
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
        return root
    }
}
