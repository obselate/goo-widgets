# Changelog

## Unreleased

- Native pixel checks convert layout coordinates to capture pixels, so the theme, choice, ComboBox, field, toggle and chrome checks also hold at display scale 1.5. The TextField adornment inset check expects the inset as Goo snaps it to device pixels, and DataGrid column widths drop float32 noise below 0.001 px.
- Add `Theme.HoverTextColor` for the text, shortcut and submenu arrow of highlighted and pressed `Menu` items, for example white on a navy `HoverColor`. Zero keeps the current colors. Menu item labels now take the row `Color`, so a row state style from `CreateItem`, such as `Focus`, colors the label.
- Add `Theme.Fluent` and `Theme.FluentMica`: the Windows 11 Fluent look with WinUI 3 colors, 4 px control and 8 px overlay radii, the WinUI type ramp, Indicator selection and a solid scrollbar. FluentMica adds the Mica window material and acrylic popups with 30 px blur. Both keep the toolkit font.
- Theme family and mode are independent. `Theme.Variant` returns a theme's light or dark variant. `Theme.Default` and themes derived from it now carry the Bone and Ink variant, so `Theme.Attach(window, Theme.Default with{...})` follows the mode instead of staying fixed. Attach keeps the current mode. The default mode is System. `Theme.SetMode` switches within the attached family and leaves fixed themes (`Ink`, `Bone`, `GitHubDark`, `Variant = nil`) unchanged. Before, SetMode replaced every palette with Bone or Ink. A mode change replaces palette colors. On the built-in families, colors set on the attached theme stay in every mode, and an explicit `AccentColor` wins over the system accent. A custom `Variant` is used verbatim, accent included.
- Add `Theme.ScrollbarColor` for a solid scrollbar thumb and `Theme.OverlayBlur` for the glass overlay blur radius.
- `Theme.Native` on Windows now uses the Fluent palettes: WinUI type ramp, scrollbar, flat panels, control edge and popup shadows, 83 ms transitions and a lighter dialog scrim.
- Add `Theme.Controls` (`ControlStyle.Standard` or `ControlStyle.Fluent`). Fluent and Windows Native use Fluent shapes: faint control strokes with a strong bottom field edge and a 2 px accent focus line, filled combo triggers, a small switch knob that grows on hover, a ringed slider thumb, a filled radio mark, an accent rail pill that matches the list pill, a 2 px scrollbar thumb, and a tighter list caption. They derive the accent fill from the system accent (lighter in dark mode, darker in light mode) to keep 3:1 contrast. The built-in families follow the system accent in Light and Dark mode too, as WinUI does for a forced theme.
- Report pump count, elapsed time, expected and actual row alignment, and anchor values when the native virtual scroll probe times out.
- Selected text over a translucent selection fill now gets its contrast from the fill composed over the theme panel or popup surface. Opaque fills are unchanged.
- Size popovers and menus to their content, limited by the viewport. The ComboBox popup, `TriggerMenu` and `CommandPalette` fit their rows in height. Remove the 280 px width and 360 px height defaults of `Popover`, the 260 px `ComboBox.PopupHeight` default, the 240 px `TriggerMenu` height default and the 360 px `CommandPalette` height default. `Width`, `MaxHeight`, `PopupHeight` and `Height` still set fixed limits.
- Without a `Width`, `Popover`, `Menu`, `HoverCard` and anchored `TeachingTip` panels and the `Tooltip` bubble stop growing at 65 characters of the theme font size (32.5 em), so long text wraps at a readable line length. Remove the 320 px `HoverCard` and anchored `TeachingTip` width defaults. `Width` and `MaxWidth` still win.
- `ComboBox` and `DatePicker` popups are at least as wide as the trigger. `ComboBox.MatchTriggerWidth` is now `bool?`. Nil and true use the trigger width as the minimum. False gives the popup the trigger `Width`. Long options end with an ellipsis.
- `Tooltip.Placement` is now `PortalPlacement?` and defaults to `Top`.
- Show single-line labels with an ellipsis when space is short: `ActionButton`, `Chip`, `TabBar` tabs, `ToggleGroup` items, `Menu` items, the `ListRow` title, `SearchList` and `ComboBox` rows, the `ComboBox` value and `TreeView` labels. These controls can shrink in a narrow container. `CreateText`, `CreateTitle` and `CreateItem` replace the label.
- `ListView`, `TreeView`, `DataGrid` and `SearchList` without a `Height` grow and shrink to fill the free space of the parent and scroll inside it. Their default height (280, 280, 300 and 240 px) is the starting size, so in a parent without a bounded height they keep that height.
- A click or arrow key on a fully visible `ListView` row no longer scrolls the list. The list scrolls only as far as needed to show the active row.

## 0.21.0 - 2026-11-09

- Remove redundant input callback rebuilds from the QuickStart sample and update the usage guide for automatic host rebuilds.
- Add `theme.Spacing` padding above and below the ComboBox popup list, like menus. The list scrolls inside the padding.
- Draw `WindowChrome` caption buttons with crisp 10 px Windows 11 style glyphs. Apps that select `GooMaterialIcon` items no longer get `crop_square` and `filter_none` by default. Add them as `GooMaterialIcon` items if the app uses them.

## 0.20.0 - 2026-11-08

