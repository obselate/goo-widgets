package Goo.Widgets

import Goo

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
    /// Width of the context bar container. Nil resolves to Length.Percent(100.0).
    var Width Length?
    /// Background color of the context bar container. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Text color for the context bar. Nil resolves to #fafafa.
    var TextColor Color?
    /// Border color of the context bar container. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Background color of the dismiss button. Nil resolves to Color.Transparent.
    var DismissBackgroundColor Color?
    /// Text color of the dismiss button. Nil resolves to #a1a1aa.
    var DismissTextColor Color?
    /// Border color of the dismiss button. Nil resolves to Color.Transparent.
    var DismissBorderColor Color?
    /// Hover background color of the dismiss button. Nil resolves to #27272a.
    var DismissHoverBackgroundColor Color?
    /// Active background color of the dismiss button. Nil resolves to #3f3f46.
    var DismissActiveBackgroundColor Color?
    /// Focus border color of the dismiss button. Nil resolves to #d4d4d8.
    var DismissFocusBorderColor Color?
    /// Whether the focused dismiss button uses the configured focus border color.
    var ShowFocusHighlight bool
    /// Disabled background color of the dismiss button. Nil resolves to Color.Transparent.
    var DismissDisabledBackgroundColor Color?
    /// Disabled text color of the dismiss button. Nil resolves to #71717a.
    var DismissDisabledTextColor Color?
    /// Minimum height of the context bar container. Zero resolves to 44.0.
    var MinHeight float64
    /// Horizontal padding of the context bar container. Zero resolves to 12.0.
    var PaddingHorizontal float64
    /// Vertical padding of the context bar container. Zero resolves to 8.0.
    var PaddingVertical float64
    /// Spacing between caller content and dismiss action. Nil resolves to 10.0; explicit zero is preserved.
    var Gap float64?
    /// Border width of the context bar container. Nil resolves to 1.0; explicit zero is preserved.
    var BorderWidth float64?
    /// Border radius of the context bar container. Nil resolves to 8.0; explicit zero is preserved.
    var BorderRadius float64?
    /// Border radius of the dismiss button. Nil resolves to 5.0; explicit zero is preserved.
    var DismissBorderRadius float64?
    /// Border width of the dismiss button. Nil resolves to 1.0; explicit zero is preserved.
    var DismissBorderWidth float64?
    /// Transition duration in milliseconds. Nil resolves to 150.0; explicit zero is preserved.
    var TransitionMs float64?
    /// Easing curve applied to transitions. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Transform applied when the dismiss button is active/pressed. Nil resolves to PanelTransform{Scale: 0.98}.
    var DismissActiveTransform PanelTransform?
    /// Opacity of the context bar container. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Height of the dismiss button. Zero resolves to 28.0.
    var DismissHeight float64
    /// Minimum width of the dismiss button. Zero resolves to 72.0.
    var DismissMinWidth float64
    /// Horizontal padding of the dismiss button. Zero resolves to 10.0.
    var DismissPaddingHorizontal float64
    /// Font size of the dismiss button text. Zero resolves to 12.0.
    var DismissFontSize float64
    /// Font weight of the dismiss button text. Zero resolves to 600.
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
        let dismissText = DismissText ?? "Dismiss"
        let resolved = this with{
            AccessibilityName = AccessibilityName ?? "Context",
            DismissText = dismissText,
            DismissAccessibilityName = DismissAccessibilityName ?? dismissText,
            Width = Width ?? Length.Percent(100.0),
            BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
            TextColor = TextColor ?? Color.Parse("#fafafa"),
            BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
            DismissBorderColor = DismissBorderColor ?? Color.Transparent,
            DismissBackgroundColor = DismissBackgroundColor ?? Color.Transparent,
            DismissTextColor = DismissTextColor ?? Color.Parse("#a1a1aa"),
            DismissHoverBackgroundColor = DismissHoverBackgroundColor ?? Color.Parse("#27272a"),
            DismissActiveBackgroundColor = DismissActiveBackgroundColor ?? Color.Parse("#3f3f46"),
            DismissFocusBorderColor = DismissFocusBorderColor ?? Color.Parse("#d4d4d8"),
            DismissDisabledBackgroundColor = DismissDisabledBackgroundColor ?? Color.Transparent,
            DismissDisabledTextColor = DismissDisabledTextColor ?? Color.Parse("#71717a"),
            MinHeight = if MinHeight == 0.0 {
                44.0
            } else {
                MinHeight
            },
            PaddingHorizontal = if PaddingHorizontal == 0.0 {
                12.0
            } else {
                PaddingHorizontal
            },
            PaddingVertical = if PaddingVertical == 0.0 {
                8.0
            } else {
                PaddingVertical
            },
            Gap = Gap ?? 10.0,
            BorderWidth = BorderWidth ?? 1.0,
            DismissBorderWidth = DismissBorderWidth ?? 1.0,
            BorderRadius = BorderRadius ?? 8.0,
            DismissBorderRadius = DismissBorderRadius ?? 5.0,
            TransitionMs = TransitionMs ?? 150.0,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            DismissActiveTransform = DismissActiveTransform ?? PanelTransform{Scale: 0.98},
            Opacity = Opacity ?? 1.0,
            DismissHeight = if DismissHeight == 0.0 {
                28.0
            } else {
                DismissHeight
            },
            DismissMinWidth = if DismissMinWidth == 0.0 {
                72.0
            } else {
                DismissMinWidth
            },
            DismissPaddingHorizontal = if DismissPaddingHorizontal == 0.0 {
                10.0
            } else {
                DismissPaddingHorizontal
            },
            DismissFontSize = if DismissFontSize == 0.0 {
                12.0
            } else {
                DismissFontSize
            },
            DismissFontWeight = if DismissFontWeight == 0 {
                600
            } else {
                DismissFontWeight
            },
            Transform = Transform ?? PanelTransform{},
            CreateDismiss = nil,
            CreateRoot = nil,
        }
        var button Button? = nil
        if let createDismiss = createDismiss {
            button = createDismiss(resolved)
        } else {
            let label = if resolved.FontFamily != nil {
                Text{
                    Content: resolved.DismissText!!,
                    FontFamily: resolved.FontFamily!!,
                    FontSize: resolved.DismissFontSize,
                    FontWeight: resolved.DismissFontWeight,
                }
            } else {
                Text{
                    Content: resolved.DismissText!!,
                    FontSize: resolved.DismissFontSize,
                    FontWeight: resolved.DismissFontWeight,
                }
            }
            button = Button{
                Height: resolved.DismissHeight,
                MinWidth: resolved.DismissMinWidth,
                PaddingLeft: resolved.DismissPaddingHorizontal,
                PaddingRight: resolved.DismissPaddingHorizontal,
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
                Focus: if resolved.ShowFocusHighlight {
                    Style{BorderColor: resolved.DismissFocusBorderColor!!}
                } else {
                    Style{}
                },
                DisabledStyle: Style{
                    BackgroundColor: resolved.DismissDisabledBackgroundColor!!,
                    Color: resolved.DismissDisabledTextColor!!
                },
                Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: resolved.DismissAccessibilityName!!},
                label,
            }
        }
        if let createRoot = createRoot {
            return createRoot(resolved, Content, button!!)
        }
        let root = Container{
            FlexDirection: FlexDirection.Row,
            Width: resolved.Width!!,
            MinHeight: resolved.MinHeight,
            PaddingLeft: resolved.PaddingHorizontal,
            PaddingRight: resolved.PaddingHorizontal,
            PaddingTop: resolved.PaddingVertical,
            PaddingBottom: resolved.PaddingVertical,
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
