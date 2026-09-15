# Changelog

## Unreleased

- Add controlled DataGrid columns, captured resizing, sorting, row selection,
  filter/cell factories, and measured virtual detail rows with native gallery proof.

- Add controlled TreeView expansion, single row selection and host-owned tri-state
  checks, with active-descendant keyboard/accessibility focus and optional virtualization.

- Add measured Grid tracks and spans, DonutChart and StackedBar quantitative charts,
  and a mounted TimeAxis with collision lanes, overflow, and initial viewport placement.
  Include package contracts, native input/resize checks, and gallery captures.

- Add controlled SplitPane, TabBar, and mounted TextArea widgets, with native
  interaction checks and gallery examples. The review build uses Goo 0.5.4-preview.1
  for the new composite-widget focus and layout APIs.

These changes are in the current checkout only. Published `0.1.1` is unchanged.

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
