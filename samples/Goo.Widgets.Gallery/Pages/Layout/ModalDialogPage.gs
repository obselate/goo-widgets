package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal open class ModalDialogExample : Cell {
    private var dialogOpen bool = true
    private var result string = "No action"

    /// Builds the interactive modal-dialog example.
    public override func Build() Blob -> Container{
        Width: 720.0,
        Height: 360.0,
        Position: PositionType.Relative,
        Gap: 12.0,
        Color: "#fafafa",
        ActionButton{
            Label: "Open dialog",
            OnClick: () -> {
                dialogOpen = true
            }
        }.Build(),
        Text{Content: result, Color: "#a1a1aa"},
        ModalDialog{
            Open: dialogOpen,
            AccessibilityName: "Confirm change",
            Header: Text{Content: "Confirm change", FontSize: 18.0, FontWeight: 700},
            Content: Text{Content: "Apply this change to the selected items?"},
            OnClose: () -> {
                dialogOpen = false
            },
            OnCancel: () -> {
                result = "Canceled"
                dialogOpen = false
            },
            OnConfirm: () -> {
                result = "Confirmed"
                dialogOpen = false
            },
        }.Build(),
    }
}

internal class ModalDialogPage : GalleryPage {
    override func Title() string -> "Modal dialog"

    override func Build() Blob -> Cell.Mount[ModalDialogExample]("modal-dialog-example")
}
