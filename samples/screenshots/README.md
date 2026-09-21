# Gallery screenshots

Each image is captured from the running Goo Widgets gallery. Click an image for its full resolution.

## Refresh screenshots

Install the optional [Goo DevTools](https://github.com/obselate/goo/blob/main/docs/devtools/README.md) capture tool, then run these commands from the repository root in a graphical session:

```sh
dotnet tool install --global Goo.DevTools --version 0.6.4
dotnet build samples/Goo.Widgets.Gallery -c Release
dotnet run --project samples/Goo.Widgets.Gallery -c Release --no-build -- --screenshots samples/screenshots
python3 scripts/verify-screenshots.py
```

In a Wayland session, set `SDL_VIDEODRIVER=wayland` to select the native display driver.

Ensure `goo` is on `PATH`, or set `GOO_CLI` to its executable or CLI DLL. The capture command opens one window, visits every widget, waits for the presentation to settle, and closes the window when finished. Screenshots include the gallery frame.

To refresh just one widget, add its gallery page title:

```sh
dotnet run --project samples/Goo.Widgets.Gallery -c Release --no-build -- --screenshots samples/screenshots --page "Color picker"
```

Every new widget needs a registered `<WidgetName>Page.gs`, a matching `<WidgetName>.png`, and an entry below. Refresh the screenshot when its appearance changes. Keep the images as actual gallery captures. Helper and model types do not need their own images.

## Actions

| Widget example | Gallery screenshot |
| --- | --- |
| [ActionButton](../Goo.Widgets.Gallery/Pages/Controls/ActionButtonPage.gs) | [![ActionButton in the Goo Widgets gallery](ActionButton.png)](ActionButton.png) |
| [IconButton](../Goo.Widgets.Gallery/Pages/Actions/IconButtonPage.gs) | [![IconButton in the Goo Widgets gallery](IconButton.png)](IconButton.png) |

## Charts

| Widget example | Gallery screenshot |
| --- | --- |
| [DonutChart](../Goo.Widgets.Gallery/Pages/Charts/DonutChartPage.gs) | [![DonutChart in the Goo Widgets gallery](DonutChart.png)](DonutChart.png) |
| [StackedBar](../Goo.Widgets.Gallery/Pages/Charts/StackedBarPage.gs) | [![StackedBar in the Goo Widgets gallery](StackedBar.png)](StackedBar.png) |

## Colors

| Widget example | Gallery screenshot |
| --- | --- |
| [ColorPicker](../Goo.Widgets.Gallery/Pages/Colors/ColorPickerPage.gs) | [![ColorPicker in the Goo Widgets gallery](ColorPicker.png)](ColorPicker.png) |

## Data

| Widget example | Gallery screenshot |
| --- | --- |
| [Chip](../Goo.Widgets.Gallery/Pages/Controls/ChipPage.gs) | [![Chip in the Goo Widgets gallery](Chip.png)](Chip.png) |
| [TimeAxis](../Goo.Widgets.Gallery/Pages/Data/TimeAxisPage.gs) | [![TimeAxis in the Goo Widgets gallery](TimeAxis.png)](TimeAxis.png) |
| [TreeView](../Goo.Widgets.Gallery/Pages/Data/TreeViewPage.gs) | [![TreeView in the Goo Widgets gallery](TreeView.png)](TreeView.png) |

## Feedback

| Widget example | Gallery screenshot |
| --- | --- |
| [Badge](../Goo.Widgets.Gallery/Pages/Controls/BadgePage.gs) | [![Badge in the Goo Widgets gallery](Badge.png)](Badge.png) |
| [Banner](../Goo.Widgets.Gallery/Pages/Controls/BannerPage.gs) | [![Banner in the Goo Widgets gallery](Banner.png)](Banner.png) |
| [DismissibleContextBar](../Goo.Widgets.Gallery/Pages/Controls/DismissibleContextBarPage.gs) | [![DismissibleContextBar in the Goo Widgets gallery](DismissibleContextBar.png)](DismissibleContextBar.png) |
| [EmptyState](../Goo.Widgets.Gallery/Pages/Controls/EmptyStatePage.gs) | [![EmptyState in the Goo Widgets gallery](EmptyState.png)](EmptyState.png) |
| [ProgressBar](../Goo.Widgets.Gallery/Pages/Controls/ProgressBarPage.gs) | [![ProgressBar in the Goo Widgets gallery](ProgressBar.png)](ProgressBar.png) |
| [ProgressSummary](../Goo.Widgets.Gallery/Pages/Feedback/ProgressSummaryPage.gs) | [![ProgressSummary in the Goo Widgets gallery](ProgressSummary.png)](ProgressSummary.png) |

## Graphs

| Widget example | Gallery screenshot |
| --- | --- |
| [GraphCanvas](../Goo.Widgets.Gallery/Pages/Graphs/GraphCanvasPage.gs) | [![GraphCanvas in the Goo Widgets gallery](GraphCanvas.png)](GraphCanvas.png) |
| [GraphNodeCard](../Goo.Widgets.Gallery/Pages/Graphs/GraphNodeCardPage.gs) | [![GraphNodeCard in the Goo Widgets gallery](GraphNodeCard.png)](GraphNodeCard.png) |

## Inputs

| Widget example | Gallery screenshot |
| --- | --- |
| [Checkbox](../Goo.Widgets.Gallery/Pages/Inputs/CheckboxPage.gs) | [![Checkbox in the Goo Widgets gallery](Checkbox.png)](Checkbox.png) |
| [SearchList](../Goo.Widgets.Gallery/Pages/Inputs/SearchListPage.gs) | [![SearchList in the Goo Widgets gallery](SearchList.png)](SearchList.png) |
| [Slider](../Goo.Widgets.Gallery/Pages/Inputs/SliderPage.gs) | [![Slider in the Goo Widgets gallery](Slider.png)](Slider.png) |
| [Stepper](../Goo.Widgets.Gallery/Pages/Controls/StepperPage.gs) | [![Stepper in the Goo Widgets gallery](Stepper.png)](Stepper.png) |
| [TextField](../Goo.Widgets.Gallery/Pages/Controls/TextFieldPage.gs) | [![TextField in the Goo Widgets gallery](TextField.png)](TextField.png) |
| [ToggleSwitch](../Goo.Widgets.Gallery/Pages/Controls/ToggleSwitchPage.gs) | [![ToggleSwitch in the Goo Widgets gallery](ToggleSwitch.png)](ToggleSwitch.png) |
| [UploadTile](../Goo.Widgets.Gallery/Pages/Controls/UploadTilePage.gs) | [![UploadTile in the Goo Widgets gallery](UploadTile.png)](UploadTile.png) |

## Layout

| Widget example | Gallery screenshot |
| --- | --- |
| [Grid](../Goo.Widgets.Gallery/Pages/Layout/GridPage.gs) | [![Grid in the Goo Widgets gallery](Grid.png)](Grid.png) |
| [AppBar](../Goo.Widgets.Gallery/Pages/Controls/AppBarPage.gs) | [![AppBar in the Goo Widgets gallery](AppBar.png)](AppBar.png) |
| [Drawer](../Goo.Widgets.Gallery/Pages/Controls/DrawerPage.gs) | [![Drawer in the Goo Widgets gallery](Drawer.png)](Drawer.png) |
| [ListRow](../Goo.Widgets.Gallery/Pages/Controls/ListRowPage.gs) | [![ListRow in the Goo Widgets gallery](ListRow.png)](ListRow.png) |
| [MasterDetail](../Goo.Widgets.Gallery/Pages/Layout/MasterDetailPage.gs) | [![MasterDetail in the Goo Widgets gallery](MasterDetail.png)](MasterDetail.png) |
| [ModalDialog](../Goo.Widgets.Gallery/Pages/Layout/ModalDialogPage.gs) | [![ModalDialog in the Goo Widgets gallery](ModalDialog.png)](ModalDialog.png) |
| [SectionHeader](../Goo.Widgets.Gallery/Pages/Controls/SectionHeaderPage.gs) | [![SectionHeader in the Goo Widgets gallery](SectionHeader.png)](SectionHeader.png) |
| [WindowChrome](../Goo.Widgets.Gallery/Pages/Layout/WindowChromePage.gs) | [![WindowChrome in the Goo Widgets gallery](WindowChrome.png)](WindowChrome.png) |
| [Disclosure](../Goo.Widgets.Gallery/Pages/Layout/DisclosurePage.gs) | [![Disclosure in the Goo Widgets gallery](Disclosure.png)](Disclosure.png) |

## Media

| Widget example | Gallery screenshot |
| --- | --- |
| [AsyncImage](../Goo.Widgets.Gallery/Pages/Controls/AsyncImagePage.gs) | [![AsyncImage in the Goo Widgets gallery](AsyncImage.png)](AsyncImage.png) |
| [Avatar](../Goo.Widgets.Gallery/Pages/Controls/AvatarPage.gs) | [![Avatar in the Goo Widgets gallery](Avatar.png)](Avatar.png) |
| [MediaCard](../Goo.Widgets.Gallery/Pages/Media/MediaCardPage.gs) | [![MediaCard in the Goo Widgets gallery](MediaCard.png)](MediaCard.png) |
| [MediaTransport](../Goo.Widgets.Gallery/Pages/Media/MediaTransportPage.gs) | [![MediaTransport in the Goo Widgets gallery](MediaTransport.png)](MediaTransport.png) |

## Navigation

| Widget example | Gallery screenshot |
| --- | --- |
| [NavigationRail](../Goo.Widgets.Gallery/Pages/Navigation/NavigationRailPage.gs) | [![NavigationRail in the Goo Widgets gallery](NavigationRail.png)](NavigationRail.png) |

## New controlled widgets

| Widget example | Gallery screenshot |
| --- | --- |
| [SplitPane](../Goo.Widgets.Gallery/Pages/Layout/SplitPanePage.gs) | [![SplitPane](SplitPane.png)](SplitPane.png) |
| [TabBar](../Goo.Widgets.Gallery/Pages/Navigation/TabBarPage.gs) | [![TabBar](TabBar.png)](TabBar.png) |
| [TextArea](../Goo.Widgets.Gallery/Pages/Inputs/TextAreaPage.gs) | [![TextArea](TextArea.png)](TextArea.png) |