- Use `Post` for queued UI work. Requires Goo 0.29.0.
- Value widgets convert implicitly to `Blob`. Add widget literals directly to child collections and content slots without calling `Build()`.
- Upgrade Goo to 0.29.0 for callback ownership and controlled text synchronization during Build.
- Upgrade Goo to 0.28.7 for filter performance, 12 px text, and focus outlines inside rounded clipping ancestors.
- Raise `Theme.Ink` and `Theme.Bone` `BorderColor` so dividers and panel edges stay visible: about 1.8:1 against `PanelColor` in Ink (`#3d424d`) and 1.6:1 in Bone (`#cbcbc6`).
- Show the Goo mark in the gallery sidebar and window icon. Gallery pages use theme tokens, so text and surfaces stay readable in Light. The gallery shell uses even 12 px insets and no selected-row marker.
- Add `TextField.Handle` for the text entry. A `TextField` with `Leading`, `Trailing`, addons, `Clearable` or `RevealButton` now shows the focus ring and hover border on the whole field, and the clear action keeps focus in the field.
- Gallery search uses the standard `TextField` with a clear action, matches category names, and takes focus with Ctrl+F, Ctrl+K or `/`. The no-results message is announced as a status.
- Add theme depth. `Theme.Ink` uses tonal elevation: canvas `#08090c`, panel `#16181e`, raised `#1f2229`, overlay `#22252e`, and fields `#040506` below the canvas. Ink text, border, link, focus and status colors are lighter, so no text or field-border contrast falls below its earlier value. New `PanelShadows`, `OverlayShadows`, `ControlShadows` and `FieldShadows` tokens drive `PanelStyle`, `OverlayStyle`, `Card`, popovers, menus, dialogs, toasts, tooltips, filled buttons, and the inset look of text fields, check boxes, radio buttons, number inputs and combo boxes. Raised controls, cards and floating surfaces have a 1 px top highlight. Pressed buttons show the inset shadow. Rows and list items get no shadow.
- Forward widget input callbacks to their supplying Cell, so host state changes update the host UI without an explicit Rebuild.

## 0.19.8 - 2026-11-07

- Inset row focus rings in the shared interaction policy, so every row widget keeps its ring inside rounded and clipping hosts. Remove per-control row inset overrides.
- Size labeled `Checkbox` and `RadioButton` choices to their content with the control radius and end padding, so the focus ring wraps the box and label without spanning the container.
- Draw the SplitPane divider as a line of the theme border width that highlights on hover and drag. `HandleSize` now sets the pointer target, which overlaps both panes and defaults to twice the theme spacing (8 px). The panes gain the space the old divider took. The accessible value reports the controlled value exactly when the minima do not clamp it.

## 0.19.7 - 2026-11-07

- Keep the Banner dismiss button inside its bounds when long messages wrap.

## 0.19.6 - 2026-11-07

- Upgrade Goo to 0.28.6 for scrolled rounded images, vertical placement at unequal display scales, clamped logical scroll offsets, and deferred virtual row realization before rendering.

## 0.19.5 - 2026-11-07

Tagged but not published to NuGet. Its changes ship in 0.19.6.

- Upgrade Goo to 0.28.4 for retained scrolling, display-bounded initial windows and CPU-device presentation fixes. Preserve full-size gallery fit checks with explicit window minimums.

## 0.19.4 - 2026-11-06

- Size Markdown list markers from the font size and center them on the first text line. Right-align ordered list numbers.
- Use the theme line height for Markdown text lines. Lines were the font height times the line height, so Markdown spacing tightens from about 2.1 em to about 1.5 em with the default theme.
- Add `MarkdownViewInput.RuleColor` for table row rules and thematic breaks. Nil keeps the muted text color.
- Add `SplitPaneInput.HandleColor` for the divider. Nil keeps the theme border color.

## 0.19.3 - 2026-11-06

- Upgrade Goo to 0.28.3 for virtual row recycling, retained subtree drawing and path rendering fixes.

## 0.19.2 - 2026-11-06

- Fix control icon creation in trimmed builds.
- Project composite focus rings to active list, tree, grid and combo-box rows through Goo, and share their interaction paint without moving keyboard or accessibility focus.

## 0.19.1 - 2026-11-06

- Upgrade Goo to 0.28.2 for stable layout at fractional display scales.

## 0.19.0 - 2026-11-06

