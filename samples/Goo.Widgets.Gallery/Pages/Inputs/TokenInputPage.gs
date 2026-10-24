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
            Text{
                Content: "Enter or comma adds a token. Backspace selects, then removes the last token.",
                Color: theme.MutedTextColor
            },
            Cell.Mount[TokenInputInput, TokenInput](
                "recipients",
                TokenInputInput{
                    Tokens: tokens,
                    Width: Percent(100),
                    AccessibilityName: "Recipients",
                    Placeholder: "Add an email address",
                    Validate: value -> value.Contains("@"),
                    Suggestions: []string{"blair@example.com", "casey@example.com"},
                    OnTokensChange: values -> {
                        tokens = values
                        Rebuild()
                    },
                }
            ),
            Text{Content: "Disabled", Color: theme.MutedTextColor},
            Cell.Mount[TokenInputInput, TokenInput](
                "disabled",
                TokenInputInput{Tokens: []string{"read-only@example.com"}, Width: Percent(100), Disabled: true,}
            ),
        }
    }
}

internal class TokenInputPage : GalleryPage {
    override func Title() string -> "Token input"

    override func Build() Blob -> Cell.Mount[TokenInputExample]("token-input-example")
}
