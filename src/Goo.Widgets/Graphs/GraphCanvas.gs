package Goo.Widgets

import Goo
import System
import System.Collections.Generic

/// Immutable input for a mounted graph canvas.
public data struct GraphCanvasInput {
    /// Nodes in the graph.
    var Nodes[]GraphNode
    /// Edges in the graph.
    var Edges[]GraphEdge
    /// Controlled selected node identities.
    var SelectedNodeIds[]string
    /// Controlled viewport transform.
    var Viewport GraphViewport
    /// Canvas width in logical pixels. Zero resolves to 800.0.
    var Width float64
    /// Canvas height in logical pixels. Zero resolves to 480.0.
    var Height float64
    /// Node width in logical pixels. Zero resolves to 160.0.
    var NodeWidth float64
    /// Node height in logical pixels. Zero resolves to 64.0.
    var NodeHeight float64
    /// Grid spacing in world coordinates. Zero resolves to 48.0.
    var GridSpacing float64
    /// Minimum visible grid spacing in screen pixels. Zero resolves to 18.0.
    var MinimumGridScreenSpacing float64
    /// Minimum permitted zoom. Zero resolves to 0.1.
    var MinimumZoom float64
    /// Maximum permitted zoom. Zero resolves to 4.0.
    var MaximumZoom float64
    /// Background color. Nil resolves to #09090b.
    var BackgroundColor Color?
    /// Grid line color. Nil resolves to #27272a.
    var GridColor Color?
    /// Edge color. Nil resolves to #52525b.
    var EdgeColor Color?
    /// Color of edges connected to selected nodes. Nil resolves to #60a5fa.
    var SelectedEdgeColor Color?
    /// Edge width in logical pixels. Zero resolves to 2.0.
    var EdgeWidth float64
    /// Marquee fill color. Nil resolves to translucent blue.
    var MarqueeFillColor Color?
    /// Marquee border color. Nil resolves to #60a5fa.
    var MarqueeBorderColor Color?
    /// Optional base style for the canvas root.
    var RootStyle Style?
    /// Optional base style for node cards.
    var NodeStyle Style?
    /// Optional base style for edge strokes.
    var EdgeStyle Style?
    /// Creates content for a node. The node Content value is used when nil.
    var CreateNodeContent Func[GraphNode, Blob]?
    /// Customizes a built interactive node card or replaces it with another blob.
    var CustomizeNode Func[GraphNode, Container, Blob]?
    /// Customizes a built edge stroke or replaces it with another blob.
    var CustomizeEdge Func[GraphEdge, Container, Blob]?
    /// Receives requested controlled selection updates.
    var OnSelectionChanged Action[[]string]?
    /// Receives requested controlled node position updates.
    var OnNodePositionChanged Action[GraphNodePositionChange]?
    /// Receives requested controlled viewport updates.
    var OnViewportChanged Action[GraphViewport]?
}

enum GraphPointerMode {
    None;
    Pan;
    Marquee;
    Node
}

/// An interactive controlled graph canvas with panning, zooming, selection, and node dragging.
public open class GraphCanvas : Cell[GraphCanvasInput] {
    private let handle ElementHandle = ElementHandle{}
    private var resolved GraphCanvasInput
    private var viewport GraphViewport
    private var lastExternalViewport GraphViewport
    private var initialized bool
    private var pointerMode GraphPointerMode
    private var pointerId int64 = -1L
    private var draggedNodeId string?
    private var draggedNodePosition Point
    private var dragPointerWorld Point
    private var marqueeStart Point
    private var marqueeEnd Point
    private var marqueeAdd bool
    private var marqueeToggle bool

