package Goo.Widgets.Gallery.Pages.Feedback

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

internal class SkeletonExample : Cell {
    private var animated bool = true

    public override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            Width: Percent(100), MaxWidth: theme.ControlHeight * 12, Gap: theme.PanelPadding,
            Container{
                FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center, Gap: theme.ControlGap,
                Cell.Mount[SkeletonInput, Skeleton]("circle", SkeletonInput{
                    Variant: SkeletonVariant.Circle, Size: theme.ControlHeight * 2, Animated: animated,
                }),
                Container{FlexGrow: 1, FlexBasis: 0, MinWidth: 0,
                    Cell.Mount[SkeletonInput, Skeleton]("text", SkeletonInput{
                        Width: Percent(100), Lines: 3, Animated: animated,
                    })},
            },
            Cell.Mount[SkeletonInput, Skeleton]("rectangle", SkeletonInput{
                Variant: SkeletonVariant.Rectangle, Width: Percent(100), Height: theme.ControlHeight * 3, Animated: animated,
            }),
            ActionButton{Content: animated ? "Pause": "Resume", OnClick: () -> {
                animated = !animated
                Rebuild()
            }}.Build(),
        }
    }
}

internal class SkeletonPage : GalleryPage {
    override func Title() string -> "Skeleton"
    override func Build() Blob -> Cell.Mount[SkeletonExample]("skeleton-example")
}
