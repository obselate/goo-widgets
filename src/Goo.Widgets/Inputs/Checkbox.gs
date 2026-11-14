package Goo.Widgets.Inputs

import System

import Goo
import Goo.Widgets
import Goo.Widgets.Icons

/// A controlled checkbox with false, true, and mixed accessibility states.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
public data struct Checkbox {
    /// Current checkbox state. Unspecified resolves to false.
    var Value AccessibilityChecked
    /// Whether activation cycles from true to mixed before false.
    var AllowMixed bool
    /// Whether the checkbox rejects input.
    var Disabled bool
    /// Called with the next state when the checkbox is activated.
    var OnChange Action[AccessibilityChecked]?
    /// Optional text rendered beside the checkbox mark as one interactive row.
    var Label string?
    /// Supporting text shown with the label. Nil omits it.
    var Description string?
    /// Uses a bordered card presentation for each labeled choice.
    var Card bool
    /// Label text color. Nil resolves to the theme text color.
    var LabelColor Color?
    /// Label font size. Nil uses the nearest theme font size.
    var LabelFontSize float64?
    /// Label font weight. Nil uses the nearest theme font weight.
    var LabelFontWeight int32?
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
    /// Visible box width and height. Nil uses five theme spacing units.
    var Size float64?
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
    /// Mark icon size. Nil uses three and a half theme spacing units.
    var MarkSize float64?
    /// Transition duration. Nil resolves to the theme transition duration and preserves explicit zero.
    var TransitionMs float64?
    /// Transition easing. Nil resolves to EaseOut.
    var TransitionEasing Easing?
    /// Configures the fresh root before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: Accessibility.Checked, Accessibility.Description, Accessibility.Name, Accessibility.Role, Disabled, Focusable, KeyBindings (required entries), OnClick.
    var ConfigureRoot Action[Checkbox, Blob?, Button]?

