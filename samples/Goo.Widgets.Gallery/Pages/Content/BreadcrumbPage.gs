package Goo.Widgets.Gallery.Pages.Content

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Navigation

internal class BreadcrumbExample : Cell {
    private var selected string = "Current location"
    private let items[]BreadcrumbItem = []BreadcrumbItem{
        BreadcrumbItem{Id: "home", Label: "Home"},
        BreadcrumbItem{Id: "workspace", Label: "Workspace"},
        BreadcrumbItem{Id: "projects", Label: "Projects"},
        BreadcrumbItem{Id: "widgets", Label: "Widgets"},
        BreadcrumbItem{Id: "navigation", Label: "Navigation"},
        BreadcrumbItem{Id: "current", Label: "Breadcrumb"}
    }

    private func Select(id string) {
        selected = id
        Rebuild()
    }

    public override func Build() Blob -> Container{
        Width: Percent(100),
        Gap: 24,
        Typography{Content: "Breadcrumb and path bar", Variant: TextVariant.H2}.Build(),
        Cell.Mount[BreadcrumbInput, Breadcrumb]("full", BreadcrumbInput{Items: items, OnSelect: Select}),
        Container{
            Width: 300,
            Cell.Mount[BreadcrumbInput, Breadcrumb]("collapsed", BreadcrumbInput{Items: items, OnSelect: Select})
        },
        Typography{Content: "Path bar: chevrons open sibling locations", Variant: TextVariant.Caption}.Build(),
        Cell.Mount[BreadcrumbInput, PathBar](
            "siblings",
            BreadcrumbInput{
                Items: items,
                OnSelect: Select,
                SiblingItems: (id string) -> []BreadcrumbItem{
                    BreadcrumbItem{Id: "source", Label: "Source"},
                    BreadcrumbItem{Id: "tests", Label: "Tests"}
                }
            }
        ),
        Typography{Content: "Selected: " + selected, Variant: TextVariant.Caption}.Build()
    }
}

internal class BreadcrumbPage : GalleryPage {
    override func Title() string -> "Breadcrumb and path bar"

    override func Build() Blob -> Cell.Mount[BreadcrumbExample]("example")
}
