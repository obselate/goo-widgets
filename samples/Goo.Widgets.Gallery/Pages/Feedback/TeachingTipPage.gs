package Goo.Widgets.Gallery.Pages.Feedback

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

internal class TeachingTipExample : Cell {
    private let anchor ElementHandle = ElementHandle()
    private var anchored bool = true
    private var isOpen bool = true

    private func SetOpen(value bool) {
        isOpen = value
        Rebuild()
    }

    public override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            Width: Percent(100), MaxWidth: 640.0, MinHeight: theme.ControlHeight * 6, Gap: theme.ControlGap,
            Container{Handle: anchor, ActionButton{Content: "Bookmark", OnClick: () -> {
                anchored = true
                SetOpen(true)
            }}.Build()},
            ActionButton{Content: "Reading list", OnClick: () -> {
                anchored = false
                SetOpen(true)
            }}.Build(),
            TeachingTip{
                Open: isOpen, Anchor: anchored ? anchor: nil, OnOpenChange: SetOpen,
                Title: "Bookmark", Subtitle: "Reading list", ActionText: "Save",
                OnActionClick: () -> SetOpen(false), LightDismiss: true,
            }.Build(),
        }
    }
}

internal class TeachingTipPage : GalleryPage {
    override func Title() string -> "Teaching tip"
    override func Build() Blob -> Cell.Mount[TeachingTipExample]("teaching-tip-example")
}
