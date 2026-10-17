package Goo.Widgets.Layout

import Goo
import Goo.Widgets

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
    /// Background color in normal state. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Background color in selected state. Nil uses the nearest theme.
    var SelectedBackgroundColor Color?
    /// Primary title text color. Nil uses the nearest theme.
    var TextColor Color?
    /// Secondary caption text color. Nil uses the nearest theme.
    var CaptionColor Color?
    /// Authored selected-state shadow. Nil uses an accent border.
    var SelectedBoxShadow BoxShadow?
    /// Minimum row height. Nil sizes to content and density.
    var MinHeight float64?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Vertical padding. Explicit zero is preserved.
    var PaddingVertical float64?
    /// Slot gap. Explicit zero is preserved.
    var Gap float64?
    /// Text gap. Explicit zero is preserved.
    var ContentGap float64?
    /// Border radius. Nil uses the nearest theme radius; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration. Nil uses theme motion. Explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Row opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Title font size. Zero uses the nearest theme font size.
    var TitleFontSize float64
    /// Title font weight. Zero uses the nearest theme label font weight.
    var TitleFontWeight int32
    /// Caption font size. Zero uses the nearest theme caption font size.
    var CaptionFontSize float64
    /// Caption font weight. Zero uses the nearest theme caption font weight.
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
        let theme = Theme.Read()
        let createTitle = CreateTitle
        let createCaption = CreateCaption
        let createRoot = CreateRoot
        let titleText = Title ?? ""
        let resolved = this with{
            Title = titleText,
            AccessibilityName = AccessibilityName ?? titleText,
            Width = Width ?? Percent(100.0),
            BackgroundColor = BackgroundColor ?? theme.PanelColor,
            SelectedBackgroundColor = SelectedBackgroundColor ?? theme.AccentColor.WithAlpha(0.15),
            TextColor = TextColor ?? theme.TextColor,
            CaptionColor = CaptionColor ?? theme.MutedTextColor,
            SelectedBoxShadow = SelectedBoxShadow ?? BoxShadow{Color: theme.AccentColor, Spread: theme.BorderWidth},
            MinHeight = MinHeight ?? theme.ControlHeight,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            PaddingVertical = PaddingVertical ?? theme.Spacing * 2.0,
            Gap = Gap ?? theme.ControlGap,
            ContentGap = ContentGap ?? theme.Spacing,
            BorderRadius = BorderRadius ?? theme.PanelRadius,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            FontFamily = FontFamily ?? theme.FontFamily,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            TitleFontSize = if TitleFontSize == 0.0 {
                theme.FontSize
            } else {
                TitleFontSize
            },
            TitleFontWeight = if TitleFontWeight == 0 {
                theme.LabelFontWeight
            } else {
                TitleFontWeight
            },
            CaptionFontSize = if CaptionFontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                CaptionFontSize
            },
            CaptionFontWeight = if CaptionFontWeight == 0 {
                theme.CaptionFontWeight
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
            Gap: resolved.ContentGap!!,
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
            LineHeight: theme.LineHeight,
            Width: resolved.Width!!,
            MinHeight: resolved.MinHeight!!,
            Padding: Edges(resolved.PaddingVertical!!, resolved.PaddingHorizontal!!),
            BorderRadius: resolved.BorderRadius!!,
            BackgroundColor: background,
            Focus: theme.FocusStyle,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: resolved.Gap!!,
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
