package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class FormFieldPage : GalleryPage {
    override func Title() string -> "Form field"

    override func Build() Blob -> FormSection{
        Legend: "Profile",
        Description: "One shared frame for different controls.",
        Width: 360,
        Children: []Blob{
            FormField{
                Label: "Display name",
                Required: true,
                Description: "Visible to your team.",
                Content: TextEntry{Height: 36, Value: "Alex", Padding: 8}
            }.Build(),
            FormField{
                Label: "Email",
                Issue: "Enter a valid email address.",
                Content: TextEntry{Height: 36, Value: "alex@", Padding: 8}
            }.Build(),
            FormField{
                Label: "Notifications",
                Description: "Receive updates by email.",
                Content: Checkbox{Label: "Email updates", State: AccessibilityChecked.True}.Build()
            }.Build(),
        },
    }.Build()
}
