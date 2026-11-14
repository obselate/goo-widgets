package Goo.Widgets.Actions

import Goo
import Goo.Widgets
import System

/// An accessible icon-only button that accepts any Goo blob as its icon.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
public data struct IconButton {
    /// Visual content shown inside the button.
    var Icon Blob?
    /// Accessible button name.
    var AccessibilityName string?
    /// Action invoked by Goo button activation.
    var OnClick Action?
    /// Whether the button rejects input.
    var Disabled bool
    /// Whether the active visual state is selected.
    var Active bool
    /// Button width. Nil uses the theme control height.
    var Width Length?
    /// Button height. Nil uses the resolved width.
    var Height Length?
    /// Button padding. Nil resolves to 0.0.
    var Padding float64?
    /// Button corner radius. Nil uses the nearest theme radius.
    var BorderRadius float64?
    /// Default button background. Nil resolves to transparent.
    var BackgroundColor Color?
    /// Active button background. Nil uses the nearest theme.
    var ActiveBackgroundColor Color?
    /// Hover button background. Nil uses the nearest theme.
    var HoverBackgroundColor Color?
    /// Focus outline color. Nil uses the nearest theme.
    var FocusOutlineColor Color?
    /// Disabled opacity. Nil uses the theme.
    var DisabledOpacity float64?
    /// Optional base style for the root button.
    var RootStyle Style?
    /// Configures the fresh root before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: Accessibility.Name, Accessibility.Role, Accessibility.Selected, Disabled, Focusable, KeyBindings (required entries), OnClick.
    var ConfigureRoot Action[IconButton, Blob, Button]?

    /// Builds a fresh Goo button tree.
    public func Build() Blob {
        let theme = Theme.Read()
        let configureRoot = ConfigureRoot
        let defaultWidth Length = theme.ControlHeight
        let width = Width ?? defaultWidth
        let height = Height ?? width
        let resolved = this with{
            AccessibilityName = AccessibilityName ?? theme.Text("Icon action"),
            Width = width,
            Height = height,
            Padding = Padding ?? 0.0,
            BorderRadius = BorderRadius ?? theme.ControlRadius!!,
            BackgroundColor = BackgroundColor ?? Color.Transparent,
            ActiveBackgroundColor = ActiveBackgroundColor ?? theme.ActiveColor,
            HoverBackgroundColor = HoverBackgroundColor ?? theme.HoverColor,
            FocusOutlineColor = FocusOutlineColor ?? theme.FocusColor,
            DisabledOpacity = DisabledOpacity ?? theme.DisabledOpacity,
            ConfigureRoot = nil,
        }
        let icon = resolved.Icon ?? Container{Width: 0.0, Height: 0.0, Accessibility: Accessibility{Hidden: true}}
        let button = Button{
            Width: resolved.Width!!,
            Height: resolved.Height!!,
            Padding: resolved.Padding!!,
            BorderRadius: resolved.BorderRadius!!,
            AlignItems: AlignItems.Center,
            BorderWidth: theme.HighContrast ? theme.BorderWidth: 0,
            BorderColor: Color.Transparent,
            JustifyContent: JustifyContent.Center,
            Cursor: Cursor.Pointer,
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            BackgroundColor: if resolved.Active {
                resolved.ActiveBackgroundColor!!
            } else {
                resolved.BackgroundColor!!
            },
            HoverStyle: HoverBackgroundColor == nil ? nil: Style{BackgroundColor: HoverBackgroundColor!!},
            FocusStyle: FocusOutlineColor == nil ? nil: Style{OutlineColor: FocusOutlineColor!!},
            DisabledStyle: Style{BackgroundColor: Color.Transparent, Opacity: resolved.DisabledOpacity!!},
            BasedOn: resolved.RootStyle,
            icon,
        }
        if let configure = configureRoot {
            let originalAccessibilityName = (button.Accessibility?.Name ?? "")
            let originalAccessibilityRole = (button.Accessibility?.Role ?? AccessibilityRole(0))
            let originalAccessibilitySelected = button.Accessibility?.Selected
            let originalDisabled = button.Disabled
            let originalFocusable = button.Focusable
            configure.Invoke(resolved, icon, button)
            if (button.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("IconButton owns Accessibility.Name; set IconButton.AccessibilityName instead of changing it in ConfigureRoot")
            }
            if (button.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("IconButton owns Accessibility.Role; configure IconButton instead of changing it in ConfigureRoot")
            }
            if button.Accessibility?.Selected != originalAccessibilitySelected {
                throw InvalidOperationException("IconButton owns Accessibility.Selected; configure IconButton instead of changing it in ConfigureRoot")
            }
            if button.Disabled != originalDisabled {
                throw InvalidOperationException("IconButton owns Disabled; set IconButton.Disabled instead of changing it in ConfigureRoot")
            }
            if button.Focusable != originalFocusable {
                throw InvalidOperationException("IconButton owns Focusable; configure IconButton instead of changing it in ConfigureRoot")
            }
        }
        theme.ApplyInteraction(button, InteractionFamily.Button, Active)
        button.Disabled = Disabled
        button.Focusable = !Disabled
        let buttonAccessibility = if let configured = button.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        buttonAccessibility.Role = AccessibilityRole.Button
        buttonAccessibility.Name = resolved.AccessibilityName!!
        buttonAccessibility.Selected = Active
        button.Accessibility = buttonAccessibility
        button.OnClick = Disabled ? nil: button.OnClick ?? OnClick
        WidgetKeyBindings.BindActivation(button)
        return button
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w IconButton) Blob -> w.Build()
