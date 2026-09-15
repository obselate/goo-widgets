package Goo.Widgets.Consumer

import System
import System.Collections.Generic
import System.IO
import System.Threading
import System.Threading.Tasks
import Microsoft.Win32.SafeHandles
import Goo
import Goo.Widgets.Layout
import Goo.Widgets.Navigation
import Hexa.NET.SDL3

func ChromeContractControl(input WindowChrome, command WindowChromeAction, content Blob, action Action?) Button -> Button {
  Focusable: true, Disabled: false, Accessibility: Accessibility{Role: AccessibilityRole.Link, Name: "wrong"},
  Children: {Text{Content: "wrong"}},
}
func ChromeContractRoot(input WindowChrome, children []Blob) Container -> Container {
  OnPointerDown: (e PointerEvent) -> {}, Children: children,
}
func WindowChromeContracts() {
  let row = (WindowChrome{CreateRoot: ChromeContractRoot, CreateControl: ChromeContractControl}.Build() as Container)!!
  Require(!row.Focusable && row.Children.Count == 4, "Chrome changed the factory child order or became a focusable drag region")
  Require(row.OnPointerDown != nil, "Stateless chrome discarded the root factory's pointer handler")
  for child in row.Children {
    if child is Button {
      Require(child.Disabled && !child.Focusable && child.OnClick == nil && child.Accessibility?.Role == AccessibilityRole.Button,
        "A custom chrome control bypassed action availability or semantics")
      Require(child.Children.Count == 1 && child.Children[0] is Shape, "A custom chrome control bypassed the content factory")
    }
  }
}

internal class ChromeHost : Cell {
  internal var Host Window?
  internal var OverrideActions bool = true
  internal var NativeBinding bool = true
  internal var EnableDoubleClick bool = true
  internal var ShowChrome bool = true
  internal var Commands int32
  internal var EmbeddedClicks int32
  internal var BadClicks int32
  internal var MenuFactories int32
  internal var LastCommand string = "Ready"
  internal var MenuInput MenuInput
  internal let Blank ElementHandle = ElementHandle()
  internal let Embedded ElementHandle = ElementHandle()
  internal let BodyButton ElementHandle = ElementHandle()
  internal let Overlay ElementHandle = ElementHandle()
  internal let Controls Dictionary[WindowChromeAction, Button] = Dictionary[WindowChromeAction, Button]()
  private func Minimize() { LastCommand = "Minimize callback"
    Commands++
    Rebuild() }
  private func Maximize() { Host!!.State = WindowState.Maximized
    LastCommand = "Maximize callback"
    Commands++
    Rebuild() }
  private func Restore() { Host!!.State = WindowState.Normal
    LastCommand = "Restore callback"
    Commands++
    Rebuild() }
  private func Close() { LastCommand = "Close callback"
    Commands++
    Rebuild() }
  private func Control(input WindowChrome, command WindowChromeAction, content Blob, action Action?) Button {
    let button = Button{Handle: ElementHandle(), Width: input.ControlWidth, Height: input.Height, Padding: 0.0,
      BackgroundColor: Color.Transparent, AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center,
      OnClick: () -> { BadClicks++ }, Children: {Text{Content: "wrong"}}}
    Controls[command] = button
    return button
  }
  private func Root(input WindowChrome, children []Blob) Container {
    children[1].Handle = Blank
    return Container{Height: input.Height, FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center,
      BackgroundColor: "#18181b", Focusable: true, Children: {Text{Content: "wrong"}}}
  }
  private func Menu(input WindowChrome, prepared MenuInput) MenuInput { MenuFactories++
    MenuInput = prepared
    return prepared with{Width = 225.0} }
  public override func Build() Blob {
    let root = Container{Handle: Overlay, Width: Length.Percent(100), Height: Length.Percent(100), BackgroundColor: "#101216", Color: "#e4e4e7"}
    if ShowChrome {
      let window = Host!!
      var chromeInput = WindowChrome{OverlayHost: Overlay, EnableDoubleClick: EnableDoubleClick, EnableContextMenu: true,
        Height: 40.0, ControlWidth: 48.0, CreateRoot: Root, CreateControl: Control, CreateMenu: Menu,
        LeadingContent: Container{FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center, Gap: 20.0, PaddingLeft: 12.0, Children: {
          Text{Content: "Window chrome", FontSize: 14.0},
          Button{Handle: Embedded, Width: 120.0, Height: 28.0, BackgroundColor: "#373044", OnClick: () -> { EmbeddedClicks++
            Rebuild() }, Children: {Text{Content: "Embedded control", FontSize: 12.0}}},
        }},
      }
      if NativeBinding { chromeInput.Host = window }
      else {
        chromeInput.IsMaximized = window.State == WindowState.Maximized
      }
      if OverrideActions {
        chromeInput.OnMinimize = Minimize
        chromeInput.OnMaximize = Maximize
        chromeInput.OnRestore = Restore
        chromeInput.OnClose = Close
      }
      let chrome = chromeInput.Build()
      chrome.Key = "chrome"
      root.Children.Add(chrome)
    }
    root.Children.Add(Container{Key: "body", FlexGrow: 1.0, AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center, Gap: 18.0, Children: {
      Text{Content: Host?.State.ToString() ?? "Normal", FontSize: 36.0, FontWeight: 700.0},
      Text{Content: LastCommand + " · embedded: " + EmbeddedClicks.ToString(), FontSize: 18.0, Color: "#a5b4fc"},
      Button{Handle: BodyButton, Width: 160.0, Height: 36.0, BackgroundColor: "#27272a", Children: {Text{Content: "Body focus target"}}},
    }})
    return root
  }
}

