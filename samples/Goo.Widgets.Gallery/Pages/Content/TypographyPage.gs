package Goo.Widgets.Gallery.Pages.Content

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal class TypographyPage : GalleryPage {
    override func Title() string -> "Typography"

    override func Build() Blob {
        let root = Container{Width: Percent(100), Gap: 8}
        for variant in[]TextVariant{
            TextVariant.H1,
            TextVariant.H2,
            TextVariant.H3,
            TextVariant.H4,
            TextVariant.H5,
            TextVariant.H6,
            TextVariant.Title,
            TextVariant.Subtitle,
            TextVariant.Label,
            TextVariant.Caption,
            TextVariant.Overline,
            TextVariant.Code
        } {
            root.Children.Add(
                Typography{Content: variant.ToString() + "  The quick brown fox", Variant: variant}.Build()
            )
        }
        return root
    }
}
