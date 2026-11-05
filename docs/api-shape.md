# Public API shape

```sh
dotnet build src/Goo.Widgets/Goo.Widgets.gsproj -c Release
dotnet build tools/Goo.Widgets.Checks -c Release
dotnet run --project tools/Goo.Widgets.Checks -c Release --no-build -- api-shape --check
```

These rules apply to public API in `src/Goo.Widgets`. The optional Markdown package is outside this check. `scripts/verify.sh build` runs the check after the solution build.

The check reads the compiled Release assembly and generated XML documentation. It reports XML doc IDs in ordinal order, then numeric rule order. It exits zero only when all enforced rules and exact exceptions pass. It does not launch Goo or load the widget assembly into the runtime.

## Rules

Rules marked **review** require source review or behavior verification. The check enforces declaration shape and summary presence, not behavior, documentation quality or rendering cost.

| ID | Rule | One example |
| --- | --- | --- |
| S1 | A stateless widget is a public data struct with public `Build()` returning `Blob` or a Blob subtype. A mounted widget is a public open `Cell[WidgetInput]` class with a public data struct input. Shared or inherited inputs need an exact exception. | `Cell[SliderInput]` |
| S2, review | Use a Cell for retained state, resource lifetime, subscriptions or a rebuild boundary. Keep app state and I/O outside the widget. Keep `Build` cheap. | Slider retains its drag state in its Cell. |
| S3 | Generic visual factories need exact exceptions. Keep VirtualRows, VirtualItems and the VirtualLists.Rows CLR bridge. | `VirtualRows[T]` |
| S4 | Primary editable state uses `Value` and nullable `OnChange Action[T]`. Emit the new value. Do not use State, Checked, Tokens or Changed aliases for this pair. | `var OnChange Action[float64]?` |
| S5 | An optional primary final-value notification is `OnCommit`, with the same emitted type as OnChange. | `var OnCommit Action[float64]?` |
| S6 | Auxiliary state uses `On<Concept>Change` and optional `On<Concept>Commit`, not Changed or Committed. Keep domain commands distinct. | `var OnVolumeChange Action[float64]?` |
| S7, review | Controlled inputs are authoritative. Send change requests without mutating caller collections or treating input refreshes as user edits. | The host updates `Value` after an `OnChange` request. |
| S8, review | Document uncontrolled mode selection, initial value, owner, reset and mode changes. Do not infer it from a missing callback or add it by default. | `TextField{Controlled: true}` selects controlled synchronization. |
| S9 | Primary activation is OnClick: Action? for one target or Action[TIdentity]? for an item. Separate parts use `On<Part>Click`. Keep domain commands. ListRow.OnInvoke handles double-click or Enter, separate from OnClick for single-click or Space. | `var OnClick Action[string]?` |
| S10 | Single selection uses SelectedId string? and OnSelect Action[string]?. Sets use SelectedIds []?string or []string and OnSelectionChange Action[[]string]?. Set-only APIs remain set-based in single mode. Breadcrumb navigation has only OnSelect. | `var OnSelectionChange Action[[]string]?` |
| S11, review | IDs are stable and unique. Emit a new selection set. An empty set clears selection. Document ordering, disabled-item policy and independent active or focus state. Activation is not selection. | An item's ID stays the same after sorting. |
| S12 | Interactive open state uses Open bool or bool? and OnOpenChange Action[bool]?. Keep OnDismiss only for a reason or item identity. A presentation-only Drawer needs no state callback. | `var OnOpenChange Action[bool]?` |
| S13 | Expansion uses Expanded bool and a boolean change request, or an expanded ID set and identity-first boolean request. Named sets use `Expanded<Part>Ids` and `On<Part>ExpandedChange`. | `var OnExpandedChange Action[string, bool]?` |
| S14 | Query is string?. A query editor also exposes OnQueryChange Action[string]?. Input-only filters need no callback. Keep an empty query distinct from a selected ID. | `var OnQueryChange Action[string]?` |
| S15 | Shared field metadata is Label, Description and Error, all string?. FormField owns composition. TextField, TextArea and NumberInput expose direct wrappers. Use Error, not Issue or IssueText. | `var Error string?` |
| S16 | Input families expose Disabled bool and AccessibilityName string?. Text-entry families also expose ReadOnly bool. FormField alone owns Required by default. Preserve feature switches such as Enabled. | `var ReadOnly bool` |
| S17, review | Disabled rejects interaction and is skipped by Tab traversal. ReadOnly rejects edits but keeps focus, selection, copy and navigation. Preserve label, description, error and required relationships on the editor. Error implies invalid presentation. | ReadOnly text can still be selected and copied. |
| S18 | A descriptor Style override is nullable and named RootStyle or `<Part>Style`. Do not add a mandatory styling interface or require a slot on every wrapper. | `var RootStyle Style?` |
| S19 | A part factory is nullable Func named `Create<Part>`. Pass the owning descriptor first, context next and a prepared default part last. Construction factories may omit the default. Text formatters use Format names. Relationship factories need exact exceptions. | `var CreateRoot Func[ListViewInput, Container, Container]?` |
| S20 | Visual token overrides are nullable. Numeric subpart Width, Height, Size, Thickness and Spacing metrics use float64?. Theme definitions, domain values, counts, limits and behavior flags are not overrides. Nil selects a default. Explicit zero is not a default sentinel. | `var BorderWidth float64?` |
| S21 | Root Width, Height and min/max dimensions use Length?. Root square Size uses float64?. Fixed-coordinate graph dimensions need exact exceptions and remain nullable. | `var Width Length?` |
| S22 | Use MinWidth, MaxWidth, MinHeight and MaxHeight for root constraints. Name subparts. Omit Px on pixel metrics. Numeric durations use Ms. Keep domain units and Minimum/Maximum range names. | `var TransitionMs float64?` |
| S23 | Appearance uses Variant with a widget Variant enum or an approved shared semantic enum. Density uses shared Density with Standard, Compact, Comfortable and Touch. Preserve domain concepts such as Tone and Placement. | `var Density Density` |
| S24 | Optional notifications and requests are nullable Action or Func fields named `On<Operation>`. Use Action for void and Func for a result or consumed-event decision. Equivalent G# function-type syntax is valid. No async-returning event delegates. Predicates, parsers, providers, formatters, required builders, rendering configuration and CLR events have separate roles. | `var OnKeyDown Func[KeyEvent, bool]?` |
| S25 | Events have no sender or redundant owner argument. Send the new value, or identity first and then the new value. Other arguments must have distinct domain roles. KeyEvent, PointerEvent, GraphNodePositionChange and TextRange payloads are allowed. | `Action[string, bool]?` sends identity before expanded state. |
| S26, review | Gate edits and actions before mutation requests. Compute new state before callbacks. Keep preview and commit separate. Document dismissal and action order. Do not block or perform I/O in callbacks. Preserve required semantics after factories and styles. | `OnOpenChange?.Invoke(false)` requests closure. |
| S27 | Every explicit public type, member, constructor, free function and enum value has a nonempty leading XML summary. Merge partial types. Exclude inherited and compiler-generated members, and members of non-public types. See compiler limits below. | `/// Requests the new expanded state.` |
| S28, review | Document units, range, nil meaning, defaults, emitted arguments, timing and style precedence. Document every parameter and type parameter by name and describe return values. | `/// Border width in logical pixels. Nil uses the theme.` |
| S29, review | Document controller, resource and state ownership, disposal, mounted identity, stable IDs and uncontrolled resets. State what factories must preserve. | `/// Caller-owned controller. The widget does not dispose it.` |
| S30, review | Migrate callers, samples, tests and docs in one cutover. Remove old names and paths. Do not add compatibility callbacks, forwarding properties or deprecated aliases. | Keep OnChange without an OnValueChanged alias. |

