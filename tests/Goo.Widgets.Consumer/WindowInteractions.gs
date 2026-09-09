package Goo.Widgets.Consumer

import System
import System.Runtime.InteropServices
import System.Threading
import Hexa.NET.SDL3
import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Colors
import Goo.Widgets.Inputs
import Goo.Widgets.Graphs
import Goo.Widgets.Icons

internal class IconButtonHost : Cell {
  internal var Activations int32
  internal var Root Button?

  public override func Build() Blob {
    let button = (IconButton{
      Icon: MaterialIcons.Create("add"), AccessibilityName: "Add item",
      OnClick: () -> { Activations++ },
    }.Build() as Button)!!
    button.Handle = ElementHandle{}
    Root = button
    return button
  }
}

internal class GraphHost : Cell {
  internal var Position Point = Point{X: 140.0, Y: 120.0}
  internal var Selected []string = []string{}
  internal var Card Container?
  internal var Moves int32

  public override func Build() Blob -> Container {
    Padding: 32,
    Children: {
      Cell.Mount[GraphCanvasInput, GraphCanvas]("graph", GraphCanvasInput{
        Nodes: []GraphNode{GraphNode{Id: "one", Label: "Drag me", Position: Position}},
        SelectedNodeIds: Selected, Width: 500.0, Height: 320.0,
        CustomizeNode: (node GraphNode, card Container) -> { card.Handle = ElementHandle{}
          Card = card
          return card },
        OnSelectionChanged: (ids []string) -> { Selected = ids
          Rebuild() },
        OnNodePositionChanged: (change GraphNodePositionChange) -> { Position = change.Position
          Moves++
          Rebuild() },
      }),
    },
  }
}

@DllImport("SDL3", EntryPoint: "SDL_GetWindows", CallingConvention: CallingConvention.Cdecl)
func NativeWindows(out count int32) nint;

@DllImport("SDL3", EntryPoint: "SDL_GetWindowID", CallingConvention: CallingConvention.Cdecl)
func NativeWindowId(window nint) uint32;

@DllImport("SDL3", EntryPoint: "SDL_free", CallingConvention: CallingConvention.Cdecl)
func NativeFree(memory nint) void;

internal class InteractiveHost : Cell {
  internal var Value float64 = 0.2
  internal var Commits int32
  internal var SliderRoot Container?
  internal var ColorRoot Container?
  internal var ColorValue int32 = 0x4477AA
  internal var ShowPicker bool = true
  internal var RangeDisabled bool
  internal var ShowGraph bool
  internal var Graph GraphHost?

  private func Change(value float64) {
    Value = value
    Rebuild()
  }

  /// Builds the isolated package interaction fixture.
  public override func Build() Blob {
    if ShowGraph { return Cell.Mount[GraphHost]("graph-fixture", (graph GraphHost) -> { Graph = graph }) }
    let root = Container{
      Width: Length.Percent(100), Height: Length.Percent(100), Padding: 32, Gap: 20,
      BackgroundColor: "#18181b", Color: "#fafafa",
      Children: {
        Text{Key: "heading", Content: "Packaged widget input checks", FontSize: 24},
        Cell.Mount[SliderInput, Slider]("range", SliderInput{
          Value: Value, Step: 0.3, Disabled: RangeDisabled,
          OnValueChanged: (value float64) -> Change(value),
          OnValueCommitted: (value float64) -> { Value = value
            Commits++
            Rebuild() },
          CreateRoot: (input SliderInput, slider Container) -> { SliderRoot = slider
            return slider },
        }),
      },
    }
    if ShowPicker {
      root.Children.Add(Cell.Mount[ColorPickerInput, ColorPicker]("color", ColorPickerInput{
        Value: ColorValue, Mode: ColorMode.Hsv, WheelSize: 220,
        OnValueChanged: (value int32) -> { ColorValue = value
          Rebuild() },
        CreateRoot: (input ColorPickerInput, wheel Blob, tone Blob) -> {
          let container = Container{Gap: 12, Width: input.WheelSize, Children: {wheel, tone}}
          ColorRoot = container
          return container
        },
      }))
    }
    return root
  }
}

func PumpFrames(window Window, frames int32) {
  for frame in 0 ... frames {
    window.Pump(0.016)
    Thread.Sleep(10)
  }
}

func OnlyNativeWindow() uint32 {
  let windows = NativeWindows(out var count)
  try {
    Require(windows != nint(0) && count == 1, "Expected one native window in the isolated consumer process.")
    return NativeWindowId(Marshal.ReadIntPtr(windows))
  } finally {
    NativeFree(windows)
  }
}

func SendKey(windowId uint32, key SDLScancode) {
  var down = SDLEvent{Key: SDLKeyboardEvent{
    Type: SDLEventType.KeyDown, WindowID: windowId, Scancode: key, Down: uint8(1),
  }}
  var up = SDLEvent{Key: SDLKeyboardEvent{
    Type: SDLEventType.KeyUp, WindowID: windowId, Scancode: key,
  }}
  Require(SDL.PushEvent(ref down), "SDL rejected key down.")
  Require(SDL.PushEvent(ref up), "SDL rejected key up.")
}

func MouseButton(windowId uint32, x float32, y float32, down bool) {
  var event = SDLEvent{Button: SDLMouseButtonEvent{
    Type: if down { SDLEventType.MouseButtonDown } else { SDLEventType.MouseButtonUp },
    WindowID: windowId, Which: 1u, Button: uint8(1),
    Down: if down { uint8(1) } else { uint8(0) }, X: x, Y: y,
  }}
  Require(SDL.PushEvent(ref event), "SDL rejected mouse input.")
}

