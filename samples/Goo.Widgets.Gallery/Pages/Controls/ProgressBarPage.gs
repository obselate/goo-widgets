package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

class ProgressBarPage : GalleryPage {
    public override func Title() string -> "ProgressBar"

    public override func Build() Blob {
        let baseBar = ProgressBar{Width: 320.0, Height: 10.0,}

        let queuedBar = baseBar with{Value = 0.0, AccessibilityName = "Queued task", AccessibilityValueText = "0%",}
        let activeBar = baseBar with{
            Value = 0.45,
            AccessibilityName = "Active download",
            AccessibilityValueText = "45%",
        }
        let completeBar = baseBar with{
            Value = 1.0,
            FillColor = Color.Parse("#22c55e"),
            AccessibilityName = "Completed upload",
            AccessibilityValueText = "100%",
        }

        return Container{
            FlexDirection: FlexDirection.Column,
            AlignItems: AlignItems.Center,
            Gap: 20,
            Container{
                FlexDirection: FlexDirection.Column,
                AlignItems: AlignItems.FlexStart,
                Gap: 6,
                Text{Content: "Queued (0%)", FontSize: 12, Color: "#a1a1aa"},
                queuedBar.Build(),
            },
            Container{
                FlexDirection: FlexDirection.Column,
                AlignItems: AlignItems.FlexStart,
                Gap: 6,
                Text{Content: "In progress (45%)", FontSize: 12, Color: "#a1a1aa"},
                activeBar.Build(),
            },
            Container{
                FlexDirection: FlexDirection.Column,
                AlignItems: AlignItems.FlexStart,
                Gap: 6,
                Text{Content: "Complete (100%)", FontSize: 12, Color: "#a1a1aa"},
                completeBar.Build(),
            },
        }
    }
}