## Value and field families

| Widget | Value type | OnChange and OnCommit payload |
| --- | --- | --- |
| Calendar | DateOnly? | DateOnly. Nil means no selected date. No clear request is emitted. |
| Checkbox | AccessibilityChecked | AccessibilityChecked, including Mixed. |
| ColorPicker | int32 | int32, packed 24-bit sRGB. |
| DatePicker | DateOnly? | DateOnly?. Nil is no date and can be emitted to clear it. |
| TimePicker | TimeOnly? | TimeOnly?. Nil is no time and can be emitted to clear it. |
| NumberInput, Slider, SplitPane | float64 | float64. SplitUnit selects ratio or pixels for SplitPane. |
| TextArea | string? | string. Nil preserves an external document or initializes the owned document to empty. |
| TextField | string? | string. Nil selects an empty initial string. Controlled selects synchronization while focused. |
| ToggleSwitch | bool | bool. |
| TokenInput | []?string | []string. Nil selects an empty token array. |

- Disabled and AccessibilityName are required on TextField, TextArea, DatePicker, TimePicker, NumberInput, TokenInput, Calendar, Checkbox, ColorPicker, ComboBox, RadioGroup, SearchList, Slider, ToggleGroup and ToggleSwitch.
- ReadOnly is required on TextField, TextArea, DatePicker, TimePicker, NumberInput and TokenInput. Keep it connected to native editing behavior.
- FormField, TextField, TextArea and NumberInput expose Label, Description and Error. Other controls compose FormField. Existing Label or Description convenience fields keep the same types. Keep Invalid where an invalid state without error text is useful. DatePicker.InvalidMessage is a parse-failure message, not field validation metadata.
- Apply S12 to ComboBox, DatePicker, MenuButton, Menu, CommandPalette, ModalDialog, Popover and Toast. Keep reason-bearing or item-bearing OnDismiss and the ModalDialog OnCancel and OnConfirm actions.
- PropertyGrid and NavigationRail named expanded ID sets use nil for all expanded. A non-nil array is the explicit expanded set. Presentation-only expanded indicators need no callback.
- MediaTransport uses Position and Volume with their named change and commit callbacks. ProgressBar.Value, ThemeScope.Value, chart values and model coordinates are not editable-value pairs.
- On widget descriptors, the S20 suffixes are Color, FontSize, FontWeight, FontFamily, Gap, Padding, PaddingHorizontal, PaddingVertical, BorderWidth, BorderRadius, Opacity, TransitionMs, TransitionEasing, Transform and BoxShadow. Apply Theme defaults, explicit tokens and the part Style in that order through BasedOn.

