# Goo Widgets

Reusable G# building blocks for [Goo](https://github.com/obselate/goo) desktop UI projects.
One library, organized as `Goo.Widgets.<category>`. Widgets use the public Goo API and
accept application data and callbacks. They do not own your application, services,
network access, global theme, or window loop.

## Use

The library starts at version `0.1.0` and depends on Goo `0.5.1`, the latest published
Goo version verified on 2026-09-09. Dependencies are pinned and locked so a build is
repeatable. Upgrade the Goo pin and lock files together when adopting a newer release.

Until this package is published to NuGet, build it with `bash scripts/verify.sh`, then
install from the resulting local feed:

```sh
dotnet add YourApp.gsproj package Goo.Widgets --version 0.1.0 --source /path/to/goo-widgets/artifacts/packages
```

Keep nuget.org configured for the transitive Goo dependencies.
Import only the categories you use:

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

Place the returned `Blob` in any Goo `Children` collection. Build presentation widgets
from the owning `Cell.Build` so current data and callbacks are captured. Mount stateful
widgets with stable keys. The [gallery](samples/Goo.Widgets.Gallery) contains complete,
compiled examples. The [consumer catalog](docs/CONSUMERS.md) records the extraction sources.

| Import | Building blocks |
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

## Customize

Controls expose data, callbacks, appearance properties, and primitive factories.
Use G# `with` to derive widget values. Factories receive resolved defaults and allow
access to the underlying Goo primitives. Each `Build()` produces a fresh tree.
No global theme registration or initialization step is required.
Visible focus highlights are off by default. Set `ShowFocusHighlight: true` on widgets
that expose focus styling to enable them. Keyboard input and accessibility semantics
remain active with either setting.

## Build and verify

Install the exact .NET SDK from `global.json`, then run:

```sh
bash scripts/verify.sh
GOO_DEVTOOLS=1 dotnet run --project samples/Goo.Widgets.Gallery -c Release --no-build
```

In a desktop session, also run native interaction checks and mount every gallery page:

```sh
GOO_WIDGETS_WINDOW=1 dotnet run --project tests/Goo.Widgets.Consumer -c Release --no-build
dotnet run --project samples/Goo.Widgets.Gallery -c Release --no-build -- --verify
```

The native checks exercise capture, keyboard focus, disabled input, resizing, color
picker disposal/remount, and clean exit. Open one sample with `-- --page "Color picker"`.
See the catalog's contracts before replacing widget factories.

The repository contains its pinned G# linter source. Restore uses nuget.org and committed
lock files. No sibling checkout or private feed is needed. `artifacts/` is generated.
Strict lint permits `!!` only as used after nullable default resolution in the extracted
factory APIs. Formatting, public signatures, documentation, immutable locals, and single
expression rules remain enabled. The package consumer is compiled against the packed
NuGet artifact, rather than a project reference.

The widgets are managed .NET 10 code. Desktop runtime support and native prerequisites
follow Goo 0.5.1. The gallery requires a graphical session and Vulkan support, or Goo's
software rendering backend. Linux x64 is the initial runtime verification target.
Build-only CI does not establish UI behavior on other platforms.

## Repository and releases

Library code lives under `src/Goo.Widgets/<category>`. The gallery is a consumer under
`samples/`. Build tooling is under `deps/`, with provenance and licenses. Add application
models and services to your host, rather than adding them to the widget library.

Use feature branches in the same checkout and merge verified changes into `main`.
The stable CI check is `verify`. The library project owns the version. Use SemVer,
starting at `0.1.0`, and annotate a release with the matching `v<Version>` tag.
Never replace a published version. The verification script creates a NuGet package
and SHA-256 checksum. Publishing a package is a separate release action.

MIT licensed. See [LICENSE](LICENSE) and the source notices in `deps/`.
