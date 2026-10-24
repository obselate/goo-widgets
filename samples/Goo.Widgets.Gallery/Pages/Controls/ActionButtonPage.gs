package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Icons

class ActionButtonPage : GalleryPage {
    public override func Title() string -> "ActionButton"

    public override func Build() Blob -> Cell.Mount[ActionButtonDemo]("action-buttons")
}

class ActionButtonDemo : Cell {
    private var pressed bool

    public override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            Gap: 16,
            Text{Content: "Actions", FontSize: theme.HeadingFontSize, Color: theme.TextColor},
            Container{
                FlexDirection: FlexDirection.Row,
                FlexWrap: FlexWrap.Wrap,
                Gap: 12,
                (
                    theme.PrimaryButton with{
                        Content = "Save",
                        Leading = MaterialIcons.Create("save", size: 18),
                        Shortcut = "Ctrl S"
                    }
                ).Build(),
                (
                    theme.OutlineButton with{
                        Content = "Next",
                        Trailing = MaterialIcons.Create("arrow_forward", size: 18)
                    }
                ).Build(),
                (theme.SubtleButton with{Content = "Subtle"}).Build(),
                (theme.LinkButton with{Content = "Learn more"}).Build(),
            },
            Container{
                FlexDirection: FlexDirection.Row,
                FlexWrap: FlexWrap.Wrap,
                Gap: 12,
                (theme.Button with{Content = "Saving changes", Loading = true}).Build(),
                (theme.Button with{Content = "Disabled", Disabled = true}).Build(),
                (
                    theme.Button with{
                        Content = "Pinned",
                        Pressed = pressed,
                        OnClick = () -> {
                            pressed = !pressed
                            Rebuild()
                        }
                    }
                ).Build(),
            },
        }
    }
}
