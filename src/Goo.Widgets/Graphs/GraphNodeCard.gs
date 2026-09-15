package Goo.Widgets.Graphs

import Goo
import System

/// Reusable graph node presentation with caller-owned content and pointer handlers.
public data struct GraphNodeCard {
    /// Node rendered by the card.
    var Node GraphNode
    /// Whether the card uses its selected appearance.
    var Selected bool
    /// Card center in screen coordinates. Nil resolves to Node.Position.
    var Center Point?
    /// Card width in logical pixels. Zero resolves to 160.0.
    var Width float64
    /// Card height in logical pixels. Zero resolves to 64.0.
    var Height float64
    /// Card padding. Nil resolves to 12.0.
    var Padding float64?
    /// Card corner radius. Nil resolves to 8.0.
    var BorderRadius float64?
    /// Card border width. Nil resolves to 1.0.
    var BorderWidth float64?
    /// Unselected background color. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Selected background color. Nil resolves to #1d4ed8.
    var SelectedBackgroundColor Color?
    /// Unselected border color. Nil resolves to #52525b.
    var BorderColor Color?
    /// Selected border color. Nil resolves to #93c5fd.
    var SelectedBorderColor Color?
    /// Fallback label color. Nil resolves to #fafafa.
    var ForegroundColor Color?
    /// Optional base style for the card root.
    var RootStyle Style?
    /// Receives pointer presses on the card.
    var OnPointerDown Action[PointerEvent]?
    /// Receives pointer movement captured by the card.
    var OnPointerMove Action[PointerEvent]?
    /// Receives pointer releases captured by the card.
    var OnPointerUp Action[PointerEvent]?
    /// Receives pointer cancellation captured by the card.
    var OnPointerCancel Action[PointerEvent]?

    /// Builds the graph node card.
    public func Build() Container {
        let width = if Width == 0.0 {
            160.0
        } else {
            Width
        }
        let height = if Height == 0.0 {
            64.0
        } else {
            Height
        }
        let padding = Padding ?? 12.0
        let borderRadius = BorderRadius ?? 8.0
        let borderWidth = BorderWidth ?? 1.0
        let center = Center ?? Node.Position
        if String.IsNullOrWhiteSpace(Node.Id) {
            throw ArgumentException("Node identity must be nonempty.", "Node")
        }
        if String.IsNullOrWhiteSpace(Node.Label) {
            throw ArgumentException("Node label must be nonempty.", "Node")
        }
        if !Double.IsFinite(width) || width <= 0.0 {
            throw ArgumentOutOfRangeException("Width")
        }
        if !Double.IsFinite(height) || height <= 0.0 {
            throw ArgumentOutOfRangeException("Height")
        }
        if !Double.IsFinite(center.X) || !Double.IsFinite(center.Y) {
            throw ArgumentOutOfRangeException("Center")
        }
        if !Double.IsFinite(padding) || padding < 0.0 {
            throw ArgumentOutOfRangeException("Padding")
        }
        if !Double.IsFinite(borderRadius) || borderRadius < 0.0 {
            throw ArgumentOutOfRangeException("BorderRadius")
        }
        if !Double.IsFinite(borderWidth) || borderWidth < 0.0 {
            throw ArgumentOutOfRangeException("BorderWidth")
        }
        let content = Node.Content ?? Text{
            Content: Node.Label,
            Color: ForegroundColor ?? Color.Parse("#fafafa"),
            FontSize: 13.0,
            FontWeight: 700,
            TextWrap: TextWrap.NoWrap,
            TextTrimming: TextTrimming.Ellipsis,
        }
        return Container(){
            .BasedOn: RootStyle,
            .Key: "graph-node-" + Node.Id,
            .Position: PositionType.Absolute,
            .Left: center.X - width * 0.5,
            .Top: center.Y - height * 0.5,
            .Width: width,
            .Height: height,
            .Padding: padding,
            .BorderRadius: borderRadius,
            .BorderWidth: borderWidth,
            .BorderColor: if Selected {
                SelectedBorderColor ?? Color.Parse("#93c5fd")
            } else {
                BorderColor ?? Color.Parse("#52525b")
            },
            .BackgroundColor: if Selected {
                SelectedBackgroundColor ?? Color.Parse("#1d4ed8")
            } else {
                BackgroundColor ?? Color.Parse("#18181b")
            },
            .AlignItems: AlignItems.Center,
            .JustifyContent: JustifyContent.Center,
            .Focusable: true,
            .Cursor: Cursor.Pointer,
            .Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: Node.Label, Selected: Selected,},
            .OnPointerDown: OnPointerDown,
            .OnPointerMove: OnPointerMove,
            .OnPointerUp: OnPointerUp,
            .OnPointerCancel: OnPointerCancel,
            content,
        }
    }
}
