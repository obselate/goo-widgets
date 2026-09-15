package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery
import Goo.Widgets.Icons

class EmptyStatePage : GalleryPage {
    public override func Title() string -> "EmptyState"

    public override func Build() Blob {
        let emptyIll = Container(){
            .Width: 36.0,
            .Height: 36.0,
            .BorderRadius: 8.0,
            .BackgroundColor: Color.Parse("#27272a"),
            .AlignItems: AlignItems.Center,
            .JustifyContent: JustifyContent.Center,
            MaterialIcons.Create("inventory_2", 24.0, Color.Parse("#d4d4d8")),
        }
        let emptyAct = Container(){
            .PaddingLeft: 12.0,
            .PaddingRight: 12.0,
            .PaddingTop: 5.0,
            .PaddingBottom: 5.0,
            .BorderRadius: 6.0,
            .BackgroundColor: Color.Parse("#fafafa"),
            Text{Content: "Create project", FontSize: 11.0, FontWeight: 600, Color: "#09090b"},
        }
        let emptyCollection = EmptyState{
            AccessibilityName: "Empty projects collection",
            Title: "No projects yet",
            Description: "Get started by creating your first workspace repository.",
            Illustration: emptyIll,
            Action: emptyAct,
            Width: 360.0,
            MinHeight: 170.0,
            PaddingHorizontal: 20.0,
            PaddingVertical: 18.0,
            Gap: 10.0,
            TextGap: 4.0,
            TitleFontSize: 16.0,
            DescriptionFontSize: 12.0,
        }

        let noResIll = Container(){
            .Width: 36.0,
            .Height: 36.0,
            .BorderRadius: 8.0,
            .BackgroundColor: Color.Parse("#27272a"),
            .AlignItems: AlignItems.Center,
            .JustifyContent: JustifyContent.Center,
            MaterialIcons.Create("search", 24.0, Color.Parse("#a1a1aa")),
        }
        let noResAct = Container(){
            .PaddingLeft: 10.0,
            .PaddingRight: 10.0,
            .PaddingTop: 4.0,
            .PaddingBottom: 4.0,
            .BorderRadius: 6.0,
            .BackgroundColor: Color.Parse("#18181b"),
            .BorderWidth: 1.0,
            .BorderColor: Color.Parse("#3f3f46"),
            Text{Content: "Clear filters", FontSize: 11.0, FontWeight: 600, Color: "#d4d4d8"},
        }
        let noResults = EmptyState{
            AccessibilityName: "No search results found",
            Title: "No matching results",
            Description: "Try adjusting search terms or clear existing filter tags.",
            Illustration: noResIll,
            Action: noResAct,
            Width: 360.0,
            MinHeight: 170.0,
            PaddingHorizontal: 20.0,
            PaddingVertical: 18.0,
            Gap: 10.0,
            TextGap: 4.0,
            TitleFontSize: 16.0,
            DescriptionFontSize: 12.0,
        }

        let permIll = Container(){
            .Width: 36.0,
            .Height: 36.0,
            .BorderRadius: 8.0,
            .BackgroundColor: Color.Parse("#450a0a"),
            .AlignItems: AlignItems.Center,
            .JustifyContent: JustifyContent.Center,
            MaterialIcons.Create("lock", 24.0, Color.Parse("#fca5a5")),
        }
        let permAct = Container(){
            .PaddingLeft: 10.0,
            .PaddingRight: 10.0,
            .PaddingTop: 4.0,
            .PaddingBottom: 4.0,
            .BorderRadius: 6.0,
            .BackgroundColor: Color.Parse("#450a0a"),
            .BorderWidth: 1.0,
            .BorderColor: Color.Parse("#991b1b"),
            Text{Content: "Open settings", FontSize: 11.0, FontWeight: 600, Color: "#fca5a5"},
        }
        let permission = EmptyState{
            AccessibilityName: "Permission required empty state",
            Title: "Access restricted",
            Description: "You need administrator role clearance to view audit logs.",
            Illustration: permIll,
            Action: permAct,
            Width: 360.0,
            MinHeight: 170.0,
            PaddingHorizontal: 20.0,
            PaddingVertical: 18.0,
            Gap: 10.0,
            TextGap: 4.0,
            TitleFontSize: 16.0,
            TitleColor: Color.Parse("#fecaca"),
            DescriptionFontSize: 12.0,
            DescriptionColor: Color.Parse("#fca5a5"),
            BackgroundColor: Color.Parse("#450a0a"),
            BorderColor: Color.Parse("#991b1b"),
            BorderWidth: 1.0,
            BorderRadius: 10.0,
        }

        let minimalState = EmptyState{
            AccessibilityName: "All caught up inbox notification",
            HeadingLevel: 3,
            Title: "You are all caught up",
            Width: 360.0,
            MinHeight: 170.0,
            PaddingHorizontal: 20.0,
            PaddingVertical: 18.0,
            TitleFontSize: 15.0,
            TitleColor: Color.Parse("#d4d4d8"),
            BackgroundColor: Color.Parse("#18181b"),
            BorderColor: Color.Parse("#3f3f46"),
            BorderWidth: 1.0,
            BorderRadius: 10.0,
        }

        return Container(){
            .FlexDirection: FlexDirection.Column,
            .AlignItems: AlignItems.Center,
            .JustifyContent: JustifyContent.Center,
            .Gap: 16.0,
            Container(){
                .FlexDirection: FlexDirection.Row,
                .AlignItems: AlignItems.Center,
                .JustifyContent: JustifyContent.Center,
                .Gap: 16.0,
                Container(){
                    .FlexDirection: FlexDirection.Column,
                    .Gap: 6.0,
                    Text{Content: "EMPTY COLLECTION", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa"},
                    emptyCollection.Build(),
                },
                Container(){
                    .FlexDirection: FlexDirection.Column,
                    .Gap: 6.0,
                    Text{Content: "NO SEARCH RESULTS", FontSize: 10.0, FontWeight: 700, Color: "#d4d4d8"},
                    noResults.Build(),
                },
            },
            Container(){
                .FlexDirection: FlexDirection.Row,
                .AlignItems: AlignItems.Center,
                .JustifyContent: JustifyContent.Center,
                .Gap: 16.0,
                Container(){
                    .FlexDirection: FlexDirection.Column,
                    .Gap: 6.0,
                    Text{Content: "PERMISSION REQUIRED (BORDERED)", FontSize: 10.0, FontWeight: 700, Color: "#ef4444"},
                    permission.Build(),
                },
                Container(){
                    .FlexDirection: FlexDirection.Column,
                    .Gap: 6.0,
                    Text{Content: "TITLE ONLY (MINIMAL)", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa"},
                    minimalState.Build(),
                },
            },
        }
    }
}
