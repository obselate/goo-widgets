package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Graphs
import System

func GraphTouchInteractions() {
    let host = GraphHost()
    let window = Window{Root: host, Width: 620, Height: 420, Title: "Goo graph touch check"}.Open()
    try {
        PumpFrames(window, 12)
        TouchPressAt(window, 601, Point{X: 350, Y: 240})
        TouchMoveAt(window, 601, Point{X: 370, Y: 250})
        PumpFrames(window, 4)
        Require(host.Viewport.PanX == 20.0 && host.Viewport.PanY == 10.0,
            "One-contact graph pan changed its logical delta")
        TouchPressAt(window, 602, Point{X: 470, Y: 250})
        PumpFrames(window, 3)
        Require(host.Viewport.PanX == 20.0 && host.Viewport.Zoom == 1.0,
            "Adding a graph pinch contact moved the viewport")
        TouchMoveAt(window, 602, Point{X: 570, Y: 250})
        PumpFrames(window, 4)
        Require(host.Viewport.Zoom == 2.0, "Graph pinch did not apply 2x scale")
        let requests = host.ViewportRequests
        window.PlatformInput.PointerCancel(601, PointerDevice.Touch)
        TouchMoveAt(window, 602, Point{X: 520, Y: 250})
        TouchReleaseAt(window, 602, Point{X: 520, Y: 250})
        PumpFrames(window, 4)
        Require(host.ViewportRequests == requests, "Canceled graph pinch kept changing the viewport")
        host.Viewport = GraphViewport{Zoom: 1.0}
        host.Rebuild()
        PumpFrames(window, 4)
        let card = host.Card!!.Handle!!.BorderBox
        let start = Point{X: card.X + card.Width * 0.5, Y: card.Y + card.Height * 0.5}
        let before = host.Position
        TouchPressAt(window, 603, start)
        TouchMoveAt(window, 603, Point{X: start.X + 24.0, Y: start.Y + 12.0})
        PumpFrames(window, 4)
        TouchReleaseAt(window, 603, Point{X: start.X + 24.0, Y: start.Y + 12.0})
        PumpFrames(window, 4)
        Require(host.Position.X == before.X + 24.0 && host.Position.Y == before.Y + 12.0
            && host.Selected.Length == 1 && host.Selected[0] == "one",
            "Touch node drag did not retain selection or world coordinates")
        let id = OnlyNativeWindow()
        GraphViewportInteractions(window, host, id)
        CaptureIssueProof(window, "graph-touch-navigation")
    } finally {
        window.RequestClose()
        PumpFrames(window, 2)
    }
    Console.WriteLine("PASS: graph pan, pinch without contact-join jump, cancellation, node drag and controlled mouse zoom")
}
