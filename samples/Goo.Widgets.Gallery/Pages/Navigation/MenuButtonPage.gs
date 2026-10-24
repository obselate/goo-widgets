package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Navigation

internal class MenuButtonExample : Cell {
    private var menuOpen bool
    private var result string = "None"

    private func Activate(id string) {
        result = id
        Rebuild()
    }

    public override func Build() Blob {
        let items = []MenuItem{
            MenuItem{Id: "Save", Label: "Save"},
            MenuItem{Id: "Save as", Label: "Save as…"},
            MenuItem{Id: "Unavailable", Label: "Unavailable", Disabled: true},
            MenuItem{Id: "Export", Label: "Export"},
        }
        return Container{
            Width: Percent(100),
            MaxWidth: 560,
            Gap: 20,
            Cell.Mount[MenuButtonInput, MenuButton](
                "trigger",
                MenuButtonInput{
                    Button: ActionButton{Content: "File actions"},
                    Items: items,
                    Open: menuOpen,
                    OnActivate: Activate,
                    OnOpenChange: (isOpen bool) -> {
                        menuOpen = isOpen
                        Rebuild()
                    },
                }
            ),
            Cell.Mount[MenuButtonInput, MenuButton](
                "disabled",
                MenuButtonInput{Button: ActionButton{Content: "Disabled menu", Disabled: true}, Items: items,}
            ),
            Text{Content: "Last action " + result},
        }
    }
}

internal class MenuButtonPage : GalleryPage {
    override func Title() string -> "Menu button"

    override func Build() Blob -> Cell.Mount[MenuButtonExample]("menu-button-example")
}
