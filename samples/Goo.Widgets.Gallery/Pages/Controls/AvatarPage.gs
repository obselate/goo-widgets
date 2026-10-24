package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery
import Goo.Widgets.Media

class AvatarPage : GalleryPage {
    public override func Title() string -> "Avatar"

    public override func Build() Blob {
        let baseAvatar = Avatar{FallbackText: "?", Size: 64.0, FontSize: 18.0, FontWeight: 700, BorderWidth: 2.0,}

        let defaultAvatar = baseAvatar with{
            AccessibilityName = "Alex",
            FallbackText = "AL",
            Presence = StatusState.Done
        }
        let successAvatar = baseAvatar with{
            AccessibilityName = "Bea",
            FallbackText = "BE",
            Presence = StatusState.Running,
            NameTone = Tone.Info,
        }
        let warningAvatar = baseAvatar with{
            AccessibilityName = "Chris",
            FallbackText = "CK",
            Presence = StatusState.Waiting,
            NameTone = Tone.Warning,
        }
        let squareAvatar = baseAvatar with{
            AccessibilityName = "GX",
            FallbackText = "GX",
            BackgroundColor = Color.Parse("#3f3f46"),
            BorderColor = Color.Parse("#52525b"),
            Size = 72.0,
            BorderRadius = 10.0,
        }

        return Container{
            FlexDirection: FlexDirection.Column,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Gap: 20,
            AvatarGroup{
                AccessibilityName: "Project members",
                Max: 2,
                Size: 40,
                Items: []Avatar{defaultAvatar, successAvatar, warningAvatar, squareAvatar},
            }.Build(),
            Container{
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: 20,
                Container{
                    FlexDirection: FlexDirection.Column,
                    AlignItems: AlignItems.Center,
                    Gap: 8,
                    defaultAvatar.Build(),
                    Text{Content: "Default", FontSize: 12},
                },
                Container{
                    FlexDirection: FlexDirection.Column,
                    AlignItems: AlignItems.Center,
                    Gap: 8,
                    successAvatar.Build(),
                    Text{Content: "Success", FontSize: 12},
                },
                Container{
                    FlexDirection: FlexDirection.Column,
                    AlignItems: AlignItems.Center,
                    Gap: 8,
                    warningAvatar.Build(),
                    Text{Content: "Warning", FontSize: 12},
                },
                Container{
                    FlexDirection: FlexDirection.Column,
                    AlignItems: AlignItems.Center,
                    Gap: 8,
                    squareAvatar.Build(),
                    Text{Content: "Square", FontSize: 12},
                },
            },
        }
    }
}
