# Goo Widgets

Reusable G# widgets for [Goo](https://github.com/obselate/goo) desktop applications.
Import the categories you need, supply your data and callbacks, and compose the
widgets into your Goo UI.

Browse the [gallery screenshots](https://github.com/obselate/goo-widgets/blob/main/samples/screenshots/README.md) or run the
[gallery](https://github.com/obselate/goo-widgets/tree/main/samples/Goo.Widgets.Gallery) for interactive examples of every widget.
The [usage guide](https://github.com/obselate/goo-widgets/blob/main/docs/usage.md)
includes a complete color picker application and basic widget examples.

## Install

Goo Widgets `0.1.1` targets .NET 10 and depends on Goo and Goo.Svg `0.5.2`.
Install the package from NuGet.org:

```sh
dotnet add YourApp.gsproj package Goo.Widgets --version 0.1.1
```

The published package is `0.1.1`. The current checkout also contains unreleased
ergonomic APIs described below. They are not available from the published package.
The review build is `0.1.2-preview.1` and requires the matching Goo/Goo.Svg
`0.5.4-preview.1` packages built from the core checkout; it has not been published.

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
| `Goo.Widgets.Inputs` | TextField, TextArea, ToggleSwitch, Checkbox, Slider, SearchList, ComboBox, ComboBoxOption, Calendar, DatePicker, Stepper, UploadTile |
| `Goo.Widgets.Feedback` | Badge, Banner, DismissibleContextBar, EmptyState, ProgressBar, ProgressSummary |
| `Goo.Widgets.Layout` | AppBar, Drawer, SectionHeader, ListRow, WindowChrome, MasterDetail, ModalDialog, ModalDialogHost, Popover, Disclosure, SplitPane, Grid, GridTrack, GridItem |
| `Goo.Widgets.Media` | AsyncImage, Avatar, MediaCard, MediaTransport |
| `Goo.Widgets.Data` | Chip, SelectionItem, DataGrid, DataGridColumn, DataGridRow, TimeAxis, TimeAxisEvent, TreeView, TreeNode |
| `Goo.Widgets.Navigation` | NavigationRail, NavigationItem, TabBar, Menu, MenuItem |
| `Goo.Widgets.Colors` | ColorPicker, ColorMath, color models |
| `Goo.Widgets.Graphs` | GraphCanvas, GraphNodeCard, graph models |
| `Goo.Widgets.Charts` | DonutChart, StackedBar, ChartSeries, ChartSegment |
| `Goo.Widgets.Icons` | MaterialIcons |

## Dialogs, popovers, and menus

`ModalDialogHost` accepts the existing `ModalDialog` value and its factories. On
open it focuses an AutoFocus element, the first eligible child, or the dialog
root if no child accepts focus. Tab wraps within the active dialog. Escape calls
OnCancel (falling back to OnClose); the backdrop calls OnClose. Closing or removing
the host restores the previous eligible target. Nested dialogs suspend underlying
input and accessibility until the top dialog closes. Custom cancel/confirm
buttons keep their action callbacks and confirmation-disabled state.

`Popover` takes `PopoverInput` with controlled Open, arbitrary Content, and exactly
one Anchor handle or WindowPoint. It uses measured bounds, flips to the opposite
side when it fits better, and clamps to Viewport (window coordinates), or its
parent overlay bounds by default. It tracks anchor movement and resize. OnDismiss
reports Escape, OutsideClick, or AnchorRemoved; update Open and rebuild the host.
Tab stays in the popup and closing restores eligible prior focus. Factories
customize the panel/root while placement, handles, input, and content stay wired.

`Menu` takes `MenuInput` with an Anchor or WindowPoint for a context menu. Items
have globally unique IDs, labels/custom content, disabled/separator state, optional
children, and an optional per-item action overriding the shared OnActivate(id).
Up/Down/Home/End navigate; Right/Left open and close submenus; Enter/Space activate;
Escape closes the active level. Pointer hover also opens submenus. DismissOnActivate
defaults to true. CreateItem, CreateSeparator, CreatePanel, and CreateRoot retain
navigation, identity, and accessibility wiring. Hosts can use Menu or Shift+F10
key events to open the same menu from a keyboard trigger (see the gallery).

Mount these overlays under a full-window, unclipped parent. They do not create a
portal or a native window. Their opening order only sorts siblings within an
existing parent. Keep their controlled Open state in sync when hiding an overlay
host externally; closing and reopening starts a fresh focus lifecycle. Native
secondary-window ownership remains Goo's Window.Owner/Modal API.

## ComboBox

Mount `Cell.Mount[ComboBoxInput, ComboBox]` with stable option IDs, `SelectedId`, and
`OnSelect`. The trigger displays the selected label/custom content or Placeholder.
Selection changes only on activation or Enter; Escape cancels. Up/Down/Home/End
move the active option, skip disabled options, and reveal offscreen virtual rows.
`Searchable` adds a search field. Empty results keep the popup open without committing.

Pass the handle of a full-window, unclipped container as `OverlayHost`, and keep
the selector's ancestor overflow visible. The popup paints in that region without
changing the selector's layout size. The host is a geometry reference, not a portal;
ancestor clipping and stacking still apply. Opening restores the selected option,
and closing restores trigger focus. `Open` and `Query` can be controlled with their
callbacks; leaving them nil uses widget-owned state. Update controlled values and
rebuild the owning Cell in callbacks. Trigger, search, row, popup, and root factories
customize appearance while identity, input, and accessibility wiring remain applied.

## Calendar and DatePicker

Mount `Cell.Mount[CalendarInput, Calendar]` with a `DateOnly? Value` and `OnChange`.
The Gregorian calendar uses the supplied `Culture`, `FirstDayOfWeek`, and optional
`Today`. Minimum/Maximum and IsDateDisabled constrain both pointer and keyboard
selection. Arrows move by day/week, Home/End visit week boundaries, Page Up/Down
change month, and Shift+Page Up/Down change year with leap-day clamping. Enter
selects the active date. `Month`/`OnMonthChange` optionally control the visible month.
Day and navigation factories customize appearance while keeping date calculations,
roving focus, and accessibility wiring.

`Cell.Mount[DatePickerInput, DatePicker]` adds a text draft and anchored calendar.
Enter or blur submits the draft; Escape restores the committed date. Empty input
commits nil by default; `AllowEmpty: false` rejects it. Invalid input retains the
draft and committed value, exposes an accessible error, and invokes `OnInvalid`.
`Format` and `Parse` override localized display and parsing; a nil parse result
rejects nonempty input. Host value and formatter changes update the focused field.
Alt+Down or F4 opens the calendar; dismissal restores focus. Supply the same
full-window, unclipped `OverlayHost` used by ComboBox. Calendar, day, input, button,
popup, and root factories preserve required behavior after customization. Hosts
own time zones, storage formats, recurrence, and scheduling policy.

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
- Disclosure owns no expanded state. Build it with `Expanded` and `OnExpandedChange`.
  Collapsed content stays mounted under `Display.None`: it has no layout, input, or
  accessibility presence, and mounted child state survives collapse/reopen. Removing
  the disclosure unmounts and disposes its children normally. Factories receive resolved
  props; retain the supplied keys, callbacks, and hidden-body contract.
- ModalDialog builds the visual overlay. Mount `Cell.Mount[ModalDialog, ModalDialogHost]`
  for focus entry, containment, restoration, and nested modal isolation. Put sibling
  overlay hosts under the same full-window parent; opening order determines their
  layers within that parent. Content and confirmation work remain host-owned.
- GraphCanvas uses supplied node positions. The host owns layout calculation,
  selection, and viewport state. Cards keep their screen size as positions zoom.
- WindowChrome needs a Window or callbacks for window actions. Media and upload
  widgets emit callbacks. The host owns playback, file access, and other services.

## Current checkout ergonomics

These additions are in the current checkout and are not part of published `0.1.1`:

- `ColorPickerInput.Compact` keeps only the wheel and tone slider. The default
  full composition also includes the mode selector and preview. Leave `Mode`
  unset for picker-local mode switching, or supply `Mode` and update it from
  `OnModeChanged` when the host owns the selected color model.
- `Checkbox.Label` renders the mark and label as one interactive checkbox row.
  `LabelColor`, `LabelFontSize`, `LabelFontWeight`, and `LabelGap` tune the row.
- `SliderInput.Label`, `ShowValue`, and `FormatValue` add an optional visible
  label and formatted value while retaining the slider's accessibility value.
- `GraphNodeCard.Center` is optional and defaults to `Node.Position`. Supply a
  screen-space `Center` only when the card needs an explicit override.

```gsharp
Checkbox{
  Label: "Include inherited settings",
  State: state,
  OnChange: (next AccessibilityChecked) -> { state = next },
}.Build()

Cell.Mount[SliderInput, Slider]("opacity", SliderInput{
  Label: "Opacity",
  ShowValue: true,
  FormatValue: (value float64) -> Math.Round(value * 100.0).ToString() + "%",
  Value: opacity,
  Minimum: 0.0,
  Maximum: 1.0,
})
```

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
the package and SHA-256 checksums to the GitHub release. Debug symbols are embedded
in the library. See the
[release instructions](https://github.com/obselate/goo-widgets/blob/main/.github/RELEASING.md).

Widget source is MIT licensed. See [LICENSE](https://github.com/obselate/goo-widgets/blob/main/LICENSE). Bundled Material Symbols
are Apache-2.0 licensed. See [their license](https://github.com/obselate/goo-widgets/blob/main/assets/material-symbols/LICENSE).
