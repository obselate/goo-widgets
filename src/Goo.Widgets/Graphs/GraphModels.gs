package Goo.Widgets

import Goo

/// The controlled graph viewport transform.
public data struct GraphViewport {
    /// Horizontal screen-space translation.
    var PanX float64
    /// Vertical screen-space translation.
    var PanY float64
    /// World-to-screen scale.
    var Zoom float64
}

/// A graph node with caller-owned identity, position, label, and optional content.
public data struct GraphNode {
    /// Stable node identity.
    var Id string
    /// Center position in graph world coordinates.
    var Position Point
    /// Accessible and fallback display label.
    var Label string
    /// Optional content rendered in place of the fallback label.
    var Content Blob?
}

/// A visual connection between two graph nodes.
public data struct GraphEdge {
    /// Stable edge identity.
    var Id string
    /// Source node identity.
    var FromId string
    /// Destination node identity.
    var ToId string
}

/// Describes a requested controlled node position update.
public data struct GraphNodePositionChange {
    /// Identity of the moved node.
    var NodeId string
    /// Requested position in graph world coordinates.
    var Position Point
}
