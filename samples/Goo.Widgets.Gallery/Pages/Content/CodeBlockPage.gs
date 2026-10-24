package Goo.Widgets.Gallery.Pages.Content

import Goo
import Goo.Widgets
import Goo.Widgets.Content
import Goo.Widgets.Gallery

internal class CodeBlockExample : Cell {
    internal var Window Window?
    private var expanded bool
    private var copied bool
    private let code string = "package Example\n\nimport Goo\n\nfunc Main() {\n    let message = \"Hello, Goo\"\n    Console.WriteLine(message)\n}"

    public override func Build() Blob -> Container{
        Width: Percent(100),
        MaxWidth: 680,
        MinWidth: 0,
        Gap: 16,
        Cell.Mount[CodeBlockInput, CodeBlock](
            "code",
            CodeBlockInput{
                Code: code,
                Language: "G#",
                Window: Window,
                ShowLineNumbers: true,
                CollapsedLines: 5,
                Expanded: expanded,
                OnExpandedChange: value -> {
                    expanded = value
                    Rebuild()
                },
                OnCopy: value -> {
                    Window?.SetClipboardText(value)
                    copied = true
                    Rebuild()
                },
                Highlight: (layer, palette) -> {
                    layer.SetStyle("package", TextRange(0, 7), Style{Color: palette.Keyword})
                    layer.SetStyle("import", TextRange(17, 6), Style{Color: palette.Keyword})
                    layer.SetStyle("function", TextRange(34, 4), Style{Color: palette.Function})
                    layer.SetStyle("string", TextRange(61, 12), Style{Color: palette.String})
                },
            }
        ),
        Text{
            Content: copied ? "Copied to clipboard": "Select text or copy the full code while folded.",
            Color: Theme.Read().MutedTextColor
        },
    }
}

internal class CodeBlockPage : GalleryPage {
    override func Title() string -> "Code block"

    override func Build() Blob -> Cell.Mount[CodeBlockExample]("code-block-example", cell -> cell.Window = OwningWindow)
}