func MouseMove(windowId uint32, x float32, y float32) {
  var event = SDLEvent{Motion: SDLMouseMotionEvent{
    Type: SDLEventType.MouseMotion, WindowID: windowId, Which: 1u,
    State: 1u, X: x, Y: y,
  }}
  Require(SDL.PushEvent(ref event), "SDL rejected mouse movement.")
}

func IconButtonInteractions() {
  let host = IconButtonHost{}
  let window = Window{Title: "Goo Widgets icon button verification", Width: 120, Height: 120, Root: host}
  window.Open()
  try {
    PumpFrames(window, 20)
    let windowId = OnlyNativeWindow()
    let button = host.Root!!
    Require(button.Handle!!.IsMounted, "Packaged icon button did not mount.")
    let box = button.Handle!!.BorderBox
    let x = float32(box.X + box.Width / 2.0)
    let y = float32(box.Y + box.Height / 2.0)
    MouseButton(windowId, x, y, true)
    PumpFrames(window, 2)
    MouseButton(windowId, x, y, false)
    PumpFrames(window, 3)
    Require(host.Activations == 1, "Native icon button activation did not fire exactly once.")
  } finally {
    window.RequestClose()
    PumpFrames(window, 3)
  }
  Require(!window.IsOpen, "Icon button test window did not close.")
}

func WindowInteractions() {
  IconButtonInteractions()
  let host = InteractiveHost{}
  let window = Window{Title: "Goo Widgets input verification", Width: 620, Height: 480, Root: host}
  window.Open()
  try {
    PumpFrames(window, 30)
    let windowId = OnlyNativeWindow()
    let slider = host.SliderRoot!!
    Require(slider.Handle!!.IsMounted && slider.Handle!!.BorderBox.Width > 0.0, "Packaged slider did not mount.")
    Require(slider.Handle!!.Focus(), "Packaged slider could not receive focus.")
    SendKey(windowId, SDLScancode.End)
    PumpFrames(window, 6)
    Require(host.Value == 1.0 && host.Commits == 1, "Native keyboard input did not reach the packaged slider.")

    let box = host.SliderRoot!!.Handle!!.BorderBox
    MouseButton(windowId, float32(box.X + box.Width * 0.25), float32(box.Y + box.Height / 2.0), true)
    PumpFrames(window, 3)
    MouseMove(windowId, float32(box.X + box.Width * 1.2), float32(box.Y + box.Height / 2.0))
    PumpFrames(window, 3)
    MouseButton(windowId, float32(box.X + box.Width * 1.2), float32(box.Y + box.Height / 2.0), false)
    PumpFrames(window, 3)
    Require(host.Value == 1.0 && host.Commits == 2, "Captured pointer drag did not clamp and commit at the endpoint. Value=" + host.Value.ToString() + ", commits=" + host.Commits.ToString() + ", width=" + box.Width.ToString())

    host.RangeDisabled = true
    host.Rebuild()
    PumpFrames(window, 3)
    SendKey(windowId, SDLScancode.Home)
    PumpFrames(window, 3)
    Require(host.Value == 1.0 && host.Commits == 2, "Disabled range accepted native input.")

    let wheel = host.ColorRoot!!.Children[0]
    Require(wheel.Handle!!.Focus(), "Color wheel could not receive focus.")
    let previousColor = host.ColorValue
    SendKey(windowId, SDLScancode.Right)
    PumpFrames(window, 4)
    Require(host.ColorValue != previousColor, "Color wheel did not process native keyboard input.")

    window.Width = 760
    window.Height = 560
    PumpFrames(window, 10)
    Require(host.SliderRoot!!.Handle!!.BorderBox.Width > box.Width, "Slider layout did not respond to window resize.")

    host.ShowPicker = false
    host.Rebuild()
    PumpFrames(window, 3)
    host.ShowPicker = true
    host.Rebuild()
    PumpFrames(window, 5)
    Require(host.ColorRoot!!.Children[0].Handle!!.IsMounted, "Color picker failed after disposal and remount.")

    host.ShowGraph = true
    host.Rebuild()
    PumpFrames(window, 5)
    let graph = host.Graph!!
    let card = graph.Card!!.Handle!!.BorderBox
    let startX = float32(card.X + card.Width / 2.0)
    let startY = float32(card.Y + card.Height / 2.0)
    MouseButton(windowId, startX, startY, true)
    PumpFrames(window, 3)
    MouseMove(windowId, startX + 60.0f, startY + 40.0f)
    PumpFrames(window, 3)
    MouseButton(windowId, startX + 60.0f, startY + 40.0f, false)
    PumpFrames(window, 3)
    Require(graph.Selected.Length == 1 && graph.Selected[0] == "one", "Native graph selection lost its node identity.")
    Require(graph.Moves > 0 && graph.Position.X > 190.0 && graph.Position.Y > 150.0, "Captured native graph drag did not update host coordinates.")
    Console.WriteLine("PASS: actual window, native keyboard, captured pointer, disabled input, color change, resize, disposal/remount, graph selection/drag.")
  } finally {
    window.RequestClose()
    PumpFrames(window, 3)
  }
  Require(!window.IsOpen, "Widget test window did not close.")
}
