package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Inputs

class TextFieldPage : GalleryPage {
    public override func Title() string -> "TextField"

    public override func Build() Blob {
        let baseField = TextField{EntryHeight: 44.0, Gap: 7.0, BorderRadius: 8.0,}

        let defaultField = baseField with{
            Label = "Email address",
            Value = "alex@example.com",
            Placeholder = "you@example.com",
            AccessibilityName = "Email address",
        }
        let invalidField = baseField with{
            Label = "Email address",
            Value = "alex@",
            Placeholder = "you@example.com",
            Invalid = true,
            IssueText = "Enter a valid email address.",
            AccessibilityName = "Email address",
        }
        let disabledField = baseField with{
            Label = "Email address",
            Value = "locked@example.com",
            Placeholder = "you@example.com",
            Disabled = true,
            AccessibilityName = "Locked account email",
            Clearable = true,
        }
        let customField = baseField with{
            Label = "Workspace",
            Value = "Design team",
            AccessibilityName = "Workspace name",
            BackgroundColor = Color.Parse("#18181b"),
            TextColor = Color.Parse("#fafafa"),
            BorderColor = Color.Parse("#52525b"),
            FocusColor = Color.Parse("#e4e4e7"),
            DisabledBackgroundColor = Color.Parse("#09090b"),
            BorderWidth = 1.5,
            BorderRadius = 12.0,
            FocusRingWidth = 3.0,
        }
        let password = baseField with{
            Label = "Password",
            Value = "correct horse",
            Password = true,
            RevealButton = true,
            Width = 280,
        }
        let address = baseField with{
            Label = "Site address",
            Value = "team",
            Clearable = true,
            MaxLength = 20,
            Width = 280,
            PrefixAddon = Text{Content: "https://", Color: Theme.Read().MutedTextColor},
            SuffixAddon = Text{Content: ".dev", Color: Theme.Read().MutedTextColor},
            Leading = MaterialIcons.Create("link", 16, Theme.Read().MutedTextColor),
        }

        return Container{
            Width: 620.0,
            FlexDirection: FlexDirection.Column,
            Gap: 18.0,
            Container{
                Width: Percent(100.0),
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.FlexStart,
                JustifyContent: JustifyContent.Center,
                Gap: 24.0,
                Container{
                    Width: 280.0,
                    FlexDirection: FlexDirection.Column,
                    Gap: 5.0,
                    Text{Content: "DEFAULT", FontSize: 10.0, FontWeight: 700},
                    defaultField.Build(),
                },
                Container{
                    Width: 280.0,
                    FlexDirection: FlexDirection.Column,
                    Gap: 5.0,
                    Text{Content: "INVALID", FontSize: 10.0, FontWeight: 700, Color: "#ef4444"},
                    invalidField.Build(),
                },
            },
            Container{
                Width: Percent(100.0),
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.FlexStart,
                JustifyContent: JustifyContent.Center,
                Gap: 24.0,
                Container{
                    Width: 280.0,
                    FlexDirection: FlexDirection.Column,
                    Gap: 5.0,
                    Text{Content: "DISABLED", FontSize: 10.0, FontWeight: 700},
                    disabledField.Build(),
                },
                Container{
                    Width: 280.0,
                    FlexDirection: FlexDirection.Column,
                    Gap: 5.0,
                    Text{Content: "CUSTOM", FontSize: 10.0, FontWeight: 700},
                    customField.Build(),
                },
            },
            Container{
                Width: Percent(100),
                FlexDirection: FlexDirection.Row,
                Gap: 24,
                JustifyContent: JustifyContent.Center,
                password.Build(),
                address.Build()
            },
        }
    }
}
