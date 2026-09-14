# Using Goo Widgets

Add the package to an existing Goo application:

```sh
dotnet add YourApp.gsproj package Goo.Widgets --version 0.1.1
```

Goo Widgets brings in Goo and Goo.Svg 0.5.2. The examples target .NET 10 and use Gsharp.NET.Sdk 0.4.59.

The package examples below use published `0.1.1`. The current checkout also has
unreleased ergonomics described in the [README](../README.md). Those APIs are not
available from the published package.

## Basic widgets

Value widgets such as `ActionButton`, `Checkbox`, and `Badge` return a Goo `Blob` from `.Build()`. Insert that result into your container's `Children` collection.

The [complete example](../samples/Goo.Widgets.QuickStart/Program.gs) uses an action button to reset the selected color:

```gsharp
import Goo.Widgets.Actions

ActionButton{
  Label: "Reset",
  OnClick: () -> ResetColor(),
}.Build()
```

`ResetColor` belongs to the host cell. It updates application state and calls `Rebuild()` to refresh the display. Widget callbacks are the connection to your application's commands and data.

## Color picker integration

Keep the selected color in your application's host cell. Mount `ColorPicker` inside the host's `Build` method with a stable key:

```gsharp
import Goo
import Goo.Widgets.Colors

Cell.Mount[ColorPickerInput, ColorPicker]("color-picker", ColorPickerInput{
  Value: liveColor,
  Mode: ColorMode.Oklch,
  WheelSize: 260.0,
  AccessibilityName: "Theme color",
  OnValueChanged: (value int32) -> SetLiveColor(value),
  OnValueCommitted: (value int32) -> CommitColor(value),
})
```

| Part | Application responsibility |
| --- | --- |
| `Value` | Supply a packed 24-bit sRGB `int32`, such as `0x4F8FEA`. |
| `Mode` | Select `ColorMode.Hsl`, `ColorMode.Hsv`, or `ColorMode.Oklch`. The input and callback values remain sRGB. |
| `OnValueChanged` | Update the host's current color and live preview during interaction. |
| `OnValueCommitted` | Apply or save the final selection after a completed interaction. |
| `OnModeChanged` (current checkout) | Adopt a mode button choice when the host owns `Mode`. |
| Mount key | Keep the same key across rebuilds so the picker retains its internal interaction state. |

In the current checkout, set `Compact: true` to show only the wheel and tone
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
Container{
  Width: 260.0,
  Height: 96.0,
  BackgroundColor: ColorMath.GooColor(liveColor),
}

Text{
  Content: "#" + ColorMath.Hex(liveColor),
}
```

Changing `liveColor` from elsewhere and rebuilding the host also updates the picker. The sample's Reset button demonstrates this. The picker manages its wheel image and disposes it when Goo unmounts the cell. The source QuickStart uses the published input properties. Its full mode-selector and preview composition requires the current checkout.

When the mounted picker has siblings, give those siblings keys as well. The complete example keys the Reset button and committed-color readout.

## Current checkout ergonomics

The current checkout lets a checkbox own its visible label and its full hit target:

```gsharp
Checkbox{
  Label: "Include inherited settings",
  State: state,
  AllowMixed: true,
  OnChange: (next AccessibilityChecked) -> { state = next },
}.Build()
```

`SliderInput.Label` supplies a visible label and the default accessible name.
`ShowValue` adds the value beside it. `FormatValue` formats both the accessible
range text and the visible value:

```gsharp
Cell.Mount[SliderInput, Slider]("opacity", SliderInput{
  Label: "Opacity",
  ShowValue: true,
  FormatValue: (value float64) -> Math.Round(value * 100.0).ToString() + "%",
  Value: opacity,
  Minimum: 0.0,
  Maximum: 1.0,
})
```

`GraphNodeCard.Center` is optional in the current checkout. It defaults to the
node's `Position`; supply `Center: Point{ X: 300.0, Y: 120.0 }` for an explicit
screen-space card center.

## Run the complete application

From this repository:

```sh
dotnet run --project samples/Goo.Widgets.QuickStart -c Release
```

In a Wayland session, set `SDL_VIDEODRIVER=wayland` if needed to select the native display driver.

The [project](../samples/Goo.Widgets.QuickStart/Goo.Widgets.QuickStart.gsproj) uses a source project reference so it builds with this checkout. To use the same [Program.gs](../samples/Goo.Widgets.QuickStart/Program.gs) in a separate application, reference the published package instead:

```xml
<Project Sdk="Gsharp.NET.Sdk/0.4.59">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Goo.Widgets" Version="0.1.1" />
    <Watch Include="**/*.gs" Exclude="bin/**;obj/**" />
  </ItemGroup>
</Project>
```

## Controlled split panes, tabs, and multiline fields

Mount `SplitPaneInput/SplitPane`, `TabBarInput/TabBar`, and `TextAreaInput/TextArea`
with stable `Cell.Mount` keys. Update the supplied value in the host callback and
call the host's `Rebuild()`; each mounted control retains its own interaction
state. These APIs require the unreleased Goo 0.5.4 preview core.

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

The preview core packages are local review artifacts, separate from published
Goo 0.5.3. Pack Goo, Goo.Svg, and Goo.Accessibility with
`-p:GooReleaseVersion=0.5.4-preview.1` and the native payload paths required by the
core packaging targets. Use an isolated NuGet cache and restore from that package
output directory before running `scripts/verify.sh`. Publishing these widgets
requires publishing their core dependency first. Native checks are opt-in:

```sh
GOO_WIDGETS_COMPOSITES=1 /usr/bin/python3 scripts/with-isolated-wayland.py -- \
  dotnet tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll
```

Set `GOO_WIDGETS_PROOF_DIR` to capture native results and `GOO_CLI` to the matching
Goo DevTools executable or DLL. The runner creates a private KWin session and input
seat and requires the platform packages listed in its docstring.
