# Goo Widgets

Reusable G# widgets for [Goo](https://github.com/obselate/goo) desktop applications.
Import the categories you need, supply your data and callbacks, and compose the
widgets into your Goo UI.

Browse the [gallery screenshots](samples/screenshots/README.md) or run the
[gallery](samples/Goo.Widgets.Gallery) for interactive examples of every widget.

## Install

Goo Widgets `0.1.0` targets .NET 10 and depends on Goo and Goo.Svg `0.5.1`.
Until Goo Widgets is published to NuGet, install the .NET SDK specified in
`global.json` and build a local package:

```sh
dotnet pack src/Goo.Widgets/Goo.Widgets.gsproj -c Release -o artifacts/packages -p:RestoreLockedMode=true
dotnet add YourApp.gsproj package Goo.Widgets --version 0.1.0 --source /path/to/goo-widgets/artifacts/packages
```

Keep nuget.org configured for Goo's transitive dependencies.

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
See the [asset provenance and license](assets/material-symbols/README.md).

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

The gallery needs a graphical session and Goo's Vulkan runtime prerequisites.
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

Add new screenshots to the [screenshot index](samples/screenshots/README.md).
Refresh the image when a widget or its gallery presentation changes. Capture
instructions are in that index. The verification script rejects missing gallery
pages and screenshots.

Keep application models, services, assets, and theme policy in the host application.
The library project owns the SemVer version. Upgrade dependency pins and lock
files together. Releases use matching `v<Version>` tags and must not replace a
published version. CI uploads the package and SHA-256 checksum. Package publication
is a separate release action.

Widget source is MIT licensed. See [LICENSE](LICENSE). Bundled Material Symbols
are Apache-2.0 licensed. See [their license](assets/material-symbols/LICENSE).
