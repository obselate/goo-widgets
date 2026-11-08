package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery
import Goo.Widgets.Icons

class EmptyStatePage : GalleryPage {
    public override func Title() string -> "EmptyState"

    public override func Build() Blob {
        let theme = Theme.Read()
        let emptyIll = Container{
            Width: 36.0,
            Height: 36.0,
            BorderRadius: 8.0,
            BackgroundColor: theme.SunkenColor,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            MaterialIcons.Create("inventory_2", 24.0, theme.MutedTextColor),
        }
        let emptyAct = Container{
            Padding: Edges(5.0, 12.0),
            BorderRadius: 6.0,
            BackgroundColor: theme.AccentColor,
            Text{Content: "Create project", FontSize: 11.0, FontWeight: 600, Color: theme.OnAccentColor},
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

        let noResIll = Container{
            Width: 36.0,
            Height: 36.0,
            BorderRadius: 8.0,
            BackgroundColor: theme.SunkenColor,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            MaterialIcons.Create("search", 24.0, theme.MutedTextColor),
        }
        let noResAct = Container{
            Padding: Edges(4.0, 10.0),
            BorderRadius: 6.0,
            BackgroundColor: theme.RaisedColor,
            BorderWidth: 1.0,
            BorderColor: theme.InputBorderColor,
            Text{Content: "Clear filters", FontSize: 11.0, FontWeight: 600},
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

        let permIll = Container{
            Width: 36.0,
            Height: 36.0,
            BorderRadius: 8.0,
            BackgroundColor: theme.PanelColor,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            MaterialIcons.Create("lock", 24.0, theme.DangerColor),
        }
        let permAct = Container{
            Padding: Edges(4.0, 10.0),
            BorderRadius: 6.0,
            BackgroundColor: theme.PanelColor,
            BorderWidth: 1.0,
            BorderColor: theme.DangerColor,
            Text{Content: "Open settings", FontSize: 11.0, FontWeight: 600, Color: theme.DangerColor},
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
            TitleColor: theme.DangerColor,
            DescriptionFontSize: 12.0,
            DescriptionColor: theme.TextColor,
            BackgroundColor: theme.DangerQuietColor,
            BorderColor: theme.DangerColor,
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
            TitleColor: theme.MutedTextColor,
            BackgroundColor: theme.RaisedColor,
            BorderColor: theme.BorderColor,
            BorderWidth: 1.0,
            BorderRadius: 10.0,
        }

        return Container{
            Gap: 16.0,
            Container{FlexDirection: FlexDirection.Row, Gap: 16.0, emptyCollection.Build(), noResults.Build()},
            Container{FlexDirection: FlexDirection.Row, Gap: 16.0, permission.Build(), minimalState.Build()},
        }
    }
}
