package Goo.Widgets.Gallery

import Goo
import System.Diagnostics
import System.IO
import System.Threading

func VerifyGallery(registry GalleryRegistry) {
  let gallery = Gallery(registry, 0)
  let window = Window{Title: "Goo Widgets gallery verification", Width: 1100, Height: 800, Root: gallery}
  window.Open()
  try {
    for index in 0 ... registry.Count() {
      gallery.Show(index)
      for frame in 0 ... 5 {
        window.Pump(0.016)
        Thread.Sleep(16)
      }
      Console.WriteLine("PASS: " + registry.CurrentPage(index).Title())
    }
  } finally {
    window.RequestClose()
    window.Pump(0.0)
  }
  if window.IsOpen { throw InvalidOperationException("Gallery window did not close.") }
}

func RequestedValue(args []string, option string) string? {
  for index in 0 ... args.Length {
    if args[index] == option {
      if index + 1 >= args.Length || args[index + 1].StartsWith("--") {
        throw ArgumentException(option + " requires a value.")
      }
      return args[index + 1]
    }
  }
  return nil
}

func PumpFrames(window Window, frames int32) {
  for frame in 0 ... frames {
    window.Pump(0.016)
    Thread.Sleep(16)
  }
}

func ScreenshotName(page GalleryPage) string {
  let name = page.GetType().Name
  if name.EndsWith("Page") {
    return name.Substring(0, name.Length - 4)
  }
  return name
}

func GooCliExecutable() string {
  let configured = Environment.GetEnvironmentVariable("GOO_CLI")
  if configured != nil && configured != "" { return configured }
  let toolName = if OperatingSystem.IsWindows() { "goo.exe" } else { "goo" }
  let userTool = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".dotnet", "tools", toolName)
  if File.Exists(userTool) { return userTool }
  return "goo"
}

func CaptureProcess(path string) Process {
  let executable = GooCliExecutable()
  let info = if Path.GetExtension(executable).Equals(".dll", StringComparison.OrdinalIgnoreCase) {
    let dotnet = ProcessStartInfo("dotnet")
    dotnet.ArgumentList.Add(executable)
    dotnet
  } else {
    ProcessStartInfo(executable)
  }
  info.UseShellExecute = false
  info.ArgumentList.Add("capture")
  info.ArgumentList.Add("--pid")
  info.ArgumentList.Add(Environment.ProcessId.ToString())
  info.ArgumentList.Add("--latest")
  info.ArgumentList.Add("--output")
  info.ArgumentList.Add(path)
  return Process.Start(info) ?? throw InvalidOperationException("Could not start Goo capture.")
}

func CaptureAttempt(window Window, path string) bool {
  using let process = CaptureProcess(path)
  let deadline = Environment.TickCount64 + 15000
  while !process.HasExited {
    window.Pump(0.016)
    Thread.Sleep(16)
    if Environment.TickCount64 > deadline {
      process.Kill()
      process.WaitForExit()
      throw TimeoutException("Goo capture timed out: " + path)
    }
  }
  return process.ExitCode == 0
}

func CaptureWindow(window Window, path string) {
  let temporary = path + ".tmp.png"
  try {
    for attempt in 0 ... 5 {
      if File.Exists(temporary) { File.Delete(temporary) }
      if CaptureAttempt(window, temporary) {
        File.Move(temporary, path, true)
        return
      }
      PumpFrames(window, 10)
    }
    throw InvalidOperationException("Goo capture failed after retries: " + path)
  } finally {
    if File.Exists(temporary) { File.Delete(temporary) }
  }
}

