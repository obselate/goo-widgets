package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal class CardPage : GalleryPage {
    override func Title() string -> "Card"

    override func Build() Blob {
        let theme = Theme.Read()
        let root = Container{Width: Percent(100), MinWidth: 0, Gap: 12, FlexDirection: FlexDirection.Row}
        let left = Container{FlexGrow: 1, FlexBasis: 0, MinWidth: 0, Gap: 12}
        let right = Container{FlexGrow: 1, FlexBasis: 0, MinWidth: 0, Gap: 12}
        root.Children.Add(left)
        root.Children.Add(right)
        for variant in[]CardVariant{CardVariant.Card, CardVariant.Panel, CardVariant.Frame, CardVariant.Well} {
            let column = variant == CardVariant.Card || variant == CardVariant.Frame ? left: right
            column.Children.Add(
                Card{
                    Variant: variant,
                    Title: variant.ToString(),
                    HeaderAction: ActionButton{Content: "Manage", Height: 28}.Build(),
                    Content: Text{Content: "42.8 GB of 100 GB", Color: theme.TextColor},
                    Footer: Text{Content: "12 workspaces", Color: theme.MutedTextColor}
                }.Build()
            )
        }
        left.Children.Add(Card{Title: "Open workspace", OnClick: () -> { }}.Build())
        right.Children.Add(
            Card{
                Title: "Unavailable",
                Disabled: true,
                OnClick: () -> { }
            }.Build()
        )
        return root
    }
}
