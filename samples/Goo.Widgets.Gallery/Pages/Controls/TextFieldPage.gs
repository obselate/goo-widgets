package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Inputs

class TextFieldPage : GalleryPage {
    public override func Title() string -> "TextField"

    public override func Build() Blob {
        let baseField = TextField{EntryHeight: 44.0, Gap: 7.0, BorderRadius: 8.0, Width: 280.0}
        let ltrField = baseField with{ContentDirection = Direction.LeftToRight}

        let defaultField = ltrField with{
            Label = "Email address",
            Value = "alex@example.com",
            Placeholder = "you@example.com",
            AccessibilityName = "Email address",
        }
        let invalidField = ltrField with{
            Label = "Email address",
            Value = "alex@",
            Placeholder = "you@example.com",
            Invalid = true,
            IssueText = "Enter a valid email address.",
            AccessibilityName = "Email address",
        }
        let disabledField = ltrField with{
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
        let password = ltrField with{
            Label = "Password",
            Value = "correct horse",
            Password = true,
            RevealButton = true,
        }
        let address = ltrField with{
            Label = "Site address",
            Value = "team",
            Clearable = true,
            MaxLength = 20,
            PrefixAddon = Text{Content: "https://", Color: Theme.Read().MutedTextColor},
            SuffixAddon = Text{Content: ".dev", Color: Theme.Read().MutedTextColor},
            Leading = MaterialIcons.Create("link", 16, Theme.Read().MutedTextColor),
        }

        return Container{
            Gap: 18.0,
            Container{FlexDirection: FlexDirection.Row, AlignItems: AlignItems.FlexStart, Gap: 24.0, defaultField.Build(), invalidField.Build()},
            Container{FlexDirection: FlexDirection.Row, AlignItems: AlignItems.FlexStart, Gap: 24.0, disabledField.Build(), customField.Build()},
            Container{FlexDirection: FlexDirection.Row, AlignItems: AlignItems.FlexStart, Gap: 24.0, password.Build(), address.Build()},
        }
    }
}
