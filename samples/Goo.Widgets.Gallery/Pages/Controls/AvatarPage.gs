package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Media

class AvatarPage : GalleryPage {
    public override func Title() string -> "Avatar"

    public override func Build() Blob {
        let baseAvatar = Avatar{FallbackText: "?", Size: 64.0, FontSize: 18.0, FontWeight: 700, BorderWidth: 2.0,}

        let defaultAvatar = baseAvatar with{AccessibilityName = "AL", FallbackText = "AL",}
        let successAvatar = baseAvatar with{
            AccessibilityName = "BE",
            FallbackText = "BE",
            BackgroundColor = Color.Parse("#166534"),
            BorderColor = Color.Parse("#22c55e"),
        }
        let warningAvatar = baseAvatar with{
            AccessibilityName = "CK",
            FallbackText = "CK",
            BackgroundColor = Color.Parse("#854d0e"),
            BorderColor = Color.Parse("#f59e0b"),
        }
        let squareAvatar = baseAvatar with{
            AccessibilityName = "GX",
            FallbackText = "GX",
            BackgroundColor = Color.Parse("#3f3f46"),
            BorderColor = Color.Parse("#52525b"),
            Size = 72.0,
            BorderRadius = 10.0,
        }

        return Container(){
            .FlexDirection: FlexDirection.Row,
            .AlignItems: AlignItems.Center,
            .JustifyContent: JustifyContent.Center,
            .Gap: 20,
            Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .Gap: 8,
                defaultAvatar.Build(),
                Text{Content: "Default", FontSize: 12, Color: "#a1a1aa"},
            },
            Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .Gap: 8,
                successAvatar.Build(),
                Text{Content: "Success", FontSize: 12, Color: "#a1a1aa"},
            },
            Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .Gap: 8,
                warningAvatar.Build(),
                Text{Content: "Warning", FontSize: 12, Color: "#a1a1aa"},
            },
            Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .Gap: 8,
                squareAvatar.Build(),
                Text{Content: "Square", FontSize: 12, Color: "#a1a1aa"},
            },
        }
    }
}
