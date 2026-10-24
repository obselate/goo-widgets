package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Data
import Goo.Widgets.Gallery

class ChipPage : GalleryPage {
    public override func Title() string -> "Chip"

    public override func Build() Blob {
        let defaultChip = Chip{Label: "Documentation",}

        let selectedLeadingChip = Chip{
            Label: "Active",
            Selected: true,
            Leading: Container{Width: 8.0, Height: 8.0, BorderRadius: 4.0, BackgroundColor: "#09090b",},
        }

        let disabledSelectedChip = Chip{Label: "Locked Tag", Selected: true, Disabled: true,}

        let customStyledChip = Chip{
            Label: "Custom Style",
            Selected: true,
            Leading: Container{Width: 8.0, Height: 8.0, BorderRadius: 2.0, BackgroundColor: "#27272a",},
            Height: 32.0,
            PaddingHorizontal: 14.0,
            Gap: 8.0,
            FontSize: 13.0,
            FontWeight: 700,
            BorderRadius: 8.0,
        }

        return Container{
            FlexDirection: FlexDirection.Row,
            FlexWrap: FlexWrap.Wrap,
            AlignItems: AlignItems.Center,
            Gap: 24.0,
            defaultChip.Build(),
            selectedLeadingChip.Build(),
            disabledSelectedChip.Build(),
            customStyledChip.Build(),
        }
    }
}
