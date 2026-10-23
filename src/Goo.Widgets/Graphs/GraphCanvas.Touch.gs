package Goo.Widgets.Graphs

import Goo
import Goo.Gestures
import System
import System.Collections.Generic

public open partial class GraphCanvas {
    private let navigation []GestureRecognizer
    private let nodeGestures Dictionary[string, []GestureRecognizer] = Dictionary[string, []GestureRecognizer]()
    private let touchNodes Dictionary[string, GraphNode] = Dictionary[string, GraphNode]()
    private var canvasTapId int64 = -1L
    private var previousTranslation Point
    private var previousScale float64 = 1.0
    private var previousNodePoint Point

    public init() {
        navigation = []GestureRecognizer{TransformGesture(TransformViewport)}
    }

    private func RefreshTouchNodes() {
        touchNodes.Clear()
        for node in resolved.Nodes { touchNodes[node.Id] = node }
        for pair in nodeGestures {
            if !touchNodes.ContainsKey(pair.Key) { nodeGestures.Remove(pair.Key) }
        }
    }

    private func NodeGestures(id string) []GestureRecognizer {
        if nodeGestures.TryGetValue(id, out var gestures) { return gestures }
        gestures = []GestureRecognizer{PanGesture((event PanGestureEvent) -> MoveTouchNode(id, event))}
        nodeGestures.Add(id, gestures)
        return gestures
    }

    private func TransformViewport(event TransformGestureEvent) {
        if event.Phase == GesturePhase.Started {
            previousTranslation = Point{}
            previousScale = 1.0
            pointerMode = GraphPointerMode.Pan
            canvasTapId = -1L
        }
        if event.Phase != GesturePhase.Canceled {
            let delta = Point{X: event.Translation.X - previousTranslation.X,
                Y: event.Translation.Y - previousTranslation.Y}
            let zoom = Math.Clamp(viewport.Zoom * event.Scale / previousScale,
                resolved.MinimumZoom, resolved.MaximumZoom)
            let center = event.Center
            let world = WorldPosition(Point{X: center.X - delta.X, Y: center.Y - delta.Y})
            let next = GraphViewport{PanX: center.X - world.X * zoom,
                PanY: center.Y - world.Y * zoom, Zoom: zoom}
            previousTranslation = event.Translation
            previousScale = event.Scale
            if next != viewport {
                viewport = next
                resolved.OnViewportChanged?.Invoke(viewport)
            }
        }
        if event.Phase == GesturePhase.Completed || event.Phase == GesturePhase.Canceled {
            pointerMode = GraphPointerMode.None
        }
        Rebuild()
    }

    private func MoveTouchNode(id string, event PanGestureEvent) {
        if event.Phase == GesturePhase.Started {
            if !touchNodes.TryGetValue(id, out var node) { return }
            EmitNodeSelection(id, KeyModifiers{})
            pointerMode = GraphPointerMode.Node
            draggedNodeId = id
            draggedNodePosition = Point{X: node.Position.X + event.Translation.X / viewport.Zoom,
                Y: node.Position.Y + event.Translation.Y / viewport.Zoom}
            previousNodePoint = event.WindowPosition
            resolved.OnNodePositionChanged?.Invoke(GraphNodePositionChange{NodeId: id, Position: draggedNodePosition})
        } else if event.Phase != GesturePhase.Canceled && draggedNodeId == id {
            draggedNodePosition = Point{
                X: draggedNodePosition.X + (event.WindowPosition.X - previousNodePoint.X) / viewport.Zoom,
                Y: draggedNodePosition.Y + (event.WindowPosition.Y - previousNodePoint.Y) / viewport.Zoom,
            }
            previousNodePoint = event.WindowPosition
            resolved.OnNodePositionChanged?.Invoke(GraphNodePositionChange{NodeId: id, Position: draggedNodePosition})
        }
        if event.Phase == GesturePhase.Completed || event.Phase == GesturePhase.Canceled {
            pointerMode = GraphPointerMode.None
            draggedNodeId = nil
        }
        Rebuild()
    }
}
