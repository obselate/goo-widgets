package Goo.Widgets.Gallery.Pages.Actions

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery

internal open class IconButtonExample : Cell {
  private var active bool
  private var count int32

  public override func Build() Blob -> Container {
    Gap: 16.0,
    AlignItems: AlignItems.Center,
    Children: {
      Container{
        FlexDirection: FlexDirection.Row,
        AlignItems: AlignItems.Center,
        Gap: 12.0,
        Children: {
          IconButton{
            AccessibilityName: "Add item",
            Icon: Text{ Content: "+", FontSize: 24.0, Color: "#fafafa", Accessibility: Accessibility{ Hidden: true } },
            OnClick: () -> { count++
              Rebuild() },
          }.Build(),
          IconButton{
            AccessibilityName: "Pin item",
            Active: active,
            Icon: Text{ Content: "P", FontSize: 14.0, FontWeight: 700, Color: "#fafafa", Accessibility: Accessibility{ Hidden: true } },
            OnClick: () -> { active = !active
              Rebuild() },
          }.Build(),
          IconButton{
            AccessibilityName: "Unavailable action",
            Disabled: true,
            Icon: Text{ Content: "×", FontSize: 20.0, Color: "#fafafa", Accessibility: Accessibility{ Hidden: true } },
          }.Build(),
        },
      },
      Text{ Content: "Add pressed " + count.ToString() + " times", FontSize: 12.0, Color: "#a1a1aa" },
    },
  }
}

internal class IconButtonPage : GalleryPage {
  override func Title() string -> "Icon button"
  override func Build() Blob -> Cell.Mount[IconButtonExample]("icon-button-example")
}
