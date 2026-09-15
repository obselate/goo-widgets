package Goo.Widgets.Actions

import Goo
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
    /// Button width. Zero resolves to 40.0.
    var Width float64
    /// Button height. Zero resolves to the resolved width.
    var Height float64
    /// Button padding. Nil resolves to 0.0.
    var Padding float64?
    /// Button corner radius. Nil resolves to 8.0.
    var BorderRadius float64?
    /// Default button background. Nil resolves to transparent.
    var BackgroundColor Color?
    /// Active button background. Nil resolves to #27272a.
    var ActiveBackgroundColor Color?
    /// Hover button background. Nil resolves to #27272a.
    var HoverBackgroundColor Color?
    /// Enables the visible focus outline. Disabled by default.
    var ShowFocusHighlight bool
    /// Focus outline color. Nil resolves to #a1a1aa.
    var FocusOutlineColor Color?
    /// Disabled opacity. Nil resolves to 0.4.
    var DisabledOpacity float64?
    /// Optional base style for the root button.
    var RootStyle Style?
    /// Creates the final button from resolved props and icon content.
    var CreateRoot Func[IconButton, Blob, Button]?

    /// Builds a fresh Goo button tree.
    public func Build() Blob {
        let createRoot = CreateRoot
        let width = if Width == 0.0 {
            40.0
        } else {
            Width
        }
        let height = if Height == 0.0 {
            width
        } else {
            Height
        }
        let resolved = this with{
            AccessibilityName = AccessibilityName ?? "Icon action",
            Width = width,
            Height = height,
            Padding = Padding ?? 0.0,
            BorderRadius = BorderRadius ?? 8.0,
            BackgroundColor = BackgroundColor ?? Color.Transparent,
            ActiveBackgroundColor = ActiveBackgroundColor ?? Color.Parse("#27272a"),
            HoverBackgroundColor = HoverBackgroundColor ?? Color.Parse("#27272a"),
            FocusOutlineColor = FocusOutlineColor ?? Color.Parse("#a1a1aa"),
            DisabledOpacity = DisabledOpacity ?? 0.4,
            CreateRoot = nil,
        }
        let icon = resolved.Icon ?? Container{Width: 0.0, Height: 0.0, Accessibility: Accessibility{Hidden: true}}
        if let createRoot = createRoot {
            return createRoot(resolved, icon)
        }
        return Button(){
            .BasedOn: resolved.RootStyle,
            .Width: resolved.Width,
            .Height: resolved.Height,
            .Padding: resolved.Padding!!,
            .BorderRadius: resolved.BorderRadius!!,
            .AlignItems: AlignItems.Center,
            .JustifyContent: JustifyContent.Center,
            .Cursor: Cursor.Pointer,
            .Disabled: resolved.Disabled,
            .Opacity: if resolved.Disabled {
                resolved.DisabledOpacity!!
            } else {
                1.0
            },
            .BackgroundColor: if resolved.Active {
                resolved.ActiveBackgroundColor!!
            } else {
                resolved.BackgroundColor!!
            },
            .Hover: Style{BackgroundColor: resolved.HoverBackgroundColor!!},
            .Focus: if resolved.ShowFocusHighlight {
                Style{OutlineWidth: 2.0, OutlineColor: resolved.FocusOutlineColor!!, OutlineOffset: 2.0}
            } else {
                Style{}
            },
            .Accessibility: Accessibility{
                Role: AccessibilityRole.Button,
                Name: resolved.AccessibilityName!!,
                Selected: resolved.Active,
            },
            .OnClick: resolved.OnClick,
            icon,
        }
    }
}
