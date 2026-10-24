package Goo.Widgets.Gallery.Pages.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import Goo.Widgets.Gallery
import Goo.Widgets.Icons

internal class AttachmentChipPage : GalleryPage {
    override func Title() string -> "Attachment chip"

    override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            Width: 440,
            Gap: 16,
            AttachmentChip{
                Name: "Quarterly-product-design-review-final.pdf",
                Detail: "2.4 MB",
                OnOpen: () -> { },
                OnDownload: () -> { },
            }.Build(),
            AttachmentChip{
                Name: "Landscape.png",
                Detail: "Uploading · 64%",
                Progress: 0.64,
                Leading: Container{
                    Width: 32,
                    Height: 32,
                    BorderRadius: 4,
                    BackgroundColor: theme.AccentColor,
                    AlignItems: AlignItems.Center,
                    JustifyContent: JustifyContent.Center,
                    MaterialIcons.Create("image", 24, theme.OnAccentColor),
                },
                OnRemove: () -> { },
            }.Build(),
            AttachmentChip{
                Name: "Notes.txt",
                Detail: "Upload interrupted",
                Failed: true,
                Progress: 0.3,
                OnRemove: () -> { },
            }.Build(),
            AttachmentChip{
                Name: "Managed-attachment.zip",
                Detail: "12 MB",
                Disabled: true,
                OnDownload: () -> { },
            }.Build(),
        }
    }
}
