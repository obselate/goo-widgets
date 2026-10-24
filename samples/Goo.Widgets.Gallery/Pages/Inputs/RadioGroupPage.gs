package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Inputs

class RadioGroupPage : GalleryPage {
    public override func Title() string -> "Radio group"

    public override func Build() Blob -> Cell.Mount[RadioDemo]("radio-demo")
}

class RadioDemo : Cell {
    private var selected string = "standard"
    private var reminders AccessibilityChecked
    public override func Build() Blob -> Container{
        Gap: 12,
        Text{Content: "Delivery choices", FontSize: Theme.Read().HeadingFontSize},
        Cell.Mount[RadioGroupInput, RadioGroup](
            "radio",
            RadioGroupInput{
                AccessibilityName: "Delivery",
                SelectedId: selected,
                OnSelect: (id string) -> {
                    selected = id
                    Rebuild()
                },
                Items: []RadioOption{
                    RadioOption{Id: "standard", Label: "Standard", Description: "Arrives in three days"},
                    RadioOption{Id: "express", Label: "Express", Description: "Arrives tomorrow"},
                    RadioOption{Id: "unavailable", Label: "Same day", Disabled: true},
                },
            }
        ),
        Text{Content: "Choice cards", FontSize: Theme.Read().HeadingFontSize},
        Cell.Mount[RadioGroupInput, RadioGroup](
            "cards",
            RadioGroupInput{
                AccessibilityName: "Delivery cards",
                Card: true,
                SelectedId: selected,
                OnSelect: (id string) -> {
                    selected = id
                    Rebuild()
                },
                Items: []RadioOption{
                    RadioOption{
                        Id: "standard",
                        Label: "Standard",
                        Description: "Reliable delivery",
                        Leading: MaterialIcons.Create("inventory_2", size: 22)
                    },
                    RadioOption{
                        Id: "express",
                        Label: "Express",
                        Description: "Priority delivery",
                        Leading: MaterialIcons.Create("local_shipping", size: 22)
                    },
                },
            }
        ),
        Checkbox{
            Label: "Delivery reminders",
            Description: "Send a message before delivery",
            Card: true,
            State: reminders,
            OnChange: (state AccessibilityChecked) -> {
                reminders = state
                Rebuild()
            },
        }.Build(),
    }
}
