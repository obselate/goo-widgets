package Goo.Widgets.Gallery

import Goo
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

func RequestedPage(args []string) string? {
  for index in 0 ... args.Length {
    if args[index] == "--page" {
      if index + 1 >= args.Length {
        throw ArgumentException("--page requires a gallery page title.")
      }
      return args[index + 1]
    }
  }
  return nil
}

func Main(args []string) {
  let registry = CreateRegistry()
  if args.Length == 1 && args[0] == "--verify" {
    VerifyGallery(registry)
    return
  }
  var initialIndex int32
  if let requestedPage = RequestedPage(args) {
    initialIndex = registry.IndexOf(requestedPage)
  }
  Window.ConfigureApplication("Goo Widgets Gallery", "0.1.0", "com.obselate.goo-widgets.gallery")
  Window{
    Title: "Goo Widgets Gallery",
    Width: 1100,
    Height: 800,
    Root: Gallery(registry, initialIndex),
  }.Run()
}
