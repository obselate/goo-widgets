package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

class BadgePage : GalleryPage {
    public override func Title() string -> "Badge"

    public override func Build() Blob {
        let defaultBadge = Badge{Count: 128}
        let errorBadge = Badge{Content: "Error", Tone: Tone.Danger}
        let successBadge = Badge{Content: "Ready", Tone: Tone.Success}
        let warningBadge = Badge{Content: "Paused", Tone: Tone.Warning}
        let dotBadge = Badge{AccessibilityName: "Unread notifications",}

        return Container{
            FlexDirection: FlexDirection.Column,
            AlignItems: AlignItems.Center,
            Gap: 24,
            Container{
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: 32,
                Container{
                    FlexDirection: FlexDirection.Column,
                    AlignItems: AlignItems.Center,
                    Gap: 8,
                    defaultBadge.Build(),
                    Text{Content: "Count", FontSize: 12},
                },
                Container{
                    FlexDirection: FlexDirection.Column,
                    AlignItems: AlignItems.Center,
                    Gap: 8,
                    errorBadge.Build(),
                    Text{Content: "Error", FontSize: 12},
                },
                Container{
                    FlexDirection: FlexDirection.Column,
                    AlignItems: AlignItems.Center,
                    Gap: 8,
                    successBadge.Build(),
                    Text{Content: "Success", FontSize: 12},
                },
                Container{
                    FlexDirection: FlexDirection.Column,
                    AlignItems: AlignItems.Center,
                    Gap: 8,
                    warningBadge.Build(),
                    Text{Content: "Warning", FontSize: 12},
                },
                Container{
                    FlexDirection: FlexDirection.Column,
                    AlignItems: AlignItems.Center,
                    Gap: 8,
                    dotBadge.Build(),
                    Text{Content: "Dot", FontSize: 12},
                },
            },
            Container{
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: 24,
                StatusIndicator{State: StatusState.Running}.Build(),
                StatusIndicator{State: StatusState.Done, Variant: StatusVariant.Icon}.Build(),
                StatusIndicator{State: StatusState.Waiting, Variant: StatusVariant.Pill}.Build(),
            },
        }
    }
}
