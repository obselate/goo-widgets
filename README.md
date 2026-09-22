# Goo Widgets

Reusable G# widgets for [Goo](https://github.com/obselate/goo) desktop applications.

The package provides actions, inputs, feedback, layout, navigation, data views,
charts, themes, and embedded Material Symbols. Import the categories you use and
compose them with ordinary Goo content.

## Install

Goo Widgets `0.2.5` targets .NET 10. Use `Gsharp.NET.Sdk/0.4.591` and install the
package from NuGet.org:

```sh
dotnet add YourApp.gsproj package Goo.Widgets --version 0.2.5
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

Value widgets return a Goo `Blob` from `Build()`. Stateful widgets use
`Cell.Mount[Input, Widget]` with a stable key. The
[usage guide](https://github.com/obselate/goo-widgets/blob/main/docs/usage.md)
covers input policy, controlled state, overlays, customization, and complex widgets.

Complete examples:

- [Quick start](https://github.com/obselate/goo-widgets/tree/main/samples/Goo.Widgets.QuickStart)
- [Widget gallery](https://github.com/obselate/goo-widgets/tree/main/samples/Goo.Widgets.Gallery)
- [Ink and Bone themes](https://github.com/obselate/goo-widgets/tree/main/samples/Goo.Widgets.Theme)

## Build

The repository requires .NET SDK `10.0.401` and uses locked dependencies.

```sh
bash scripts/verify.sh
```

Verification builds the solution, checks gallery screenshot coverage, packs and
validates both packages, and runs packaged consumer checks.

## Links

- [Gallery screenshots](https://github.com/obselate/goo-widgets/blob/main/samples/screenshots/README.md)
- [Optional Markdown package](https://github.com/obselate/goo-widgets/blob/main/src/Goo.Widgets.Markdown/README.md)
- [Release process](https://github.com/obselate/goo-widgets/blob/main/.github/RELEASING.md)
- [Goo documentation](https://github.com/obselate/goo/tree/main/docs)