func ChromeSeat(command string) {
  Require(Environment.GetEnvironmentVariable("WAYLAND_DISPLAY") == "goo-widgets", "Chrome native input requires the isolated compositor")
  let input = Environment.GetEnvironmentVariable("GOO_WIDGET_INPUT_COMMAND_FD")
  let output = Environment.GetEnvironmentVariable("GOO_WIDGET_INPUT_ACK_FD")
  Require(input != nil && output != nil, "Chrome native input seat is missing")
  using let writer = StreamWriter(FileStream(SafeFileHandle(nint(Int32.Parse(input!!)), false), FileAccess.Write))
  using let reader = StreamReader(FileStream(SafeFileHandle(nint(Int32.Parse(output!!)), false), FileAccess.Read))
  writer.WriteLine(command)
  writer.Flush()
  Require(reader.ReadLine() == "ok", "Native input seat rejected a command")
}
func ChromeNativeDoubleClick(window Window) {
  ChromeSeat("move 600 20")
  PumpFrames(window, 1)
  let sender = Task.Run(() -> {
    for click in 0 ... 2 {
      ChromeSeat("button 272 1")
      Thread.Sleep(40)
      ChromeSeat("button 272 0")
      Thread.Sleep(70)
    }
  })
  while !sender.IsCompleted { window.Pump(0.016) }
  sender.GetAwaiter().GetResult()
  PumpFrames(window, 10)
}

