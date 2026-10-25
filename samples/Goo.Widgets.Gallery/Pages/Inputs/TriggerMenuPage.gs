package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class TriggerMenuExample : Cell {
    private let editor ElementHandle = ElementHandle()
    private let controller TextEditorController = TextEditorController(TextDocument("Thanks for the review @an"))
    private let people[]string = []string{
        "Ada Lovelace",
        "Alan Turing",
        "Annie Easley",
        "Grace Hopper",
        "Katherine Johnson",
        "Margaret Hamilton",
        "Radia Perlman",
    }

    public init() {
        let end = TextPosition{Offset: controller.Document.Length}
        controller.Selection = TextSelection{Anchor: end, Active: end}
    }

    public override func Build() Blob -> Container{
        Width: Percent(100),
        MaxWidth: 560,
        MinWidth: 0,
        Cell.Mount[TriggerMenuInput, TriggerMenu](
            "mentions",
            TriggerMenuInput{
                Editor: editor,
                Controller: controller,
                Items: (trigger string) -> people,
                Content: Cell.Mount[TextAreaInput, TextArea](
                    "message",
                    TextAreaInput{
                        Controller: controller,
                        AccessibilityName: "Message",
                        Width: Percent(100),
                        MinimumRows: 3,
                        CreateEditor: (input TextAreaInput, created TextEditor) -> {
                            created.Handle = editor
                            created.AutoFocus = true
                            return created
                        },
                    }
                ),
            }
        ),
    }
}

internal class TriggerMenuPage : GalleryPage {
    override func Title() string -> "Trigger menu"

    override func Build() Blob -> Cell.Mount[TriggerMenuExample]("trigger-menu-example")
}
