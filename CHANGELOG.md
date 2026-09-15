# Changelog

## Unreleased

- Add Ink/Bone palettes and widget presets using ordinary G# values, with a
  runnable sample that preserves input state when switching palettes. Use 16 px
  medium text and semibold buttons, with bundled Vend Sans weights in the sample.
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
