package Goo.Widgets.Gallery.Pages.Graphs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Graphs

internal open class GraphNodeCardExample : Cell {
  public override func Build() Blob -> Container {
    Gap: 12.0,
    Children: {
      Text{
        Content: "Graph node cards support normal, selected, and caller-owned content states.",
        FontSize: 11.0,
        Color: "#a1a1aa",
      },
      Container{
        Width: 740.0,
        Height: 260.0,
        Position: PositionType.Relative,
        BackgroundColor: "#09090b",
        BorderWidth: 1.0,
        BorderColor: "#27272a",
        BorderRadius: 8.0,
        Children: {
          GraphNodeCard{
            Node: GraphNode{
              Id: "normal",
              Label: "Normal node",
              Position: Point{ X: 140.0, Y: 96.0 },
            },
          }.Build(),
          GraphNodeCard{
            Node: GraphNode{
              Id: "selected",
              Label: "Selected node",
              Position: Point{ X: 370.0, Y: 96.0 },
            },
            Selected: true,
          }.Build(),
          GraphNodeCard{
            Node: GraphNode{
              Id: "custom",
              Label: "Custom node",
              Position: Point{ X: 600.0, Y: 96.0 },
              Content: Container{
                Gap: 3.0,
                AlignItems: AlignItems.Center,
                Children: {
                  Text{ Content: "Custom content", FontSize: 13.0, FontWeight: 700, Color: "#fafafa" },
                  Text{ Content: "caller supplied", FontSize: 10.0, Color: "#d4d4d8" },
                },
              },
            },
            BackgroundColor: "#172554",
            BorderColor: "#60a5fa",
          }.Build(),
        },
      },
    },
  }
}

internal class GraphNodeCardPage : GalleryPage {
  override func Title() string -> "Graph node card"
  override func Build() Blob -> Cell.Mount[GraphNodeCardExample]("graph-node-card-example")
}
