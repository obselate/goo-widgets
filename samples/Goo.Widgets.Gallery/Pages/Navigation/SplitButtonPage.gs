package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Navigation

internal class SplitButtonExample : Cell {
    private var isOpen bool
    private var result string = "None"

    private func Activate(id string) {
        result = id
        Rebuild()
    }

    public override func Build() Blob -> Container{
        Gap: 20,
        SplitButton{
            Button: ActionButton{Content: "Send", OnClick: () -> Activate("Send")},
            ArrowAccessibilityName: "Other send actions",
            Menu: MenuButtonInput{
                Open: isOpen,
                OnOpenChange: (value bool) -> {
                    isOpen = value
                    Rebuild()
                },
                OnActivate: Activate,
                Items: []MenuItem{
                    MenuItem{Id: "Schedule send", Label: "Schedule send"},
                    MenuItem{Id: "Save as draft", Label: "Save as draft"},
                },
            },
        }.Build(),
        SplitButton{Button: ActionButton{Content: "Disabled send", Disabled: true}}.Build(),
        Text{Content: "Last action " + result},
    }
}

internal class SplitButtonPage : GalleryPage {
    override func Title() string -> "Split button"

    override func Build() Blob -> Cell.Mount[SplitButtonExample]("split-button-example")
}
