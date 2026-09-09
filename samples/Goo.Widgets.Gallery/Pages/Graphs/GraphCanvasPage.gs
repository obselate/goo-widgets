package Goo.Widgets.Gallery.Pages.Graphs

import Goo
import Goo.Widgets.Graphs
import Goo.Widgets.Gallery

internal open class GraphCanvasExample : Cell {
  private var nodes []GraphNode = []GraphNode{
    GraphNode{ Id: "source", Label: "Source", Position: GraphPoint{ X: 100.0, Y: 120.0 } },
    GraphNode{ Id: "transform", Label: "Transform", Position: GraphPoint{ X: 350.0, Y: 210.0 } },
    GraphNode{ Id: "output", Label: "Output", Position: GraphPoint{ X: 600.0, Y: 120.0 } },
  }
  private let edges []GraphEdge = []GraphEdge{
    GraphEdge{ Id: "source-transform", FromId: "source", ToId: "transform" },
    GraphEdge{ Id: "transform-output", FromId: "transform", ToId: "output" },
  }
  private var selected []string = []string{}
  private var viewport GraphViewport = GraphViewport{ PanX: 20.0, PanY: 20.0, Zoom: 0.9 }

  public override func Build() Blob -> Container {
    Width: 740.0,
    Gap: 10.0,
    FlexDirection: FlexDirection.Column,
    Children: {
      Text{
        Key: "graph-instructions",
        Content: "Middle-drag to pan, wheel to zoom, drag nodes, or drag the background to select.",
        FontSize: 11.0,
        Color: "#a1a1aa",
      },
      Cell.Mount[GraphCanvasInput, GraphCanvas]("graph-demo", GraphCanvasInput{
        Nodes: nodes,
        Edges: edges,
        SelectedNodeIds: selected,
        Viewport: viewport,
        Width: 740.0,
        Height: 400.0,
        NodeWidth: 140.0,
        NodeHeight: 58.0,
        CreateNodeContent: (node GraphNode) -> NodeContent(node),
        OnSelectionChanged: (ids []string) -> {
          selected = ids
          Rebuild()
        },
        OnViewportChanged: (value GraphViewport) -> {
          viewport = value
          Rebuild()
        },
        OnNodePositionChanged: (change GraphNodePositionChange) -> MoveNode(change),
      }),
      Text{
        Key: "graph-status",
        Content: selected.Length.ToString() + " selected  |  " + (viewport.Zoom * 100.0).ToString("0") + "% zoom",
        FontSize: 11.0,
        Color: "#d4d4d8",
      },
    },
  }

  private func NodeContent(node GraphNode) Blob -> Container {
    AlignItems: AlignItems.Center,
    Gap: 3.0,
    Children: {
      Text{ Content: node.Label, FontSize: 13.0, FontWeight: 700, Color: "#fafafa" },
      Text{ Content: node.Id, FontSize: 10.0, Color: "#d4d4d8" },
    },
  }

  private func MoveNode(change GraphNodePositionChange) {
    for i in 0 ... nodes.Length {
      if nodes[i].Id == change.NodeId {
        nodes[i] = nodes[i]with{ Position = change.Position }
        Rebuild()
        return
      }
    }
  }
}

internal class GraphCanvasPage : GalleryPage {
  override func Title() string -> "Graph canvas"
  override func Build() Blob -> Cell.Mount[GraphCanvasExample]("graph-canvas-example")
}
