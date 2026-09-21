package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal class ManagedDialogExample : Cell {
    internal var PlatformInput PlatformInput?
    private var isOpen bool = true
    private var nested bool
    private var result string = "Ready for review"
    private func Open() {
        isOpen = true
        Rebuild()
    }

    private func OpenNested() {
        nested = true
        Rebuild()
    }

    private func Close() {
        isOpen = false
        Rebuild()
    }

    private func CloseNested() {
        nested = false
        Rebuild()
    }

    private func BuildOpenButton() Blob {
        let button = Button{
            Key: "open",
            Width: 160.0,
            Height: 36.0,
            BackgroundColor: "#27272a",
            BorderRadius: 6.0,
            OnClick: Open,
            Text{Content: "Review change"}
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }

    private func BuildNestedButton() Blob {
        let button = Button{
            Height: 34.0,
            BackgroundColor: "#312e81",
            BorderRadius: 5.0,
            OnClick: OpenNested,
            Text{Content: "Open nested confirmation"}
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }

    public override func Build() Blob -> Container{
        Width: 720.0,
        Height: 420.0,
        Gap: 16.0,
        Color: "#fafafa",
        BuildOpenButton(),
        Text{Key: "status", Content: result, Color: "#a1a1aa"},
        Cell.Mount[ModalDialog, ModalDialogHost](
            "dialog",
            ModalDialog{
                Open: isOpen,
                KeyBindings: WidgetKeyBindings.Editing(PlatformInput),
                Width: 500.0,
                AccessibilityName: "Review deployment",
                Header: Text{Content: "Review deployment", FontSize: 22.0, FontWeight: 700},
                Content: Container{
                    Gap: 16.0,
                    Text{
                        Content: "Tab stays inside this dialog. Closing returns focus to the control that opened it.",
                        Color: "#a1a1aa"
                    },
                    TextEntry{
                        Value: "Production update",
                        Width: Length.Percent(100.0),
                        Height: 36.0,
                        Padding: 8.0,
                        BackgroundColor: "#09090b",
                        Accessibility: Accessibility{Name: "Change label"}
                    },
                    BuildNestedButton()
                },
                OnClose: Close,
                OnCancel: Close,
                OnConfirm: () -> {
                    result = "Change confirmed"
                    Close()
                }
            }
        ),
        Cell.Mount[ModalDialog, ModalDialogHost](
            "nested",
            ModalDialog{
                Open: nested,
                KeyBindings: WidgetKeyBindings.Editing(PlatformInput),
                Width: 390.0,
                AccessibilityName: "Nested confirmation",
                Header: Text{Content: "Nested confirmation", FontSize: 20.0, FontWeight: 700},
                Content: Text{Content: "Escape returns to the underlying dialog.", Color: "#a1a1aa"},
                OnClose: CloseNested,
                OnCancel: CloseNested,
                OnConfirm: CloseNested
            }
        ),
    }
}

internal class ModalDialogHostPage : GalleryPage {
    override func Title() string -> "Managed dialog"

    override func Build() Blob {
        let input = PlatformInput
        return Cell.Mount[ManagedDialogExample](
            () -> {
                let example = ManagedDialogExample{}
                example.PlatformInput = input
                return example
            },
            "managed-dialog-example"
        )
    }
}
