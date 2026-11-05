package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class RatingControlExample : Cell {
    private var rating float64 = 3.5

    public override func Build() Blob -> Container{
        Width: Percent(100),
        MaxWidth: 320,
        Gap: Theme.Read().ControlGap,
        Cell.Mount[RatingControlInput, RatingControl]("rating", RatingControlInput{
            Value: rating,
            Step: 0.5,
            Width: Percent(100),
            AccessibilityName: "Rating",
            OnChange: value -> {
                rating = value
                Rebuild()
            }
        }),
        Cell.Mount[RatingControlInput, RatingControl]("average", RatingControlInput{
            Value: 4.2,
            ReadOnly: true,
            Width: Percent(100),
            AccessibilityName: "Average"
        })
    }
}

internal class RatingControlPage : GalleryPage {
    override func Title() string -> "Rating"

    override func Build() Blob -> Cell.Mount[RatingControlExample]("rating-control-example")
}
