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
                Content: () -> {
                    let compact = Theme.Read()
                    return Container{
                        Gap: compact.ControlGap,
                        TextField{Label: "Compact scope", Value: "28 px controls"}.Build(),
                        ThemeScope{
                            Value: compact with{
                                AccentColor = Color.Parse("#a43723"),
                                OnAccentColor = Theme.Ink.TextColor
                            },
                            Density: Density.Touch,
                            Content: () -> {
                                let touch = Theme.Read()
                                return Container{
                                    Gap: touch.ControlGap,
                                    (touch.PrimaryButton with{Content = "Nested accent and Touch density"}).Build(),
                                    TextField{Label: "Touch scope", Value: "44 px controls"}.Build(),
                                }
                            },
                        }.Build(),
                    }
                },
            }.Build(),
        }
    }
}
