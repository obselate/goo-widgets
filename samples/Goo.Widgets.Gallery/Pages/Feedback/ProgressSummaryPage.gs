package Goo.Widgets.Gallery.Pages.Feedback

import Goo
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

internal class ProgressSummaryPage : GalleryPage {
    override func Title() string -> "Progress summary"

    override func Build() Blob -> ProgressSummary{
        Label: "Compliance scan",
        Detail: "36 / 48 checks",
        Progress: ProgressBar{
            Value: 0.75,
            Width: 420.0,
            AccessibilityName: "Compliance scan progress",
            AccessibilityValueText: "36 of 48 checks",
        },
        Trailing: Badge{Content: "Running"}.Build(),
    }.Build()
}
