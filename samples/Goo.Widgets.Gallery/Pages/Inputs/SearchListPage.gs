package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal open class SearchListExample : Cell {
    private var query string = ""
    private var selected string = "alpha"

    /// Builds the controlled search-list example.
    public override func Build() Blob -> Container{
        Gap: 12,
        SearchList{
            Items: []SelectionItem{
                SelectionItem{Id: "alpha", Label: "Alpha", Detail: "Project"},
                SelectionItem{Id: "beta", Label: "Beta", Detail: "Document"},
                SelectionItem{Id: "gamma", Label: "Gamma", Detail: "Locked", Disabled: true},
            },
            Width: 360,
            Height: 220,
            Query: query,
            SelectedId: selected,
            OnQueryChange: (value string) -> {
                query = value
            },
            OnSelect: (value string) -> {
                selected = value
            },
        }.Build(),
        Text{Content: "Selected: " + selected, Color: "#fafafa"},
    }
}

internal class SearchListPage : GalleryPage {
    override func Title() string -> "Search list"

    override func Build() Blob -> Cell.Mount[SearchListExample]("search-list-example")
}
