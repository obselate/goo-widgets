package Goo.Widgets

import Goo
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
    /// Metadata padding. Nil resolves to 12.0.
    var Padding float64?
    /// Gap between metadata rows. Nil resolves to 4.0.
    var Gap float64?
    /// Card corner radius. Nil resolves to 8.0.
    var BorderRadius float64?
    /// Card background. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Card hover background. Nil resolves to #27272a.
    var HoverBackgroundColor Color?
    /// Primary text color. Nil resolves to #fafafa.
    var TitleColor Color?
    /// Secondary text color. Nil resolves to #a1a1aa.
    var SupportingColor Color?
    /// Primary text size. Zero resolves to 16.0.
    var TitleFontSize float64
    /// Supporting text size. Zero resolves to 13.0.
    var SupportingFontSize float64
    /// Optional base style for the root button.
    var RootStyle Style?
    /// Creates the metadata content from resolved props.
    var CreateContent Func[MediaCard, Blob]?
    /// Creates the final button from resolved props, thumbnail, and metadata content.
    var CreateRoot Func[MediaCard, Blob, Blob, Button]?

    /// Builds a fresh Goo card tree.
    public func Build() Blob {
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
            Padding = Padding ?? 12.0,
            Gap = Gap ?? 4.0,
            BorderRadius = BorderRadius ?? 8.0,
            BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
            HoverBackgroundColor = HoverBackgroundColor ?? Color.Parse("#27272a"),
            TitleColor = TitleColor ?? Color.Parse("#fafafa"),
            SupportingColor = SupportingColor ?? Color.Parse("#a1a1aa"),
            TitleFontSize = if TitleFontSize == 0.0 {
                16.0
            } else {
                TitleFontSize
            },
            SupportingFontSize = if SupportingFontSize == 0.0 {
                13.0
            } else {
                SupportingFontSize
            },
            CreateContent = nil,
            CreateRoot = nil,
        }
        let thumbnail = resolved.Thumbnail ?? Container{
            Width: resolved.Width,
            Height: resolved.ThumbnailHeight,
            FlexShrink: 0.0,
            BackgroundColor: Color.Parse("#27272a"),
            Accessibility: Accessibility{Hidden: true},
        }
        let content = if let createContent = createContent {
            createContent(resolved)
        } else {
            let children = System.Collections.Generic.List[Blob]()
            children.Add(
                Text{
                    Content: resolved.Title!!,
                    FontSize: resolved.TitleFontSize,
                    FontWeight: 600,
                    Color: resolved.TitleColor!!,
                    TextWrap: TextWrap.NoWrap,
                    TextTrimming: TextTrimming.Ellipsis,
                }
            )
            if let subtitle = resolved.Subtitle {
                children.Add(SupportingText(resolved, subtitle))
            }
            if let detail = resolved.Detail {
                children.Add(SupportingText(resolved, detail))
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
            return createRoot(resolved, thumbnail, content)
        }
        return Button{
            BasedOn: resolved.RootStyle,
            Width: resolved.Width,
            Height: resolved.ThumbnailHeight + resolved.ContentHeight,
            Padding: 0.0,
            BorderRadius: resolved.BorderRadius!!,
            Cursor: Cursor.Pointer,
            Disabled: resolved.Disabled,
            AlignItems: AlignItems.Stretch,
            TextAlign: TextAlign.Left,
            OverflowX: Overflow.Hidden,
            OverflowY: Overflow.Hidden,
            BackgroundColor: resolved.BackgroundColor!!,
            Hover: Style{BackgroundColor: resolved.HoverBackgroundColor!!},
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: resolved.AccessibilityName!!},
            OnClick: resolved.OnClick,
            thumbnail,
            content,
        }
    }

    private func SupportingText(input MediaCard, content string) Blob -> Text{
        Content: content,
        FontSize: input.SupportingFontSize,
        Color: input.SupportingColor!!,
        TextWrap: TextWrap.NoWrap,
        TextTrimming: TextTrimming.Ellipsis,
    }
}
