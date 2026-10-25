package Goo.Widgets.Actions

import Goo
import Goo.Widgets
import System

/// An accessible icon-only button that accepts any Goo blob as its icon.
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
    var Width float64?
    /// Button height. Nil uses the resolved width.
    var Height float64?
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
    /// Disabled opacity. Nil resolves to 0.4.
    var DisabledOpacity float64?
    /// Optional base style for the root button.
    var RootStyle Style?
    /// Creates the final button from resolved props and icon content.
    var CreateRoot Func[IconButton, Blob, Button]?

    /// Builds a fresh Goo button tree.
    public func Build() Blob {
        let theme = Theme.Read()
        let createRoot = CreateRoot
        let width = Width ?? theme.ControlHeight
        let height = Height ?? width
        let resolved = this with{
            AccessibilityName = AccessibilityName ?? theme.Text("Icon action"),
            Width = width,
            Height = height,
            Padding = Padding ?? 0.0,
            BorderRadius = BorderRadius ?? theme.ControlRadius,
            BackgroundColor = BackgroundColor ?? Color.Transparent,
            ActiveBackgroundColor = ActiveBackgroundColor ?? theme.PressedColor,
            HoverBackgroundColor = HoverBackgroundColor ?? theme.HoverColor,
            FocusOutlineColor = FocusOutlineColor ?? theme.FocusColor,
            DisabledOpacity = DisabledOpacity ?? 0.4,
            CreateRoot = nil,
        }
        let icon = resolved.Icon ?? Container{Width: 0.0, Height: 0.0, Accessibility: Accessibility{Hidden: true}}
        if let createRoot = createRoot {
            let button = createRoot(resolved, icon)
            WidgetKeyBindings.BindActivation(button)
            return button
        }
        let button = Button{
            Width: resolved.Width!!,
            Height: resolved.Height!!,
            Padding: resolved.Padding!!,
            BorderRadius: resolved.BorderRadius!!,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Cursor: Cursor.Pointer,
            Disabled: resolved.Disabled,
            Opacity: if resolved.Disabled {
                resolved.DisabledOpacity!!
            } else {
                1.0
            },
            BackgroundColor: if resolved.Active {
                resolved.ActiveBackgroundColor!!
            } else {
                resolved.BackgroundColor!!
            },
            Hover: Style{BackgroundColor: resolved.HoverBackgroundColor!!},
            Focus: Style{OutlineWidth: 2.0, OutlineColor: resolved.FocusOutlineColor!!, OutlineOffset: 2.0},
            BasedOn: resolved.RootStyle,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Button,
                Name: resolved.AccessibilityName!!,
                Selected: resolved.Active,
            },
            OnClick: resolved.OnClick,
            icon,
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }
}