    protected override func Build(input GraphCanvasInput) Blob {
        resolved = Resolve(input)
        if !initialized || input.Viewport != lastExternalViewport {
            viewport = resolved.Viewport
            lastExternalViewport = input.Viewport
            initialized = true
        }
        let root = Container{
            BasedOn: resolved.RootStyle,
            Key: "graph-canvas",
            Handle: handle,
            Position: PositionType.Relative,
            Width: resolved.Width,
            Height: resolved.Height,
            Overflow: Overflow.Hidden,
            BackgroundColor: resolved.BackgroundColor!!,
            Focusable: true,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: "Graph canvas"},
            OnPointerDown: (e PointerEvent) -> BeginCanvasPointer(e),
            OnPointerMove: (e PointerEvent) -> MovePointer(e),
            OnPointerUp: (e PointerEvent) -> EndPointer(e),
            OnPointerCancel: (e PointerEvent) -> CancelPointer(e),
            OnWheel: (e WheelEvent) -> Zoom(e),
            GridLayer(),
            EdgeLayer(),
        }
        for node in resolved.Nodes {
            if NodeVisible(node) || draggedNodeId == node.Id {
                root.Children.Add(NodeCard(node))
            }
        }
        if pointerMode == GraphPointerMode.Marquee {
            root.Children.Add(Marquee())
        }
        return root
    }

    private func Resolve(input GraphCanvasInput) GraphCanvasInput {
        let minimumZoom = if input.MinimumZoom == 0.0 {
            0.1
        } else {
            input.MinimumZoom
        }
        let maximumZoom = if input.MaximumZoom == 0.0 {
            4.0
        } else {
            input.MaximumZoom
        }
        if !Double.IsFinite(minimumZoom) || minimumZoom <= 0.0 {
            throw ArgumentOutOfRangeException("MinimumZoom")
        }
        if !Double.IsFinite(maximumZoom) || maximumZoom < minimumZoom {
            throw ArgumentOutOfRangeException("MaximumZoom")
        }
        let value = input with{
            Nodes = input.Nodes ?? []GraphNode{},
            Edges = input.Edges ?? []GraphEdge{},
            SelectedNodeIds = input.SelectedNodeIds ?? []string{},
            Viewport = GraphViewport{
                PanX: input.Viewport.PanX,
                PanY: input.Viewport.PanY,
                Zoom: Math.Clamp(
                    if input.Viewport.Zoom == 0.0 {
                        1.0
                    } else {
                        input.Viewport.Zoom
                    },
                    minimumZoom,
                    maximumZoom
                ),
            },
            Width = if input.Width == 0.0 {
                800.0
            } else {
                input.Width
            },
            Height = if input.Height == 0.0 {
                480.0
            } else {
                input.Height
            },
            NodeWidth = if input.NodeWidth == 0.0 {
                160.0
            } else {
                input.NodeWidth
            },
            NodeHeight = if input.NodeHeight == 0.0 {
                64.0
            } else {
                input.NodeHeight
            },
            GridSpacing = if input.GridSpacing == 0.0 {
                48.0
            } else {
                input.GridSpacing
            },
            MinimumGridScreenSpacing = if input.MinimumGridScreenSpacing == 0.0 {
                18.0
            } else {
                input.MinimumGridScreenSpacing
            },
            MinimumZoom = minimumZoom,
            MaximumZoom = maximumZoom,
            EdgeWidth = if input.EdgeWidth == 0.0 {
                2.0
            } else {
                input.EdgeWidth
            },
            BackgroundColor = input.BackgroundColor ?? Color.Parse("#09090b"),
            GridColor = input.GridColor ?? Color.Parse("#27272a"),
            EdgeColor = input.EdgeColor ?? Color.Parse("#52525b"),
            SelectedEdgeColor = input.SelectedEdgeColor ?? Color.Parse("#60a5fa"),
            MarqueeFillColor = input.MarqueeFillColor ?? Color.Rgba(59, 130, 246, 40),
            MarqueeBorderColor = input.MarqueeBorderColor ?? Color.Parse("#60a5fa"),
        }
        Validate(value)
        return value
    }

    private func Validate(value GraphCanvasInput) {
        if !Double.IsFinite(value.Width) || value.Width <= 0.0 {
            throw ArgumentOutOfRangeException("Width")
        }
        if !Double.IsFinite(value.Height) || value.Height <= 0.0 {
            throw ArgumentOutOfRangeException("Height")
        }
        if !Double.IsFinite(value.NodeWidth) || value.NodeWidth <= 0.0 {
            throw ArgumentOutOfRangeException("NodeWidth")
        }
        if !Double.IsFinite(value.NodeHeight) || value.NodeHeight <= 0.0 {
            throw ArgumentOutOfRangeException("NodeHeight")
        }
        if !Double.IsFinite(value.GridSpacing) || value.GridSpacing <= 0.0 {
            throw ArgumentOutOfRangeException("GridSpacing")
        }
        if !Double.IsFinite(value.MinimumGridScreenSpacing) || value.MinimumGridScreenSpacing <= 0.0 {
            throw ArgumentOutOfRangeException("MinimumGridScreenSpacing")
        }
        if !Double.IsFinite(value.EdgeWidth) || value.EdgeWidth <= 0.0 {
            throw ArgumentOutOfRangeException("EdgeWidth")
        }
        if !Double.IsFinite(value.Viewport.PanX) || !Double.IsFinite(value.Viewport.PanY)
        || !Double.IsFinite(value.Viewport.Zoom) {
            throw ArgumentOutOfRangeException("Viewport")
        }
        let nodeIds = HashSet[string](StringComparer.Ordinal)
        for node in value.Nodes {
            if String.IsNullOrWhiteSpace(node.Id) || !nodeIds.Add(node.Id) {
                throw ArgumentException("Graph node identities must be nonempty and unique.", "Nodes")
            }
            if String.IsNullOrWhiteSpace(node.Label) {
                throw ArgumentException("Graph node labels must be nonempty.", "Nodes")
            }
            if !Double.IsFinite(node.Position.X) || !Double.IsFinite(node.Position.Y) {
                throw ArgumentException("Graph node positions must be finite.", "Nodes")
            }
        }
        let edgeIds = HashSet[string](StringComparer.Ordinal)
        for edge in value.Edges {
            if String.IsNullOrWhiteSpace(edge.Id) || !edgeIds.Add(edge.Id) {
                throw ArgumentException("Graph edge identities must be nonempty and unique.", "Edges")
            }
        }
        let selectedIds = HashSet[string](StringComparer.Ordinal)
        for id in value.SelectedNodeIds {
            if String.IsNullOrWhiteSpace(id) || !selectedIds.Add(id) {
                throw ArgumentException("Selected node identities must be nonempty and unique.", "SelectedNodeIds")
            }
        }
    }

    private func GridLayer() Container {
        let layer = PassiveLayer("graph-grid")
        var spacing = resolved.GridSpacing * viewport.Zoom
        while spacing < resolved.MinimumGridScreenSpacing {
            spacing *= 2.0
        }
        var offsetX = viewport.PanX % spacing
        var offsetY = viewport.PanY % spacing
        if offsetX < 0.0 {
            offsetX += spacing
        }
        if offsetY < 0.0 {
            offsetY += spacing
        }
        var index int32
        var x = offsetX
        while x <= resolved.Width {
            layer.Children.Add(
                Container{
                    Key: "grid-x-" + index.ToString(),
                    Position: PositionType.Absolute,
                    Left: x,
                    Top: 0.0,
                    Width: 1.0,
                    Height: resolved.Height,
                    BackgroundColor: resolved.GridColor!!,
                    HitTestSelf: false,
                }
            )
            x += spacing
            index++
        }
        index = 0
        var y = offsetY
        while y <= resolved.Height {
            layer.Children.Add(
                Container{
                    Key: "grid-y-" + index.ToString(),
                    Position: PositionType.Absolute,
                    Left: 0.0,
                    Top: y,
                    Width: resolved.Width,
                    Height: 1.0,
                    BackgroundColor: resolved.GridColor!!,
                    HitTestSelf: false,
                }
            )
            y += spacing
            index++
        }
        return layer
    }

    private func EdgeLayer() Container {
        let layer = PassiveLayer("graph-edges")
        let nodes = Dictionary[string, GraphNode](StringComparer.Ordinal)
        for node in resolved.Nodes {
            nodes[node.Id] = node
        }
        for edge in resolved.Edges {
            if !nodes.TryGetValue(edge.FromId, out var from) || !nodes.TryGetValue(edge.ToId, out var to) {
                continue
            }
            let fromPosition = ScreenPosition(NodePosition(from))
            let toPosition = ScreenPosition(NodePosition(to))
            if Math.Max(fromPosition.X, toPosition.X) < 0.0 || Math.Min(fromPosition.X, toPosition.X) > resolved.Width
            || Math.Max(fromPosition.Y, toPosition.Y) < 0.0 || Math.Min(
                fromPosition.Y,
                toPosition.Y
            ) > resolved.Height {
                continue
            }
            let dx = toPosition.X - fromPosition.X
            let dy = toPosition.Y - fromPosition.Y
            let length = Math.Sqrt(dx * dx + dy * dy)
            let selected = IsSelected(edge.FromId) || IsSelected(edge.ToId)
            let stroke = Container{
                BasedOn: resolved.EdgeStyle,
                Key: "graph-edge-" + edge.Id,
                Position: PositionType.Absolute,
                Left: fromPosition.X,
                Top: fromPosition.Y - resolved.EdgeWidth * 0.5,
                Width: length,
                Height: resolved.EdgeWidth,
                BackgroundColor: if selected {
                    resolved.SelectedEdgeColor!!
                } else {
                    resolved.EdgeColor!!
                },
                Opacity: if selected {
                    1.0
                } else if resolved.SelectedNodeIds.Length > 0 {
                    0.25
                } else {
                    0.7
                },
                TransformOriginX: Length.Percent(0.0),
                TransformOriginY: Length.Percent(50.0),
                Transform: PanelTransform{Rotate: Math.Atan2(dy, dx) * 180.0 / Math.PI},
                HitTestSelf: false,
            }
            layer.Children.Add(
                if let customizeEdge = resolved.CustomizeEdge {
                    customizeEdge(edge, stroke)
                } else {
                    stroke
                }
            )
        }
        return layer
    }

    private func PassiveLayer(key string) Container -> Container{
        Key: key,
        Position: PositionType.Absolute,
        Left: 0.0,
        Top: 0.0,
        Width: resolved.Width,
        Height: resolved.Height,
        HitTestSelf: false,
    }

    private func NodeCard(node GraphNode) Blob {
        let position = ScreenPosition(NodePosition(node))
        let displayNode = if let createNodeContent = resolved.CreateNodeContent {
            node with{Content = createNodeContent(node)}
        } else {
            node
        }
        let card = GraphNodeCard{
            Node: displayNode,
            Selected: IsSelected(node.Id),
            Center: position,
            Width: resolved.NodeWidth,
            Height: resolved.NodeHeight,
            RootStyle: resolved.NodeStyle,
            OnPointerDown: (e PointerEvent) -> BeginNodePointer(node, e),
            OnPointerUp: (e PointerEvent) -> EndPointer(e),
            OnPointerCancel: (e PointerEvent) -> CancelPointer(e),
        }.Build()
        return if let customizeNode = resolved.CustomizeNode {
            customizeNode(node, card)
        } else {
            card
        }
    }

    private func Marquee() Container {
        let left = Math.Min(marqueeStart.X, marqueeEnd.X)
        let top = Math.Min(marqueeStart.Y, marqueeEnd.Y)
        return Container{
            Key: "graph-marquee",
            Position: PositionType.Absolute,
            Left: left,
            Top: top,
            Width: Math.Abs(marqueeEnd.X - marqueeStart.X),
            Height: Math.Abs(marqueeEnd.Y - marqueeStart.Y),
            BackgroundColor: resolved.MarqueeFillColor!!,
            BorderWidth: 1.0,
            BorderColor: resolved.MarqueeBorderColor!!,
            HitTestSelf: false,
        }
    }

    private func BeginCanvasPointer(e PointerEvent) {
        if pointerMode != GraphPointerMode.None {
            return
        }
        if e.Button == PointerButton.Middle {
            pointerMode = GraphPointerMode.Pan
        } else if e.Button == PointerButton.Primary {
            pointerMode = GraphPointerMode.Marquee
            marqueeStart = e.Position
            marqueeEnd = e.Position
            marqueeAdd = e.Modifiers.Shift
            marqueeToggle = e.Modifiers.Ctrl
            if !marqueeAdd && !marqueeToggle {
                EmitSelection([]string{})
            }
        } else {
            return
        }
        pointerId = e.PointerId
        e.Capture()
        e.PreventDefault()
        Rebuild()
    }

    private func BeginNodePointer(node GraphNode, e PointerEvent) {
        if e.Button != PointerButton.Primary || pointerMode != GraphPointerMode.None {
            return
        }
        if !EmitNodeSelection(node.Id, e.Modifiers) {
            e.StopPropagation()
            return
        }
        pointerMode = GraphPointerMode.Node
        pointerId = e.PointerId
        draggedNodeId = node.Id
        draggedNodePosition = node.Position
        dragPointerWorld = WorldPosition(CanvasPosition(e))
        e.Capture()
        e.PreventDefault()
        e.StopPropagation()
        Rebuild()
    }

    private func MovePointer(e PointerEvent) {
        if e.PointerId != pointerId {
            return
        }
        if pointerMode == GraphPointerMode.Pan {
            viewport = viewport with{PanX = viewport.PanX + e.Delta.X, PanY = viewport.PanY + e.Delta.Y}
            resolved.OnViewportChanged?.Invoke(viewport)
            Rebuild()
        } else if pointerMode == GraphPointerMode.Marquee {
            marqueeEnd = e.Position
            Rebuild()
        } else if pointerMode == GraphPointerMode.Node {
            guard let draggedNodeId = draggedNodeId else {
                return
            }
            let world = WorldPosition(CanvasPosition(e))
            draggedNodePosition = Point{
                X: draggedNodePosition.X + world.X - dragPointerWorld.X,
                Y: draggedNodePosition.Y + world.Y - dragPointerWorld.Y,
            }
            dragPointerWorld = world
            resolved.OnNodePositionChanged?.Invoke(
                GraphNodePositionChange{NodeId: draggedNodeId, Position: draggedNodePosition,}
            )
            Rebuild()
        }
    }

    private func EndPointer(e PointerEvent) {
        if e.PointerId != pointerId {
            return
        }
        if pointerMode == GraphPointerMode.Marquee {
            CompleteMarquee()
        }
        CancelPointer(e)
    }

    private func CancelPointer(e PointerEvent) {
        if e.PointerId != pointerId {
            return
        }
        e.ReleaseCapture()
        pointerMode = GraphPointerMode.None
        pointerId = -1L
        draggedNodeId = nil
        Rebuild()
    }

    private func CompleteMarquee() {
        let left = Math.Min(marqueeStart.X, marqueeEnd.X)
        let top = Math.Min(marqueeStart.Y, marqueeEnd.Y)
        let right = Math.Max(marqueeStart.X, marqueeEnd.X)
        let bottom = Math.Max(marqueeStart.Y, marqueeEnd.Y)
        let next = if marqueeAdd || marqueeToggle {
            List[string](resolved.SelectedNodeIds)
        } else {
            List[string]()
        }
        for node in resolved.Nodes {
            let center = ScreenPosition(NodePosition(node))
            let intersects = center.X + resolved.NodeWidth * 0.5 >= left
            && center.X - resolved.NodeWidth * 0.5 <= right
            && center.Y + resolved.NodeHeight * 0.5 >= top
            && center.Y - resolved.NodeHeight * 0.5 <= bottom
            if !intersects {
                continue
            }
            if marqueeToggle && next.Contains(node.Id) {
                next.Remove(node.Id)
            } else if !next.Contains(node.Id) {
                next.Add(node.Id)
            }
        }
        EmitSelection(next.ToArray())
    }

    private func EmitNodeSelection(id string, modifiers KeyModifiers) bool {
        let next = List[string](resolved.SelectedNodeIds)
        if modifiers.Ctrl {
            if !next.Remove(id) {
                next.Add(id)
            }
        } else if modifiers.Shift {
            if !next.Contains(id) {
                next.Add(id)
            }
        } else if next.Count != 1 || next[0] != id {
            next.Clear()
            next.Add(id)
        }
        EmitSelection(next.ToArray())
        return next.Contains(id)
    }

    private func EmitSelection(ids[]string) {
        resolved.OnSelectionChanged?.Invoke(ids)
    }

    private func Zoom(e WheelEvent) {
        if e.Delta.Y == 0.0 {
            return
        }
        let nextZoom = Math.Clamp(
            viewport.Zoom * Math.Pow(1.1, Math.Clamp(e.Delta.Y, -10.0, 10.0)),
            resolved.MinimumZoom,
            resolved.MaximumZoom
        )
        let world = WorldPosition(e.Position)
        viewport = GraphViewport{
            PanX: e.Position.X - world.X * nextZoom,
            PanY: e.Position.Y - world.Y * nextZoom,
            Zoom: nextZoom,
        }
        resolved.OnViewportChanged?.Invoke(viewport)
        e.PreventDefault()
        Rebuild()
    }

    private func IsSelected(id string) bool -> Array.IndexOf(resolved.SelectedNodeIds, id) >= 0

    private func NodePosition(node GraphNode) Point {
        if draggedNodeId == node.Id {
            return draggedNodePosition
        }
        return node.Position
    }

    private func ScreenPosition(point Point) Point -> Point{
        X: point.X * viewport.Zoom + viewport.PanX,
        Y: point.Y * viewport.Zoom + viewport.PanY,
    }

    private func WorldPosition(point Point) Point -> Point{
        X: (point.X - viewport.PanX) / viewport.Zoom,
        Y: (point.Y - viewport.PanY) / viewport.Zoom,
    }

    private func CanvasPosition(e PointerEvent) Point {
        let bounds = handle.BorderBox
        return Point{X: e.WindowPosition.X - bounds.X, Y: e.WindowPosition.Y - bounds.Y}
    }

    private func NodeVisible(node GraphNode) bool {
        let point = ScreenPosition(NodePosition(node))
        return point.X + resolved.NodeWidth * 0.5 >= 0.0
        && point.X - resolved.NodeWidth * 0.5 <= resolved.Width
        && point.Y + resolved.NodeHeight * 0.5 >= 0.0
        && point.Y - resolved.NodeHeight * 0.5 <= resolved.Height
    }
}