    /// Builds a fresh Goo checkbox button or labeled interactive row.
    public func Build() Blob {
        let theme = Theme.Read()
        let configureRoot = ConfigureRoot
        let onChange = OnChange
        let state = if Value == AccessibilityChecked.Unspecified {
            AccessibilityChecked.False
        } else {
            Value
        }
        let active = state != AccessibilityChecked.False
        let size = Size ?? theme.Spacing * 5.0
        let resolved = this with{
            Value = state,
            AccessibilityName = AccessibilityName ?? (Label ?? ""),
            LabelColor = LabelColor ?? theme.TextColor,
            LabelFontSize = LabelFontSize ?? theme.FontSize,
            LabelFontWeight = LabelFontWeight ?? theme.FontWeight,
            LabelGap = LabelGap ?? theme.ControlGap,
            Size = size,
            HitSize = HitSize ?? Math.Max(size, theme.ControlHeight),
            BackgroundColor = BackgroundColor ?? theme.FieldColor,
            CheckedBackgroundColor = CheckedBackgroundColor ?? theme.AccentColor,
            BorderColor = BorderColor ?? theme.InputBorderColor,
            CheckedBorderColor = CheckedBorderColor ?? theme.AccentColor,
            MarkColor = MarkColor ?? theme.OnAccentColor,
            DisabledOpacity = DisabledOpacity ?? theme.DisabledOpacity,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.ControlRadius!! / 2.0,
            MarkSize = MarkSize ?? theme.Spacing * 3.5,
            TransitionMs = theme.ReducedMotion ? 0.0: TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            ConfigureRoot = nil,
        }

        var content Blob? = UncheckedContent
        if state == AccessibilityChecked.True {
            content = CheckedContent
        } else if state == AccessibilityChecked.Mixed {
            content = MixedContent
        }
        if active && content == nil {
            let mark = if state == AccessibilityChecked.Mixed {
                ControlIcon.Remove
            } else {
                ControlIcon.Check
            }
            content = ControlIcons.Create(mark, size: resolved.MarkSize!!, color: Disabled ? theme.DisabledTextColor: resolved.MarkColor!!)
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
        let root = {
            let markBox = Container{
                Width: resolved.Size!!,
                Height: resolved.Size!!,
                BorderWidth: resolved.BorderWidth!!,
                BorderRadius: resolved.BorderRadius!!,
                BorderColor: Disabled ? theme.DisabledTextColor: active ? resolved.CheckedBorderColor!!: resolved.BorderColor!!,
                BackgroundColor: Disabled ? theme.SunkenColor: active ? resolved.CheckedBackgroundColor!!: resolved.BackgroundColor!!,
                BoxShadows: Disabled || active ? []BoxShadow{}: theme.FieldShadows,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.Center,
                HitTestSelf: false,
            }
            if let content = content { markBox.Children.Add(content) }
            let button = Button{
                Width: Label == nil ? resolved.HitSize!!: Length.Auto,
                MinHeight: resolved.HitSize!!,
                Gap: resolved.LabelGap!!,
                Cursor: Cursor.Pointer,
                BorderWidth: theme.HighContrast ? theme.BorderWidth: 0,
                BorderColor: Color.Transparent,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
                TransitionProperties: theme.InteractionTransitions,
                FlexDirection: FlexDirection.Row,
                JustifyContent: Label == nil ? JustifyContent.Center: JustifyContent.FlexStart,
                DisabledStyle: Style{BackgroundColor: Card && Label != nil ? theme.PanelColor: Color.Transparent, Opacity: resolved.DisabledOpacity!!},
                markBox,
            }
            if let label = resolved.Label {
                let text = Text{Content: label,
                    Color: Disabled ? theme.DisabledTextColor: active && Card ? theme.SelectedText(resolved.LabelColor!!): resolved.LabelColor!!,
                    FontFamily: theme.FontFamily, FontSize: resolved.LabelFontSize!!, FontWeight: resolved.LabelFontWeight!!}
                if let description = resolved.Description {
                    button.Children.Add(Container{Gap: theme.Spacing, text,
                        Text{Content: description, Color: Disabled ? theme.DisabledTextColor: active && Card ? theme.SelectedText(theme.MutedTextColor): theme.MutedTextColor, FontSize: theme.CaptionFontSize}})
                } else { button.Children.Add(text) }
            }
            if Label == nil || (!resolved.Card && resolved.Description == nil) { button.Height = resolved.HitSize!! }
            if resolved.Card && Label != nil {
                button.Padding = theme.ControlPadding
                button.BorderWidth = resolved.BorderWidth!!
                button.BorderRadius = theme.ControlRadius!!
                button.BorderColor = active ? resolved.CheckedBorderColor!!: resolved.BorderColor!!
                button.BackgroundColor = active ? theme.SelectedFill(theme.ActiveColor): theme.PanelColor
            }
            if Label != nil && !resolved.Card {
                button.AlignSelf = AlignSelf.FlexStart
                button.BorderRadius = theme.ControlRadius!!
                button.PaddingStart = theme.Spacing * 2.0
                button.PaddingEnd = theme.Spacing * 2.0
            }
            button
        }
        if let configure = configureRoot {
            let originalAccessibilityChecked = (root.Accessibility?.Checked ?? AccessibilityChecked(0))
            let originalAccessibilityDescription = (root.Accessibility?.Description ?? "")
            let originalAccessibilityName = (root.Accessibility?.Name ?? "")
            let originalAccessibilityRole = (root.Accessibility?.Role ?? AccessibilityRole(0))
            let originalDisabled = root.Disabled
            let originalFocusable = root.Focusable
            let originalOnClick = root.OnClick
            configure.Invoke(resolved, content, root)
            if (root.Accessibility?.Checked ?? AccessibilityChecked(0)) != originalAccessibilityChecked {
                throw InvalidOperationException("Checkbox owns Accessibility.Checked; configure Checkbox instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Description ?? "") != originalAccessibilityDescription {
                throw InvalidOperationException("Checkbox owns Accessibility.Description; set Checkbox.Description instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("Checkbox owns Accessibility.Name; set Checkbox.AccessibilityName instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("Checkbox owns Accessibility.Role; configure Checkbox instead of changing it in ConfigureRoot")
            }
            if root.Disabled != originalDisabled {
                throw InvalidOperationException("Checkbox owns Disabled; set Checkbox.Disabled instead of changing it in ConfigureRoot")
            }
            if root.Focusable != originalFocusable {
                throw InvalidOperationException("Checkbox owns Focusable; configure Checkbox instead of changing it in ConfigureRoot")
            }
            if root.OnClick != originalOnClick {
                throw InvalidOperationException("Checkbox owns OnClick; configure Checkbox instead of changing it in ConfigureRoot")
            }
        }
        theme.ApplyInteraction(root, InteractionFamily.Toggle, active && Card && Label != nil)
        if Label != nil && !Card && configureRoot == nil {
            root.FocusStyle = Style{BasedOn: root.FocusStyle, OutlineOffset: -theme.FocusRingWidth}
        }
        root.Disabled = Disabled
        root.Focusable = !Disabled
        root.OnClick = onClick
        let rootAccessibility = if let configured = root.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        rootAccessibility.Role = AccessibilityRole.Checkbox
        rootAccessibility.Name = resolved.AccessibilityName!!
        rootAccessibility.Checked = state
        rootAccessibility.Description = resolved.Description ?? ""
        root.Accessibility = rootAccessibility
        WidgetKeyBindings.BindActivation(root)
        return root
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w Checkbox) Blob -> w.Build()
