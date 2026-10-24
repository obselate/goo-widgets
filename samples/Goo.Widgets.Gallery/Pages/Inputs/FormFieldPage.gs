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
                CreateContent: relations -> TextField{
                    Value: "Alex",
                    AccessibilityName: "Display name",
                    Width: Percent(100),
                    CreateRoot: (input, label, entry, issue) -> {
                        entry.Accessibility!!.Relationships = relations
                        entry.Accessibility!!.Required = true
                        return Container{Width: Percent(100), entry}
                    },
                }.Build(),
            }.Build(),
            FormField{
                Label: "Email",
                Issue: "Enter a valid email address.",
                CreateContent: relations -> TextField{
                    Value: "alex@",
                    AccessibilityName: "Email",
                    Invalid: true,
                    Width: Percent(100),
                    CreateRoot: (input, label, entry, issue) -> {
                        entry.Accessibility!!.Relationships = relations
                        return Container{Width: Percent(100), entry}
                    },
                }.Build(),
            }.Build(),
            FormField{
                Label: "Notifications",
                Description: "Receive updates by email.",
                Content: Checkbox{Label: "Email updates", State: AccessibilityChecked.True}.Build()
            }.Build(),
        },
    }.Build()
}
