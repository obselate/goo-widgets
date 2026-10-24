package Goo.Widgets

import Goo
import System

/// Selects a size and weight from the theme type scale.
public enum TextVariant {
    Body;
    H1;
    H2;
    H3;
    H4;
    H5;
    H6;
    Title;
    Subtitle;
    Label;
    Caption;
    Overline;
    Code
}

/// Theme-styled text with optional heading semantics.
public data struct Typography {
    var Content string?
    var Variant TextVariant
    var HeadingLevel int32?
    var Color Color?
    var MaxLines int32
    var Trimming TextTrimming
    var StyleRanges[]?TextStyleRange
    var CreateText Func[Typography, Text, Text]?

    /// Creates styled text. H1 through H6 expose their heading level.
    public func Build() Text {
        let theme = Theme.Read()
        let heading = Variant >= TextVariant.H1 && Variant <= TextVariant.H6
        let level = HeadingLevel ?? (heading ? int32(Variant): 0)
        if level < 0 || level > 6 || HeadingLevel == 0 {
            throw ArgumentOutOfRangeException("HeadingLevel")
        }
        let size = switch Variant {
            case TextVariant.H1: theme.H1FontSize
            case TextVariant.H2: theme.H2FontSize
            case TextVariant.H3: theme.H3FontSize
            case TextVariant.H4: theme.H4FontSize
            case TextVariant.H5: theme.H5FontSize
            case TextVariant.H6: theme.H6FontSize
            case TextVariant.Title: theme.HeadingFontSize
            case TextVariant.Subtitle: theme.SubtitleFontSize
            case TextVariant.Label: theme.LabelFontSize
            case TextVariant.Caption: theme.CaptionFontSize
            case TextVariant.Overline: theme.OverlineFontSize
            case TextVariant.Code: theme.CodeFontSize
            default: theme.FontSize
        }
        var text = Text{
            Content: Content ?? "",
            FontFamily: Variant == TextVariant.Code ? theme.MonoFontFamily: heading ||
                Variant == TextVariant.Title ? theme.HeadingFontFamily: theme.FontFamily,
            FontSize: size,
            FontWeight: heading ||
                Variant == TextVariant.Title ? theme.HeadingFontWeight: Variant == TextVariant.Label ||
                Variant == TextVariant.Overline ? theme.LabelFontWeight: Variant == TextVariant.Caption ? theme.CaptionFontWeight: theme.FontWeight,
            Color: Color ?? theme.TextColor,
            LineHeight: theme.LineHeight,
            TextMaxLines: MaxLines,
            TextTrimming: Trimming,
            TextTransform: Variant == TextVariant.Overline ? TextTransform.Uppercase: TextTransform.None,
            StyleRanges: StyleRanges ?? []TextStyleRange{},
        }
        if let create = CreateText {
            text = create(this, text)
        }
        text.Accessibility = Accessibility{
            Role: level > 0 ? AccessibilityRole.Heading: AccessibilityRole.Text,
            Name: Content ?? "",
            Level: level > 0 ? level: nil
        }
        return text
    }
}
