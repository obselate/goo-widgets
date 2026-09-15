package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal class ManagedDialogExample : Cell {
    private var isOpen bool = true
    private var nested bool
    private var result string = "Ready for review"
    private func Close() {
        isOpen = false
        Rebuild()
    }

    private func CloseNested() {
        nested = false
        Rebuild()
    }

    public override func Build() Blob -> Container{
        Width: 720.0,
        Height: 420.0,
        Gap: 16.0,
        Color: "#fafafa",
        Button{
            Key: "open",
            Width: 160.0,
            Height: 36.0,
            BackgroundColor: "#27272a",
            BorderRadius: 6.0,
            OnClick: () -> {
                isOpen = true
                Rebuild()
            },
            Text{Content: "Review change"}
        },
        Text{Key: "status", Content: result, Color: "#a1a1aa"},
        Cell.Mount[ModalDialog, ModalDialogHost](
            "dialog",
            ModalDialog{
                Open: isOpen,
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
                    Button{
                        Height: 34.0,
                        BackgroundColor: "#312e81",
                        BorderRadius: 5.0,
                        OnClick: () -> {
                            nested = true
                            Rebuild()
                        },
                        Text{Content: "Open nested confirmation"}
                    }
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

    override func Build() Blob -> Cell.Mount[ManagedDialogExample]("managed-dialog-example")
}
