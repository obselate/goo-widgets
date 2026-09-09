package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal open class CheckboxExample : Cell {
  private var state AccessibilityChecked = AccessibilityChecked.Mixed

  /// Builds the interactive checkbox example.
  public override func Build() Blob -> Container {
    Gap: 12.0,
    FlexDirection: FlexDirection.Row,
    AlignItems: AlignItems.Center,
    Children: {
      Checkbox{
        State: state,
        AllowMixed: true,
        AccessibilityName: "Include inherited settings",
        OnChange: (next AccessibilityChecked) -> { state = next },
      }.Build(),
      Text{Content: "Include inherited settings", Color: "#fafafa"},
      Checkbox{
        State: AccessibilityChecked.False,
        Disabled: true,
        AccessibilityName: "Unavailable option",
      }.Build(),
    },
  }
}

internal class CheckboxPage : GalleryPage {
  override func Title() string -> "Checkbox"
  override func Build() Blob -> Cell.Mount[CheckboxExample]("checkbox-example")
}
