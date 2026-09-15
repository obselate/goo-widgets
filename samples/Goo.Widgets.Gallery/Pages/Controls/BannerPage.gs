package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

class BannerPage : GalleryPage {
    public override func Title() string -> "Banner"

    public override func Build() Blob {
        let baseBanner = Banner{MinHeight: 40.0, PaddingVertical: 8.0, FontWeight: 600,}

        let calmStatus = baseBanner with{Content = "All systems operational", AccessibilityName = "Calm status",}
        let loudStatus = baseBanner with{
            Content = "Maintenance starts in 10 minutes",
            Loud = true,
            AccessibilityName = "Loud status",
        }
        let alertBanner = baseBanner with{
            Content = "Connection lost. Retry now.",
            Alert = true,
            AccessibilityName = "Alert",
        }
        let customPalette = baseBanner with{
            Content = "Custom palette preview",
            AccessibilityName = "Custom palette",
            BackgroundColor = Color.Parse("#052e16"),
            TextColor = Color.Parse("#bbf7d0"),
            BorderColor = Color.Parse("#166534"),
        }

        return Container{
            Width: 620.0,
            FlexDirection: FlexDirection.Column,
            AlignItems: AlignItems.Center,
            Gap: 10,
            Container{Width: Length.Percent(100), FlexDirection: FlexDirection.Column, calmStatus.Build(),},
            Container{Width: Length.Percent(100), FlexDirection: FlexDirection.Column, loudStatus.Build(),},
            Container{Width: Length.Percent(100), FlexDirection: FlexDirection.Column, alertBanner.Build(),},
            Container{Width: Length.Percent(100), FlexDirection: FlexDirection.Column, customPalette.Build(),},
        }
    }
}
