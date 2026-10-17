package Goo.Widgets.Layout

import Goo
import Goo.Widgets

/// A semantic section header with accent dot, uppercase label, horizontal rule, and optional meta text.
public data struct SectionHeader {
    /// Header text. Nil resolves to an empty string.
    var Label string?
    /// Optional metadata text displayed trailing the rule. Nil omits the meta text element.
    var MetaText string?
    /// Whether to render the leading circular accent dot.
    var ShowAccent bool
    /// Accessible expanded state. Nil leaves Expanded unpopulated in accessibility semantics.
    var Expanded bool?
    /// Accessible name. Nil resolves to the resolved Label.
    var AccessibilityName string?
    /// Heading level for accessibility. Zero or default resolves to 2.
    var HeadingLevel int32
    /// Header width. Nil resolves to 100%.
    var Width Length?
    /// Label text color. Nil uses the nearest theme.
    var LabelColor Color?
    /// Meta text color. Nil uses the nearest theme.
    var MetaColor Color?
    /// Horizontal rule color. Nil uses the nearest theme.
    var RuleColor Color?
    /// Accent dot color. Nil uses the nearest theme.
    var AccentColor Color?
    /// Row layout gap between elements. Nil uses the nearest theme gap; explicit zero is preserved.
    var Gap float64?
    /// Accent dot diameter. Nil uses the nearest theme spacing; explicit zero is preserved.
    var AccentSize float64?
    /// Horizontal rule height. Nil uses the nearest theme border width; explicit zero is preserved.
    var RuleHeight float64?
    /// Root opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Label font size. Zero uses the nearest theme label font size.
    var LabelFontSize float64
    /// Label font weight. Zero uses the nearest theme label font weight.
    var LabelFontWeight int32
    /// Meta text font size. Zero uses the nearest theme caption font size.
    var MetaFontSize float64
    /// Meta text font weight. Zero uses the nearest theme caption font weight.
    var MetaFontWeight int32
    /// Optional font family applied to default label and meta text elements.
    var FontFamily string?
    /// Transform applied to the root container. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Custom factory for the label Text element. Receives resolved props.
    var CreateLabel Func[SectionHeader, Text]?
    /// Custom factory for the meta Text element. Receives resolved props.
    var CreateMeta Func[SectionHeader, Text]?
    /// Custom factory for the root Container. Receives resolved props and child primitives.
    var CreateRoot Func[SectionHeader, Container?, Text, Container, Text?, Container]?

    /// Builds a fresh Goo element tree after resolving props and factories.
    public func Build() Blob {
        let theme = Theme.Read()
        let createLabel = CreateLabel
        let createMeta = CreateMeta
        let createRoot = CreateRoot
        let labelText = Label ?? ""
        let resolved = this with{
            Label = labelText,
            AccessibilityName = AccessibilityName ?? labelText,
            HeadingLevel = if HeadingLevel == 0 {
                2
            } else {
                HeadingLevel
            },
            Width = Width ?? Percent(100.0),
            LabelColor = LabelColor ?? theme.TextColor,
            MetaColor = MetaColor ?? theme.FaintTextColor,
            RuleColor = RuleColor ?? theme.BorderColor,
            AccentColor = AccentColor ?? theme.AccentColor,
            Gap = Gap ?? theme.ControlGap,
            AccentSize = AccentSize ?? theme.Spacing * 1.5,
            RuleHeight = RuleHeight ?? theme.BorderWidth,
            FontFamily = FontFamily ?? theme.FontFamily,
            Opacity = Opacity ?? 1.0,
            LabelFontSize = if LabelFontSize == 0.0 {
                theme.LabelFontSize
            } else {
                LabelFontSize
            },
            LabelFontWeight = if LabelFontWeight == 0 {
                theme.LabelFontWeight
            } else {
                LabelFontWeight
            },
            MetaFontSize = if MetaFontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                MetaFontSize
            },
            MetaFontWeight = if MetaFontWeight == 0 {
                theme.CaptionFontWeight
            } else {
                MetaFontWeight
            },
            Transform = Transform ?? PanelTransform{},
            CreateLabel = nil,
            CreateMeta = nil,
            CreateRoot = nil,
        }

        var accent Container? = nil
        if resolved.ShowAccent {
            let size = resolved.AccentSize!!
            accent = Container{
                Width: size,
                Height: size,
                BorderRadius: size / 2.0,
                BackgroundColor: resolved.AccentColor!!
            }
        }

        let label = if let createLabel = createLabel {
            createLabel(resolved)
        } else {
            let value = Text{
                Content: resolved.Label!!,
                Color: resolved.LabelColor!!,
                FontSize: resolved.LabelFontSize,
                FontWeight: resolved.LabelFontWeight,
                TextTransform: TextTransform.Uppercase
            }
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }

        let rule = Container{Height: resolved.RuleHeight!!, BackgroundColor: resolved.RuleColor!!, FlexGrow: 1.0}

        let meta Text? = if let metaText = resolved.MetaText {
            if let createMeta = createMeta {
                createMeta(resolved)
            } else {
                let value = Text{
                    Content: metaText,
                    Color: resolved.MetaColor!!,
                    FontSize: resolved.MetaFontSize,
                    FontWeight: resolved.MetaFontWeight
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
            return createRoot(resolved, accent, label, rule, meta)
        }

        var semantics = Accessibility{
            Role: AccessibilityRole.Heading,
            Name: resolved.AccessibilityName!!,
            Level: resolved.HeadingLevel
        }
        if resolved.Expanded != nil {
            semantics.Expanded = resolved.Expanded
        }

        let root = Container{
            LineHeight: theme.LineHeight,
            Width: resolved.Width!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: resolved.Gap!!,
            Accessibility: semantics,
        }
        if let accent = accent {
            root.Children.Add(accent)
        }
        root.Children.Add(label)
        root.Children.Add(rule)
        if let meta = meta {
            root.Children.Add(meta)
        }
        return root
    }
}
