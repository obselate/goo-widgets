package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery

class ActionButtonPage : GalleryPage {
    public override func Title() string -> "ActionButton"

    public override func Build() Blob {
        let baseButton = ActionButton{Height: 38.0, MinWidth: 112.0, OnClick: () -> { },}

        let primaryButton = baseButton with{Label = "Primary",}
        let successButton = baseButton with{
            Label = "Success",
            BackgroundColor = Color.Parse("#166534"),
            TextColor = Color.Parse("#fafafa"),
            HoverBackgroundColor = Color.Parse("#15803d"),
            ActiveBackgroundColor = Color.Parse("#14532d"),
        }
        let dangerButton = baseButton with{
            Label = "Danger",
            BackgroundColor = Color.Parse("#991b1b"),
            TextColor = Color.Parse("#fafafa"),
            HoverBackgroundColor = Color.Parse("#b91c1c"),
            ActiveBackgroundColor = Color.Parse("#7f1d1d"),
        }
        let disabledButton = baseButton with{Label = "Disabled", Disabled = true,}

        return Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Gap: 16,
            primaryButton.Build(),
            successButton.Build(),
            dangerButton.Build(),
            disabledButton.Build(),
        }
    }
}
