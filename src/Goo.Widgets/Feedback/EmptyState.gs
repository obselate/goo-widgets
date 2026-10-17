package Goo.Widgets.Feedback

import Goo

/// A semantic empty state container with illustration, title, description, action, and slot wrappers.
public data struct EmptyState {
    /// Optional illustration slot element.
    var Illustration Blob?
    /// Primary title text. Nil resolves to empty string.
    var Title string?
    /// Optional secondary description text. Nil omits the description primitive.
    var Description string?
    /// Optional action slot element.
    var Action Blob?
    /// Accessible name. Nil resolves to the resolved title.
    var AccessibilityName string?
    /// Heading level for the title Text. Zero resolves to 2.
    var HeadingLevel int32
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Minimum height for the root container. Nil resolves to 240.0; explicit zero is preserved.
    var MinHeight float64?
    /// Background color of the root container. Nil resolves to Color.Transparent.
    var BackgroundColor Color?
    /// Border color of the root container. Nil resolves to theme.BorderColor.
    var BorderColor Color?
    /// Title text color. Nil resolves to theme.TextColor.
    var TitleColor Color?
    /// Description text color. Nil resolves to theme.MutedTextColor.
    var DescriptionColor Color?
    /// Horizontal padding. Nil resolves to theme.PanelPadding; explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Vertical padding. Nil resolves to theme.PanelPadding; explicit zero is preserved.
    var PaddingVertical float64?
    /// Main layout gap between illustration, copy, and action. Nil resolves to theme.ControlGap; explicit zero is preserved.
    var Gap float64?
    /// Layout gap between title and description inside the copy container. Nil resolves to theme.ControlGap; explicit zero is preserved.
    var TextGap float64?
    /// Border stroke width. Nil resolves to 0.0; explicit zero is preserved.
    var BorderWidth float64?
    /// Corner radius of the root container. Nil resolves to theme.PanelRadius; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration in milliseconds. Nil resolves to theme.TransitionMs; explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Root opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Title font size. Zero resolves to theme.HeadingFontSize.
    var TitleFontSize float64
    /// Title font weight. Zero resolves to theme.HeadingFontWeight.
    var TitleFontWeight int32
    /// Description font size. Zero resolves to theme.CaptionFontSize.
    var DescriptionFontSize float64
    /// Description font weight. Zero resolves to theme.CaptionFontWeight.
    var DescriptionFontWeight int32
    /// Optional font family for title and description elements.
    var FontFamily string?
    /// Transform applied to the root container. Nil resolves to identity.
    var Transform PanelTransform?
    /// Custom factory for the title Text. Receives resolved props.
    var CreateTitle Func[EmptyState, Text]?
    /// Custom factory for the description Text. Receives resolved props.
    var CreateDescription Func[EmptyState, Text]?
    /// Custom factory for the root Container. Receives resolved props, Illustration, title Text, description Text, and Action.
    var CreateRoot Func[EmptyState, Blob?, Text, Text?, Blob?, Container]?

    /// Builds a fresh Goo element tree after resolving props and factories.
    public func Build() Blob {
        let illustrationSlot = Illustration
        let actionSlot = Action
        let createTitle = CreateTitle
        let createDescription = CreateDescription
        let createRoot = CreateRoot

        let theme = Theme.Read()
        let resolvedTitle = Title ?? ""
        let resolved = this with{
            Title = resolvedTitle,
            AccessibilityName = AccessibilityName ?? resolvedTitle,
            HeadingLevel = if HeadingLevel == 0 {
                2
            } else {
                HeadingLevel
            },
            Width = Width ?? Percent(100.0),
            MinHeight = MinHeight ?? 240.0,
            BackgroundColor = BackgroundColor ?? Color.Transparent,
            BorderColor = BorderColor ?? theme.BorderColor,
            TitleColor = TitleColor ?? theme.TextColor,
            DescriptionColor = DescriptionColor ?? theme.MutedTextColor,
            PaddingHorizontal = PaddingHorizontal ?? theme.PanelPadding,
            PaddingVertical = PaddingVertical ?? theme.PanelPadding,
            Gap = Gap ?? theme.ControlGap,
            TextGap = TextGap ?? theme.ControlGap,
            BorderWidth = BorderWidth ?? 0.0,
            BorderRadius = BorderRadius ?? theme.PanelRadius,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            TitleFontSize = if TitleFontSize == 0.0 {
                theme.HeadingFontSize
            } else {
                TitleFontSize
            },
            TitleFontWeight = if TitleFontWeight == 0 {
                theme.HeadingFontWeight
            } else {
                TitleFontWeight
            },
            DescriptionFontSize = if DescriptionFontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                DescriptionFontSize
            },
            DescriptionFontWeight = if DescriptionFontWeight == 0 {
                theme.CaptionFontWeight
            } else {
                DescriptionFontWeight
            },
            Transform = Transform ?? PanelTransform{},
            CreateTitle = nil,
            CreateDescription = nil,
            CreateRoot = nil,
        }

        var title Text? = nil
        if let createTitle = createTitle {
            title = createTitle(resolved)
        } else {
            title = Text{
                Content: resolved.Title!!,
                Color: resolved.TitleColor!!,
                FontFamily: resolved.FontFamily ?? theme.FontFamily,
                FontSize: resolved.TitleFontSize,
                FontWeight: resolved.TitleFontWeight,
                Accessibility: Accessibility{
                    Role: AccessibilityRole.Heading,
                    Name: resolved.Title!!,
                    Level: resolved.HeadingLevel
                }
            }
        }

        var description Text? = nil
        if resolved.Description != nil {
            if let createDescription = createDescription {
                description = createDescription(resolved)
            } else {
                description = Text{
                    Content: resolved.Description!!,
                    Color: resolved.DescriptionColor!!,
                    FontFamily: resolved.FontFamily ?? theme.FontFamily,
                    FontSize: resolved.DescriptionFontSize,
                    FontWeight: resolved.DescriptionFontWeight
                }
            }
        }

        if let createRoot = createRoot {
            return createRoot(resolved, illustrationSlot, title!!, description, actionSlot)
        }

        let copyContainer = Container{
            Key: "copy",
            FlexDirection: FlexDirection.Column,
            AlignItems: AlignItems.Center,
            Gap: resolved.TextGap!!
        }
        copyContainer.Children.Add(title!!)
        if let description = description {
            copyContainer.Children.Add(description)
        }

        let root = Container{
            Width: resolved.Width!!,
            MinHeight: resolved.MinHeight!!,
            Padding: Edges(resolved.PaddingVertical!!, resolved.PaddingHorizontal!!),
            BackgroundColor: resolved.BackgroundColor!!,
            BorderColor: resolved.BorderColor!!,
            BorderWidth: resolved.BorderWidth!!,
            BorderRadius: resolved.BorderRadius!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            FlexDirection: FlexDirection.Column,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Gap: resolved.Gap!!,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: resolved.AccessibilityName!!}
        }

        if let illustration = illustrationSlot {
            let wrapIll = Container{Key: "illustration"}
            wrapIll.Children.Add(illustration)
            root.Children.Add(wrapIll)
        }
        root.Children.Add(copyContainer)
        if let action = actionSlot {
            let wrapAct = Container{Key: "action"}
            wrapAct.Children.Add(action)
            root.Children.Add(wrapAct)
        }
        return root
    }
}
