package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class ThemeScopePage : GalleryPage {
    override func Title() string -> "ThemeScope"

    override func Build() Blob {
        let theme = Theme.Read()
        let root = Container{Width: Percent(100), MaxWidth: 840.0, Gap: 8.0}
        let surfaces = Container{FlexDirection: FlexDirection.Row, FlexWrap: FlexWrap.Wrap, Gap: 6.0}
        let names = []string{
            "Sunken", "Active", "Strong border", "Subtle text", "Disabled text", "Link", "Focus",
            "Info fill", "Success fill", "Warning fill", "Danger fill"
        }
        let colors = []Color{
            theme.SunkenColor, theme.ActiveColor, theme.StrongBorderColor, theme.SubtleTextColor,
            theme.DisabledTextColor, theme.LinkColor, theme.FocusColor, theme.InfoFillColor,
            theme.SuccessFillColor, theme.WarningFillColor, theme.DangerQuietColor
        }
        for index in 0 ... names.Length {
            surfaces.Children.Add(Container{
                Width: 155.0, Height: 34.0, FlexDirection: FlexDirection.Row, Gap: 6.0,
                AlignItems: AlignItems.Center,
                Container{Width: 24.0, Height: 24.0, BackgroundColor: colors[index],
                    BorderWidth: 1.0, BorderColor: theme.StrongBorderColor},
                Text{Content: names[index], FontSize: theme.CaptionFontSize, Color: theme.TextColor}
            })
        }
        root.Children.Add(surfaces)
        let radii = Container{FlexDirection: FlexDirection.Row, Gap: 12.0}
        let radius = []float64{theme.RadiusSm, theme.RadiusMd, theme.RadiusLg, theme.RadiusXl}
        let shadows = []BoxShadow{theme.ElevationSm, theme.ElevationMd, theme.ElevationLg}
        for index in 0 ... radius.Length {
            radii.Children.Add(Container{
                Width: 140.0, Height: 42.0, BorderRadius: radius[index],
                BoxShadow: shadows[index % shadows.Length], BackgroundColor: theme.ActiveColor,
                AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center,
                Text{Content: "Radius " + radius[index].ToString(), Color: theme.TextColor}
            })
        }
        root.Children.Add(radii)
        let type = Container{FlexDirection: FlexDirection.Row, Gap: 12.0, AlignItems: AlignItems.Center}
        let sizes = []float64{
            theme.DisplayFontSize, theme.H1FontSize, theme.H2FontSize, theme.H3FontSize,
            theme.H4FontSize, theme.H5FontSize, theme.H6FontSize, theme.SubtitleFontSize,
            theme.OverlineFontSize, theme.CodeFontSize
        }
        for size in sizes {
            type.Children.Add(Text{Content: "Aa", FontSize: size, Color: theme.TextColor})
        }
        root.Children.Add(type)
        let palettes = [][]Color{
            theme.SeriesPalette, theme.ColorBlindPalette,
            []Color{theme.Syntax.Keyword, theme.Syntax.String, theme.Syntax.Number, theme.Syntax.Comment,
                theme.Syntax.Function, theme.Syntax.Type, theme.Syntax.Punctuation},
            []Color{theme.Diff.Added, theme.Diff.Removed, theme.Diff.Changed,
                theme.Diff.AddedFill, theme.Diff.RemovedFill, theme.Diff.ChangedFill},
            theme.Ansi.Colors, theme.Ansi.BrightColors
        }
        let labels = []string{"Series", "Color-blind safe", "Syntax", "Diff", "ANSI", "ANSI bright"}
        for index in 0 ... palettes.Length {
            let row = Container{FlexDirection: FlexDirection.Row, Gap: 6.0, AlignItems: AlignItems.Center,
                Text{Content: labels[index], Width: 120.0, Color: theme.TextColor, FontSize: theme.CaptionFontSize}}
            for color in palettes[index] {
                row.Children.Add(Container{Width: 32.0, Height: 20.0, BackgroundColor: color})
            }
            root.Children.Add(row)
        }
        root.Children.Add(ThemeScope{
            Value: theme.WithHighContrast().WithTextScale(1.25),
            Content: () -> Container{
                FlexDirection: FlexDirection.Row, Gap: 12.0, AlignItems: AlignItems.Center,
                ActionButton{Content: "High contrast + 125% text"}.Build(),
                Text{Content: "Scaled caption", FontSize: Theme.Read().CaptionFontSize,
                    Color: Theme.Read().TextColor}
            }
        }.Build())
        root.Children.Add(Text{
            Content: "Motion: " + theme.MotionFastMs.ToString() + " / " + theme.MotionNormalMs.ToString() +
                " / " + theme.MotionSlowMs.ToString() + " ms. Spinner: " + theme.SpinnerPeriodMs.ToString() + " ms.",
            Color: theme.MutedTextColor, FontSize: theme.CaptionFontSize
        })
        return root
    }
}
