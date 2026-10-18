package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Icons

/// A controlled checkbox with false, true, and mixed accessibility states.
public data struct Checkbox {
    /// Current checkbox state. Unspecified resolves to false.
    var State AccessibilityChecked
    /// Whether activation cycles from true to mixed before false.
    var AllowMixed bool
    /// Whether the checkbox rejects input.
    var Disabled bool
    /// Called with the next state when the checkbox is activated.
    var OnChange Action[AccessibilityChecked]?
    /// Optional text rendered beside the checkbox mark as one interactive row.
    var Label string?
    /// Label text color. Nil resolves to the theme text color.
    var LabelColor Color?
    /// Label font size. Zero uses the nearest theme font size.
    var LabelFontSize float64
    /// Label font weight. Zero uses the nearest theme font weight.
    var LabelFontWeight int32
    /// Gap between the checkbox mark and label. Nil resolves to the theme control gap.
    var LabelGap float64?
    /// Accessible name. Nil resolves to Label or an empty string.
    var AccessibilityName string?
    /// Optional content shown when false.
    var UncheckedContent Blob?
    /// Optional content shown when true.
    var CheckedContent Blob?
    /// Optional content shown when mixed.
    var MixedContent Blob?
    /// Visible box width and height. Zero uses five theme spacing units.
    var Size float64
    /// Hit-target square size, or labeled row height. Nil uses the larger of Size and the theme's control height.
    var HitSize float64?
    /// Background while false. Nil resolves to the theme field color.
    var BackgroundColor Color?
    /// Background while true or mixed. Nil resolves to the theme accent color.
    var CheckedBackgroundColor Color?
    /// Border while false. Nil resolves to the theme input border color.
    var BorderColor Color?
    /// Border while true or mixed. Nil resolves to the theme accent color.
    var CheckedBorderColor Color?
    /// Mark color. Nil resolves to the theme accent foreground color.
    var MarkColor Color?
    /// Disabled opacity. Nil resolves to 0.5 and preserves explicit zero.
    var DisabledOpacity float64?
    /// Border width. Nil resolves to the theme border width and preserves explicit zero.
    var BorderWidth float64?
    /// Corner radius. Nil resolves to the theme control radius half and preserves explicit zero.
    var BorderRadius float64?
    /// Mark icon size. Zero uses three and a half theme spacing units.
    var MarkSize float64
    /// Transition duration. Nil resolves to the theme transition duration and preserves explicit zero.
    var TransitionMs float64?
    /// Transition easing. Nil resolves to EaseOut.
    var TransitionEasing Easing?
    /// Creates the final button from resolved values and selected content, replacing the default root composition.
    var CreateRoot Func[Checkbox, Blob?, Button]?

