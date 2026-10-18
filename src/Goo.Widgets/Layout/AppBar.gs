package Goo.Widgets.Layout

import Goo
import Goo.Widgets

/// An application header bar with slots, title/subtitle typography, bottom border, shadow, and custom factories.
public data struct AppBar {
    /// Optional leading slot element (e.g. navigation icon or drawer toggle).
    var Leading Blob?
    /// Primary title text. Nil resolves to an empty string.
    var Title string?
    /// Optional subtitle text displayed beneath the title.
    var Subtitle string?
    /// Optional trailing slot element (e.g. actions or profile menu).
    var Trailing Blob?
    /// Accessible group name. Nil resolves to the resolved Title.
    var AccessibilityName string?
    /// Accessible heading level for the title Text. Zero or default resolves to 1.
    var HeadingLevel int32
    /// Bar width. Nil resolves to Percent(100.0).
    var Width Length?
    /// Bar height. Nil uses the nearest theme spacing.
    var Height float64?
    /// Bar background color. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Inherited title and content text color. Nil uses the nearest theme.
    var TextColor Color?
    /// Subtitle text color. Nil uses the nearest theme.
    var SubtitleColor Color?
    /// Bottom border color. Nil uses the nearest theme.
    var BorderColor Color?
    /// Horizontal padding on left and right edges. Nil uses the nearest theme padding; explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Spacing between slots and the title content stack. Nil uses the nearest theme gap; explicit zero is preserved.
    var Gap float64?
    /// Spacing between title and subtitle inside the content stack. Nil uses the nearest theme spacing; explicit zero is preserved.
    var TitleGap float64?
    /// Title text font size. Zero uses the nearest theme heading font size.
    var TitleFontSize float64
    /// Title text font weight. Zero uses the nearest theme heading font weight.
    var TitleFontWeight int32
    /// Subtitle text font size. Zero uses the nearest theme caption font size.
    var SubtitleFontSize float64
    /// Subtitle text font weight. Zero uses the nearest theme caption font weight.
    var SubtitleFontWeight int32
    /// Bottom border width. Nil uses the nearest theme border width; explicit zero is preserved.
    var BorderWidth float64?
    /// Optional authored shadow. Nil leaves the bar unshadowed.
    var BoxShadow BoxShadow?
    /// Bar opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Optional font family applied to default title and subtitle Text elements.
    var FontFamily string?
    /// Transform applied to the root container. Nil resolves to identity.
    var Transform PanelTransform?
    /// Custom factory for the title Text element. Receives resolved props.
    var CreateTitle Func[AppBar, Text]?
    /// Custom factory for the subtitle Text element. Receives resolved props.
    var CreateSubtitle Func[AppBar, Text]?
    /// Custom factory for the root Container. Receives resolved props and slot/text primitives directly.
    var CreateRoot Func[AppBar, Blob?, Text, Text?, Blob?, Container]?

    /// Builds a fresh Goo element tree after resolving props and factories.
    public func Build() Blob {
        let theme = Theme.Read()
        let createTitle = CreateTitle
        let createSubtitle = CreateSubtitle
        let createRoot = CreateRoot
        let titleText = Title ?? ""
        let resolved = this with{
            Title = titleText,
            AccessibilityName = AccessibilityName ?? titleText,
            HeadingLevel = if HeadingLevel == 0 {
                1
            } else {
                HeadingLevel
            },
            Width = Width ?? Percent(100.0),
            Height = Height ?? theme.Spacing * 14.0,
            BackgroundColor = BackgroundColor ?? theme.CanvasColor,
            TextColor = TextColor ?? theme.TextColor,
            SubtitleColor = SubtitleColor ?? theme.MutedTextColor,
            BorderColor = BorderColor ?? theme.BorderColor,
            PaddingHorizontal = PaddingHorizontal ?? theme.PanelPadding,
            Gap = Gap ?? theme.ControlGap,
            TitleGap = TitleGap ?? theme.Spacing / 2.0,
            FontFamily = FontFamily ?? theme.FontFamily,
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
            SubtitleFontSize = if SubtitleFontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                SubtitleFontSize
            },
            SubtitleFontWeight = if SubtitleFontWeight == 0 {
                theme.CaptionFontWeight
            } else {
                SubtitleFontWeight
            },
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BoxShadow = BoxShadow ?? Goo.BoxShadow{},
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateTitle = nil,
            CreateSubtitle = nil,
            CreateRoot = nil,
        }

        let title = if let createTitle = createTitle {
            createTitle(resolved)
        } else {
            let titleAccessibility = Accessibility{
                Role: AccessibilityRole.Heading,
                Name: resolved.Title!!,
                Level: resolved.HeadingLevel
            }
            let value = Text{
                Content: resolved.Title!!,
                FontSize: resolved.TitleFontSize,
                FontWeight: resolved.TitleFontWeight,
                Accessibility: titleAccessibility
            }
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }

        let subtitle Text? = if let subtitleText = resolved.Subtitle {
            if let createSubtitle = createSubtitle {
                createSubtitle(resolved)
            } else {
                let value = Text{
                    Content: subtitleText,
                    Color: resolved.SubtitleColor!!,
                    FontSize: resolved.SubtitleFontSize,
                    FontWeight: resolved.SubtitleFontWeight
                }
                if let fontFamily = resolved.FontFamily {
                    value.FontFamily = fontFamily
                }
                value
            }
        } else {
            nil
        }

        if let createRoot = createRoot {
            return createRoot(resolved, Leading, title, subtitle, Trailing)
        }

        let content = Container{
            FlexDirection: FlexDirection.Column,
            JustifyContent: JustifyContent.Center,
            Gap: resolved.TitleGap!!,
            FlexGrow: 1.0
        }
        content.Children.Add(Container(){title})
        if let subtitle = subtitle {
            content.Children.Add(Container(){subtitle})
        }

        let root = Container{
            LineHeight: theme.LineHeight,
            Width: resolved.Width!!,
            Height: resolved.Height!!,
            Padding: Edges{Right: resolved.PaddingHorizontal!!, Left: resolved.PaddingHorizontal!!},
            BackgroundColor: resolved.BackgroundColor!!,
            Color: resolved.TextColor!!,
            BorderColor: Edges[Color]{Bottom: resolved.BorderColor!!},
            BorderWidth: Edges{Bottom: resolved.BorderWidth!!},
            BoxShadow: resolved.BoxShadow!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            Overflow: Overflow.Hidden,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: resolved.Gap!!,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: resolved.AccessibilityName!!},
        }

        if let leading = Leading {
            root.Children.Add(Container(){leading})
        }
        root.Children.Add(content)
        if let trailing = Trailing {
            root.Children.Add(Container(){trailing})
        }
        return root
    }
}
