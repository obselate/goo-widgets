# Changelog

## Unreleased

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
- Bind Undo to Ctrl/Cmd+Z and Redo to Ctrl/Cmd+Shift+Z and Ctrl+Y in `WidgetKeyBindings.Editing`.
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
- Add `WidgetKeyBindings.Editing` for application-owned text editing, focus
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
