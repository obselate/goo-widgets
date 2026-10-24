# Gallery screenshots

```sh
dotnet build samples/Goo.Widgets.Gallery -c Release
SDL_VIDEODRIVER=wayland scripts/with-headless-wayland.sh \
  dotnet run --project samples/Goo.Widgets.Gallery -c Release --no-build -- \
  --screenshots samples/screenshots --theme dark
dotnet run --project tools/Goo.Widgets.Checks -c Release -- screenshots
```

Install [Goo DevTools](https://github.com/obselate/goo/blob/main/docs/devtools/README.md) first. Put `goo` on `PATH`, or set `GOO_CLI` to its executable or CLI DLL.

Each image is an actual gallery capture in Ink, 1100 wide at scale 1. Its height fits the page content, with a minimum of 420. The sidebar is hidden. The gallery waits 30 frames before each capture.

For full-shell captures, set `GOO_HEADLESS_WIDTH=1600` and `GOO_HEADLESS_HEIGHT=1100` so the private display has room for the window.

Add `--page "Color picker"` to capture one page. Use `--theme light` for Bone. Use `--shell-screenshots <directory> --page "Action button"` for a full 1440x900 shell capture.

Each image links to its page source. New pages need a registration, a matching PNG and an entry below.

## Actions

| | | |
| --- | --- | --- |
| [![Action button](ActionButton.png)](../Goo.Widgets.Gallery/Pages/Controls/ActionButtonPage.gs)<br>Action button | [![Icon button](IconButton.png)](../Goo.Widgets.Gallery/Pages/Actions/IconButtonPage.gs)<br>Icon button | |

## Inputs

| | | |
| --- | --- | --- |
| [![Checkbox](Checkbox.png)](../Goo.Widgets.Gallery/Pages/Inputs/CheckboxPage.gs)<br>Checkbox | [![Radio group](RadioGroup.png)](../Goo.Widgets.Gallery/Pages/Inputs/RadioGroupPage.gs)<br>Radio group | [![Toggle group](ToggleGroup.png)](../Goo.Widgets.Gallery/Pages/Inputs/ToggleGroupPage.gs)<br>Toggle group |
| [![Text field](TextField.png)](../Goo.Widgets.Gallery/Pages/Controls/TextFieldPage.gs)<br>Text field | [![Number input](NumberInput.png)](../Goo.Widgets.Gallery/Pages/Inputs/NumberInputPage.gs)<br>Number input | [![Form field](FormField.png)](../Goo.Widgets.Gallery/Pages/Inputs/FormFieldPage.gs)<br>Form field |
| [![Text area](TextArea.png)](../Goo.Widgets.Gallery/Pages/Inputs/TextAreaPage.gs)<br>Text area | [![Touch text editing](TouchTextEditing.png)](../Goo.Widgets.Gallery/Pages/Inputs/TouchTextEditingPage.gs)<br>Touch text editing | [![Toggle switch](ToggleSwitch.png)](../Goo.Widgets.Gallery/Pages/Controls/ToggleSwitchPage.gs)<br>Toggle switch |
| [![Stepper](Stepper.png)](../Goo.Widgets.Gallery/Pages/Controls/StepperPage.gs)<br>Stepper | [![Upload tile](UploadTile.png)](../Goo.Widgets.Gallery/Pages/Controls/UploadTilePage.gs)<br>Upload tile | [![Search list](SearchList.png)](../Goo.Widgets.Gallery/Pages/Inputs/SearchListPage.gs)<br>Search list |
| [![Combo box](ComboBox.png)](../Goo.Widgets.Gallery/Pages/Inputs/ComboBoxPage.gs)<br>Combo box | [![Calendar](Calendar.png)](../Goo.Widgets.Gallery/Pages/Inputs/CalendarPage.gs)<br>Calendar | [![Date picker](DatePicker.png)](../Goo.Widgets.Gallery/Pages/Inputs/DatePickerPage.gs)<br>Date picker |
| [![Slider](Slider.png)](../Goo.Widgets.Gallery/Pages/Inputs/SliderPage.gs)<br>Slider | [![Find bar](FindBar.png)](../Goo.Widgets.Gallery/Pages/Inputs/FindBarPage.gs)<br>Find bar | |

## Data

| | | |
| --- | --- | --- |
| [![Chip](Chip.png)](../Goo.Widgets.Gallery/Pages/Controls/ChipPage.gs)<br>Chip | [![Time axis](TimeAxis.png)](../Goo.Widgets.Gallery/Pages/Data/TimeAxisPage.gs)<br>Time axis | [![List view](ListView.png)](../Goo.Widgets.Gallery/Pages/Data/ListViewPage.gs)<br>List view |
| [![Tree view](TreeView.png)](../Goo.Widgets.Gallery/Pages/Data/TreeViewPage.gs)<br>Tree view | [![Data grid](DataGrid.png)](../Goo.Widgets.Gallery/Pages/Data/DataGridPage.gs)<br>Data grid | |

## Feedback

| | | |
| --- | --- | --- |
| [![Toast](Toast.png)](../Goo.Widgets.Gallery/Pages/Feedback/ToastPage.gs)<br>Toast | [![Spinner](Spinner.png)](../Goo.Widgets.Gallery/Pages/Feedback/SpinnerPage.gs)<br>Spinner | |
| [![Badge](Badge.png)](../Goo.Widgets.Gallery/Pages/Controls/BadgePage.gs)<br>Badge | [![Banner](Banner.png)](../Goo.Widgets.Gallery/Pages/Controls/BannerPage.gs)<br>Banner | [![Dismissible context bar](DismissibleContextBar.png)](../Goo.Widgets.Gallery/Pages/Controls/DismissibleContextBarPage.gs)<br>Dismissible context bar |
| [![Empty state](EmptyState.png)](../Goo.Widgets.Gallery/Pages/Controls/EmptyStatePage.gs)<br>Empty state | [![Progress bar](ProgressBar.png)](../Goo.Widgets.Gallery/Pages/Controls/ProgressBarPage.gs)<br>Progress bar | [![Progress summary](ProgressSummary.png)](../Goo.Widgets.Gallery/Pages/Feedback/ProgressSummaryPage.gs)<br>Progress summary |

## Layout

| | | |
| --- | --- | --- |
| [![App bar](AppBar.png)](../Goo.Widgets.Gallery/Pages/Controls/AppBarPage.gs)<br>App bar | [![Drawer](Drawer.png)](../Goo.Widgets.Gallery/Pages/Controls/DrawerPage.gs)<br>Drawer | [![Section header](SectionHeader.png)](../Goo.Widgets.Gallery/Pages/Controls/SectionHeaderPage.gs)<br>Section header |
| [![List row](ListRow.png)](../Goo.Widgets.Gallery/Pages/Controls/ListRowPage.gs)<br>List row | [![Master detail](MasterDetail.png)](../Goo.Widgets.Gallery/Pages/Layout/MasterDetailPage.gs)<br>Master detail | [![Modal dialog](ModalDialog.png)](../Goo.Widgets.Gallery/Pages/Layout/ModalDialogPage.gs)<br>Modal dialog |
| [![Modal dialog host](ModalDialogHost.png)](../Goo.Widgets.Gallery/Pages/Layout/ModalDialogHostPage.gs)<br>Modal dialog host | [![Popover](Popover.png)](../Goo.Widgets.Gallery/Pages/Layout/PopoverPage.gs)<br>Popover | [![Tooltip](Tooltip.png)](../Goo.Widgets.Gallery/Pages/Layout/TooltipPage.gs)<br>Tooltip |
| [![Disclosure](Disclosure.png)](../Goo.Widgets.Gallery/Pages/Layout/DisclosurePage.gs)<br>Disclosure | [![Split pane](SplitPane.png)](../Goo.Widgets.Gallery/Pages/Layout/SplitPanePage.gs)<br>Split pane | [![Grid](Grid.png)](../Goo.Widgets.Gallery/Pages/Layout/GridPage.gs)<br>Grid |
| [![Window chrome](WindowChrome.png)](../Goo.Widgets.Gallery/Pages/Layout/WindowChromePage.gs)<br>Window chrome | [![Theme scope](ThemeScope.png)](../Goo.Widgets.Gallery/Pages/Layout/ThemeScopePage.gs)<br>Theme scope | |

## Navigation

| | | |
| --- | --- | --- |
| [![Navigation rail](NavigationRail.png)](../Goo.Widgets.Gallery/Pages/Navigation/NavigationRailPage.gs)<br>Navigation rail | [![Tab bar](TabBar.png)](../Goo.Widgets.Gallery/Pages/Navigation/TabBarPage.gs)<br>Tab bar | [![Menu](Menu.png)](../Goo.Widgets.Gallery/Pages/Navigation/MenuPage.gs)<br>Menu |
| [![Breadcrumb](Breadcrumb.png)](../Goo.Widgets.Gallery/Pages/Content/BreadcrumbPage.gs)<br>Breadcrumb | | |

## Media

| | | |
| --- | --- | --- |
| [![Async image](AsyncImage.png)](../Goo.Widgets.Gallery/Pages/Controls/AsyncImagePage.gs)<br>Async image | [![Avatar](Avatar.png)](../Goo.Widgets.Gallery/Pages/Controls/AvatarPage.gs)<br>Avatar | [![Media card](MediaCard.png)](../Goo.Widgets.Gallery/Pages/Media/MediaCardPage.gs)<br>Media card |
| [![Media transport](MediaTransport.png)](../Goo.Widgets.Gallery/Pages/Media/MediaTransportPage.gs)<br>Media transport | | |

## Charts

| | | |
| --- | --- | --- |
| [![Donut chart](DonutChart.png)](../Goo.Widgets.Gallery/Pages/Charts/DonutChartPage.gs)<br>Donut chart | [![Stacked bar](StackedBar.png)](../Goo.Widgets.Gallery/Pages/Charts/StackedBarPage.gs)<br>Stacked bar | |

## Graphs

| | | |
| --- | --- | --- |
| [![Graph canvas](GraphCanvas.png)](../Goo.Widgets.Gallery/Pages/Graphs/GraphCanvasPage.gs)<br>Graph canvas | [![Graph node card](GraphNodeCard.png)](../Goo.Widgets.Gallery/Pages/Graphs/GraphNodeCardPage.gs)<br>Graph node card | |

## Colors

| | | |
| --- | --- | --- |
| [![Color picker](ColorPicker.png)](../Goo.Widgets.Gallery/Pages/Colors/ColorPickerPage.gs)<br>Color picker | | |

## Content

| | | |
| --- | --- | --- |
| [![Markdown view](MarkdownView.png)](../Goo.Widgets.Gallery/Pages/Content/MarkdownViewPage.gs)<br>Markdown view | [![Typography](Typography.png)](../Goo.Widgets.Gallery/Pages/Content/TypographyPage.gs)<br>Typography | [![Kbd](Kbd.png)](../Goo.Widgets.Gallery/Pages/Content/KbdPage.gs)<br>Kbd |
| [![Code block](CodeBlock.png)](../Goo.Widgets.Gallery/Pages/Content/CodeBlockPage.gs)<br>Code block | | |
