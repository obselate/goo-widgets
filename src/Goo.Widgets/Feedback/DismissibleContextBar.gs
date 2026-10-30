package Goo.Widgets.Feedback

import Goo
import Goo.Widgets

/// A horizontal context bar with caller content, an integrated dismiss button, and customizable factories.
public data struct DismissibleContextBar {
    /// Hosted content element placed before the dismiss action.
    var Content Blob?
    /// Accessible name for the context bar group container. Nil resolves to "Context".
    var AccessibilityName string?
    /// Text content for the dismiss action button. Nil resolves to "Dismiss".
    var DismissText string?
    /// Accessible name for the dismiss button. Nil resolves to the resolved dismiss text.
    var DismissAccessibilityName string?
    /// Action invoked when the dismiss button is activated.
    var OnDismiss Action?
    /// Whether the context bar dismiss button rejects input.
    var Disabled bool
    /// Width of the context bar container. Nil resolves to Percent(100.0).
    var Width Length?
    /// Background color of the context bar container. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Text color for the context bar. Nil uses the nearest theme.
    var TextColor Color?
    /// Border color of the context bar container. Nil uses the nearest theme.
    var BorderColor Color?
    /// Background color of the dismiss button. Nil resolves to Color.Transparent.
    var DismissBackgroundColor Color?
    /// Text color of the dismiss button. Nil uses the nearest theme.
    var DismissTextColor Color?
    /// Border color of the dismiss button. Nil resolves to Color.Transparent.
    var DismissBorderColor Color?
    /// Hover background color of the dismiss button. Nil uses the nearest theme.
    var DismissHoverBackgroundColor Color?
    /// Active background color of the dismiss button. Nil uses the nearest theme.
    var DismissActiveBackgroundColor Color?
    /// Focus border color of the dismiss button. Nil uses the nearest theme.
    var DismissFocusBorderColor Color?
    /// Disabled background color of the dismiss button. Nil resolves to Color.Transparent.
    var DismissDisabledBackgroundColor Color?
    /// Disabled text color of the dismiss button. Nil uses the nearest theme.
    var DismissDisabledTextColor Color?
    /// Minimum height of the context bar container. Nil resolves to theme.ControlHeight.
    var MinHeight float64?
    /// Horizontal padding of the context bar container. Nil resolves to theme.PanelPadding.
    var PaddingHorizontal float64?
    /// Vertical padding of the context bar container. Nil resolves to theme.PanelPadding.
    var PaddingVertical float64?
    /// Spacing between caller content and dismiss action. Nil resolves to theme.ControlGap; explicit zero is preserved.
    var Gap float64?
    /// Border width of the context bar container. Nil resolves to 1.0; explicit zero is preserved.
    var BorderWidth float64?
    /// Border radius of the context bar container. Nil resolves to theme.PanelRadius; explicit zero is preserved.
    var BorderRadius float64?
    /// Border radius of the dismiss button. Nil resolves to theme.PanelRadius; explicit zero is preserved.
    var DismissBorderRadius float64?
    /// Border width of the dismiss button. Nil resolves to 1.0; explicit zero is preserved.
    var DismissBorderWidth float64?
    /// Transition duration in milliseconds. Nil resolves to theme.TransitionMs; explicit zero is preserved.
    var TransitionMs float64?
    /// Easing curve applied to transitions. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Transform applied when the dismiss button is active/pressed. Nil resolves to identity transform.
    var DismissActiveTransform PanelTransform?
    /// Opacity of the context bar container. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Height of the dismiss button. Nil resolves to theme.ControlHeight.
    var DismissHeight float64?
    /// Minimum width of the dismiss button. Nil resolves to 72.0.
    var DismissMinWidth float64?
    /// Horizontal padding of the dismiss button. Nil resolves to theme.ControlPadding.
    var DismissPaddingHorizontal float64?
    /// Font size of the dismiss button text. Zero resolves to theme.FontSize.
    var DismissFontSize float64
    /// Font weight of the dismiss button text. Zero resolves to theme.FontWeight.
    var DismissFontWeight int32
    /// Optional font family for the dismiss button text.
    var FontFamily string?
    /// Transform applied to the context bar container. Nil resolves to identity.
    var Transform PanelTransform?
    /// Custom factory for creating the dismiss Button from resolved props.
    var CreateDismiss Func[DismissibleContextBar, Button]?
    /// Custom factory for creating the root Container from resolved props, caller Content, and final Button.
    var CreateRoot Func[DismissibleContextBar, Blob?, Button, Container]?

