package Goo.Widgets.Gallery.Pages.Feedback

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery
import Goo.Widgets.Media

class ToastPage : GalleryPage {
    public override func Title() string -> "Toast"

    public override func Build() Blob -> Cell.Mount[FeedbackIdentityDemo](() -> FeedbackIdentityDemo(this), nil)
}

class FeedbackIdentityDemo(Page ToastPage) : Cell {
    private var visible bool = true
    private var restored bool

    public override func Build() Blob {
        let theme = Theme.Read()
        let root = Container{
            Gap: 24,
            MaxWidth: Percent(100),
            Container{
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: 24,
                Cell.Mount[SpinnerInput, Spinner](nil, SpinnerInput{Size: 16, Label: "Small spinner"}),
                Cell.Mount[SpinnerInput, Spinner](nil, SpinnerInput{Size: 28, Variant: SpinnerVariant.Dots}),
                Cell.Mount[SpinnerInput, Spinner](nil, SpinnerInput{Size: 40, Variant: SpinnerVariant.Bars}),
            },
            Container{
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: 16,
                StatusIndicator{State: StatusState.Running, Label: "Syncing"}.Build(),
                StatusIndicator{State: StatusState.Done, Variant: StatusVariant.Icon, Label: "Saved"}.Build(),
                StatusIndicator{State: StatusState.Waiting, Variant: StatusVariant.Pill, Label: "Waiting"}.Build(),
                Badge{Count: 128, Tone: Tone.Danger}.Build(),
            },
            AvatarGroup{
                Max: 3,
                Size: 48,
                Overlap: 14,
                AccessibilityName: "Project members",
                Items: []Avatar{
                    Avatar{FallbackText: "AL", AccessibilityName: "Alex", Presence: StatusState.Done},
                    Avatar{FallbackText: "BE", AccessibilityName: "Bea", Presence: StatusState.Waiting},
                    Avatar{FallbackText: "CK", AccessibilityName: "Chris", Presence: StatusState.Offline},
                    Avatar{FallbackText: "DM"},
                    Avatar{FallbackText: "ES"},
                },
            }.Build(),
            ActionButton{
                Content: restored ? "Restored": "Show toast",
                OnClick: () -> {
                    visible = true
                    restored = false
                }
            }.Build(),
        }
        if let window = Page.OwningWindow {
            root.Children.Add(
                Cell.Mount[ToastHostInput, ToastHost](
                    nil,
                    ToastHostInput{
                        Window: window,
                        Items: visible ? []ToastItem{
                            ToastItem{
                                Id: "undo",
                                Title: "File moved to trash",
                                Description: "report.pdf",
                                Tone: Tone.Success,
                                ActionLabel: "Undo",
                                OnAction: () -> {
                                    restored = true
                                    Rebuild()
                                },
                                DurationMs: 8000,
                            }
                        }: []ToastItem{},
                        OnDismiss: (id string) -> {
                            visible = false
                            Rebuild()
                        },
                    }
                )
            )
        }
        return root
    }
}
