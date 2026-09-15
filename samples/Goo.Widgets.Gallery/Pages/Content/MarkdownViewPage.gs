package Goo.Widgets.Gallery.Pages.Content

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Markdown

internal class MarkdownExample : Cell {
    private var activated string = "Select text or open the guide."
    private func Open(target string) {
        activated = "Link callback: " + target
        Rebuild()
    }

    public override func Build() Blob -> Container(){
        .Width: 720.0,
        .Height: 450.0,
        .Gap: 12.0,
        Text{Key: "status", Content: activated, FontSize: 12.0, Color: "#a5b4fc"},
        Container(){
            .Key: "scroll",
            .FlexGrow: 1.0,
            .FlexBasis: 0.0,
            .MinHeight: 0.0,
            .OverflowY: Overflow.Scroll,
            Cell.Mount[MarkdownViewInput, MarkdownView](
                "markdown",
                MarkdownViewInput{
                    OnLink: Open,
                    Text:
                    "# A readable release note\n\nSelectable **bold**, *italic*, and `inline code` stay together. Open the [release guide](app:guide) through a host callback.\n\n"
                    + "> [!TIP]\n> Selection, copying, and wrapping use Goo’s text editor.\n\n"
                    +
                        "| Component | Status |\n| :--- | ---: |\n| Calendar | Ready |\n| Markdown | Optional package |\n\n"
                    + "```gsharp\nlet message = Text{Content: \"Hello, Goo\"}\n```\n\n"
                    +
                        "1. Review the rendered content.\n2. Resize and select a paragraph.\n\n> Your application owns link and image behavior.\n\n---\n\n## More to explore\n\nHeadings expose handles for your table of contents."
                }
            )
        }
    }
}

internal class MarkdownViewPage : GalleryPage {
    override func Title() string -> "Markdown"

    override func Build() Blob -> Cell.Mount[MarkdownExample]("markdown-example")
}
