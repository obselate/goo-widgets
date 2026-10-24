package Goo.Widgets.Gallery.Pages.Feedback

import Goo
import Goo.Widgets
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

class SpinnerPage : GalleryPage {
    public override func Title() string -> "Spinner"

    public override func Build() Blob {
        let theme = Theme.Read()
        let root = Container{
            Gap: 24,
        }
        for variant in[]SpinnerVariant{SpinnerVariant.Ring, SpinnerVariant.Dots, SpinnerVariant.Bars} {
            let row = Container{
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: 32,
                Text{Content: variant.ToString(), Color: theme.TextColor, Width: 80},
            }
            for size in[]float64{16, 24, 40} {
                row.Children.Add(Cell.Mount[SpinnerInput, Spinner](nil, SpinnerInput{Variant: variant, Size: size}))
            }
            root.Children.Add(row)
        }
        return root
    }
}
