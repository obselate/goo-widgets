# Goo Widgets

Reusable G# widgets for [Goo](https://github.com/obselate/goo) desktop applications.
Import the categories you need, supply your data and callbacks, and compose the
widgets into your Goo UI.

Browse the [gallery screenshots](https://github.com/obselate/goo-widgets/blob/main/samples/screenshots/README.md) or run the
[gallery](https://github.com/obselate/goo-widgets/tree/main/samples/Goo.Widgets.Gallery) for interactive examples of every widget.
The [usage guide](https://github.com/obselate/goo-widgets/blob/main/docs/usage.md)
includes a complete color picker application and basic widget examples.

## Install

Goo Widgets `0.1.0` targets .NET 10 and depends on Goo and Goo.Svg `0.5.2`.
Install the package from NuGet.org:

```sh
dotnet add YourApp.gsproj package Goo.Widgets --version 0.1.0
```

```gsharp
import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Feedback

let save = ActionButton{
  Label: "Save",
  OnClick: () -> Save(),
}.Build()

let progress = ProgressBar{Value: 0.6}.Build()
```

Place the returned `Blob` in a Goo `Children` collection.

| Import | Widgets and supporting types |
| --- | --- |
| `Goo.Widgets.Actions` | ActionButton, IconButton |
| `Goo.Widgets.Inputs` | TextField, ToggleSwitch, Checkbox, Slider, SearchList, Stepper, UploadTile |
| `Goo.Widgets.Feedback` | Badge, Banner, DismissibleContextBar, EmptyState, ProgressBar, ProgressSummary |
| `Goo.Widgets.Layout` | AppBar, Drawer, SectionHeader, ListRow, WindowChrome, MasterDetail, ModalDialog |
| `Goo.Widgets.Media` | AsyncImage, Avatar, MediaCard, MediaTransport |
| `Goo.Widgets.Data` | Chip, SelectionItem |
| `Goo.Widgets.Navigation` | NavigationRail, NavigationItem |
| `Goo.Widgets.Colors` | ColorPicker, ColorMath, color models |
| `Goo.Widgets.Graphs` | GraphCanvas, GraphNodeCard, graph models |
| `Goo.Widgets.Icons` | MaterialIcons |

## Material icons

The library includes all 4,128 Material Symbols Outlined icons for the standard
24px, weight 400, unfilled variant. The SVG sources total 1.92 MiB and are embedded
in the assembly. No installed icon font or separate asset folder is needed.
See the [asset provenance and license](https://github.com/obselate/goo-widgets/blob/main/assets/material-symbols/README.md).

```gsharp
import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Icons

let add = IconButton{
  AccessibilityName: "Add item",
  Icon: MaterialIcons.Create("add", size: 24.0, color: Color.Parse("#fafafa")),
  OnClick: () -> AddItem(),
}.Build()
```

`MaterialIcons.Names()` returns the available names in ordinal order. `Create`
returns a fresh Goo `Shape` with the requested size and color, defaulting to 24
logical pixels and `#fafafa`. Icon geometry is loaded and cached on first use.
Default checkbox marks, media controls, window controls, and gallery icons all use
these SVGs. Text and avatar initials use the application font.
The shape is decorative. Give its button an accessible name.

## Compose and customize

Widgets expose data, callbacks, appearance properties, and factories for their Goo
primitives. Use G# `with` to derive widget values. Each `Build()` creates a fresh
tree. No global theme registration or initialization is required.

- Build value widgets inside the host cell's `Build`. Mount stateful widgets such
  as Slider, ColorPicker, MediaTransport, and GraphCanvas with
  `Cell.Mount[Input, Widget]` and stable keys. Update host state in callbacks and
  call the host's `Rebuild()`.
- Goo siblings must be all keyed or all unkeyed. Give siblings keys when composing
  mounted cells. Replacement factories must preserve required keys, handlers,
  handles, accessibility semantics, and layout properties.
- Return fresh mutable content from factories when building multiple instances.
- Visible focus highlights are off by default. Set `ShowFocusHighlight: true` on
  widgets that expose it. Keyboard input and accessibility semantics stay enabled.
- SearchList filters supplied in-memory items and needs unique stable IDs and a
  logical viewport width and height. The host owns remote search and storage.
- ModalDialog overlays its parent. The host manages its bounds, stacking, focus
  entry, restoration, and containment.
- GraphCanvas uses supplied node positions. The host owns layout calculation,
  selection, and viewport state. Cards keep their screen size as positions zoom.
- WindowChrome needs a Window or callbacks for window actions. Media and upload
  widgets emit callbacks. The host owns playback, file access, and other services.

## Build and run

```sh
bash scripts/verify.sh
dotnet run --project samples/Goo.Widgets.Gallery -c Release --no-build
```

Verification restores locked dependencies, builds the library and gallery,
checks screenshot coverage, packs the library, and runs consumer checks against
the packaged assembly. `artifacts/`, `bin/`, and `obj/` are generated and ignored.

For a source lint review with the standalone `gslint` tool:

```sh
gslint --strict --severity GL0005=info src/Goo.Widgets
```

GL0005 remains visible as a manual review advisory. Widget props use assertions
after resolving defaults or assigning factory results. All other lint rules run
at strict severity.

The gallery needs a graphical session and Goo's Vulkan runtime prerequisites.
In a Wayland session, set `SDL_VIDEODRIVER=wayland` for native checks and screenshots.
To open one widget or run the native interaction checks:

```sh
dotnet run --project samples/Goo.Widgets.Gallery -c Release --no-build -- --page "Color picker"
GOO_WIDGETS_WINDOW=1 dotnet run --project tests/Goo.Widgets.Consumer -c Release --no-build
dotnet run --project samples/Goo.Widgets.Gallery -c Release --no-build -- --verify
```

Native checks cover pointer capture, keyboard focus, disabled input, resizing,
color picker disposal and remounting, and clean exit. Linux x64 is the verified
runtime target. CI does not run graphical checks.

## Add or change a widget

Keep widget code and its supporting types under `src/Goo.Widgets/<category>`.
Every widget must have a registered `<WidgetName>Page.gs` gallery example and a
real gallery screenshot at `samples/screenshots/<WidgetName>.png`. Helpers and
data types do not need separate screenshots.

Add new screenshots to the [screenshot index](https://github.com/obselate/goo-widgets/blob/main/samples/screenshots/README.md).
Refresh the image when a widget or its gallery presentation changes. Capture
instructions are in that index. The verification script rejects missing gallery
pages and screenshots.

Keep application models, services, assets, and theme policy in the host application.
The library project owns the SemVer version. Upgrade dependency pins and lock
files together. Releases use matching `v<Version>` tags and must not replace a
published version. Tag builds publish through NuGet Trusted Publishing and attach
the package, symbols, and SHA-256 checksums to the GitHub release. See the
[release instructions](https://github.com/obselate/goo-widgets/blob/main/.github/RELEASING.md).

Widget source is MIT licensed. See [LICENSE](https://github.com/obselate/goo-widgets/blob/main/LICENSE). Bundled Material Symbols
are Apache-2.0 licensed. See [their license](https://github.com/obselate/goo-widgets/blob/main/assets/material-symbols/LICENSE).
