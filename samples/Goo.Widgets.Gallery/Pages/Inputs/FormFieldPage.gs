package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class FormFieldPage : GalleryPage {
    private let displayName ElementHandle = ElementHandle()
    private let email ElementHandle = ElementHandle()

    override func Title() string -> "Form field"

    override func Build() Blob -> FormSection{
        Legend: "Profile",
        Width: 360,
        Children: []Blob{
            FormField{
                Label: "Display name",
                Required: true,
                Description: "Visible to your team.",
                LabelFor: displayName,
                Content: TextField{
                    Handle: displayName,
                    Value: "Alex",
                    AccessibilityName: "Display name",
                    Width: Percent(100),
                }.Build(),
            },
            FormField{
                Label: "Email",
                Error: "Enter a valid email address.",
                LabelFor: email,
                Content: TextField{
                    Handle: email,
                    Value: "alex@",
                    AccessibilityName: "Email",
                    Invalid: true,
                    Width: Percent(100),
                }.Build(),
            },
            FormField{
                Label: "Notifications",
                Description: "Receive updates by email.",
                Content: Checkbox{Label: "Email updates", Value: AccessibilityChecked.True}
            },
        },
    }
}