## Exact exceptions

`docs/api-shape-allowlist.json` contains version 1 and an entries array. Each entry has a rule, fully qualified source symbol, normalized signature and domain reason:

```json
{
  "rule": "S21",
  "symbol": "Goo.Widgets.Graphs.GraphCanvasInput.Width",
  "signature": "var Width float64?",
  "reason": "Graph transforms use a fixed logical-pixel viewport."
}
```

- Match the rule, symbol, generic arity and entire normalized signature exactly. Method signatures include parameter types to distinguish overloads. Findings use XML doc IDs. Allowlist symbols use source names without the doc-ID prefix.
- Keep entries sorted by numeric rule, symbol and signature. No wildcard, regular expression, prefix or absent-symbol exception is allowed.
- One entry suppresses one rule case only. A fixed-coordinate S21 exception does not waive S20 nullability or S27 documentation.
- The check fails on malformed, duplicate, stale or unused entries. An exception must be removed when its declaration conforms without it. Do not allowlist migration work.
- Add a reviewed role entry in the checker for a new widget. Support types still receive public summary checking.

## Compiler limits

- Constructor summaries still require review. The current compiler does not mark synthesized constructors, so the check cannot distinguish them from explicit constructors and prints a constructor-coverage notice. See [G# issue 5761](https://github.com/DavidObando/gsharp/issues/5761).
- G# drops XML summaries of partial types. Exact S27 type exceptions cover DataGrid, GraphCanvas and TouchTextEditing. Their members remain checked. Keep their source summaries. See [G# issue 5762](https://github.com/DavidObando/gsharp/issues/5762).
