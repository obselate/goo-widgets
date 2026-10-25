package Goo.Widgets.Media

import Goo
import Goo.Widgets
import System

/// A generic actionable card with supplied thumbnail content and text metadata.
public data struct MediaCard {
    /// Thumbnail content owned by this card tree.
    var Thumbnail Blob?
    /// Primary card title.
    var Title string?
    /// Optional secondary text.
    var Subtitle string?
    /// Optional tertiary text.
    var Detail string?
    /// Accessible button name. Nil resolves from the title.
    var AccessibilityName string?
    /// Action invoked by Goo button activation.
    var OnClick Action?
    /// Whether the card rejects input.
    var Disabled bool
    /// Card width. Zero resolves to 200.0.
    var Width float64
    /// Thumbnail height. Zero resolves to the card width.
    var ThumbnailHeight float64
    /// Metadata area height. Zero resolves to 88.0.
    var ContentHeight float64
    /// Metadata padding. Nil uses the nearest theme padding.
    var Padding float64?
    /// Gap between metadata rows. Nil uses the nearest theme spacing.
    var Gap float64?
    /// Card corner radius. Nil uses the nearest theme radius.
    var BorderRadius float64?
    /// Card background. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Card hover background. Nil uses the nearest theme.
    var HoverBackgroundColor Color?
    /// Primary text color. Nil uses the nearest theme.
    var TitleColor Color?
    /// Secondary text color. Nil uses the nearest theme.
    var SupportingColor Color?
    /// Primary text size. Zero uses the nearest theme heading font size.
    var TitleFontSize float64
    /// Supporting text size. Zero uses the nearest theme caption font size.
    var SupportingFontSize float64
    /// Optional base style for the root button.
    var RootStyle Style?
    /// Creates the metadata content from resolved props.
    var CreateContent Func[MediaCard, Blob]?
    /// Creates the final button from resolved props, thumbnail, and metadata content.
    var CreateRoot Func[MediaCard, Blob, Blob, Button]?

    /// Builds a fresh Goo card tree.
    public func Build() Blob {
        let theme = Theme.Read()
        let createContent = CreateContent
        let createRoot = CreateRoot
        let title = Title ?? ""
        let width = if Width == 0.0 {
            200.0
        } else {
            Width
        }
        let resolved = this with{
            Title = title,
            AccessibilityName = AccessibilityName ?? title,
            Width = width,
            ThumbnailHeight = if ThumbnailHeight == 0.0 {
                width
            } else {
                ThumbnailHeight
            },
            ContentHeight = if ContentHeight == 0.0 {
                88.0
            } else {
                ContentHeight
            },
            Padding = Padding ?? theme.PanelPadding,
            Gap = Gap ?? theme.Spacing,
            BorderRadius = BorderRadius ?? theme.PanelRadius,
            BackgroundColor = BackgroundColor ?? theme.PanelColor,
            HoverBackgroundColor = HoverBackgroundColor ?? theme.HoverColor,
            TitleColor = TitleColor ?? theme.TextColor,
            SupportingColor = SupportingColor ?? theme.MutedTextColor,
            TitleFontSize = if TitleFontSize == 0.0 {
                theme.HeadingFontSize
            } else {
                TitleFontSize
            },
            SupportingFontSize = if SupportingFontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                SupportingFontSize
            },
            CreateContent = nil,
            CreateRoot = nil,
        }
        let thumbnail = resolved.Thumbnail ??
        Container{
            Width: resolved.Width,
            Height: resolved.ThumbnailHeight,
            FlexShrink: 0.0,
            BackgroundColor: theme.FieldColor,
            Accessibility: Accessibility{Hidden: true},
        }
        let content = if let createContent = createContent {
            createContent(resolved)
        } else {
            let children = System.Collections.Generic.List[Blob]()
            children.Add(
                Text{
                    Content: resolved.Title!!,
                    FontFamily: theme.HeadingFontFamily,
                    FontSize: resolved.TitleFontSize,
                    FontWeight: theme.HeadingFontWeight,
                    Color: resolved.TitleColor!!,
                    TextWrap: TextWrap.NoWrap,
                    TextTrimming: TextTrimming.Ellipsis,
                }
            )
            if let subtitle = resolved.Subtitle {
                children.Add(SupportingText(theme, resolved, subtitle))
            }
            if let detail = resolved.Detail {
                children.Add(SupportingText(theme, resolved, detail))
            }
            Container{
                Width: resolved.Width,
                Height: resolved.ContentHeight,
                MinWidth: 0.0,
                FlexShrink: 0.0,
                Padding: resolved.Padding!!,
                Gap: resolved.Gap!!,
                AlignItems: AlignItems.Stretch,
                JustifyContent: JustifyContent.FlexStart,
                Children: children,
            }
        }
        if let createRoot = createRoot {
            let button = createRoot(resolved, thumbnail, content)
            WidgetKeyBindings.BindActivation(button)
            return button
        }
        let button = Button{
            LineHeight: theme.LineHeight,
            Width: resolved.Width,
            Height: resolved.ThumbnailHeight + resolved.ContentHeight,
            Padding: 0.0,
            BorderRadius: resolved.BorderRadius!!,
            Focus: theme.FocusStyle,
            Cursor: Cursor.Pointer,
            Disabled: resolved.Disabled,
            AlignItems: AlignItems.Stretch,
            TextAlign: TextAlign.Start,
            OverflowX: Overflow.Hidden,
            OverflowY: Overflow.Hidden,
            BackgroundColor: resolved.BackgroundColor!!,
            Hover: Style{BackgroundColor: resolved.HoverBackgroundColor!!},
            BasedOn: resolved.RootStyle,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: resolved.AccessibilityName!!},
            OnClick: resolved.OnClick,
            thumbnail,
            content,
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }

    private func SupportingText(theme Theme, input MediaCard, content string) Blob -> Text{
        Content: content,
        FontFamily: theme.FontFamily,
        FontWeight: theme.CaptionFontWeight,
        FontSize: input.SupportingFontSize,
        Color: input.SupportingColor!!,
        TextWrap: TextWrap.NoWrap,
        TextTrimming: TextTrimming.Ellipsis,
    }
}