    /// Builds a fresh Goo context bar element tree after resolving props and factories.
    public func Build() Blob {
        let createDismiss = CreateDismiss
        let createRoot = CreateRoot
        let theme = Theme.Read()
        let dismissText = DismissText ?? theme.Text("Dismiss")
        let resolved = this with{
            AccessibilityName = AccessibilityName ?? theme.Text("Context"),
            DismissText = dismissText,
            DismissAccessibilityName = DismissAccessibilityName ?? dismissText,
            Width = Width ?? Percent(100.0),
            BackgroundColor = BackgroundColor ?? theme.PanelColor,
            TextColor = TextColor ?? theme.TextColor,
            BorderColor = BorderColor ?? theme.BorderColor,
            DismissBorderColor = DismissBorderColor ?? Color.Transparent,
            DismissBackgroundColor = DismissBackgroundColor ?? Color.Transparent,
            DismissTextColor = DismissTextColor ?? theme.MutedTextColor,
            DismissHoverBackgroundColor = DismissHoverBackgroundColor ?? theme.HoverColor,
            DismissActiveBackgroundColor = DismissActiveBackgroundColor ?? theme.BorderColor,
            DismissFocusBorderColor = DismissFocusBorderColor ?? theme.FocusColor,
            DismissDisabledBackgroundColor = DismissDisabledBackgroundColor ?? Color.Transparent,
            DismissDisabledTextColor = DismissDisabledTextColor ?? theme.FaintTextColor,
            MinHeight = MinHeight ?? theme.ControlHeight,
            PaddingHorizontal = PaddingHorizontal ?? theme.PanelPadding,
            PaddingVertical = PaddingVertical ?? theme.PanelPadding,
            Gap = Gap ?? theme.ControlGap,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            DismissBorderWidth = DismissBorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.PanelRadius,
            DismissBorderRadius = DismissBorderRadius ?? theme.ControlRadius,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            DismissActiveTransform = DismissActiveTransform ?? PanelTransform{},
            Opacity = Opacity ?? 1.0,
            DismissHeight = DismissHeight ?? theme.ControlHeight,
            DismissMinWidth = DismissMinWidth ?? theme.ControlMinWidth,
            DismissPaddingHorizontal = DismissPaddingHorizontal ?? theme.ControlPadding,
            DismissFontSize = if DismissFontSize == 0.0 {
                theme.FontSize
            } else {
                DismissFontSize
            },
            DismissFontWeight = if DismissFontWeight == 0 {
                theme.FontWeight
            } else {
                DismissFontWeight
            },
            FontFamily = FontFamily ?? theme.FontFamily,
            Transform = Transform ?? PanelTransform{},
            CreateDismiss = nil,
            CreateRoot = nil,
        }
        var button Button? = nil
        if let createDismiss = createDismiss {
            button = createDismiss(resolved)
        } else {
            let label = Text{
                Content: resolved.DismissText!!,
                FontFamily: resolved.FontFamily ?? theme.FontFamily,
                FontSize: resolved.DismissFontSize,
                FontWeight: resolved.DismissFontWeight,
            }
            button = Button{
                Height: resolved.DismissHeight!!,
                MinWidth: resolved.DismissMinWidth!!,
                Padding: Edges{Right: resolved.DismissPaddingHorizontal!!, Left: resolved.DismissPaddingHorizontal!!},
                BorderWidth: resolved.DismissBorderWidth!!,
                BorderColor: resolved.DismissBorderColor!!,
                BorderRadius: resolved.DismissBorderRadius!!,
                BackgroundColor: resolved.DismissBackgroundColor!!,
                Color: resolved.DismissTextColor!!,
                FlexShrink: 0.0,
                Cursor: Cursor.Pointer,
                Focusable: true,
                Disabled: resolved.Disabled,
                OnClick: resolved.OnDismiss,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
                Hover: Style{BackgroundColor: resolved.DismissHoverBackgroundColor!!},
                Active: Style{
                    BackgroundColor: resolved.DismissActiveBackgroundColor!!,
                    Transform: resolved.DismissActiveTransform!!
                },
                Focus: Style{OutlineWidth: theme.FocusRingWidth, OutlineColor: resolved.DismissFocusBorderColor!!, OutlineOffset: theme.FocusRingOffset},
                DisabledStyle: Style{
                    BackgroundColor: resolved.DismissDisabledBackgroundColor!!,
                    Color: resolved.DismissDisabledTextColor!!
                },
                Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: resolved.DismissAccessibilityName!!},
                label,
            }
        }
        WidgetKeyBindings.BindActivation(button!!)
        if let createRoot = createRoot {
            return createRoot(resolved, Content, button!!)
        }
        let root = Container{
            LineHeight: theme.LineHeight,
            FlexDirection: FlexDirection.Row,
            Width: resolved.Width!!,
            MinHeight: resolved.MinHeight!!,
            Padding: Edges(resolved.PaddingVertical!!, resolved.PaddingHorizontal!!),
            Gap: resolved.Gap!!,
            BackgroundColor: resolved.BackgroundColor!!,
            Color: resolved.TextColor!!,
            BorderColor: resolved.BorderColor!!,
            BorderWidth: resolved.BorderWidth!!,
            BorderRadius: resolved.BorderRadius!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.SpaceBetween,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: resolved.AccessibilityName!!},
        }
        if let content = Content {
            root.Children.Add(content)
        }
        root.Children.Add(button!!)
        return root
    }
}
