package Goo.Widgets

import Goo
import System

/// Selects a size and weight from the theme type scale.
public enum TextVariant {
    /// Uses the theme body text style.
    Body;
    /// Uses the theme level-1 heading style.
    H1;
    /// Uses the theme level-2 heading style.
    H2;
    /// Uses the theme level-3 heading style.
    H3;
    /// Uses the theme level-4 heading style.
    H4;
    /// Uses the theme level-5 heading style.
    H5;
    /// Uses the theme level-6 heading style.
    H6;
    /// Uses the theme title text style.
    Title;
    /// Uses the theme subtitle text style.
    Subtitle;
    /// Uses the theme label text style.
    Label;
    /// Uses the theme caption text style.
    Caption;
    /// Uses the theme uppercase overline style.
    Overline;
    /// Uses the theme monospace code style.
    Code
}

/// Theme-styled text with optional heading semantics.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
public data struct Typography {
    /// Text to display. Nil uses an empty string.
    var Content string?
    /// Selects font metrics and text treatment from the theme type scale.
    var Variant TextVariant
    /// Explicit accessibility heading level from 1 through 6. Nil derives it from H1 through H6, or emits no heading role.
    var HeadingLevel int32?
    /// Text color override. Nil uses the theme text color.
    var Color Color?
    /// Maximum displayed lines. Zero leaves the line count unrestricted.
    var MaxLines int32
    /// Text overflow treatment passed to Goo text layout.
    var Trimming TextTrimming
    /// UTF-16 text spans with explicit styling. Nil supplies no span overrides.
    var StyleRanges[]?TextStyleRange
    /// Configures the fresh text before the widget applies its semantics.
    /// Widget-owned fields: Accessibility.Level, Accessibility.Name, Accessibility.Role.
    var ConfigureText Action[Typography, Text]?

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
        if let configure = ConfigureText {
            let originalAccessibilityLevel = text.Accessibility?.Level
            let originalAccessibilityName = (text.Accessibility?.Name ?? "")
            let originalAccessibilityRole = (text.Accessibility?.Role ?? AccessibilityRole(0))
            configure.Invoke(this, text)
            if text.Accessibility?.Level != originalAccessibilityLevel {
                throw InvalidOperationException("Typography owns Accessibility.Level; configure Typography instead of changing it in ConfigureText")
            }
            if (text.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("Typography owns Accessibility.Name; configure Typography instead of changing it in ConfigureText")
            }
            if (text.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("Typography owns Accessibility.Role; configure Typography instead of changing it in ConfigureText")
            }
        }
        let textAccessibility = if let configured = text.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        textAccessibility.Role = level > 0 ? AccessibilityRole.Heading: AccessibilityRole.Text
        textAccessibility.Name = Content ?? ""
        textAccessibility.Level = level > 0 ? level: nil
        text.Accessibility = textAccessibility
        return text
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w Typography) Blob -> w.Build()
