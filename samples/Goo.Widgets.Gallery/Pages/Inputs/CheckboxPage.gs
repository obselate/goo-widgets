package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal open class CheckboxExample : Cell {
    private var state AccessibilityChecked = AccessibilityChecked.Mixed

    /// Builds the interactive checkbox example.
    public override func Build() Blob -> Container{
        Gap: 12.0,
        FlexDirection: FlexDirection.Row,
        AlignItems: AlignItems.Center,
        Checkbox{
            Label: "Include inherited settings",
            State: state,
            AllowMixed: true,
            OnChange: (next AccessibilityChecked) -> {
                state = next
            },
        }.Build(),
        Checkbox{Label: "Unavailable option", State: AccessibilityChecked.False, Disabled: true,}.Build(),
    }
}

internal class CheckboxPage : GalleryPage {
    override func Title() string -> "Checkbox"

    override func Build() Blob -> Cell.Mount[CheckboxExample]("checkbox-example")
}
