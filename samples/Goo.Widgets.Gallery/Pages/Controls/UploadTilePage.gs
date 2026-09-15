package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Inputs

class UploadTilePage : GalleryPage {
    public override func Title() string -> "UploadTile"

    public override func Build() Blob {
        let waitingTile = UploadTile{
            AccessibilityName: "Waiting file upload specimen",
            Size: 140.0,
            Body: Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .JustifyContent: JustifyContent.Center,
                .Gap: 6.0,
                MaterialIcons.Create("description", 28.0, Color.Parse("#a1a1aa")),
                Text{Content: "report.pdf", FontSize: 11.0, Color: "#d4d4d8"},
            },
            Status: Text{Content: "Waiting in queue...", FontSize: 11.0, Color: "#a1a1aa"},
            Action: Container(){
                .PaddingLeft: 6.0,
                .PaddingRight: 6.0,
                .PaddingTop: 2.0,
                .PaddingBottom: 2.0,
                .BorderRadius: 4.0,
                .BackgroundColor: Color.Parse("#27272a"),
                MaterialIcons.Create("close", 12.0, Color.Parse("#a1a1aa")),
            },
        }

        let progressTile = UploadTile{
            AccessibilityName: "Progress file upload specimen",
            Size: 140.0,
            Body: Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .JustifyContent: JustifyContent.Center,
                .Gap: 6.0,
                MaterialIcons.Create("folder_zip", 28.0),
                Text{Content: "archive.zip", FontSize: 11.0, Color: "#d4d4d8"},
            },
            Status: Text{Content: "Uploading 68%", FontSize: 11.0, FontWeight: 700, Color: "#fafafa"},
            Action: Container(){
                .PaddingLeft: 6.0,
                .PaddingRight: 6.0,
                .PaddingTop: 2.0,
                .PaddingBottom: 2.0,
                .BorderRadius: 4.0,
                .BackgroundColor: Color.Parse("#27272a"),
                MaterialIcons.Create("pause", 12.0, Color.Parse("#a1a1aa")),
            },
        }

        let failedTile = UploadTile{
            AccessibilityName: "Failed file upload specimen",
            Size: 140.0,
            Failed: true,
            Body: Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .JustifyContent: JustifyContent.Center,
                .Gap: 6.0,
                MaterialIcons.Create("raw_on", 28.0, Color.Parse("#ef4444")),
                Text{Content: "photo_raw.dng", FontSize: 11.0, Color: "#d4d4d8"},
            },
            Status: Text{Content: "Failed ∶ Network timeout", FontSize: 10.0, Color: "#fca5a5"},
            Action: Container(){
                .PaddingLeft: 6.0,
                .PaddingRight: 6.0,
                .PaddingTop: 2.0,
                .PaddingBottom: 2.0,
                .BorderRadius: 4.0,
                .BackgroundColor: Color.Parse("#450a0a"),
                Text{Content: "RETRY", FontSize: 9.0, FontWeight: 700, Color: "#fca5a5"},
            },
        }

        let readyTile = UploadTile{
            AccessibilityName: "Ready file upload specimen",
            Size: 140.0,
            BackgroundColor: Color.Parse("#052e16"),
            BorderColor: Color.Parse("#166534"),
            StatusBackgroundColor: Color.Parse("#14532d"),
            BorderRadius: 14.0,
            Padding: 16.0,
            StatusPaddingVertical: 10.0,
            Body: Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .JustifyContent: JustifyContent.Center,
                .Gap: 6.0,
                MaterialIcons.Create("image", 28.0, Color.Parse("#4ade80")),
                Text{Content: "banner.png", FontSize: 11.0, Color: "#f0fdf4"},
            },
            Status: Text{Content: "Ready / 100%", FontSize: 11.0, FontWeight: 700, Color: "#4ade80"},
            Action: Container(){
                .PaddingLeft: 6.0,
                .PaddingRight: 6.0,
                .PaddingTop: 2.0,
                .PaddingBottom: 2.0,
                .BorderRadius: 4.0,
                .BackgroundColor: Color.Parse("#166534"),
                Text{Content: "VIEW", FontSize: 9.0, FontWeight: 700, Color: "#bbf7d0"},
            },
        }

        return Container(){
            .FlexDirection: FlexDirection.Row,
            .AlignItems: AlignItems.Center,
            .JustifyContent: JustifyContent.Center,
            .Gap: 24.0,
            Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .Gap: 8.0,
                Text{Content: "WAITING (INITIAL)", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa"},
                waitingTile.Build(),
            },
            Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .Gap: 8.0,
                Text{Content: "PROGRESS (ACTIVE)", FontSize: 10.0, FontWeight: 700, Color: "#fafafa"},
                progressTile.Build(),
            },
            Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .Gap: 8.0,
                Text{Content: "FAILED (RETRY STATE)", FontSize: 10.0, FontWeight: 700, Color: "#ef4444"},
                failedTile.Build(),
            },
            Container(){
                .FlexDirection: FlexDirection.Column,
                .AlignItems: AlignItems.Center,
                .Gap: 8.0,
                Text{Content: "READY (CUSTOM PALETTE)", FontSize: 10.0, FontWeight: 700, Color: "#4ade80"},
                readyTile.Build(),
            },
        }
    }
}
