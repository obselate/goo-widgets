package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal class GridExample : Cell {
    private var narrow bool
    private var clicks int32
    public override func Build() Blob -> Container{
        Gap: 18,
        Button{
            BackgroundColor: "#244753",
            Padding: 10,
            BorderRadius: 5,
            Color: "#bcf3ff",
            OnClick: () -> {
                narrow = !narrow
            },
            Text{Content: narrow ? "Width 340": "Width 610"}
        },
        Grid{
            Width: narrow ? 340.0: 610.0,
            ColumnGap: 16,
            RowGap: 14,
            Columns: []GridTrack{GridTrack.Auto(70.0, 120.0), GridTrack.Fraction(1, 80), GridTrack.Fixed(70)},
            Rows: []GridTrack{GridTrack.Auto(), GridTrack.Auto(), GridTrack.Auto(), GridTrack.Auto()},
            Items: []GridItem{
                GridItem{Id: "heading", ColumnSpan: 3, Content: Text{Content: "Project settings", FontSize: 24}},
                GridItem{Id: "name-label", Row: 1, Content: Text{Content: "Name"}},
                GridItem{Id: "name", Row: 1, Column: 1, Content: Text{Content: "Field notes"}},
                GridItem{
                    Id: "status",
                    Row: 1,
                    Column: 2,
                    RowSpan: 2,
                    Content: Container{
                        Padding: 8,
                        BackgroundColor: "#173f36",
                        BorderRadius: 5,
                        Text{Content: "Shared", FontSize: 12, Color: "#8de6c9"}
                    }
                },
                GridItem{Id: "description-label", Row: 2, Content: Text{Content: "Description"}},
                GridItem{
                    Id: "description",
                    Row: 2,
                    Column: 1,
                    Content: Text{
                        Content: "Notes from the spring field survey, grouped by site and sorted by date of the first visit.",
                        FontSize: 15
                    }
                },
                GridItem{
                    Id: "action",
                    Row: 3,
                    Column: 1,
                    ColumnSpan: 2,
                    Content: Button{
                        Padding: 10,
                        BackgroundColor: "#37304f",
                        Color: "#dbcafa",
                        BorderRadius: 5,
                        OnClick: () -> {
                            clicks++
                        },
                        Text{Content: "Clicks " + clicks.ToString()}
                    }
                },
            },
        }.Build()
    }
}

internal class GridPage : GalleryPage {
    override func Title() string -> "Grid"

    override func Build() Blob -> Cell.Mount[GridExample]("grid-example")
}