func ChromeInteractions() {
  WindowChromeContracts()
  let host = ChromeHost()
  let semantics = SearchListSemantics()
  let window = Window{Title: "Window chrome verification", Width: 1400, Height: 900, Decorated: false, Root: host, AccessibilityAdapter: semantics}
  host.Host = window
  window.StateChanged += (state WindowState) -> host.Rebuild()
  window.Open()
  try {
    PumpFrames(window, 25)
    let id = OnlyNativeWindow()
    Require(host.Blank.IsMounted && host.Embedded.IsMounted && host.Controls.Count == 3, "Custom chrome root lost its required children")
    Require(window.State == WindowState.Normal, "Chrome fixture did not start normal")
    ChromeSeat("move 200 20")
    PumpFrames(window, 3)
    ChromeSeat("button 272 1")
    PumpFrames(window, 3)
    ChromeSeat("button 272 0")
    PumpFrames(window, 8)
    Require(host.EmbeddedClicks == 1 && host.Commands == 0, "Native embedded input triggered the titlebar gesture")
    host.EmbeddedClicks = 0
    host.Rebuild()
    PumpFrames(window, 5)
    CaptureIssueProof(window, "chrome-initial")
    ChromeNativeDoubleClick(window)
    Require(window.State == WindowState.Maximized && host.Commands == 1 && host.LastCommand == "Maximize callback", "Native titlebar double-click did not use the maximize override")
    CaptureIssueProof(window, "chrome-maximized")
    ChromeNativeDoubleClick(window)
    Require(window.State == WindowState.Normal && host.Commands == 2 && host.LastCommand == "Restore callback", "Native titlebar double-click did not restore through the callback")
    CaptureIssueProof(window, "chrome-normal")
    CompositeClick(window, host.Embedded)
    CompositeClick(window, host.Embedded)
    Require(host.EmbeddedClicks == 2 && host.Commands == 2 && window.State == WindowState.Normal, "Embedded titlebar clicks triggered the blank gesture")
    CompositeClick(window, host.Controls[WindowChromeAction.Maximize].Handle!!)
    PumpFrames(window, 25)
    Require(window.State == WindowState.Maximized && host.Commands == 3 && host.BadClicks == 0, "Custom maximize control bypassed the resolved callback")
    CompositeClick(window, host.Controls[WindowChromeAction.Restore].Handle!!)
    PumpFrames(window, 25)
    Require(window.State == WindowState.Normal && host.Commands == 4, "Custom restore control failed")
    Require(host.Embedded.Focus(), "Embedded titlebar control could not focus")
    SelectorKey(id, SDLScancode.F10, SDLKeymod.Shift)
    PumpFrames(window, 20)
    let menu = FindSemantics(semantics.Tree?.Root, "Window commands")
    Require(menu != nil && host.MenuInput.Open && host.MenuInput.Items!! [0].Disabled && !host.MenuInput.Items!! [2].Disabled,
      "Keyboard window menu did not reflect normal-state actions")
    CaptureIssueProof(window, "chrome-keyboard-menu")
    SendKey(id, SDLScancode.Escape)
    PumpFrames(window, 12)
    Require(!host.MenuInput.Open && OverlayFocus(semantics, "Embedded control"), "Window menu dismissal did not restore focus")
    ChromeSeat("move 600 20")
    PumpFrames(window, 3)
    ChromeSeat("button 273 1")
    PumpFrames(window, 3)
    ChromeSeat("button 273 0")
    PumpFrames(window, 20)
    Require(host.MenuInput.Open && host.MenuInput.WindowPoint != nil, "Native right-click did not open a pointer-positioned command menu")
    CaptureIssueProof(window, "chrome-pointer-menu")
    SendKey(id, SDLScancode.End)
    SendKey(id, SDLScancode.Return)
    PumpFrames(window, 15)
    Require(!host.MenuInput.Open && host.LastCommand == "Close callback" && host.Commands == 5 && window.IsOpen,
      "Window command menu bypassed the close override or failed dismissal")
    host.OverrideActions = false
    host.Rebuild()
    PumpFrames(window, 10)
    ChromeNativeDoubleClick(window)
    Require(window.State == WindowState.Maximized && host.Commands == 5, "Native titlebar host default did not maximize")
    Require(host.Embedded.Focus(), "Maximized chrome control could not focus")
    SendKey(id, SDLScancode.Application)
    PumpFrames(window, 20)
    Require(host.MenuInput.Open && !host.MenuInput.Items!! [0].Disabled && host.MenuInput.Items!! [2].Disabled,
      "Menu key did not open maximized-state commands")
    CaptureIssueProof(window, "chrome-maximized-menu")
    CompositeClick(window, host.BodyButton)
    PumpFrames(window, 12)
    Require(!host.MenuInput.Open, "Window menu outside-click dismissal failed")
    Require(OverlayFocus(semantics, "Embedded control"), "Window menu outside-click did not restore focus")
    ChromeNativeDoubleClick(window)
    Require(window.State == WindowState.Normal && host.Commands == 5, "Native titlebar host default did not restore")
    host.OverrideActions = true
    host.EnableDoubleClick = false
    host.Rebuild()
    PumpFrames(window, 10)
    let before = host.Commands
    ChromeNativeDoubleClick(window)
    Require(host.Commands == before, "Disabled custom double-click handling invoked an override")
    window.State = WindowState.Normal
    PumpFrames(window, 20)
    host.ShowChrome = false
    host.Rebuild()
    PumpFrames(window, 15)
    Require(!host.Blank.IsMounted && host.BodyButton.Focus(), "Chrome removal retained a menu focus scope")
  } finally { window.RequestClose()
    PumpFrames(window, 5) }
  ChromeCallbackInteractions()
  Console.WriteLine("PASS: native titlebar double-click/default/override, custom controls, embedded input, native pointer and keyboard menus, state transitions, focus restoration and removal")
}

func ChromeCallbackInteractions() {
  let host = ChromeHost{NativeBinding: false}
  let window = Window{Title: "Callback-only chrome verification", Width: 1000, Height: 640, Root: host}
  host.Host = window
  window.StateChanged += (state WindowState) -> host.Rebuild()
  window.Open()
  try {
    PumpFrames(window, 20)
    Require(host.Blank.IsMounted, "Callback-only chrome failed before overlay bounds were measured")
    let id = OnlyNativeWindow()
    let box = host.Blank.BorderBox
    let x = float32(box.X + box.Width * 0.5)
    let y = float32(box.Y + box.Height * 0.5)
    MouseMove(id, x, y)
    for click in 0 ... 2 { MouseButton(id, x, y, true)
      MouseButton(id, x, y, false) }
    PumpFrames(window, 20)
    Require(host.Commands == 1 && window.State == WindowState.Maximized, "Callback-only chrome did not use the shared pointer click count")
    Require(host.Embedded.Focus(), "Callback-only embedded control could not focus")
    SendKey(id, SDLScancode.Application)
    PumpFrames(window, 15)
    Require(host.MenuInput.Open && host.MenuInput.Viewport?.Width > 0.0, "Callback-only chrome menu did not use measured overlay bounds")
    CaptureIssueProof(window, "chrome-callback-menu")
    SendKey(id, SDLScancode.Escape)
    PumpFrames(window, 10)
    Require(!host.MenuInput.Open, "Callback-only menu did not dismiss")
  } finally { window.RequestClose()
    PumpFrames(window, 5) }
}
