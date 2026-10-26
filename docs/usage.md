# Using Goo Widgets

Goo Widgets `0.15.0` requires Goo `0.16.0` or later, .NET 10, and
`Gsharp.NET.Sdk/0.4.1150`. SVG and gestures are included in Goo.
Follow the [installation instructions](../README.md#install).

## Basic widgets

Value widgets such as `ActionButton`, `Checkbox`, and `Badge` return a Goo `Blob` from `.Build()`. Add it to the parent container:

```gsharp
import Goo.Widgets.Actions

ActionButton{Content: "Reset", OnClick: () -> ResetColor(),}.Build()
```

`ActionButton.Content` is the visible button text and supplies the default
accessible name. Set `AccessibilityName` only when assistive technology should
announce different text.

`ResetColor` changes the host Cell's state. Input callbacks rebuild that Cell
automatically. A mounted child's callback that changes parent state must call
the parent's `Rebuild()`. See the [complete example](../samples/Goo.Widgets.QuickStart/Program.gs).

### Widget categories

| Import | Widgets and supporting types |
| --- | --- |
| `Goo.Widgets.Actions` | ActionButton, IconButton |
| `Goo.Widgets.Inputs` | TextField, TextArea, ToggleSwitch, Checkbox, Slider, SearchList, ComboBox, ComboBoxOption, Calendar, DatePicker, Stepper, UploadTile |
| `Goo.Widgets.Feedback` | Badge, Banner, Alert, InlineMessage, DismissibleContextBar, EmptyState, ProgressBar, ProgressSummary |
| `Goo.Widgets.Layout` | AppBar, Drawer, SectionHeader, ListRow, WindowChrome, MasterDetail, ModalDialog, ModalDialogHost, Popover, Disclosure, SplitPane, Grid, GridTrack, GridItem |
| `Goo.Widgets.Media` | AsyncImage, Avatar, MediaCard, MediaTransport |
| `Goo.Widgets.Data` | Chip, SelectionItem, DataGrid, DataGridColumn, DataGridRow, TimeAxis, TimeAxisEvent, TreeView, TreeNode, VirtualItems, VirtualRows |
| `Goo.Widgets.Navigation` | NavigationRail, NavigationItem, TabBar, Menu, MenuItem |
| `Goo.Widgets.Colors` | ColorPicker, ColorMath, color models |
| `Goo.Widgets.Graphs` | GraphCanvas, GraphNodeCard, graph models |
| `Goo.Widgets.Charts` | DonutChart, StackedBar, ChartSeries, ChartSegment |
| `Goo.Widgets.Icons` | MaterialIcons |

## Application input bindings

Widget buttons and composite controls supply activation and navigation bindings.
Attach the shared editing policy to the application root after creating its `Window`:

```gsharp
import Goo.Widgets

class App : Cell {
    private var input PlatformInput?

    internal func AttachWindow(window Window) {
        input = window.PlatformInput
    }

    override func Build() Blob -> Container{
        KeyBindings: WidgetKeyBindings.Editing(input),
        // application content
    }
}

let root = App{}
let window = Window{Root: root}
Theme.Attach(window)
root.AttachWindow(window)
window.Run()
```

The policy supplies focused text commands, Tab and Shift+Tab focus traversal,
clipboard shortcuts, Escape cancellation, and repeatable movement and deletion.
Applications can replace it with their own `KeyBinding` set.
Use `WidgetKeyBindings.BindActivation(blob)` for custom interactive primitives.
It preserves existing bindings, uses `ElementHandle` press/activation for `Button`,
and adds release activation for other clickable primitives.

Key bindings stop at Goo focus-scope boundaries. Supply the same editing policy
through `ModalDialog.KeyBindings` so text commands and focus traversal remain
available inside managed dialogs:

```gsharp
ModalDialog{
    Open: dialogOpen,
    KeyBindings: WidgetKeyBindings.Editing(input),
    Content: TextEntry{Value: value},
}
```

## Color picker integration

Keep the selected color in the host Cell. Mount `ColorPicker` in `Build` with a stable key:

```gsharp
import Goo
import Goo.Widgets.Colors

Cell.Mount[ColorPickerInput, ColorPicker](
    "color-picker",
    ColorPickerInput{
        Value: liveColor,
        Mode: ColorMode.Oklch,
        WheelSize: 260.0,
        AccessibilityName: "Theme color",
        OnValueChanged: (value int32) -> SetLiveColor(value),
        OnValueCommitted: (value int32) -> CommitColor(value),
    }
)
```

| Part | Application responsibility |
| --- | --- |
| `Value` | Supply a packed 24-bit sRGB `int32`, such as `0x4F8FEA`. |
| `Mode` | Select `ColorMode.Hsl`, `ColorMode.Hsv`, or `ColorMode.Oklch`. The input and callback values remain sRGB. |
| `OnValueChanged` | Update the host's current color and live preview during interaction. |
| `OnValueCommitted` | Apply or save the final selection after a completed interaction. |
| `OnModeChanged` | Adopt a mode button choice when the host owns `Mode`. |
| Mount key | Keep the same key across rebuilds so the picker retains its internal interaction state. |

Set `Compact: true` for only the wheel and tone slider. The default also shows
the mode selector and preview. Leave `Mode` unset for local switching.
To control it from the host, set `Mode` and update it from `OnModeChanged`.

Implement the callbacks in the host:

```gsharp
private var liveColor int32 = 0x4F8FEA
private var committedColor int32 = 0x4F8FEA

private func SetLiveColor(value int32) {
    liveColor = value
    Rebuild()
}

private func CommitColor(value int32) {
    liveColor = value
    committedColor = value
    Rebuild()
}
```

The sample keeps `committedColor` in memory. Save to settings, a document, or undo history in `CommitColor`, not on each drag preview.

Convert the packed value when building Goo visuals:

```gsharp
Container{Width: 260.0, Height: 96.0, BackgroundColor: ColorMath.GooColor(liveColor),}

Text("#${ColorMath.Hex(liveColor)}")
```

Changing `liveColor` and rebuilding the host updates the picker, as the sample's Reset button shows. The picker disposes its wheel image on unmount.

Key the picker's siblings, as the example does for Reset and the committed-color readout.

## Labels and color controls

A checkbox can own its visible label and its full hit target:

```gsharp
Checkbox{
    Label: "Include inherited settings",
    State: state,
    AllowMixed: true,
    OnChange: (next AccessibilityChecked) -> {
        state = next
    },
}.Build()
```

`SliderInput.Label` supplies a visible label and the default accessible name.
`ShowValue` adds the value beside it. `FormatValue` formats both the accessible
range text and the visible value:

```gsharp
Cell.Mount[SliderInput, Slider](
    "opacity",
    SliderInput{
        Label: "Opacity",
        ShowValue: true,
        FormatValue: (value float64) -> "${Math.Round(value * 100)}%",
        Value: opacity,
        Minimum: 0.0,
        Maximum: 1.0,
    }
)
```

`GraphNodeCard.Center` is optional. It defaults to the
node's `Position`; supply `Center: Point{ X: 300.0, Y: 120.0 }` for an explicit
screen-space card center.

## Run the example

From the repository:

```sh
dotnet run --project samples/Goo.Widgets.QuickStart -c Release
```

In a Wayland session, set `SDL_VIDEODRIVER=wayland` if needed to select the native display driver.

The [project](../samples/Goo.Widgets.QuickStart/Goo.Widgets.QuickStart.gsproj) uses
source references. Its application source also works with the NuGet package.

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
side when it fits better, and clamps to Viewport (window coordinates), or the
Window bounds by default. Its first visible frame waits for the panel measurement,
so wrapped content is already aligned. It tracks anchor movement and resize. OnDismiss
reports Escape, OutsideClick, or AnchorRemoved; update Open and rebuild the host.
Tab stays in the popup. Closing restores eligible prior focus except on outside
pointer clicks. Factories
customize the panel/root while placement, handles, input, and content stay wired.

`Menu` takes `MenuInput` with an Anchor or WindowPoint for a context menu.
`Placement` selects the preferred root position (default BottomStart);
`SubmenuPlacement` accepts LeftStart or RightStart (default: the end side of
`Theme.Direction`). Popover still flips/clamps at viewport edges. The arrow toward
the submenu side opens it and the other arrow closes it. Items
have globally unique IDs, labels/custom content, disabled/separator state, optional
children, and an optional per-item action overriding the shared OnActivate(id).
Up/Down/Home/End navigate; the arrows open and close submenus; Enter/Space activate;
Escape closes the active level. Pointer hover also opens submenus. DismissOnActivate
defaults to true. CreateItem, CreateSeparator, CreatePanel, and CreateRoot retain
navigation, identity, and accessibility wiring. `SubmenuArrowStyle` styles the
direction indicator after its default text declarations. Hosts can use Menu or Shift+F10
key events to open the same menu from a keyboard trigger (see the gallery).

Popover, Menu, and ModalDialogHost present through Goo's automatic per-Window
Portal overlay. They stay logically owned where declared while escaping source
layout, clipping, transforms, and stacking. Multiple overlays share the native
Window and use ZIndex plus opening order. Keep controlled Open state in sync when
hiding an owning subtree. Closing and reopening starts a fresh focus lifecycle.
Native secondary-window ownership remains Goo's Window.Owner/Modal API.

## ComboBox

Mount `Cell.Mount[ComboBoxInput, ComboBox]` with stable option IDs, `SelectedId`, and
`OnSelect`. The trigger displays the selected label/custom content or Placeholder.
Selection changes only on activation or Enter; Escape cancels. Up/Down/Home/End
move the active option, skip disabled options, and reveal offscreen virtual rows.
`Searchable` adds a search field. Empty results keep the popup open without committing.

The popup uses the Window Portal overlay and does not change selector layout.
`OverlayHost` is optional. When supplied, its mounted border box is the collision
viewport, while presentation still uses the Window overlay. Omitting it uses the
Window bounds. Opening restores the selected option,
and closing restores trigger focus. `Open` and `Query` can be controlled with their
callbacks; leaving them nil uses widget-owned state. Update controlled values and
rebuild the owning Cell in callbacks. Trigger, search, row, popup, and root factories
customize appearance while identity, input, and accessibility wiring remain applied.

`Placement` defaults to `PopoverPlacement.BottomStart`. Set `TopStart` to prefer
opening above, with downward fallback. If neither side fits, the popup shrinks
to the side with more room and scrolls.

## Calendar and DatePicker

Mount `Cell.Mount[CalendarInput, Calendar]` with a `DateOnly? Value` and `OnChange`.
The Gregorian calendar uses the supplied `Culture`, `FirstDayOfWeek`, and optional
`Today`. Minimum/Maximum and IsDateDisabled constrain both pointer and keyboard
selection. Arrows move by day/week, Home/End visit week boundaries, Page Up/Down
change month, and Shift+Page Up/Down change year with leap-day clamping. Enter
selects the active date. `Month`/`OnMonthChange` optionally control the visible month.
Day and navigation factories customize appearance while keeping date calculations,
roving focus, and accessibility wiring. `MonthTextStyle` and `DayTextStyle` override
the default month heading and day number text declarations.

`Cell.Mount[DatePickerInput, DatePicker]` adds a text draft and anchored calendar.
Enter or blur submits the draft; Escape restores the committed date. Empty input
commits nil by default; `AllowEmpty: false` rejects it. Invalid input retains the
draft and committed value, exposes an accessible error, and invokes `OnInvalid`.
`Format` and `Parse` override localized display and parsing; a nil parse result
rejects nonempty input. Host value and formatter changes update the focused field.
Alt+Down or F4 opens the calendar; dismissal restores focus. The popup uses the
Window Portal overlay. Optional `OverlayHost` constrains collision handling to a
mounted border box without becoming the presentation parent. Calendar, day, input,
button, popup, and root factories preserve required behavior after customization. Hosts
own time zones, storage formats, recurrence, and scheduling policy.

## Optional Markdown

`Goo.Widgets.Markdown` adds `Cell.Mount[MarkdownViewInput, MarkdownView]` for headings,
paragraphs, emphasis, links, inline/fenced code, lists, quotes, rules, pipe tables,
and GFM alerts. It depends on Markdig 1.3.2; the base widget package stays parser-free.
Each text block owns a selectable read-only editor with measured intrinsic height;
selection and copying operate within that block. Links use `OnLink`, and images
remain selectable alternative text unless `ResolveImage` supplies a Blob.
Block/inline/editor factories customize presentation, and `OnHeadings` supplies
handles for table-of-contents navigation. See the [package guide](https://github.com/obselate/goo-widgets/blob/main/src/Goo.Widgets.Markdown/README.md)
for lifecycle, scrolling, and customization details.

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
returns a fresh Goo `Shape` with the requested size and color. Without a tint,
it reads the nearest theme's text color during the owning Cell build.
Icon geometry, not resolved paint, is cached. Default checkbox marks, media
controls, window controls, and gallery icons use these SVGs.
The shape is decorative. Give its button an accessible name.

## Goo theme

Call `Theme.Attach(window)` before `Open` to follow the system appearance.
Light and Unknown select Bone colors. Dark selects Ink colors.
System attachment preserves app-set window backgrounds at attachment and on appearance updates, while text color follows the theme and `Theme.Attach(window, value)` explicitly sets both colors.
System attachment also follows the system accent color when available. An explicit
`Theme.Attach(window, value)` or subtree `ThemeScope` keeps its application-set accent.
`Theme.Attach(window, value)` selects a fixed snapshot, including `Theme.Default`.
`Theme.SetMode(window, ThemeMode.Light)` or `Dark` locks the built-in palette.
`System` resumes preference tracking. SetMode preserves typography and metrics
but replaces all palette roles, including custom colors.

`Theme.Default` uses system fonts, 14 px body text, 32 px controls, 6 px control
corners and 8 px panel corners. Named Ink, Bone and GitHubDark presets retain
their branded typography and metrics.
Motion defaults to zero. `TransitionMs` opts into motion unless reduced motion
is active. Window reduced-motion policy also applies inside fixed scopes, including
scrollbar fades, and restores authored transition durations when disabled.
High contrast strengthens text, borders and focus. Text scale adjusts all type
sizes and minimum control sizes, including fixed scopes. `WithHighContrast()`
and `WithTextScale(scale)` apply the same policy to an authored theme.

For right-to-left apps, set `Direction = Direction.RightToLeft` on the attached
theme and on the app root:

```gsharp
Theme.Attach(window, Theme.Default with{Direction = Direction.RightToLeft})
```

Widgets then mirror layout, horizontal arrow keys, slider drag and drawer and tab edges.
A `ThemeScope` with `Direction` Auto keeps the outer direction.

`Theme.Culture` formats numbers and dates in Slider, NumberInput, Calendar, DatePicker,
TimeAxis and chart summaries. Nil follows `CultureInfo.CurrentCulture`. `Theme.Translate`
receives each English default label, with `{0}` and `{1}` for inserted values, and
returns the translation or nil:

```gsharp
Theme.Attach(window, Theme.Default with{Translate = (text string) -> german.GetValueOrDefault(text)})
```

Explicit labels and `Culture` inputs always win. A `ThemeScope` keeps the outer
culture and translation unless its theme sets its own.

Use `LinkColor` for links and `FocusColor` for keyboard focus. Theme also supplies
quiet tone fills, sunken and active surfaces, strong borders, subtle and disabled
text, four radii, three elevations, type sizes and motion durations. `Syntax`,
`Diff`, `Ansi`, `SeriesPalette` and `ColorBlindPalette` provide shared palettes.

Read `Theme.Read()` during an owned Cell build or virtual callback.
`Theme.Read(window)` reads only the window snapshot on its owner thread.
Neither API is a process-global current theme. A missing window attachment is
initialized with System policy.

```gsharp
import Goo
import Goo.Widgets
import Goo.Widgets.Actions

ThemeScope{
    Value: Theme.Read() with{AccentColor = Color.Parse("#245b91")},
    Density: Density.Compact,
    Content: () -> ActionButton{Content: "Save", OnClick: () -> Save()}.Build(),
}.Build()
```

Scope content must be constructed in its deferred callback. A scope does not
change window clear colors. Density assigns absolute control height, padding
and gap: Compact 28/8/4, Standard 32/12/8, Comfortable 40/16/8 and Touch 44/16/8.
Without Density, a scope preserves custom metrics such as a 23 px control.
Explicit widget properties and final factory/style overrides take precedence.
Replacing primitive factories own their focus and scrolling semantics.

Run the [complete sample](../samples/Goo.Widgets.Theme/Program.gs):

```sh
dotnet run --project samples/Goo.Widgets.Theme/Goo.Widgets.Theme.gsproj
```

## Semantic messages

```gsharp
Banner{
    Tone: Tone.Warning,
    Title: "Maintenance",
    Content: "Save your work.",
    Action: ActionButton{Content: "Save", OnClick: Save}.Build(),
    OnDismiss: Dismiss,
}.Build()
```

`Tone` is Neutral, Info, Success, Warning or Danger. Badge and Chip also use it.
Replace Banner's `Loud = true` with `Tone.Warning` and `Alert = true` with
`Tone.Danger`. Danger uses an assertive alert. Other tones use a polite status.
Set `Live = false` for static messages.

Banner supports a title, icon, trailing action, actions below its body and a
content slot. `OnDismiss` runs after its closing animation. Reduced motion
closes it at once. Escape does not dismiss it.
`Alert` supplies a description or content slot and a Filled or Rule variant.
`InlineMessage` supplies a compact icon and text.

`RovingFocus` shares disabled-aware arrow, Home and End navigation. Its
`RightToLeft` option reverses horizontal movement. Existing tab, rail, menu,
calendar and tree key policies stay unchanged.

## Compose and customize

Widgets expose data, callbacks, appearance, and factories for Goo primitives.
Use G# `with` to derive values. Each `Build()` creates a fresh tree.
No global theme registration or initialization is required.

- Build value widgets inside the host Cell's `Build`. Input callbacks automatically
  rebuild that Cell. Mount stateful widgets such as Slider, ColorPicker,
  MediaTransport, and GraphCanvas with `Cell.Mount[Input, Widget]` and stable keys.
  When a mounted widget's callback changes parent state, call the parent's `Rebuild()`.
- Goo siblings must be all keyed or all unkeyed. Give siblings keys when composing
  mounted cells. Replacement factories must preserve required keys, handlers,
  handles, accessibility semantics, and layout properties.
- Return fresh mutable content from factories when building multiple instances.
- Focus styling uses Goo's keyboard-visible focus modality. Widget buttons and
  composite controls install their own bindings.
  Apply `WidgetKeyBindings.Editing(window.PlatformInput)`
  to the application root for editing, focus traversal, clipboard and key repeat.
- SearchList filters supplied in-memory items and needs unique stable IDs and a
  logical viewport width and height. The host owns remote search and storage.
- Disclosure owns no expanded state. Build it with `Expanded` and `OnExpandedChange`.
  Collapsed content stays mounted under `Display.None`: it has no layout, input, or
  accessibility presence, and mounted child state survives collapse/reopen. Removing
  the disclosure unmounts and disposes its children normally. Factories receive resolved
  props; retain the supplied keys, callbacks, and hidden-body contract.
- ModalDialog builds an in-parent visual. Mount `Cell.Mount[ModalDialog, ModalDialogHost]`
  for Window Portal presentation, focus entry, containment, restoration, and nested
  modal isolation. Content and confirmation work remain host-owned.
- GraphCanvas uses supplied node positions. The host owns layout calculation,
  selection, and viewport state. Cards keep their screen size as positions zoom.
- Touch pans the canvas. A second contact adds pinch zoom without a viewport jump.
- Touch node dragging uses the same core gesture arbitration as scrolling and drag/drop.
- Lifting or canceling a pinch contact ends navigation. Held contacts cannot start another action.
- WindowChrome needs a Window or callbacks for window actions. `EnableDoubleClick`
  routes blank titlebar double-clicks through the resolved maximize/restore action;
  supply `Host` for native drag regions in undecorated windows, including when
  callbacks override its actions. False leaves the operating system's default
  behavior in place. Decorative title content participates in double-click handling;
  embedded clickable/focusable controls keep their own behavior. `EnableContextMenu`
  enables right-click, Menu, and Shift+F10 commands with focus restoration. Menus use
  the Window Portal overlay. Optional `OverlayHost` supplies custom collision bounds.
  `CreateMenu` customizes presentation; actions, placement, open state, and dismissal
  remain wired by the widget.
- Media and upload widgets emit callbacks. The host owns playback, file access,
  and other services.

## Controlled split panes, tabs, and multiline fields

Mount `SplitPaneInput/SplitPane`, `TabBarInput/TabBar`, and `TextAreaInput/TextArea`
with stable keys. In the host callback, update the value and call `Rebuild()`.
Each mounted control retains its interaction state.

`SplitPane` accepts first/second content, horizontal or vertical orientation, and
a controlled ratio or pixel value. Minima are in logical pixels. When their sum
exceeds available space they shrink proportionally; resizing clamps presentation
without emitting an input callback. Arrow keys use `Step`, Home/End request bounds,
and pointer cancellation clears capture without a commit. Its accessible slider
value describes the first pane. Handle/root factories can style the prepared
containers; identity, pane children, input wiring, and semantics are reapplied.

`TabBar` uses stable `NavigationItem.Id` values, controlled `SelectedId`, and
`OnSelect`. Arrow keys wrap past disabled tabs; Home/End move to the first/last
available tab. Automatic activation requests selection as focus moves; manual
activation waits for Enter or Space. One enabled tab participates in Tab traversal.
The strip scrolls horizontally and reveals keyboard focus. Panel content and
mounting stay with the host. Item/root factories retain required focus and semantic
wiring after visual customization.

`TextArea` owns one default `TextEditorController` per mounted identity and disposes
it on unmount. External `Controller` and `Layers` remain caller-owned; the controller
cannot change within that identity. Controlled `Value` updates preserve the
controller and valid selection endpoints and suppress `OnChange`. If an endpoint
ceases to be a grapheme boundary, the controller's rebased selection is retained.
A nil value preserves an external document. Read-only mode supports selection and
copy; disabled mode rejects input. `Wrap`, `MinimumRows`, `MinimumHeight`, `Height`,
label, validation, font, editor/root styles, and factories support field composition.
NoWrap enables horizontal scrolling, and both modes allow vertical scrolling.

Run `bash scripts/verify.sh` before the optional native checks:

```sh
GOO_WIDGETS_COMPOSITES=1 dotnet run --project tools/Goo.Widgets.NativeTests -c Release -- isolated -- \
  dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
```

Set `GOO_WIDGETS_PROOF_DIR` to capture native results and `GOO_CLI` to the matching
Goo DevTools executable or DLL. The runner requires KWin, libei and D-Bus development
files, `dbus-run-session`, and AT-SPI registry binaries. It owns private runtime,
config, cache, data and bus paths. It does not use the desktop session.

## Touch text editing

```gsharp
let field = TextField{Value: "Alpha beta gamma"}.Build()
let area = Cell.Mount[TextAreaInput, TextArea]("notes", TextAreaInput{Value: notes, OnChange: SaveNotes})
```

- Touch editing is enabled by default. Set `TouchEditing: false` to disable it.
- Hold a word to select it. Drag either handle to change one endpoint.
- A 2x magnifier follows the held selection point without copying text or reading pixels to the CPU.
- The toolbar provides Cut, Copy, Paste and Select all without changing editor focus.
- Read-only fields provide selection and Copy. Password fields hide Cut and Copy.
- Goo draws the handles and toolbar on every platform.

## Measured Grid layout

`Grid` places keyed `GridItem` slots in explicitly declared `Rows` and `Columns`.
Use `GridTrack.Fixed(pixels)`, `GridTrack.Auto(minimum, maximum)`, and
`GridTrack.Fraction(weight, minimum, maximum)`. Track constraints and gaps are in
logical pixels. Row/column indices are zero-based; spans default to one. All slots
share these tracks, so a header and body or multiple form sections align without
separate width calculations. Overlapping slots paint in declaration order.

Auto tracks measure real Goo text and nested content. Under a bounded constraint,
fractional tracks divide the remaining space above their minima; capped tracks
return excess space to other fractional tracks. Text is measured again at its
resolved span width to determine row height. An unbounded fractional axis fits
content. A span crossing a bounded fractional track wraps within that space rather
than expanding an auto neighbor to its full unwrapped width. Fixed tracks stay
fixed, and constraints may overflow when their minima exceed the container.
Slots fill their track rectangles; their children retain normal Goo alignment.

```gsharp
Grid{
    Columns: []GridTrack{GridTrack.Auto(70.0, 140.0), GridTrack.Fraction()},
    Rows: []GridTrack{GridTrack.Auto(), GridTrack.Auto()},
    ColumnGap: 12,
    RowGap: 8,
    Items: []GridItem{
        GridItem{Id: "name-label", Content: Text("Name")},
        GridItem{Id: "name", Column: 1, Content: Text("Field notes")},
        GridItem{
            Id: "description",
            Row: 1,
            ColumnSpan: 2,
            Content: Text("A paragraph that wraps when this grid becomes narrower.")
        },
    },
}.Build()
```

The policy snapshots track and placement arrays. Build a new `Grid` description
when data or definitions change. Stable item IDs preserve child cells and focus
when slots move or resize. `CreateRoot` receives a prepared container; required
layout and keyed children are reapplied after customization.

## Quantitative charts

`DonutChart` and `StackedBar` accept `ChartSeries` entries with a unique `Id`,
human-readable `Label`, finite nonnegative `Value`, and optional `Color`. Both
handle fractional quantities and zero totals, keep zero-valued entries in the
optional legend, and normalize large values without overflowing their sum.
Donuts draw a complete circle with two arcs when only one positive entry remains.

Customize donut `Size`, `Thickness`, `TrackColor`, and `Center`; customize bar
`Width`, `Height`, `BorderRadius`, and `TrackColor`. `ShowLegend` enables the
default labeled values and percentages. Both expose `CreateLabel`, `CreateLegend`,
and `CreateRoot`; donut slices use `CreateSlice`, and bars use `CreateSegment`.
Factories receive resolved `ChartSegment` data with the fraction and accessible
summary. Required geometry, identity, interaction, and semantics are reapplied to
custom segments. `OnActivate` enables pointer/Enter/Space activation and Tab focus;
`OnHover` reports a series ID or nil on leave. Omit them for passive charts.

## Horizontal TimeAxis

Mount `TimeAxisInput/TimeAxis` with a stable key. Supply an absolute
`DateTimeOffset` range and identified `TimeAxisEvent` intervals. `TickInterval`,
`FormatTick`, and `PixelsPerHour` control the ruler. Ticks start at the range start
and retain its UTC offset. Put other calendar/time-zone formatting in the formatter.
Ranges are half-open. Equal event endpoints are points. Limits: 4096 ticks and
a canvas width of .01 to 1e9 logical pixels. This is not a virtual event database.

Events are sorted by start and then ordinal ID, clipped to the range, and assigned
the first available lane. `MinimumEventWidth` participates in collision handling,
so point events cannot visually overlap another block in the same lane.
`MaximumLanes` caps the visible lanes; a summary below the affected time interval
holds the chronological overflow set and passes it to `OnOverflow`. `SelectedId` and `OnSelect` leave
selection with the host. Event semantics include labels and time intervals.
`CurrentTime` is an optional host-updated marker; the widget starts no timer.

`InitialTime` or `InitialEventId` positions the viewport once at its first layout,
using `InitialAlignment` (Center, Start, or Nearest). Unknown initial IDs are
ignored. Subsequent marker, data, scale, and size changes do not restart centering.
The scroll viewport supports Left/Right and Home/End. `OnViewportChanged` reports
later offsets and visible instants on the UI thread; a host that displays those
values should call its `Rebuild()`. A root factory can retain the prepared
`ElementHandle` for later `JumpTo` or `ScrollTo` requests from host actions.
The mounted widget releases its metrics subscription on removal.

Tick, marker, event, overflow, and root factories customize prepared Goo blobs.
The widget reapplies required placement, identity, scroll/input wiring, and
semantics. See the gallery for host-selected event colors and overflow details.

Native checks for these widgets use `GOO_WIDGETS_GRID_CHARTS=1` or
`GOO_WIDGETS_TIME_AXIS=1` with the isolated runner shown above.

## Virtual lists

`VirtualItems` and `VirtualRows` are policies for the Goo `Virtual` element. Each
takes the complete collection, a key selector, and an item builder, and mounts only
the items near the viewport. Give the result a bounded size.

| Function | Item size | Layout |
| --- | --- | --- |
| `VirtualItems(items, itemWidth, itemHeight, itemKey, itemBuilder)` | One fixed size | Follows `FlexDirection` and `FlexWrap`: a column, a row, or a wrapped grid |
| `VirtualRows(items, estimatedItemHeight, itemKey, itemBuilder)` | Content width, measured height | A column. `RowGap` or `Gap` sets the spacing |

```gsharp
let log = VirtualRows(lines, 20.0, (line LogLine) -> line.Id, BuildLine, followEnd: follow)
log.Handle = viewport
log.Height = 240
```

```csharp
var log = VirtualLists.Rows(lines, 20.0, line => line.Id,
    line => new Text { Content = line.Message });
log.Height = 240;
```

C#, F# and VB can call the same measured-row policy through the named CLR type
`Goo.Widgets.Data.VirtualLists.Rows<T>`. The G# `VirtualRows` function remains available.

Keys must be stable, nonempty, and unique in the collection. Keep item values
immutable and rebuild the owning Cell after a change. An item that equals its
previous value is not built again. `VirtualRows` also needs the same builder
delegate on each build to reuse rows.

`VirtualRows` keeps the first visible row in place when rows above it change
size or the width changes. A change that only removes rows from the start and adds
rows at the end is applied in place: only the added rows are keyed and built.
`followEnd: true` scrolls to the last row when inputs change. It does not block user scrolling.
In `viewport.MetricsChanged`, set `follow` to `metrics.ScrollOffset.Y >= metrics.ScrollRange.Y - 0.5`
and rebuild when it changes. Start with `follow = true` for a live log.
`ElementHandle.ScrollToItem(key)` jumps to an item of either function.

`VirtualRows` mounts at most 4,096 rows and keeps the row that contains keyboard
focus mounted. Positions use float32. Whole-pixel placement is exact up to
16,777,216 px of content and drifts beyond it. Use `GOO_WIDGETS_VIRTUAL=1`
with the native runner to exercise both functions.

## Controlled TreeView

Mount `TreeViewInput/TreeView` with unique `TreeNode.Id` values, including collapsed
descendants. Nodes supply a label or custom content, optional check state, and
children. Disabling a node disables its descendants. Cycles and shared/duplicate
identities are rejected. Control expansion with `ExpandedIds`/`OnExpandedChange`
and single-row selection with `SelectedId`/`OnSelect`. Callbacks must update inputs
and rebuild the host.
Set `ExpandOnActivate: true` for branch row clicks, Enter, and accessible Activate
to request selection and expansion/collapse. The host still updates `ExpandedIds`.
Expander buttons toggle once. Checkbox clicks and Space retain the host's check
policy. Both gallery examples enable this option. The default is false.
Replace changed node/expansion arrays. Typed Cell inputs do not observe in-place edits.

The tree composes `Checkbox` for False, True, and Mixed states. Unspecified omits
the check. `OnCheckChange` requests True from False/Mixed and False from True; it
does not change any parent or child. `MultiSelectable` describes a host check
policy allowing multiple nodes. The gallery shows a host implementing its own
cascade and parent-state calculation.

Keyboard focus stays on the tree root, while its `ActiveDescendant` relationship
identifies the current TreeItem. Up/Down/Home/End move that logical focus and skip
disabled rows. Left collapses a branch or reaches its parent; Right expands a
branch or enters its first enabled child. Enter requests selection; Space requests
a check when present, otherwise selection. Collapsing an active descendant moves
logical focus to its nearest visible ancestor. The default tree is one Tab stop.
Tree/TreeItem semantics include level, selected, checked, expanded, disabled, and
the root's multi-selection policy. Accessible Focus, Select, Activate, Expand, and
Collapse actions use the same controlled callbacks as native input.

`OnKeyDown` runs before built-in navigation. Return true to prevent the default
action and stop propagation.

Visible rows are flattened iteratively and virtualized by default. Fixed
`RowHeight` and `Indent` control geometry. `Virtualize: false` realizes every row
in a full-height provider inside an outer scroll viewport; changing the mode keeps
the retained row structure and logical focus. `ScrollbarY` styles the active vertical
scroller in either mode. Custom content follows ordinary Goo
layout and can provide its own interaction. Content, expander, checkbox, row, and
root factories customize prepared blobs. Standard row slots are added before
`CreateRow`; custom children are kept. Identity, input, and tree semantics are
reapplied. A replacement row root must supply its own slots. Use `GOO_WIDGETS_TREE=1`
with the native runner to exercise both modes, keyboard and accessibility input,
and the 1,500-child case.

## Controlled DataGrid

Mount `DataGridInput/DataGrid` with unique row and column IDs. Rows contain an
optional dictionary of display values; `CreateCell` can instead look up an
application object by row ID. The application supplies the row order, filters,
grouping, and business actions. Header/filter content and cell, checkbox, detail,
row, and root factories provide composition without duplicating column sizing.
Factories may customize appearance; the grid reapplies required slots, identity,
input, and semantics. Use `with` on the data input for ordinary variants.

For an indexed source, supply `RowAt`, nonnegative `RowCount`, and `RowIndex`
without materializing `Rows`. Return -1 from `RowIndex` for absent IDs. Replace
`RowAt` or increment `RowVersion` after data changes. Set `HasRowDetails` when
lazy rows have details. `Tag` and `SourceIndex` pass host data to factories.
`OnSelectionIndicesChange` and `OnActiveRowIndexChange` report source indices.
Use `IsGroup` for rows that must not participate in selection or navigation.
`CreateFullWidthRow` can replace the cell slots for group headers or other rows.

A column has a fixed `Width`, natural `AutoWidth`, or a positive `Flex` weight,
with `Minimum`/`Maximum` bounds. `AutoWidth` applies without a fixed width and
grows to fit headers and realized cells without shrinking on scroll. Flex columns
share the remaining viewport width above their minimums. Minimum widths may
overflow horizontally. Controlled `ColumnWidths` override individual columns in
pixels. `OnColumnWidthChange` requests a finite clamped width and
`OnColumnWidthCommit` reports pointer-up or keyboard completion. The host must
update its width map and rebuild. Cancellation stops capture without a commit.
Earlier live change requests remain applied. Resizers support Left/Right,
Home/End, and accessible value changes. Headers, filters, and virtual cells share
one width array. `ViewportHandle` scrolls both body axes. The clipped header and
filter viewport follows the body's horizontal offset.

Set `FitColumnsToViewport` to fit the columns to the measured grid width minus
the reserved vertical scrollbar. Fixed column widths are preferences. Flex
columns remain flexible even when `ColumnWidths` contains an override. The grid
shrinks flex columns, then fixed columns, down to their minimums when space is
short. If the minimums cannot fit, horizontal scrolling remains available.
Only boundaries between columns have resize handles in this mode. Pointer,
keyboard, and accessibility resizing transfer width into or out of columns to
the right within their bounds. `OnFittedColumnWidthsChange` receives one map
containing every resolved column width; replace the controlled map and rebuild.
`OnFittedColumnWidthsCommit` receives that map when resizing completes.

`SortColumnId`/`SortDirection` and `OnSort` cycle None → Ascending → Descending →
None. The host performs the sort. `Selection` supports None, Single (at most one
selected ID), and Multiple. `SelectedIds`/`OnSelectionChange` are controlled.
Click replaces selection and Ctrl/⌘ toggles. Shift and Ctrl/⌘+Shift combine the
selection saved at the anchor with the current range, so the range can shrink.
Ranges use the supplied row order and skip disabled and group rows. Toggle operations
preserve selected IDs absent from a filtered row set. `ShowSelection` composes a
leading checkbox using the same callbacks. `SelectionColumnWidth` overrides that
column's width independently of the theme's control height; nil uses that height.
There is no imposed select-all policy.

For selection shared with another view, supply `ActiveRowId` and handle
`OnActiveRowChange` to keep the active row in the host. Set `OnSelectionRequest`
to receive the row ID, toggle flag, and extend flag from pointer, keyboard,
checkbox, and accessibility actions. When this callback is set, the host owns
the selected IDs and range anchor; update `SelectedIds` and rebuild after each
request. `ActiveRowId: nil` keeps the grid's internal active row. Set
`UseDefaultKeyboard: false` when the host handles grid navigation itself.

The grid keeps keyboard focus on its root and exposes its active row through
`ActiveDescendant`. Up/Down/Home/End and PageUp/PageDown select enabled non-group
rows. Ctrl/⌘ moves the active row without selecting it. Shift adds a range,
Enter replaces selection, and Space toggles it. Left/Right request detail
collapse/expansion. Headers, resize handles, and custom interactive content retain
their own focus and keyboard behavior. Clicking interactive cell content does not
select the row or move focus to the grid. Grid/Row/ColumnHeader/GridCell semantics
include selection, expansion, disabled state, sort descriptions, and composed
accessibility actions. The current Goo metadata has no row/column index or sort
enum fields. Those are not fabricated by the widget.

`ExpandedIds` and `OnExpandedChange` control details. Supply a row's `Detail`, or
set `HasDetail` and provide `CreateDetail` for lazy composition. `VirtualRows`
measures expanded content at the shared table width, so detail text can wrap and
push following rows naturally. Ordinary cells use fixed `RowHeight` by default.
Set `AutoRowHeight` to measure visible cells, using `RowHeight` as the minimum
and estimate. `MaximumRowHeight` caps the cells area, excluding details.
Alternatively, `RowHeightProvider` supplies finite positive heights for array
rows. Replace that delegate when heights change. It cannot be combined with
`AutoRowHeight` or an indexed source.
DataGrid positions use float32. Whole-pixel placement is exact up to 16,777,216 px
of content and drifts beyond it.

Replace changed arrays and maps before rebuilding. Typed inputs do not observe
in-place mutations. Use `GOO_WIDGETS_DATA_GRID=1` with the isolated native runner
for sorting, selection, resizing/cancel, variable heights, indexed rows, expanded
details, horizontal scrolling, and 1,500 rows.


## Gallery feedback regression checks

Build with `scripts/verify.sh`, then run the actual gallery pages in isolated
native processes. `GOO_CLI` may name a Goo executable or its built CLI DLL:

```sh
GOO_CLI=/path/to/goo dotnet run --project tools/Goo.Widgets.NativeTests -c Release -- isolated -- \
  dotnet tools/Goo.Widgets.NativeTests/bin/Release/net10.0/Goo.Widgets.NativeTests.dll gallery
```

The runner writes screenshots, per-page logs, and `results.json` to
`artifacts/gallery-feedback`. Change it with `--output`. Optional page names select
cases, such as `'Data grid' 'Tree view'`. Checks compile the gallery cells into the
package consumer. Frames between native presses and releases expose focus-induced
layout changes.
