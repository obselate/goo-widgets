package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

class SectionHeaderPage : GalleryPage {
    public override func Title() string -> "SectionHeader"

    public override func Build() Blob {
        let theme = Theme.Read()
        let defaultHeader = SectionHeader{Label: "Overview",}

        let accentMetaHeader = SectionHeader{
            Label: "Repositories",
            MetaText: "12 active",
            ShowAccent: true,
            Expanded: true,
        }

        let collapsedHeader = SectionHeader{
            Label: "Archived Projects",
            MetaText: "3 hidden",
            ShowAccent: true,
            Expanded: false,
        }

        let customHeader = SectionHeader{
            Label: "System Diagnostics",
            MetaText: "v2.4.0",
            ShowAccent: true,
            Expanded: true,
            AccessibilityName: "System Diagnostics Header",
            HeadingLevel: 3,
            LabelColor: theme.SuccessColor,
            MetaColor: theme.SuccessColor,
            RuleColor: theme.SuccessColor,
            AccentColor: theme.SuccessColor,
            Gap: 14.0,
            AccentSize: 8.0,
            RuleHeight: 2.0,
            LabelFontSize: 13.0,
            LabelFontWeight: 800,
            MetaFontSize: 12.0,
            MetaFontWeight: 600,
        }

        return Container{Width: 620.0, Gap: 24.0, defaultHeader.Build(), accentMetaHeader.Build(), collapsedHeader.Build(), customHeader.Build()}
    }
}
