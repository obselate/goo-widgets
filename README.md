# Goo Widgets

Reusable G# widgets for [Goo](https://github.com/obselate/goo) desktop applications.

Includes actions, inputs, feedback, layout, navigation, data views, charts, themes,
and embedded Material Symbols. Import the categories you use.

## Install

Goo Widgets `0.9.0` requires Goo `0.16.0` or later, .NET 10, and
`Gsharp.NET.Sdk/0.4.1150`. Install from NuGet.org:

```sh
dotnet add YourApp.gsproj package Goo.Widgets --version 0.9.0
```

## Use

```gsharp
import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Feedback

let content = Container{
    Gap: 12,
    ActionButton{Content: "Save", OnClick: () -> Save()}.Build(),
    ProgressBar{Value: 0.6}.Build(),
}
```

Value widgets return a Goo `Blob` from `Build()`. Mount stateful widgets with
`Cell.Mount[Input, Widget]` and a stable key. See the
[usage guide](https://github.com/obselate/goo-widgets/blob/main/docs/usage.md)
for input policy, controlled state, overlays, customization, and complex widgets.

To embed only the Material Symbols your executable uses, list them in its project:

```xml
<ItemGroup>
  <GooMaterialIcon Include="folder;search;refresh" />
</ItemGroup>
```

Goo Widgets adds icons used by its own controls, rejects unknown names at build
time, and embeds the selected SVGs in the executable. `MaterialIcons.Names()`
lists the available subset. NativeAOT also removes the full catalog from the
library. Without `GooMaterialIcon` items, all 4,128 icons remain available.

Complete examples:

- [Quick start](https://github.com/obselate/goo-widgets/tree/main/samples/Goo.Widgets.QuickStart)
- [Widget gallery](https://github.com/obselate/goo-widgets/tree/main/samples/Goo.Widgets.Gallery)
- [Goo Dark, Goo Light, and GitHub Dark themes](https://github.com/obselate/goo-widgets/tree/main/samples/Goo.Widgets.Theme)

## Build

Requires .NET SDK `10.0.401`. Dependencies are locked.

```sh
bash scripts/verify.sh
```

Verification builds the solution, checks gallery screenshot coverage, packs and
validates both packages, and runs packaged full-catalog and subset consumer checks.

## Links

- [Gallery screenshots](https://github.com/obselate/goo-widgets/blob/main/samples/screenshots/README.md)
- [Optional Markdown package](https://github.com/obselate/goo-widgets/blob/main/src/Goo.Widgets.Markdown/README.md)
- [Release process](https://github.com/obselate/goo-widgets/blob/main/.github/RELEASING.md)
- [Goo documentation](https://github.com/obselate/goo/tree/main/docs)