    /// Builds a fresh Goo checkbox button or labeled interactive row.
    public func Build() Blob {
        let theme = Theme.Read()
        let createRoot = CreateRoot
        let onChange = OnChange
        let state = if State == AccessibilityChecked.Unspecified {
            AccessibilityChecked.False
        } else {
            State
        }
        let active = state != AccessibilityChecked.False
        let size = Size == 0.0 ? theme.Spacing * 5.0: Size
        let resolved = this with{
            State = state,
            AccessibilityName = AccessibilityName ?? (Label ?? ""),
            LabelColor = LabelColor ?? theme.TextColor,
            LabelFontSize = if LabelFontSize == 0.0 {
                theme.FontSize
            } else {
                LabelFontSize
            },
            LabelFontWeight = if LabelFontWeight == 0 {
                theme.FontWeight
            } else {
                LabelFontWeight
            },
            LabelGap = LabelGap ?? theme.ControlGap,
            Size = size,
            HitSize = HitSize ?? Math.Max(size, theme.ControlHeight),
            BackgroundColor = BackgroundColor ?? theme.FieldColor,
            CheckedBackgroundColor = CheckedBackgroundColor ?? theme.AccentColor,
            BorderColor = BorderColor ?? theme.InputBorderColor,
            CheckedBorderColor = CheckedBorderColor ?? theme.AccentColor,
            MarkColor = MarkColor ?? theme.OnAccentColor,
            DisabledOpacity = DisabledOpacity ?? 0.5,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.ControlRadius / 2.0,
            MarkSize = if MarkSize == 0.0 {
                theme.Spacing * 3.5
            } else {
                MarkSize
            },
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            CreateRoot = nil,
        }

        var content Blob? = UncheckedContent
        if state == AccessibilityChecked.True {
            content = CheckedContent
        } else if state == AccessibilityChecked.Mixed {
            content = MixedContent
        }
        if active && content == nil {
            let mark = if state == AccessibilityChecked.Mixed {
                "remove"
            } else {
                "check"
            }
            content = MaterialIcons.Create(mark, size: resolved.MarkSize, color: resolved.MarkColor!!)
        }

        if let createRoot = createRoot {
            let button = createRoot(resolved, content)
            WidgetKeyBindings.BindActivation(button)
            return button
        }
        var onClick Action? = nil
        if !resolved.Disabled {
            if let onChange = onChange {
                let next = if state == AccessibilityChecked.False {
                    AccessibilityChecked.True
                } else if state == AccessibilityChecked.True && resolved.AllowMixed {
                    AccessibilityChecked.Mixed
                } else {
                    AccessibilityChecked.False
                }
                onClick = () -> onChange(next)
            }
        }
        if let label = resolved.Label {
            let markBox = Container{
                Width: resolved.Size,
                Height: resolved.Size,
                BorderWidth: resolved.BorderWidth!!,
                BorderRadius: resolved.BorderRadius!!,
                BorderColor: if active {
                    resolved.CheckedBorderColor!!
                } else {
                    resolved.BorderColor!!
                },
                BackgroundColor: if active {
                    resolved.CheckedBackgroundColor!!
                } else {
                    resolved.BackgroundColor!!
                },
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.Center,
                HitTestSelf: false,
            }
            if let content = content {
                markBox.Children.Add(content)
            }
            let root = Button{
                LineHeight: theme.LineHeight,
                Width: Length.Auto,
                Height: resolved.HitSize!!,
                Padding: 0.0,
                Gap: resolved.LabelGap!!,
                BorderWidth: 0.0,
                BorderRadius: 0.0,
                BackgroundColor: Color.Transparent,
                Cursor: if resolved.Disabled {
                    Cursor.Default
                } else {
                    Cursor.Pointer
                },
                Opacity: if resolved.Disabled {
                    resolved.DisabledOpacity!!
                } else {
                    1.0
                },
                Focusable: true,
                Focus: theme.FocusStyle,
                Disabled: resolved.Disabled,
                OnClick: onClick,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.FlexStart,
                Hover: Style{BackgroundColor: Color.Transparent},
                Active: Style{BackgroundColor: Color.Transparent},
                Accessibility: Accessibility{
                    Role: AccessibilityRole.Checkbox,
                    Name: resolved.AccessibilityName!!,
                    Checked: state,
                },
                markBox,
                Text{
                    Content: label,
                    Color: resolved.LabelColor!!,
                    FontFamily: theme.FontFamily,
                    FontSize: resolved.LabelFontSize,
                    FontWeight: resolved.LabelFontWeight,
                },
            }
            WidgetKeyBindings.BindActivation(root)
            return root
        }
        let root = Button{
            Width: resolved.HitSize!!,
            Height: resolved.HitSize!!,
            BorderWidth: 0.0,
            BackgroundColor: Color.Transparent,
            Opacity: if resolved.Disabled {
                resolved.DisabledOpacity!!
            } else {
                1.0
            },
            Cursor: if resolved.Disabled {
                Cursor.Default
            } else {
                Cursor.Pointer
            },
            Focusable: true,
            Focus: theme.FocusStyle,
            Disabled: resolved.Disabled,
            OnClick: onClick,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Checkbox,
                Name: resolved.AccessibilityName!!,
                Checked: state,
            },
        }
        let markBox = Container{
            Width: resolved.Size,
            Height: resolved.Size,
            BorderWidth: resolved.BorderWidth!!,
            BorderRadius: resolved.BorderRadius!!,
            BorderColor: if active {
                resolved.CheckedBorderColor!!
            } else {
                resolved.BorderColor!!
            },
            BackgroundColor: if active {
                resolved.CheckedBackgroundColor!!
            } else {
                resolved.BackgroundColor!!
            },
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            HitTestSelf: false,
        }
        if let content = content {
            markBox.Children.Add(content)
        }
        root.Children.Add(markBox)
        WidgetKeyBindings.BindActivation(root)
        return root
    }
}