func CaptureGallery(registry GalleryRegistry, directory string, requestedPage string?) {
  Directory.CreateDirectory(directory)
  let first = if requestedPage != nil { registry.IndexOf(requestedPage) } else { 0 }
  let end = if requestedPage != nil { first + 1 } else { registry.Count() }
  let gallery = Gallery(registry, first)
  let window = Window{Title: "Goo Widgets gallery screenshots", Width: 1100, Height: 800, Root: gallery}
  window.Open()
  try {
    using let diagnostics = DevTools.Attach(window)
    for index in first ... end {
      gallery.Show(index)
      PumpFrames(window, 30)
      let page = registry.CurrentPage(index)
      let path = Path.Combine(directory, ScreenshotName(page) + ".png")
      CaptureWindow(window, path)
      Console.WriteLine("CAPTURED: " + path)
    }
  } finally {
    window.RequestClose()
    window.Pump(0.0)
  }
  if window.IsOpen { throw InvalidOperationException("Gallery screenshot window did not close.") }
}

class Spotlight(Page GalleryPage) : Cell {
  public override func Build() Blob -> Container {
    Width: Length.Percent(100.0),
    Height: Length.Percent(100.0),
    Padding: 24.0,
    Gap: 20.0,
    BackgroundColor: "#09090b",
    FlexDirection: FlexDirection.Column,
    Children: {
      Container{
        FlexDirection: FlexDirection.Column,
        Gap: 4.0,
        Children: {
          Text{ Content: "Goo Widgets", FontSize: 26.0, FontWeight: 700, Color: "#fafafa" },
          Text{ Content: Page.Title(), FontSize: 14.0, Color: "#a1a1aa" },
        },
      },
      Container{
        FlexGrow: 1.0,
        AlignItems: AlignItems.Center,
        JustifyContent: JustifyContent.Center,
        Children: { Page.Build() },
      },
    },
  }
}

func SpotlightWidth(page GalleryPage) int32 {
  if page.Title() == "Color picker" { return 600 }
  if page.Title() == "Checkbox" { return 640 }
  if page.Title() == "Slider" { return 640 }
  return 800
}

func SpotlightHeight(page GalleryPage) int32 {
  if page.Title() == "Color picker" { return 560 }
  if page.Title() == "Checkbox" { return 220 }
  if page.Title() == "Slider" { return 430 }
  return 600
}

func CaptureSpotlight(registry GalleryRegistry, directory string, requestedPage string) {
  Directory.CreateDirectory(directory)
  let page = registry.CurrentPage(registry.IndexOf(requestedPage))
  let width = SpotlightWidth(page)
  let height = SpotlightHeight(page)
  let window = Window{
    Title: "Goo Widgets spotlight: " + page.Title(),
    Width: width,
    Height: height,
    Root: Spotlight(page),
  }
  window.Open()
  try {
    using let diagnostics = DevTools.Attach(window)
    PumpFrames(window, 30)
    let path = Path.Combine(directory, ScreenshotName(page) + ".png")
    CaptureWindow(window, path)
    Console.WriteLine("CAPTURED: " + path)
  } finally {
    window.RequestClose()
    window.Pump(0.0)
  }
  if window.IsOpen { throw InvalidOperationException("Spotlight screenshot window did not close.") }
}

func Main(args []string) {
  let registry = CreateRegistry()
  if args.Length == 1 && args[0] == "--verify" {
    VerifyGallery(registry)
    return
  }
  let requestedPage = RequestedValue(args, "--page")
  if let spotlightDirectory = RequestedValue(args, "--spotlight") {
    if let title = requestedPage {
      Window.ConfigureApplication("Goo Widgets Gallery", "0.1.0", "com.obselate.goo-widgets.gallery")
      CaptureSpotlight(registry, spotlightDirectory, title)
      return
    }
    throw ArgumentException("--spotlight requires --page.")
  }
  if let screenshotDirectory = RequestedValue(args, "--screenshots") {
    Window.ConfigureApplication("Goo Widgets Gallery", "0.1.0", "com.obselate.goo-widgets.gallery")
    CaptureGallery(registry, screenshotDirectory, requestedPage)
    return
  }
  var initialIndex int32
  if let title = requestedPage {
    initialIndex = registry.IndexOf(title)
  }
  Window.ConfigureApplication("Goo Widgets Gallery", "0.1.0", "com.obselate.goo-widgets.gallery")
  Window{
    Title: "Goo Widgets Gallery",
    Width: 1100,
    Height: 800,
    Root: Gallery(registry, initialIndex),
  }.Run()
}
