# Using Goo Widgets

These examples use the upcoming Goo Widgets `0.3.0`, Goo/Goo.Svg `0.5.4`, .NET 10, and
`Gsharp.NET.Sdk/0.4.591`. Goo automatically supplies the upstream compiler needed
for native child composition. Follow the [installation instructions](../README.md#install).

## Basic widgets

Value widgets such as `ActionButton`, `Checkbox`, and `Badge` return a Goo `Blob` from `.Build()`. Insert that result alongside the parent container's properties and other children.

The [complete example](../samples/Goo.Widgets.QuickStart/Program.gs) uses an action button to reset the selected color:

```gsharp
import Goo.Widgets

ActionButton{Label: "Reset", OnClick: () -> ResetColor(),}.Build()
```

`ResetColor` belongs to the host Cell. It only changes application state: Goo
automatically rebuilds the Cell after its input callback. Callbacks from a
separately mounted child that change parent state must call the parent's `Rebuild()`.

## Color picker integration

Keep the selected color in your application's host cell. Mount `ColorPicker` inside the host's `Build` method with a stable key:

```gsharp
import Goo
import Goo.Widgets

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

Set `Compact: true` to show only the wheel and tone
slider. The default is the full composition with the mode selector and preview.
Leave `Mode` unset when the picker should switch models locally through its
built-in buttons. If the host owns the model, supply `Mode` and update that value
from `OnModeChanged` when a mode button is pressed.

The example host implements the callbacks as follows:

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

The sample keeps `committedColor` in memory. In your application, `CommitColor` is where you can update a settings model, document, or undo history. Keeping persistence in this callback avoids saving every drag preview.

Convert the packed value when building Goo visuals:

```gsharp
Container{Width: 260.0, Height: 96.0, BackgroundColor: ColorMath.GooColor(liveColor),}

Text("#${ColorMath.Hex(liveColor)}")
```

Changing `liveColor` from elsewhere and rebuilding the host also updates the picker. The sample's Reset button demonstrates this. The picker manages its wheel image and disposes it when Goo unmounts the cell.

When the mounted picker has siblings, give those siblings keys as well. The complete example keys the Reset button and committed-color readout.

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

## Run the complete application

From this repository:

```sh
dotnet run --project samples/Goo.Widgets.QuickStart -c Release
```

In a Wayland session, set `SDL_VIDEODRIVER=wayland` if needed to select the native display driver.

The [project](../samples/Goo.Widgets.QuickStart/Goo.Widgets.QuickStart.gsproj) uses
source project references. The same application source works with the NuGet
installation above.

## Controlled split panes, tabs, and multiline fields

Mount `SplitPaneInput/SplitPane`, `TabBarInput/TabBar`, and `TextAreaInput/TextArea`
with stable `Cell.Mount` keys. Update the supplied value in the host callback and
call the host's `Rebuild()`; each mounted control retains its own interaction
state.

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
GOO_WIDGETS_COMPOSITES=1 /usr/bin/python3 scripts/with-isolated-wayland.py -- \
  dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
```

Set `GOO_WIDGETS_PROOF_DIR` to capture native results and `GOO_CLI` to the matching
Goo DevTools executable or DLL. The runner creates a private KWin session and input
seat and requires the platform packages listed in its docstring.

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
`FormatTick`, and `PixelsPerHour` control the ruler. Ticks begin at the range start
and retain its UTC offset; calendar/time-zone formatting beyond that belongs in
the formatter. Ranges are half-open, and equal event endpoints represent points.
At most 4096 ticks and a canvas width between .01 and 1e9 logical pixels are
accepted. This widget lays out its event set; it is not a virtual event database.

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

## Controlled TreeView

Mount `TreeViewInput/TreeView` with unique `TreeNode.Id` values throughout the
hierarchy, including collapsed descendants. Each node supplies a label or custom
content, optional check state, and children. A disabled node also disables its
descendants. Cycles and shared/duplicate node identities are rejected. Expansion
uses `ExpandedIds` and `OnExpandedChange`; single row selection uses `SelectedId`
and `OnSelect`. Host callbacks should update their input and rebuild the host.
Set `ExpandOnActivate: true` to make a branch's row click, Enter, and accessible
Activate request both selection and expansion/collapse. The host still updates
`ExpandedIds`. Expander buttons toggle once; checkbox clicks and Space retain the
host's check policy. This is enabled in both gallery examples and defaults to false.
Replace node/expansion arrays when their contents change; typed Cell inputs are
immutable snapshots and do not observe in-place collection edits.

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

Visible rows are flattened iteratively and virtualized by default. Fixed
`RowHeight` and `Indent` control geometry. `Virtualize: false` realizes every row
in a full-height provider inside an outer scroll viewport; changing the mode keeps
the retained row structure and logical focus. Custom content follows ordinary Goo
layout and can provide its own interaction. Content, expander, checkbox, row, and
root factories customize prepared blobs; required slots and tree wiring are
reapplied. Use `GOO_WIDGETS_TREE=1` with the native runner to exercise both modes,
keyboard and accessibility input, and the 1,500-child case.

## Controlled DataGrid

Mount `DataGridInput/DataGrid` with unique row and column IDs. Rows contain an
optional dictionary of display values; `CreateCell` can instead look up an
application object by row ID. The application supplies the row order, filters,
grouping, and business actions. Header/filter content and cell, checkbox, detail,
row, and root factories provide composition without duplicating column sizing.
Factories may customize appearance; the grid reapplies required slots, identity,
input, and semantics. Use `with` on the data input for ordinary variants.

A column has a fixed `Width` or a positive `Flex` weight, with `Minimum`/`Maximum`
bounds. Flex columns share the remaining viewport width above their minimums;
minimum widths may overflow horizontally. Controlled `ColumnWidths` override
individual columns in pixels. `OnColumnWidthChange` requests a finite clamped
width and `OnColumnWidthCommit` reports pointer-up or keyboard completion. The
host must update its width map and rebuild. Cancellation stops capture without a
commit; earlier live change requests remain applied. Resizers support Left/Right,
Home/End, and accessible value changes. Headers, filters, and virtual cells share
one width array inside one horizontal scroll viewport.

`SortColumnId`/`SortDirection` and `OnSort` cycle None → Ascending → Descending →
None. The host performs the sort. `Selection` supports None, Single (at most one
selected ID), and Multiple. `SelectedIds`/`OnSelectionChange` are controlled.
Click replaces selection, Ctrl/⌘ toggles, and Shift selects a range in the supplied
row order, skipping disabled rows. Ctrl/⌘+Shift adds the range. Toggle operations
preserve selected IDs absent from a filtered row set. `ShowSelection` composes a
leading checkbox using the same callbacks. There is no imposed select-all policy.

The grid keeps keyboard focus on its root and exposes its active row through
`ActiveDescendant`. Up/Down/Home/End move through enabled rows; Shift extends
selection, Enter replaces it, and Space toggles it. Left/Right request detail
collapse/expansion. Headers, resize handles, and custom interactive content retain
their own focus and keyboard behavior. Grid/Row/ColumnHeader/GridCell semantics
include selection, expansion, disabled state, sort descriptions, and composed
accessibility actions. The current Goo metadata has no row/column index or sort
enum fields; those are not fabricated by the widget.

`ExpandedIds` and `OnExpandedChange` control details. Supply a row's `Detail`, or
set `HasDetail` and provide `CreateDetail` for lazy composition. `VirtualRows`
measures expanded content at the shared table width, so detail text can wrap and
push following rows naturally. Ordinary row cells use fixed `RowHeight`. Replace
changed arrays and maps before rebuilding; typed inputs do not observe in-place
mutations. Use `GOO_WIDGETS_DATA_GRID=1` with the isolated native runner for sorting,
selection, resizing/cancel, expanded details, horizontal scrolling, and 1,500 rows.


## Gallery feedback regression checks

Build with `scripts/verify.sh`, then run the actual gallery pages in isolated
native processes. `GOO_CLI` may name a Goo executable or its built CLI DLL:

```sh
GOO_CLI=/path/to/goo /usr/bin/python3 scripts/with-isolated-wayland.py -- \
  python3 scripts/verify-gallery-feedback.py
```

The runner writes screenshots, per-page logs, and `results.json` to
`artifacts/gallery-feedback`. Use `--output` to change that directory; optional
page names select cases, such as `'Data grid' 'Tree view'`. These checks compile
the gallery's actual cells into the package consumer and separate native presses
from releases with rendered frames, so focus-induced layout changes are exercised.
