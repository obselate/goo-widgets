# Using Goo Widgets

Add the package to an existing Goo application:

```sh
dotnet add YourApp.gsproj package Goo.Widgets --version 0.1.1
```

Goo Widgets brings in Goo and Goo.Svg 0.5.2. The examples target .NET 10 and use Gsharp.NET.Sdk 0.4.59.

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
| Mount key | Keep the same key across rebuilds so the picker retains its internal interaction state. |

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

Changing `liveColor` from elsewhere and rebuilding the host also updates the picker. The sample's Reset button demonstrates this. The picker manages its wheel image and disposes it when Goo unmounts the cell.

When the mounted picker has siblings, give those siblings keys as well. The complete example places it beside a keyed preview container.

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
