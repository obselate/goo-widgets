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
    /// Background color of the root container. Nil resolves to #00000000.
    var BackgroundColor Color?
    /// Border color of the root container. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Title text color. Nil resolves to #fafafa.
    var TitleColor Color?
    /// Description text color. Nil resolves to #a1a1aa.
    var DescriptionColor Color?
    /// Horizontal padding. Nil resolves to 32.0; explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Vertical padding. Nil resolves to 40.0; explicit zero is preserved.
    var PaddingVertical float64?
    /// Main layout gap between illustration, copy, and action. Nil resolves to 16.0; explicit zero is preserved.
    var Gap float64?
    /// Layout gap between title and description inside the copy container. Nil resolves to 6.0; explicit zero is preserved.
    var TextGap float64?
    /// Border stroke width. Nil resolves to 0.0; explicit zero is preserved.
    var BorderWidth float64?
    /// Corner radius of the root container. Nil resolves to 12.0; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration in milliseconds. Nil resolves to 150.0; explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Root opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Title font size. Zero resolves to 20.0.
    var TitleFontSize float64
    /// Title font weight. Zero resolves to 700.
    var TitleFontWeight int32
    /// Description font size. Zero resolves to 14.0.
    var DescriptionFontSize float64
    /// Description font weight. Zero resolves to 400.
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

        let resolvedTitle = Title ?? ""
        let resolved = this with{
            Title = resolvedTitle,
            AccessibilityName = AccessibilityName ?? resolvedTitle,
            HeadingLevel = if HeadingLevel == 0 {
                2
            } else {
                HeadingLevel
            },
            Width = Width ?? Length.Percent(100.0),
            MinHeight = MinHeight ?? 240.0,
            BackgroundColor = BackgroundColor ?? Color.Parse("#00000000"),
            BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
            TitleColor = TitleColor ?? Color.Parse("#fafafa"),
            DescriptionColor = DescriptionColor ?? Color.Parse("#a1a1aa"),
            PaddingHorizontal = PaddingHorizontal ?? 32.0,
            PaddingVertical = PaddingVertical ?? 40.0,
            Gap = Gap ?? 16.0,
            TextGap = TextGap ?? 6.0,
            BorderWidth = BorderWidth ?? 0.0,
            BorderRadius = BorderRadius ?? 12.0,
            TransitionMs = TransitionMs ?? 150.0,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            TitleFontSize = if TitleFontSize == 0.0 {
                20.0
            } else {
                TitleFontSize
            },
            TitleFontWeight = if TitleFontWeight == 0 {
                700
            } else {
                TitleFontWeight
            },
            DescriptionFontSize = if DescriptionFontSize == 0.0 {
                14.0
            } else {
                DescriptionFontSize
            },
            DescriptionFontWeight = if DescriptionFontWeight == 0 {
                400
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
                FontSize: resolved.TitleFontSize,
                FontWeight: resolved.TitleFontWeight,
                Accessibility: Accessibility{
                    Role: AccessibilityRole.Heading,
                    Name: resolved.Title!!,
                    Level: resolved.HeadingLevel
                }
            }
            if resolved.FontFamily != nil {
                title.FontFamily = resolved.FontFamily!!
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
                    FontSize: resolved.DescriptionFontSize,
                    FontWeight: resolved.DescriptionFontWeight
                }
                if resolved.FontFamily != nil {
                    description.FontFamily = resolved.FontFamily!!
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
            PaddingLeft: resolved.PaddingHorizontal!!,
            PaddingRight: resolved.PaddingHorizontal!!,
            PaddingTop: resolved.PaddingVertical!!,
            PaddingBottom: resolved.PaddingVertical!!,
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
