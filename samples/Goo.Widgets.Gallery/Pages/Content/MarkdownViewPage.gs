package Goo.Widgets.Gallery.Pages.Content

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Markdown

internal class MarkdownExample : Cell {
    private var activated string = "none"
    private func Open(target string) {
        activated = target
        Rebuild()
    }

    public override func Build() Blob -> Container{
        Width: 720.0,
        Height: Percent(100),
        Gap: 12.0,
        Text{Key: "status", Content: "Link " + activated, FontSize: 12.0},
        Container{
            Key: "scroll",
            FlexGrow: 1.0,
            FlexBasis: 0.0,
            MinHeight: 0.0,
            OverflowY: Overflow.Scroll,
            Cell.Mount[MarkdownViewInput, MarkdownView](
                "markdown",
                MarkdownViewInput{
                    OnLink: Open,
                    Text:
                    "# Release 24.9\n\nThis release adds **faster search**, *offline drafts* and `export --all`. Read the [upgrade guide](app:guide) before you update.\n\n"
                    + "> [!TIP]\n> Drafts sync again when the connection returns.\n\n"
                    + "| Area | Status |\n| :--- | ---: |\n| Search | Ready |\n| Export | Beta |\n\n"
                    + "```gsharp\nlet total = price * quantity\n```\n\n"
                    + "1. Back up your workspace.\n2. Install the update.\n\n---\n\n## Known issues\n\nLarge imports can take a few minutes."
                }
            )
        }
    }
}

internal class MarkdownViewPage : GalleryPage {
    override func Title() string -> "Markdown"

    override func Build() Blob -> Cell.Mount[MarkdownExample]("markdown-example")
}