- Wait for virtual Markdown blocks to remount before checking retained selection in native tests.
- Close native test windows before the next fixture starts.
- Keep virtual rows at scroll offset zero when retained row content changes without a prepend.
- Upgrade Goo to 0.28.1 and pause Spinner animations while fully clipped, with native checks for idle and resumed frames.
- Resolve omitted disabled opacity in partial external themes affected by [gsharp#5296](https://github.com/DavidObando/gsharp/issues/5296).
- Add a controlled ToggleButton with shared button paint and pressed accessibility state.
- Add a controlled RadioButton and share its radio item with RadioGroup while keeping group navigation and one Tab stop.
- Check gallery page fit in every choice interaction run and exclude the scrollable navigation sidebar.
- Add TeachingTip with anchored and centered presentation, host-owned open state, shared actions, and optional light dismissal.
- Add TimePicker with culture-based clock segments, minute increments, nullable clearing and read-only selection.
- Upgrade Gsharp.NET.Sdk to 0.5.212 and Markdig to 1.6.0.
- Add RatingControl with whole or half-star selection, hover preview, keyboard navigation and read-only display.
- Add Skeleton text, circle, and rectangle placeholders with paint-only shimmer that pauses while fully clipped and stays static under reduced motion.
- Share interaction styles across directly focused controls, keep selected values through hover and press, and use one focus ring, disabled opacity and motion policy.
- Upgrade Goo to 0.27.11, derive virtual option set sizes from core, and verify held-key DataGrid navigation without rebuilding unchanged rows.
- Expose SplitPane separator orientation and range values, and DataGrid logical row and column indices and counts.
- Add read-only DatePicker, NumberInput, TextField and TokenInput values with focus, selection and copy.
- Add the public API shape rules and metadata conformance check to the build verification gate.
- Add host-owned DataGrid cell editing with native inline and popup editors, validation, keyboard traversal and retained virtual rows.
- Apply the API shape to DataGrid activation, group expansion and shared density (breaking).
- Apply the API shape to inputs, colors, and actions (breaking).
- Document every public widget declaration, including enum values and explicit constructors.
- Align DataGrid navigation, additive selection, sorting and column reordering with desktop grids. Plain header clicks replace the sort. Shift-click adds a sort. Retain unchanged visible rows during navigation and support indexed select-all requests.
- Apply the API shape to Navigation, Media, Graphs, Charts and Data except DataGrid (breaking).
- Use Goo Portal anchor placement and collision bounds for popovers.
- Use theme spacing and padding for attachment chips, token inputs, and radio group marks.
- Cache graph validation and node lookup until the node or edge array changes.
- Add modal drawers with a scrim, focus containment and focus restoration. Escape and scrim clicks request closure through `OnOpenChange(false)`.
- Use the theme series palette in order for chart series without an explicit color, with the accent as the empty-palette fallback.
- Raise high-contrast accent and semantic colors to 7:1 against their surfaces and focus rings to 3:1.
- Virtualize TriggerMenu and TokenInput suggestions in bounded lists.
- Cache `ComboBox` and `SearchList` rows and lookups until their source or query inputs change.
- Virtualize Markdown blocks when `MarkdownViewInput.Height` is bounded. Leave it unset for content-sized views. Use `MarkdownViewState.ScrollToHeading(id)` instead of `MarkdownHeading.Handle.ScrollIntoView()` for off-screen headings.
- Cache prepared `ListView` rows until the items, sections or query change.
- Link over-limit text area errors and correct virtual row positions and set sizes for lists, trees, combo boxes, and search lists.
- Compress the full Material Symbols catalogue. Keep every icon name and declared icon subsets unchanged.
- Apply the API shape to Layout, Feedback, and Content (breaking).

### API migration

| Widget | Old | New |
| --- | --- | --- |
| ActionButton | `Height`, `MinWidth`: `float64?` | `Length?` |
| AppBar | `Height float64?`, numeric font overrides | `Height Length?`, nullable font overrides |
| Badge | Numeric `Height` and `MinWidth`, numeric token overrides | `Height Length?`, `MinWidth Length?`, nullable token overrides |
| Banner | `MinHeight float64?`, numeric font overrides | `MinHeight Length?`, nullable font overrides |
| Calendar | `DayHeight`: zero selects default | `float64?`. Nil selects default. |
| Checkbox | `State` | `Value` |
| Checkbox | `Size`, `MarkSize`, `LabelFontSize`, `LabelFontWeight`: zero selects default | Nullable tokens. Nil selects default. |
| CodeBlock | Sealed class, `MaxHeight float64` | Open class, `MaxHeight Length?` |
| ColorPicker | `OnValueChanged`, `OnValueCommitted`, `OnModeChanged` | `OnChange`, `OnCommit`, `OnModeChange` |
| ColorPicker | `WheelSize`, `MarkerSize`, `ToneSliderHeight`: zero selects default | `float64?`. Nil selects default. |
| ComboBox | `CreateText`, `OnSelectedIdsChange` | `FormatCreateText`, `OnSelectionChange` |
| ComboBox | `Width`: `float64` | `Length?` |
| ComboBox | `PopupHeight`, `RowHeight`: zero selects default | `float64?`. Nil selects default. |
| DataGrid | `OnRowInvoke`, `OnExpandedGroupChange` | `OnClick`, `OnGroupExpandedChange` |
| DataGrid | `DataGridDensity.Normal`, `.Compact`, `.Comfortable` | `Density.Standard`, `.Compact`, `.Comfortable`. `Density.Touch` uses touch metrics. |
| DatePicker | `Width`: `float64` | `Length?` |
| DatePicker | `PopupWidth`: zero selects default | `float64?`. Nil selects default. |
| DismissibleContextBar | `MinHeight float64?`, numeric dismiss font overrides | `MinHeight Length?`, nullable dismiss font overrides |
| Drawer | `Width float64` | `Width Length?` |
| EmptyState | `MinHeight float64?`, numeric font overrides | `MinHeight Length?`, nullable font overrides |
| FindBar | `CreateEntry(field)` | `CreateEntry(owner, field)` |
| FormField, NumberInput, FindBar | `Issue` | `Error` |
| Grid | Numeric `ColumnGap` and `RowGap` | Nullable `ColumnGap` and `RowGap` |
| IconButton | `Width`, `Height`: `float64?` | `Length?` |
| ListRow | `MinHeight float64?`, numeric font overrides | `MinHeight Length?`, nullable font overrides |
| MasterDetail | `MasterWidth float64` | `MasterWidth float64?` |
| ModalDialog | `OnClose Action?`, `Width float64` | `OnOpenChange Action[bool]?`, `Width Length?` |
| NumberInput | Closed mounted class | Public open mounted class |
| Popover | Numeric `MinWidth`, `MaxWidth`, and `MaxHeight` | `Length?` constraints, `OnOpenChange Action[bool]?` |
| ProgressBar | Numeric `Width`, `Height`, and `BorderWidth` | `Width Length?`, `Height Length?`, `BorderWidth float64?` |
| ProgressSummary | Numeric font overrides | Nullable font overrides |
| PropertyGrid | `CollapsedSections`, `OnSectionToggle` | `ExpandedSectionIds`, `OnSectionExpandedChange Action[string, bool]?` |
| PropertyGrid | `LabelWidth float64`, `CreateRow(item, content)` | `LabelWidth float64?`, `CreateRow(grid, item, content)` |
| PropertyGridItem | `Issue` | `Error` |
| SearchList | `CustomizeEntry`, `CustomizeRow`, `CustomizeRoot` | `CreateEntry`, `CreateRow`, `CreateRoot`, with the owner first |
| SearchList | `Width`, `Height`: `float64?` | `Length?` |
| SearchList | No disabled state | `Disabled bool` |
| SectionHeader | Numeric font overrides | Nullable font overrides |
| SettingsLayout | Sealed class, numeric width metrics | Open class, nullable width metrics |
| ShortcutList | Sealed class | Open class |
| Slider | `OnValueChanged`, `OnValueCommitted` | `OnChange`, `OnCommit` |
| Slider | `Height`: `float64` | `Length?` |
| Slider | `LabelFontSize`, `ValueFontSize`, `ThumbSize`, `TrackThickness`: zero selects default | `float64?`. Nil selects default. |
| Spinner | `Size float64` | `Size float64?` |
| StatusBar | Sealed class | Open class |
| StatusBarItem | `OnActivate`, `OnMenuActivate` | `OnClick`, `OnMenuClick` |
| Stepper | `Height`: `float64?` | `Length?` |
| Stepper | `FontSize`, `FontWeight`: zero selects default | Nullable tokens. Nil selects default. |
| TextArea | `MinimumHeight float64?` | `MinHeight Length?` |
| TextField | `IssueFontSize` | `ErrorFontSize float64?` |
| TextField | `FontSize`, `LabelFontSize`, `LabelFontWeight`: zero selects default | Nullable tokens. Nil selects default. |
| TextField, TextArea | `IssueText` | `Error` |
| TextField, TextArea | No description | `Description string?` |
| Toast | No open-state callback | `OnOpenChange Action[bool]?` |
| ToastHost | `Width float64?`, `CreateToast(toast, root)` | `Width Length?`, `CreateToast(host, toast, root)` |
| ToggleGroup | `Look`, `ToggleGroupLook`, `OnChange` | `Variant`, `ToggleGroupVariant`, `OnSelectionChange` |
| ToggleSwitch | `Checked`, `OnClick Action?` | `Value`, `OnChange Action<bool>?` |
| ToggleSwitch | `Width`, `Height`: pixel values | `Length?` |
| ToggleSwitch | `ThumbSize`: zero selects default | `float64?`. Nil selects default. |
| TokenInput | `Tokens`, `OnTokensChange` | `Value`, `OnChange` |
| TriggerMenu | `MaxHeight`: `float64` | `Length?`. Nil selects default. |
| WindowChrome | `Height float64`, `ControlWidth float64` | `Height Length?`, `ControlWidth float64?` |
| AttachmentChip | `OnOpen` | `OnClick` |
| Chip | `Height float64?` | `Height Length?` |
| Chip | `FontSize float64`, `FontWeight int32` | `FontSize float64?`, `FontWeight int32?` |
| ListView | `OnInvoke` | `OnClick` |
| TimeAxis | `OnViewportChanged` | `OnViewportChange` |
| TreeView | `LoadChildren` | `OnLoadChildren` |
| DonutChart, StackedBar | `OnActivate` | `OnClick` |
| DonutChart, StackedBar | `CreateLabel(segment, text)` | `CreateLabel(owner, segment, text)` |
| StackedBar | `Height float64?` | `Height Length?` |
| GraphCanvas | `SelectedNodeIds` | `SelectedIds` |
| GraphCanvas | `OnSelectionChanged`, `OnNodePositionChanged`, `OnViewportChanged` | `OnSelectionChange`, `OnNodePositionChange`, `OnViewportChange` |
| GraphCanvas | `CustomizeNode`, `CustomizeEdge` | `CreateNode`, `CreateEdge`, with owner first |
| GraphCanvas | `CreateNodeContent(node)` | `CreateNodeContent(input, node)` |
| GraphCanvas | `Width`, `Height`, `NodeWidth`, `NodeHeight`, `GridSpacing`, `MinimumGridScreenSpacing`, `EdgeWidth` as `float64` | Same fields as `float64?` |
| GraphNodeCard | `OnActivate` | `OnClick` |
| GraphNodeCard | `Width float64`, `Height float64` | `Width float64?`, `Height float64?` |
| GraphCanvas | Public `GraphPointerMode` | Internal implementation type |
| AsyncImage | `Width float64`, `Height float64` | `Width Length?`, `Height Length?` |
| AsyncImage | `FontSize float64`, `FontWeight int32` | `FontSize float64?`, `FontWeight int32?` |
| Avatar | `Size`, `BorderWidth`, `FontSize` as `float64`, `FontWeight int32` | Same fields as `float64?` and `int32?` |
| AvatarGroup | `OnActivate`, `Size float64` | `OnClick`, `Size float64?` |
| MediaCard | `Width float64` | `Width Length?` |
| MediaCard | `ThumbnailHeight`, `ContentHeight`, `TitleFontSize`, `SupportingFontSize` as `float64` | Same fields as `float64?` |
| MediaTransport | `OnSeekChanged`, `OnSeekCommitted` | `OnPositionChange`, `OnPositionCommit` |
| MediaTransport | `OnVolumeChanged`, `OnVolumeCommitted` | `OnVolumeChange`, `OnVolumeCommit` |
| MediaTransport | `ActionSize float64`, `PrimaryActionSize float64` | `ActionSize float64?`, `PrimaryActionSize float64?` |
| CommandPalette | `OnActivate`, `OnDismiss()` | `OnClick`, `OnOpenChange(false)` |
| CommandPalette | `Width float64?`, `Height float64?` | `Width Length?`, `Height Length?` |
| CommandPalette | `CreateItem(item, match, button)` | `CreateItem(input, item, match, button)` |
| Menu | `OnActivate`, `OnDismiss()` | `OnClick`, `OnOpenChange(false)` |
| MenuItem, MenuButton | `OnActivate` | `OnClick` |
| Menu | `Width float64`, `MaxHeight float64` | `Width Length?`, `MaxHeight Length?` |
| MenuButton | `CreateMenu(menu)` | `CreateMenu(input, menu)` |
| NavigationRail | `CollapsedGroups` | `ExpandedGroupIds`. Use the complement. Nil expands all groups |
| NavigationRail | `OnGroupToggle(id)` | `OnGroupExpandedChange(id, expanded)` |
| NavigationRail | `CollapsedWidth`, `ExpandedWidth`, `ItemHeight`, `FontSize` as `float64`, `FontWeight int32` | Same fields as `float64?` and `int32?` |


## 0.18.6 - 2026-11-03

- Keep measured `DataGrid.AutoWidthContent` widths across row source changes. Apply new measurements only when the width changes, including smaller widths.

## 0.18.5 - 2026-11-03

- Hold a pinned `VirtualRows` end through viewport and row size changes.
- Keep retained row content in place when a header moves during a prepend.
- Support measured item alignment and visible-anchor restore through Goo's `ElementHandle`.
- Add consumer-owned `VirtualRowsState<T>` to keep measured heights and scroll position across source changes.
- Reveal a changed external `TreeView.SelectedId` after expansion, without taking focus or scrolling again for selection callbacks.
- Require Goo 0.27.5.

## 0.18.4 - 2026-11-03

- Keep the visible `VirtualRows` row in place when new keys are prepended at scroll offset zero. Reorders at the top still stay at the top.

## 0.18.3 - 2026-11-02

- Keep the pressed TreeView checkbox in view when pointer input gives the tree focus.

## 0.18.2 - 2026-11-02

- Add an optional `version` to `VirtualRows` and `VirtualLists.Rows`. An unchanged list reference and version skip the source scan. Change the version after in-place edits. Omitting it keeps edit detection. (#158)
- Reduce allocation per owner rebuild with 100,000 rows from 88.9 MB to 92 KB when a version is supplied.

## 0.18.1 - 2026-11-01

- Keep caption controls at the requested height. (#156)
- Run package checks and all 28 native capture suites in parallel CI jobs. Cache NuGet packages, the Gsharp compiler and native dependencies.
- Wait for native fixture windows to close, virtual rows to mount and tooltip visibility to change before the next check.
- Keep clipboard fixtures floating in the private Sway session so requested window sizes are honored.

## 0.18.0 - 2026-10-31

- Breaking: `Theme.ControlRadius`, `PanelRadius` and `RadiusSm` to `RadiusXl` are now `float64?`. Null uses the `Theme.Default` value. An explicit 0 is kept, so a theme can request square corners. Code that reads these fields from a resolved theme uses `!!`. (#153)

## 0.17.0 - 2026-10-30

- Theme.FocusRingWidth and FocusRingOffset control widget focus outlines. Focus outlines use Theme.FocusColor unless the widget sets a focus color.
- Material icon subsets include every icon used by widget controls.
- BREAKING: Remove `WidgetKeyBindings.Editing` from applications. Goo 0.24.2 provides text editing keys and Tab focus traversal.

## 0.16.3 - 2026-10-29

- TextField clear and reveal buttons are no longer Tab stops.
- VirtualRows at the top stays at the top when rows are reordered.

## 0.16.2 - 2026-10-29

- Build against Goo 0.23.3.

## 0.15.0 - 2026-10-26

- Theme.Native follows the operating system look, colours, accent and font
- Theme.Selection picks tint, indicator or filled selection
- Glass themes drop the flared tab
- Crisper glass themes with window edges, overlay blur and legible secondary text
- Accent fills pick black or white text by contrast

## 0.14.1 - 2026-10-26

- DataGrid row comparison no longer allocates during realize

## 0.14.0 - 2026-10-26

- Glass themes with WithGlass, InkGlass and BoneGlass presets and native window materials
- WindowChrome.ReplaceTitlebar puts the chrome in the title area and keeps native macOS window controls
- Requires Goo 0.19.0

## 0.13.0 - 2026-10-25

- Placeholders use the new `Theme.PlaceholderColor` and meet 4.5:1 contrast in Ink, Bone and high contrast, while staying distinct from typed text. Requires Goo 0.18.0.

## 0.12.0 - 2026-10-25

- Add `Popover.AnchorRect` and `TakeFocus`, and the `TriggerMenu` mention picker.
- Add `HoverCard` for interactive hover, focus and press cards.
- BREAKING: Widgets mirror under `Theme.Direction` RightToLeft. `Drawer.FromRight` is now `Drawer.FromEnd` and `TabPlacement.Left/Right` are now `Start/End`. Add `TextField.ContentDirection` for LTR content such as email and URLs.
- Add `Theme.Culture` and `Theme.Translate` to localize number and date formatting and default labels. Slider value text follows the culture instead of InvariantCulture.

## 0.11.0 - 2026-10-25

- Spinner and Toast exit animate through Goo 0.17.0 paint slots and no longer rebuild every frame. Requires Goo 0.17.0.

## 0.10.1 - 2026-10-25

- Command palette match highlights meet 4.5:1 text contrast in Ink, Bone and high-contrast themes.
- Fixed the FindBar match count sitting above the arrows when the bar first lays out narrow, such as inside a SplitPane.

## 0.10.0 - 2026-10-24

- Add field adornments, numeric input and shared form frames.
- Add selectable sectioned lists, interactive list rows, and tree selection and editing hooks.
- Add typography, keyboard hints, breadcrumb paths, and DataGrid table actions.
- Refine Ink and Bone colors, surfaces and typography. Default follows refined Bone. Add RaisedColor and OverlayColor tokens.
- Add toast stacks, loading spinners, status badges and avatar presence groups.
- Keep TextField addon fills inside the rounded field border and align leading and trailing slots.
- Resolve zero public widget struct fields to their documented defaults when consumers build them in another assembly.
- Use a spinner and visible dimmed label for ActionButton loading.
- Resolve zero theme colors from consumer-built themes to their defaults at Theme.Attach and ThemeScope.
- Add FindBar and CodeBlock, and TextArea submit, counter and auto-growth.
- Redesign the gallery with search, sidebar navigation, theme controls and framed examples.
- Add attachment chips, removable invalid chips, token input, and multiple creatable combo boxes.
- Polish DataGrid: thin column edges, toolbar filter above the header, structured detail rows, footer outside the scroll area, column alignment, and nearest-edge reveal for unrealized rows.
- Add menu triggers and a command palette, plus editor tabs and grouped activity navigation.
- Add dialog presets, card surfaces, status bars, property grids and responsive settings layouts.
- Reduce allocations while filtering command palettes and combo boxes.
- Retain token and find controls and make toast reconciliation linear.
- CodeBlock caches highlighting, adds `StyleSpans` and `MaxHeight`, and stops laying out the full text on every rebuild.
- Fix Spinner, StatusIndicator, Toast exit and Banner close passing seconds to millisecond motion durations.

## 0.9.0 - 2026-10-24

- BREAKING: Require Goo 0.16.0 or later. Gestures now come from core Goo, so remove any Goo.Gestures reference.
- DataGrid header focus no longer scrolls the active body row into view.
- BREAKING: Banner uses Tone instead of Loud and Alert. Add semantic messages (Alert, InlineMessage), shared theme tokens and palettes, high-contrast and text-scale preferences, and shared roving keyboard focus.
- Add shared type-ahead navigation (TreeView, Menu) and fuzzy match helpers.
- Add ActionButton slots and states, RadioGroup and choice cards, and ToggleGroup.

## 0.8.0 - 2026-10-24

- Consume the first Escape when dismissing a visible tooltip, through Goo 0.13.0 Window.PreviewKeyPressed. Dialogs no longer close on the same Escape.
- VirtualRows gains followEnd to keep the last row in view when new rows arrive, replacing core pinned-scroll state.
- Requires Goo 0.13.0 or later.

## 0.7.1 - 2026-10-23

- Dismiss a hovered tooltip on Escape and keep it hidden until the pointer re-enters (WCAG 1.4.13).

## 0.7.0 - 2026-10-23

- Add touch text selection handles and an editing toolbar.
- Add a GPU magnifier for touch text selection.
- Use shared gestures for GraphCanvas touch navigation.
- Follow the platform accent without replacing application-set accents.

## 0.6.1 - 2026-10-23

- Keep custom popover panel MinWidth and MaxWidth, fixing a 0.6.0 regression that shrank custom ComboBox popups, and add ComboBox MatchTriggerWidth.

## 0.6.0 - 2026-10-23

- ComboBox shows its active option ring only after keyboard input.
- Add TextField Controlled to show the host value while the field is focused.
- TextField Width and EntryHeight accept Length values, including Percent and Auto (breaking: an explicit zero width is now zero, not the 280 default).
- Add an optional ModalDialog Footer slot that replaces the default action row.
- Popover Width accepts Length, including Auto content sizing within new MinWidth and MaxWidth bounds (breaking: a Width of zero or less now throws instead of meaning 280).

## 0.5.0 - 2026-10-23

- Add a named CLR factory for measured virtual rows.

## 0.4.3 - 2026-10-22

- Add an optional DataGrid EstimatedRowHeight for unseen virtual rows without changing the RowHeight minimum.

## 0.4.2 - 2026-10-22

- Keep DataGrid scrollbars inside the visible viewport and synchronize header scrolling in the same frame, including empty states.
- Require Goo 0.7.51.

## 0.4.1 - 2026-10-21

- Automatic themes preserve application-set window backgrounds.

## 0.4.0 - 2026-10-20

- Add lazy indexed DataGrid sources, measured and provider row heights, natural column widths and full-width group rows, and correct grid selection, nested focus, vertical reveal and TreeView row composition.
- Add opt-in DataGrid VirtualizeColumns for horizontal cell culling and CreateCellContent to replace default cell text without building it.

### Behavior changes

- Arrow, Home, End and Page keys select rows.
- Star widths are weighted with CSS flexbox clamping.
- Shift extends from the anchor selection.
- Clicking interactive cell content does not select the row.
- TreeView CreateRow keeps custom children and adds the standard slots before the factory.
- New data struct fields change the generated Deconstruct.

## 0.3.2 - 2026-10-18

- Reduce widget rebuild allocations by removing redundant checkbox-root style declarations and reusing retained DataGrid and Tooltip input callbacks.

## 0.3.1 - 2026-10-18

- Add nullable DataGridInput.SelectionColumnWidth and Checkbox.HitSize overrides while preserving theme-derived defaults.

## 0.3.0 - 2026-10-18

- BREAKING: Replace independent widget defaults and focus opt-ins with ambient window/scoped themes, density-aware metrics, default focus rings and themed scrollbars on Goo 0.7.37.
- Keep focused SearchList entry text in sync with the host query.
- Restore committed VirtualRows metadata when streaming realization or mounting fails.
- Apply host values on every Slider, ColorPicker and GraphCanvas rebuild, including rejected edits.
- Reject virtual item extents that underflow to zero in float32.
- Preserve bold, italic, inline-code and strikethrough formatting inside a single Markdown link caption.
- Graph node cards now select their node on Enter, Space and accessibility activation.
- NavigationRail now uses mounted focus ownership, one enabled tab stop and Up/Down/Home/End navigation without changing host-owned selection.
- Stop Slider and ColorPicker from committing cancelled pointer drags.
- Expose TextField invalid state and mounted label, description and error relationships, including custom entries.
- ColorWheelSource now caches resolution-dependent hue and radius instead of recomputing polar geometry on every tone frame.
- Remove growing list membership searches from DataGrid range selection while preserving order and disabled-row filtering.
- Correct the usage guide's package and SDK versions.

## 0.2.19 - 2026-10-16

- Close popovers on outside pointer clicks without restoring trigger focus. Escape still restores focus.
- Require Goo and Goo.Svg 0.7.35.

## 0.2.18 - 2026-10-15

- Keep prior virtual row heights as estimates while viewport width changes, and retain the end position while rows are measured.
- Add `DataGridInput.ExpandColumnWidth`, `DetailPadding` and `DetailBackground`.
- Preserve row click handlers supplied by `DataGridInput.CreateRow`.
- Limit DataGrid's active-row outline to keyboard navigation and the row's cells.
- Add `DataGridInput.FocusColor` for the inset focus outline.
- Center ComboBox's default 16-pixel expansion icon and expose `ComboBoxInput.CreateArrow`.
- Bind Undo to Ctrl/Cmd+Z and Redo to Ctrl/Cmd+Shift+Z and Ctrl+Y in the shared editing policy.
- Require released Goo and Goo.Svg 0.7.34 for single-line entry undo and redo.

## 0.2.17 - 2026-10-13

- Activate stateless buttons, checkboxes and switches on Space release after a rebuild.

## 0.2.16 - 2026-10-13

- Let `ComboBoxInput.Placement` prefer upward opening, with downward fallback.
- Limit anchored popups to the larger available side when neither side fits.

## 0.2.15 - 2026-10-10

- Require Goo and Goo.Svg 0.7.23.
- Add `VirtualItems` and `VirtualRows` to `Goo.Widgets.Data`. They replace the
  `Virtual` and `VirtualRows` functions that Goo removed, and return a Goo
  `Virtual` element.
- `VirtualRows` applies a change that only removes rows from the start and adds
  rows at the end in place. Set `PinToBottom` on the result to keep the end in view.
- `ComboBox` exposes each option as one list item, and its list reports the
  option count.

## 0.2.13 - 2026-10-01

- Let executable projects select Material Symbols with `GooMaterialIcon` items.
  The package includes icons used by widget defaults, checks selected names at
  build time, and omits the full icon catalog from NativeAOT subset builds.

## 0.2.11 - 2026-09-29

- Focus the ColorPicker wheel when its primary pointer press captures input, so
  keyboard actions reach the wheel after a mouse selection.

## 0.2.10 - 2026-09-29

- Add opt-in DataGrid column fitting to the measured viewport, with atomic
  width changes for pointer, keyboard, and accessibility resizing.
- Add repeatable vertical, page, and document navigation to application-root
  text editing bindings.

## 0.2.9 - 2026-09-29

- Reuse DataGrid row indices and detail metadata while the host retains the same
  immutable Rows array. This avoids rebuilding a full row dictionary and ID set
  on selection changes in large grids.

## 0.2.8 - 2026-09-29

- Require Goo and Goo.Svg 0.7.1.
- Add passive anchored tooltips, including hover help for disabled controls.
- Expose DataGrid host input, focus, scroll, resize-handle, header, and empty-state
  hooks for file browser integrations.

## 0.2.7 - 2026-09-28

- Require Goo and Goo.Svg 0.6.7.
- Add Calendar month and day text style hooks, Menu submenu arrow styling, and
  TreeView vertical scrollbar styling in virtual and nonvirtual modes.
- Let tall Calendar days increase the month header height without clipping.

## 0.2.6 - 2026-09-27

- Require Goo and Goo.Svg 0.6.6 in both packages.
- Use Goo's `Percent` and grouped `Edges` layout APIs throughout widgets,
  Markdown, examples, and packaged consumer checks.
- Add handle-based Enter activation and held Space press/release bindings to interactive widget buttons.
- Add a shared editing policy for application-owned text editing, focus
  traversal, clipboard, cancellation, and key-repeat policy.
- Add `ModalDialog.KeyBindings` for application policy inside modal focus scopes
  and preserve multiline Enter behavior in the shared editing policy.
- Move Slider and SplitPane keyboard adjustment to explicit repeatable bindings.

## 0.2.5 - 2026-09-19

- Present Popover, Menu, managed ModalDialog, ComboBox, DatePicker, and
  WindowChrome menus through Goo's per-Window Portal overlay. Source clipping,
  transforms, and layout no longer constrain managed overlays.
- Make ComboBox, DatePicker, and WindowChrome `OverlayHost` optional collision
  viewports instead of presentation hosts.
- Hold a newly opened Popover hidden until its viewport and wrapped panel have
  been measured, preventing a provisional-position first frame.
- Require Goo and Goo.Svg 0.6.3.

## 0.2.4 - 2026-09-18

- Rename the breaking `ActionButton.Label` property to `ActionButton.Content`
  so button text follows Goo's content naming convention. The content also
  supplies the default accessible name.

## 0.2.3 - 2026-09-15

- Add `Ink` and `Bone` palettes through `import Goo.Widgets.Theme`, with rounded
  widget presets and a sample that preserves input state when switching palettes.
  Use 16 px medium text and semibold buttons, with bundled Vend Sans weights in
  the sample.
- Add text field label casing and weight options, and slider thumb radius and
  border width and label size options for theme composition.

## 0.2.2 - 2026-09-15

- Update the optional Markdown package to Markdig 1.3.2.

## 0.2.1 - 2026-09-15

- Require Goo and Goo.Svg 0.5.4, which supply the updated upstream G# compiler
  automatically. Remove the temporary local compiler/feed setup.
- Use dot-free native G# mixed initializers, direct child composition, spreads, and
  upstream formatting throughout widgets and examples. Follow Goo's refactored
  ownership boundaries for input, overlays, platform services, and rendering.
- Add Calendar and DatePicker with localized input, keyboard navigation,
  constrained dates, and host-controlled selection.
- Add searchable ComboBox with optional controlled query/open state, virtual
  options, keyboard navigation, and anchored placement.
- Add managed dialog, popover, and menu focus, dismissal, restoration, and
  nested modal isolation. Keep native window ownership in Goo.
- Add optional Goo.Widgets.Markdown with selectable blocks, tables, alerts,
  heading handles, and host-owned link/image handling; keep the base package
  free of parser dependencies.
- Add controlled Disclosure with retained collapsed content, refresh SearchList
  from replacement inputs, and route WindowChrome actions through host policy.
- Restore searchable ComboBox height after clearing queries; round Disclosure
  focus outlines to their clipped headers; repair controlled SplitPane gallery callbacks.
- Bubble decorative title double-clicks through WindowChrome while excluding
  embedded controls, and reserve space for MediaTransport volume slider endpoints.
- Keep DataGrid checkboxes under the pointer when focus enters a scrolled grid
  and when toggling consecutive rows through the last row.
- Add opt-in TreeView row expansion and preferred Menu root/submenu directions,
  with native regressions using the actual gallery pages.

- Add controlled DataGrid columns, captured resizing, sorting, row selection,
  filter/cell factories, and measured virtual detail rows with native gallery proof.

- Add controlled TreeView expansion, single row selection and host-owned tri-state
  checks, with active-descendant keyboard/accessibility focus and optional virtualization.

- Add measured Grid tracks and spans, DonutChart and StackedBar quantitative charts,
  and a mounted TimeAxis with collision lanes, overflow, and initial viewport placement.
  Include package contracts, native input/resize checks, and gallery captures.

- Add controlled SplitPane, TabBar, and mounted TextArea widgets, with native
  interaction checks and gallery examples.

- Add `ColorPickerInput.Compact` for the wheel and tone slider without the mode
  selector or preview. The default now includes the full composition. Omit `Mode`
  for picker-local switching, or keep `Mode` host-owned and adopt button changes
  through `OnModeChanged`.
- Add labeled checkbox rows through `Checkbox.Label` and its label style props.
  An unspecified state now resolves to unchecked.
- Add optional `SliderInput.Label` and `ShowValue` for visible labels and
  formatted values. `FormatValue` now also formats the visible value, in addition
  to its existing accessibility use.
- Replace separate scalar card-center properties with optional `Center`, which
  defaults to `Node.Position` and accepts an explicit screen-space override.

## 0.1.1 - 2026-09-09

- Embed portable debug symbols in the library so package debugging does not depend on a rejected external symbol checksum.
- Validate embedded symbols before publishing.

## 0.1.0 - 2026-09-09

- Initial release of 31 composable G# widgets for Goo desktop applications.
- Includes 4,128 Material Symbols Outlined SVG icons without an icon font dependency.
- Supports custom appearance, callbacks, and primitive factories.
- Includes a gallery and native screenshots for every widget.
- Includes a minimal color picker application with live preview and commit callbacks.
- Requires Goo and Goo.Svg 0.5.2, including the rounded edge rendering fixes.
