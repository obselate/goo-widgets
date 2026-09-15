package Goo.Widgets.Layout

import Goo

/// A semantic list item row with optional slots, typography defaults, and factory customization.
public data struct ListRow {
    /// Optional leading slot element.
    var Leading Blob?
    /// Primary row text. Nil resolves to an empty string.
    var Title string?
    /// Optional secondary caption text.
    var Caption string?
    /// Optional trailing slot element.
    var Trailing Blob?
    /// Whether the row is selected.
    var Selected bool
    /// Accessible name. Nil resolves to the resolved title.
    var AccessibilityName string?
    /// Row width. Nil resolves to 100%.
    var Width Length?
    /// Background color in normal state. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Background color in selected state. Nil resolves to #27272a.
    var SelectedBackgroundColor Color?
    /// Primary title text color. Nil resolves to #fafafa.
    var TextColor Color?
    /// Secondary caption text color. Nil resolves to #a1a1aa.
    var CaptionColor Color?
    /// Box shadow applied when selected. Nil resolves to color #52525b and spread 1.0.
    var SelectedBoxShadow BoxShadow?
    /// Minimum row height. Zero resolves to 64.0.
    var MinHeight float64
    /// Horizontal padding. Zero resolves to 14.0.
    var PaddingHorizontal float64
    /// Vertical padding. Zero resolves to 10.0.
    var PaddingVertical float64
    /// Gap between slots and content stack. Zero resolves to 12.0.
    var Gap float64
    /// Gap between title and caption inside the content stack. Zero resolves to 3.0.
    var ContentGap float64
    /// Border radius. Nil resolves to 8.0; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration. Nil resolves to 150.0; explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Row opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Title font size. Zero resolves to 14.0.
    var TitleFontSize float64
    /// Title font weight. Zero resolves to 600.
    var TitleFontWeight int32
    /// Caption font size. Zero resolves to 12.0.
    var CaptionFontSize float64
    /// Caption font weight. Zero resolves to 400.
    var CaptionFontWeight int32
    /// Optional font family for title and caption.
    var FontFamily string?
    /// Transform applied to the row root. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Custom factory for the title Text. Receives resolved props.
    var CreateTitle Func[ListRow, Text]?
    /// Custom factory for the caption Text. Receives resolved props.
    var CreateCaption Func[ListRow, Text]?
    /// Custom factory for the root Container. Receives resolved props, slots, and content stack.
    var CreateRoot Func[ListRow, Blob?, Container, Blob?, Container]?

    /// Builds a fresh Goo element tree after resolving props and factories.
    public func Build() Blob {
        let createTitle = CreateTitle
        let createCaption = CreateCaption
        let createRoot = CreateRoot
        let titleText = Title ?? ""
        let defaultShadow = BoxShadow{Color: Color.Parse("#52525b"), Spread: 1.0}
        let resolved = this with{
            Title = titleText,
            AccessibilityName = AccessibilityName ?? titleText,
            Width = Width ?? Length.Percent(100.0),
            BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
            SelectedBackgroundColor = SelectedBackgroundColor ?? Color.Parse("#27272a"),
            TextColor = TextColor ?? Color.Parse("#fafafa"),
            CaptionColor = CaptionColor ?? Color.Parse("#a1a1aa"),
            SelectedBoxShadow = SelectedBoxShadow ?? defaultShadow,
            MinHeight = if MinHeight == 0.0 {
                64.0
            } else {
                MinHeight
            },
            PaddingHorizontal = if PaddingHorizontal == 0.0 {
                14.0
            } else {
                PaddingHorizontal
            },
            PaddingVertical = if PaddingVertical == 0.0 {
                10.0
            } else {
                PaddingVertical
            },
            Gap = if Gap == 0.0 {
                12.0
            } else {
                Gap
            },
            ContentGap = if ContentGap == 0.0 {
                3.0
            } else {
                ContentGap
            },
            BorderRadius = BorderRadius ?? 8.0,
            TransitionMs = TransitionMs ?? 150.0,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            TitleFontSize = if TitleFontSize == 0.0 {
                14.0
            } else {
                TitleFontSize
            },
            TitleFontWeight = if TitleFontWeight == 0 {
                600
            } else {
                TitleFontWeight
            },
            CaptionFontSize = if CaptionFontSize == 0.0 {
                12.0
            } else {
                CaptionFontSize
            },
            CaptionFontWeight = if CaptionFontWeight == 0 {
                400
            } else {
                CaptionFontWeight
            },
            Transform = Transform ?? PanelTransform{},
            CreateTitle = nil,
            CreateCaption = nil,
            CreateRoot = nil,
        }

        let title = if let createTitle = createTitle {
            createTitle(resolved)
        } else {
            let value = Text{
                Content: resolved.Title!!,
                Color: resolved.TextColor!!,
                FontSize: resolved.TitleFontSize,
                FontWeight: resolved.TitleFontWeight
            }
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }

        let caption Text? = if let captionText = resolved.Caption {
            if let createCaption = createCaption {
                createCaption(resolved)
            } else {
                let value = Text{
                    Content: captionText,
                    Color: resolved.CaptionColor!!,
                    FontSize: resolved.CaptionFontSize,
                    FontWeight: resolved.CaptionFontWeight
                }
                if let fontFamily = resolved.FontFamily {
                    value.FontFamily = fontFamily
                }
                value
            }
        } else {
            nil
        }

        let content = Container{
            FlexDirection: FlexDirection.Column,
            JustifyContent: JustifyContent.Center,
            Gap: resolved.ContentGap,
            FlexGrow: 1.0
        }
        content.Children.Add(title)
        if let caption = caption {
            content.Children.Add(caption)
        }

        if let createRoot = createRoot {
            return createRoot(resolved, Leading, content, Trailing)
        }

        let background = if resolved.Selected {
            resolved.SelectedBackgroundColor!!
        } else {
            resolved.BackgroundColor!!
        }
        let root = Container{
            Width: resolved.Width!!,
            MinHeight: resolved.MinHeight,
            PaddingLeft: resolved.PaddingHorizontal,
            PaddingRight: resolved.PaddingHorizontal,
            PaddingTop: resolved.PaddingVertical,
            PaddingBottom: resolved.PaddingVertical,
            BorderRadius: resolved.BorderRadius!!,
            BackgroundColor: background,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: resolved.Gap,
            Accessibility: Accessibility{
                Role: AccessibilityRole.ListItem,
                Name: resolved.AccessibilityName!!,
                Selected: resolved.Selected
            },
        }
        if resolved.Selected {
            root.BoxShadow = resolved.SelectedBoxShadow!!
        }
        if let leading = Leading {
            root.Children.Add(leading)
        }
        root.Children.Add(content)
        if let trailing = Trailing {
            root.Children.Add(trailing)
        }
        return root
    }
}
