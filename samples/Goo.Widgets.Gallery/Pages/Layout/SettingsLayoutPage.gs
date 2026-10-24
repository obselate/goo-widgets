package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs
import Goo.Widgets.Layout

internal class SettingsLayoutExample : Cell {
    private var query string = ""
    private var selected string = "general"
    private var name string = "Studio"
    private var notifications bool = true

    public override func Build() Blob -> Cell.Mount[SettingsLayoutInput, SettingsLayout](
        "settings",
        SettingsLayoutInput{
            SelectedId: selected,
            OnSelect: id -> {
                selected = id
            },
            Query: query,
            OnQueryChange: value -> {
                query = value
            },
            Sections: []SettingsSection{
                SettingsSection{
                    Id: "general",
                    Title: "General",
                    Description: "Your workspace preferences",
                    Rows: []SettingsRow{
                        SettingsRow{
                            Id: "name",
                            Label: "Workspace name",
                            Description: "Shown in the title bar",
                            Keywords: []string{"project", "title"},
                            Control: TextField{
                                Value: name,
                                Controlled: true,
                                OnChange: value -> {
                                    name = value
                                }
                            }.Build()
                        },
                        SettingsRow{
                            Id: "notifications",
                            Label: "Notifications",
                            Keywords: []string{"alerts", "sound"},
                            Control: Checkbox{
                                Label: "Show desktop alerts",
                                State: notifications ? AccessibilityChecked.True: AccessibilityChecked.False,
                                OnChange: state -> {
                                    notifications = state == AccessibilityChecked.True
                                }
                            }.Build()
                        }
                    }
                },
                SettingsSection{
                    Id: "privacy",
                    Title: "Privacy",
                    Description: "Data and diagnostics",
                    Rows: []SettingsRow{
                        SettingsRow{
                            Id: "diagnostics",
                            Label: "Diagnostics",
                            Keywords: []string{"telemetry"},
                            Control: Checkbox{Label: "Send usage data", Disabled: true}.Build()
                        }
                    }
                }
            }
        }
    )
}

internal class SettingsLayoutPage : GalleryPage {
    override func Title() string -> "Settings layout"

    override func Build() Blob -> Cell.Mount[SettingsLayoutExample]("settings-layout-example")
}
