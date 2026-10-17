package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class ThemeScopePage : GalleryPage {
    override func Title() string -> "ThemeScope"

    override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            Gap: theme.PanelPadding,
            Text{Content: "Inherited window theme", Color: theme.TextColor, FontSize: theme.HeadingFontSize},
            ActionButton{Content: "Standard control"}.Build(),
            ThemeScope{
                Density: Density.Compact,
                Content: () -> Container{
                    Gap: Theme.Read().ControlGap,
                    TextField{Label: "Compact scope", Value: "28 px controls"}.Build(),
                    ThemeScope{
                        Value: Theme.Read() with{AccentColor = Color.Parse("#a43723")},
                        Density: Density.Touch,
                        Content: () -> Container{
                            Gap: Theme.Read().ControlGap,
                            (Theme.Read().PrimaryButton with{Content = "Nested accent and Touch density"}).Build(),
                            TextField{Label: "Touch scope", Value: "44 px controls"}.Build(),
                        },
                    }.Build(),
                },
            }.Build(),
        }
    }
}
