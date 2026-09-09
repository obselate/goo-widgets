package Goo.Widgets.Consumer

import System
import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Data
import Goo.Widgets.Feedback
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import Goo.Widgets.Media

internal class SliderProbe : Slider {
  internal func Render(input SliderInput) Blob -> base.Build(input)
}

func Require(condition bool, message string) {
  if !condition { throw InvalidOperationException(message) }
}

func PackageComposition() {
  var activations int32 = 0
  var radius float64 = -1.0
  let original = ActionButton{Label: "Original", OnClick: () -> { activations++ }}
  let derived = original with{
    Label = "Save",
    BorderRadius = 0.0,
    TransitionMs = 0.0,
    CreateText = (resolved ActionButton) -> {
      radius = resolved.BorderRadius ?? -1.0
      return Text{Content: resolved.Label ?? "", FontWeight: 700}
    },
  }
  let first = (derived.Build() as Button)!!
  let second = (derived.Build() as Button)!!
  Require(original.Label == "Original", "Copy-update mutated the original widget.")
  Require(first != second, "Build reused a mutable root.")
  Require(first.Children[0] != second.Children[0], "Build reused a mutable default child.")
  Require(radius == 0.0 && first.TransitionMs == 0.0, "Explicit zero customization was lost.")
  Require(first.Accessibility?.Name == "Save", "Semantic button name was lost across the package boundary.")
  first.OnClick?.Invoke()
  Require(activations == 1, "Packaged button lost its callback.")

  var enabled bool = false
  let toggle = ToggleSwitch{AccessibilityName: "Updates", Checked: enabled, OnClick: () -> { enabled = !enabled }}
  let before = (toggle.Build() as Button)!!
  before.OnClick?.Invoke()
  let after = ((toggle with{Checked = enabled}).Build() as Button)!!
  Require(enabled && after.Accessibility?.Checked == AccessibilityChecked.True, "Controlled toggle did not reflect host state.")

  var edited string = ""
  let field = (TextField{
    Label: "Name", Value: "before", OnChange: (value string) -> { edited = value },
    CreateEntry: (resolved TextField) -> TextEntry{Value: resolved.Value ?? "", OnChange: resolved.OnChange},
  }.Build() as Container)!!
  let entry = (field.Children[1] as TextEntry)!!
  entry.OnChange?.Invoke("after")
  Require(edited == "after", "Custom text entry lost the controlled edit callback.")

  let widgets = []Blob{
    Badge{}.Build(), ProgressBar{}.Build(), Avatar{}.Build(), ActionButton{}.Build(),
    ToggleSwitch{}.Build(), Banner{}.Build(), AsyncImage{}.Build(), TextField{}.Build(),
    ListRow{}.Build(), SectionHeader{}.Build(), Drawer{}.Build(),
    DismissibleContextBar{}.Build(), Chip{}.Build(), AppBar{}.Build(),
    Stepper{}.Build(), UploadTile{}.Build(), EmptyState{}.Build(), SearchList{}.Build(),
  }
  Require(widgets.Length == 18, "A category was omitted from the package composition scenario.")
}

func NumericAndIdentityRegressions() {
  var observed float64 = -1.0
  ProgressBar{
    Value: Double.NaN,
    CreateFill: (resolved ProgressBar) -> { observed = resolved.Value
      return Container{} },
  }.Build()
  Require(observed == 0.0, "NaN escaped ProgressBar normalization.")

  var rejected bool = false
  try {
    SearchList{Items: []SelectionItem{
      SelectionItem{Id: "duplicate", Label: "First"},
      SelectionItem{Id: "duplicate", Label: "Second"},
    }}.Build()
  } catch (error ArgumentException) { rejected = true }
  Require(rejected, "Duplicate virtual-list identifiers reached Goo reconciliation.")

  let empty = (SearchList{
    Items: []SelectionItem{SelectionItem{Id: "one", Label: "First", Detail: "Document"}},
    Query: "missing", EmptyText: "Nothing found",
  }.Build() as Container)!!
  Require(empty.Children.Count == 2 && (empty.Children[1] as Text)!!.Content == "Nothing found",
    "No-match search did not replace its virtual viewport with the empty state.")
}

func Main() {
  PackageComposition()
  NumericAndIdentityRegressions()
  SliderInteractions()
  if Environment.GetEnvironmentVariable("GOO_WIDGETS_WINDOW") == "1" { WindowInteractions() }
  Console.WriteLine("PASS: packaged G# composition, copy-update, callbacks, numeric and virtual identity regressions.")
}

func SliderInteractions() {
  let slider = SliderProbe{}
  var changed float64 = -1.0
  var committed float64 = -1.0
  let input = SliderInput{
    Value: 0.0, Step: 0.3,
    OnValueChanged: (value float64) -> { changed = value },
    OnValueCommitted: (value float64) -> { committed = value },
  }
  let root = slider.Render(input)
  root.OnKeyDown?.Invoke(KeyEvent{Key: Key.End})
  Require(changed == 1.0 && committed == 1.0, "End did not reach a range endpoint between steps.")
  root.OnKeyDown?.Invoke(KeyEvent{Key: Key.Home})
  Require(changed == 0.0 && committed == 0.0, "Home did not return to the exact minimum.")
  let invalidAccepted = root.Accessibility!!.OnAction!! (AccessibilityActionRequest.SetValue("NaN"))
  Require(!invalidAccepted && committed == 0.0, "Accessible NaN changed a slider value.")
  let accepted = root.Accessibility!!.OnAction!! (AccessibilityActionRequest.SetValue("0.6"))
  Require(accepted && Math.Abs(committed - 0.6) < 0.000001, "Accessible value change was not committed.")

  let disabled = slider.Render(input with{Disabled = true})
  disabled.OnKeyDown?.Invoke(KeyEvent{Key: Key.End})
  Require(Math.Abs(committed - 0.6) < 0.000001, "A disabled slider handled a key.")
}
