package Goo.Widgets.Gallery.Pages.Graphs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Graphs

internal open class GraphNodeCardExample : Cell {
    public override func Build() Blob -> Container{
        Width: 740.0,
        Height: 260.0,
        Position: PositionType.Relative,
        BackgroundColor: Theme.Read().SunkenColor,
        BorderWidth: 1.0,
        BorderColor: Theme.Read().BorderColor,
        BorderRadius: 8.0,
        GraphNodeCard{
            Node: GraphNode{Id: "normal", Label: "Normal node", Position: Point{X: 140.0, Y: 96.0},},
        },
        GraphNodeCard{
            Node: GraphNode{Id: "selected", Label: "Selected node", Position: Point{X: 370.0, Y: 96.0},},
            Selected: true,
        },
        GraphNodeCard{
            Node: GraphNode{
                Id: "custom",
                Label: "Custom node",
                Position: Point{X: 600.0, Y: 96.0},
                Content: Container{
                    Gap: 3.0,
                    AlignItems: AlignItems.Center,
                    Text{Content: "Queue", FontSize: 13.0, FontWeight: 700, Color: Color.Parse("#fafafa")},
                    Text{Content: "12 jobs", FontSize: 10.0, Color: Color.Parse("#d4d4d8")},
                },
            },
            BackgroundColor: Color.Parse("#172554"),
            BorderColor: Color.Parse("#60a5fa"),
        },
    }
}

internal class GraphNodeCardPage : GalleryPage {
    override func Title() string -> "Graph node card"

    override func Build() Blob -> Cell.Mount[GraphNodeCardExample]("graph-node-card-example")
}
