package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class TokenInputExample : Cell {
    private var tokens[]string = []string{"alex@example.com", "invalid address"}

    public override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            Width: 560,
            Gap: 16,
            Text{Content: "Recipients", FontSize: theme.HeadingFontSize, Color: theme.TextColor},
            Cell.Mount[TokenInputInput, TokenInput](
                "recipients",
                TokenInputInput{
                    Value: tokens,
                    Width: Percent(100),
                    AccessibilityName: "Recipients",
                    Placeholder: "Add an email address",
                    Validate: value -> value.Contains("@"),
                    Suggestions: []string{"blair@example.com", "casey@example.com"},
                    OnChange: values -> {
                        tokens = values
                        Rebuild()
                    },
                }
            ),
            Text{Content: "Disabled", Color: theme.MutedTextColor},
            Cell.Mount[TokenInputInput, TokenInput](
                "disabled",
                TokenInputInput{Value: []string{"read-only@example.com"}, Width: Percent(100), Disabled: true,}
            ),
        }
    }
}

internal class TokenInputPage : GalleryPage {
    override func Title() string -> "Token input"

    override func Build() Blob -> Cell.Mount[TokenInputExample]("token-input-example")
}
