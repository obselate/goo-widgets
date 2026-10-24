package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs
import Goo.Widgets.Layout

internal open class ModalDialogExample : Cell {
    private var dialogOpen bool = true
    private var result string = "No action"
    private var preset ModalDialogPreset = ModalDialogPreset.Confirm

    /// Builds the interactive modal-dialog example.
    public override func Build() Blob -> Container{
        Width: Percent(100),
        Height: 360.0,
        Position: PositionType.Relative,
        Gap: 12.0,
        ActionButton{
            Content: "Open dialog",
            OnClick: () -> {
                dialogOpen = true
            }
        }.Build(),
        Text{Content: result},
        Container{
            FlexDirection: FlexDirection.Row,
            Gap: 12,
            ActionButton{
                Content: "Destructive",
                OnClick: () -> {
                    preset = ModalDialogPreset.Destructive
                    dialogOpen = true
                }
            }.Build(),
            ActionButton{
                Content: "Form",
                OnClick: () -> {
                    preset = ModalDialogPreset.Form
                    dialogOpen = true
                }
            }.Build()
        },
        Cell.Mount[ModalDialog, ModalDialogHost](
            "preset-dialog",
            ModalDialog{
                Open: dialogOpen,
                Preset: preset,
                AccessibilityName: "Confirm change",
                Header: Text{Content: "Confirm change", FontSize: 18.0, FontWeight: 700},
                Content: preset == ModalDialogPreset.Form ?
                TextField{Label: "Project name", Value: "Studio"}.Build():
                Text{Content: "Apply this change to the selected items?", Color: Theme.Read().TextColor},
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
            }
        ),
    }
}

internal class ModalDialogPage : GalleryPage {
    override func Title() string -> "Modal dialog"

    override func Build() Blob -> Cell.Mount[ModalDialogExample]("modal-dialog-example")
}
