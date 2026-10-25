package Goo.Widgets.Gallery.Pages.Content

import Goo
import Goo.Widgets
import Goo.Widgets.Content
import Goo.Widgets.Gallery
import System
import System.Linq

internal class CodeBlockExample : Cell {
    internal var Window Window?
    private var expanded bool
    private let code string = "package Example\n\nimport Log\n\nfunc Main() {\n    let message = \"Hello, you\"\n    Console.WriteLine(message)\n}"
    private let steps string = String.Join(
        "\n",
        Enumerable.Range(1, 400).Select(
            i -> "let step" + i.ToString() + " = step" + (i - 1).ToString() + " + " + i.ToString()
        )
    )
    private let highlightSteps Action[TextPresentationLayer, SyntaxPalette] = (
        layer TextPresentationLayer,
        palette SyntaxPalette
    ) -> {
        let text = layer.Document.GetText()
        var index = text.IndexOf("let ", StringComparison.Ordinal)
        while index >= 0 {
            layer.SetStyle(index.ToString(), TextRange(index, 3), Style{Color: palette.Keyword})
            index = text.IndexOf("let ", index + 3, StringComparison.Ordinal)
        }
    }

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
                Highlight: (layer, palette) -> {
                    layer.SetStyle("package", TextRange(0, 7), Style{Color: palette.Keyword})
                    layer.SetStyle("import", TextRange(17, 6), Style{Color: palette.Keyword})
                    layer.SetStyle("function", TextRange(34, 4), Style{Color: palette.Function})
                    layer.SetStyle("string", TextRange(61, 12), Style{Color: palette.String})
                },
            }
        ),
        Cell.Mount[CodeBlockInput, CodeBlock](
            "steps",
            CodeBlockInput{
                Code: steps,
                Language: "G#",
                Window: Window,
                ShowLineNumbers: true,
                MaxHeight: 320,
                Highlight: highlightSteps,
            }
        ),
    }
}

internal class CodeBlockPage : GalleryPage {
    override func Title() string -> "Code block"

    override func Build() Blob -> Cell.Mount[CodeBlockExample]("code-block-example", cell -> cell.Window = OwningWindow)
}
