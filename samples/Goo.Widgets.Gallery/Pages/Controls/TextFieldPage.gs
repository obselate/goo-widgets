package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Inputs
import Goo.Widgets.Gallery

class TextFieldPage : GalleryPage {
  public override func Title() string -> "TextField"

  public override func Build() Blob {
    let baseField = TextField{
      Width: 280.0,
      EntryHeight: 44.0,
      Gap: 7.0,
      PaddingHorizontal: 12.0,
      FontSize: 14.0,
      LabelFontSize: 11.0,
      IssueFontSize: 12.0,
      BackgroundColor: Color.Parse("#09090b"),
      TextColor: Color.Parse("#fafafa"),
      MutedTextColor: Color.Parse("#a1a1aa"),
      BorderColor: Color.Parse("#3f3f46"),
      FocusColor: Color.Parse("#d4d4d8"),
      InvalidColor: Color.Parse("#ef4444"),
      DisabledBackgroundColor: Color.Parse("#18181b"),
      DisabledTextColor: Color.Parse("#71717a"),
      BorderWidth: 1.0,
      BorderRadius: 8.0,
      FocusRingWidth: 2.0,
      TransitionMs: 150.0,
      TransitionEasing: Easing.EaseOut,
    }

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
    }
    let customField = baseField with{
      Label = "Workspace",
      Value = "Design team",
      AccessibilityName = "Workspace name",
      BackgroundColor = Color.Parse("#18181b"),
      TextColor = Color.Parse("#fafafa"),
      MutedTextColor = Color.Parse("#a1a1aa"),
      BorderColor = Color.Parse("#52525b"),
      FocusColor = Color.Parse("#e4e4e7"),
      InvalidColor = Color.Parse("#ef4444"),
      DisabledBackgroundColor = Color.Parse("#09090b"),
      DisabledTextColor = Color.Parse("#71717a"),
      BorderWidth = 1.5,
      BorderRadius = 12.0,
      FocusRingWidth = 3.0,
    }

    return Container{
      Width: 620.0,
      FlexDirection: FlexDirection.Column,
      Gap: 18.0,
      Children: {
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Row,
          AlignItems: AlignItems.FlexStart,
          JustifyContent: JustifyContent.Center,
          Gap: 24.0,
          Children: {
            Container{
              Width: 280.0,
              FlexDirection: FlexDirection.Column,
              Gap: 5.0,
              Children: {
                Text{ Content: "DEFAULT", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
                defaultField.Build(),
              },
            },
            Container{
              Width: 280.0,
              FlexDirection: FlexDirection.Column,
              Gap: 5.0,
              Children: {
                Text{ Content: "INVALID", FontSize: 10.0, FontWeight: 700, Color: "#ef4444" },
                invalidField.Build(),
              },
            },
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Row,
          AlignItems: AlignItems.FlexStart,
          JustifyContent: JustifyContent.Center,
          Gap: 24.0,
          Children: {
            Container{
              Width: 280.0,
              FlexDirection: FlexDirection.Column,
              Gap: 5.0,
              Children: {
                Text{ Content: "DISABLED", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
                disabledField.Build(),
              },
            },
            Container{
              Width: 280.0,
              FlexDirection: FlexDirection.Column,
              Gap: 5.0,
              Children: {
                Text{ Content: "CUSTOM", FontSize: 10.0, FontWeight: 700, Color: "#d4d4d8" },
                customField.Build(),
              },
            },
          },
        },
      },
    }
  }
}
