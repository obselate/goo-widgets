package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System

/// A controlled radio choice. RadioGroup owns selection and navigation for grouped choices.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
public data struct RadioButton {
    /// Controlled checked value. False means unchecked.
    var Value bool
    /// Requests true when an unchecked choice is activated. Nil ignores the request.
    var OnChange Action[bool]?
    /// Visible label. Nil leaves the label empty.
    var Label string?
    /// Supporting text. Nil omits it.
    var Description string?
    /// Content before the label. Nil leaves this slot empty.
    var Leading Blob?
    /// Uses a bordered card presentation.
    var Card bool
    /// Rejects interaction and removes the choice from Tab traversal.
    var Disabled bool
    /// Accessible name. Nil uses Label or the localized default.
    var AccessibilityName string?
    /// Configures the fresh root before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    var ConfigureRoot Action[RadioButton, Button]?

    /// Builds one focusable radio choice. Activation never clears a checked value.
    public func Build() Blob {
        let theme = Theme.Read()
        let selected = Value
        let enabled = !Disabled
        let onChange = OnChange
        let fluentSelected = selected && theme.Controls == ControlStyle.Fluent
        let mark = Container{
            Width: theme.Spacing * 4.5,
            Height: theme.Spacing * 4.5,
            FlexShrink: 0,
            BorderRadius: theme.Spacing * 2.25,
            BorderWidth: theme.BorderWidth,
            BorderColor: enabled ? selected ? theme.AccentColor: theme.InputBorderColor: theme.DisabledTextColor,
            BackgroundColor: enabled ? fluentSelected ? theme.AccentColor: theme.FieldColor: theme.SunkenColor,
            BoxShadows: enabled ? theme.FieldShadows: []BoxShadow{},
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
        }
        if selected {
            mark.Children.Add(
                Container{
                    Width: theme.Spacing * 2.5,
                    Height: theme.Spacing * 2.5,
                    BorderRadius: theme.Spacing * 1.25,
                    BackgroundColor: enabled ? fluentSelected ? theme.OnAccentColor: theme.AccentColor: theme.DisabledTextColor
                }
            )
        }
        let text = Container{
            Gap: theme.Spacing,
            Text{Content: Label ?? "", FontFamily: theme.FontFamily, FontSize: theme.FontSize}
        }
        if let description = Description {
            text.Children.Add(
                Text{
                    Content: description,
                    Color: !enabled ? theme.DisabledTextColor: selected && Card ? theme.SelectedText(
                        theme.MutedTextColor
                    ): theme.MutedTextColor,
                    FontSize: theme.CaptionFontSize
                }
            )
        }
        var button = Button{
            Direction: theme.Direction,
            MinHeight: theme.ControlHeight,
            FlexDirection: FlexDirection.Row,
            JustifyContent: JustifyContent.FlexStart,
            Gap: theme.ControlGap,
            Color: enabled ? selected && Card ? theme.SelectedText(
                theme.TextColor
            ): theme.TextColor: theme.DisabledTextColor,
            BorderWidth: Card || theme.HighContrast ? theme.BorderWidth: 0,
            BorderRadius: theme.ControlRadius!!,
            BorderColor: selected ? theme.AccentColor: theme.InputBorderColor,
            Padding: Card ? theme.ControlPadding: 0,
            BackgroundColor: Card ? selected ? theme.SelectedFill(
                theme.ActiveColor
            ): theme.PanelColor: Color.Transparent,
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            DisabledStyle: Style{BackgroundColor: Card ? theme.PanelColor: Color.Transparent},
            mark,
        }
        if let leading = Leading {
            button.Children.Add(leading)
        }
        button.Children.Add(text)
        if !Card {
            button.AlignSelf = AlignSelf.FlexStart
            button.PaddingStart = theme.Spacing * 2.0
            button.PaddingEnd = theme.Spacing * 2.0
        }
        ConfigureRoot?.Invoke(this, button)
        theme.ApplyInteraction(button, InteractionFamily.Toggle, selected && Card)
        if !Card && ConfigureRoot == nil {
            button.FocusStyle = Style{BasedOn: button.FocusStyle, OutlineOffset: -theme.FocusRingWidth}
        }
        button.Disabled = !enabled
        button.Focusable = enabled
        button.TabStop = enabled
        button.OnClick = () -> {
            if enabled && !selected {
                onChange?.Invoke(true)
            }
        }
        button.Accessibility = Accessibility{
            Role: AccessibilityRole.Radio,
            Name: AccessibilityName ?? Label ?? theme.Text("Choices"),
            Description: Description ?? "",
            Checked: selected ? AccessibilityChecked.True: AccessibilityChecked.False,
        }
        WidgetKeyBindings.BindOwnedActivation(button)
        return button
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w RadioButton) Blob -> w.Build()
