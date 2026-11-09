package Goo.Widgets.Feedback

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Layout

/// A controlled teaching panel. The caller owns Open and handles closure requests.
/// Anchored tips use Popover. Unanchored tips use the modal overlay host.
public data struct TeachingTip {
    /// Whether the tip is shown. Defaults to false.
    var Open bool
    /// Requests false on close, Escape, or permitted outside dismissal. Does not change Open.
    var OnOpenChange Action[bool]?
    /// Caller-owned target. Nil centers the tip in the window modal overlay.
    var Anchor ElementHandle?
    /// Preferred anchored edge. Defaults to BottomStart.
    var Placement PopoverPlacement
    /// Short heading. Nil omits it.
    var Title string?
    /// Secondary heading. Nil omits it.
    var Subtitle string?
    /// Caller-owned body. Nil omits it.
    var Content Blob?
    /// Optional action label. Nil omits the action button.
    var ActionText string?
    /// Runs when the action is activated. Does not request closure.
    var OnActionClick Action?
    /// Whether the action rejects input and Tab focus. Defaults to false.
    var ActionDisabled bool
    /// Whether a click outside requests closure. Defaults to false. Escape always requests closure.
    var LightDismiss bool
    /// Accessible name. Nil uses Title, then localized Dialog text.
    var AccessibilityName string?
    /// Close button name. Nil uses localized Close text.
    var CloseText string?
    /// Panel width. Nil fits an anchored tip to its content, up to the Popover readable width, and uses 320 logical pixels for a centered tip. The host constrains it to the viewport.
    var Width Length?
    /// Panel height limit. Nil uses 90 percent of the viewport.
    var MaxHeight Length?

    /// Builds the tip with shared buttons, theme paint, focus containment, and focus restoration.
    public func Build() Blob {
        let theme = Theme.Read()
        let name = AccessibilityName ?? Title ?? theme.Text("Dialog")
        let heading = Container{FlexGrow: 1, MinWidth: 0, Gap: theme.Spacing}
        if let title = Title {
            heading.Children.Add(Text{Content: title, FontSize: theme.HeadingFontSize, FontWeight: theme.HeadingFontWeight,
                FontFamily: theme.HeadingFontFamily, Accessibility: Accessibility{Role: AccessibilityRole.Heading, Name: title, Level: 2}})
        }
        if let subtitle = Subtitle {
            heading.Children.Add(Text{Content: subtitle, Color: theme.MutedTextColor, FontFamily: theme.FontFamily, FontSize: theme.FontSize})
        }
        let panel = Container{
            Gap: theme.ControlGap,
            Container{
                FlexDirection: FlexDirection.Row, AlignItems: AlignItems.FlexStart, Gap: theme.ControlGap,
                heading,
                IconButton{
                    AccessibilityName: CloseText ?? theme.Text("Close"),
                    Icon: ControlIcons.Create(ControlIcon.Close, theme.FontSize + theme.Spacing, theme.TextColor),
                    OnClick: () -> OnOpenChange?.Invoke(false),
                }.Build(),
            },
        }
        if let content = Content { panel.Children.Add(content) }
        if let action = ActionText {
            panel.Children.Add(ActionButton{Content: action, Disabled: ActionDisabled, OnClick: OnActionClick}.Build())
        }
        let defaultWidth Length = 320.0
        let width = Width ?? defaultWidth
        let maximum = MaxHeight ?? Percent(90)
        if let anchor = Anchor {
            return Cell.Mount[PopoverInput, Popover]("teaching-tip-anchor", PopoverInput{
                Open: Open, Anchor: anchor, Placement: Placement, OnOpenChange: OnOpenChange,
                DismissOnOutsideClick: LightDismiss, Role: AccessibilityRole.Dialog, AccessibilityName: name,
                Width: Width, MaxHeight: maximum, Padding: theme.PanelPadding, Content: panel,
            })
        }
        return Cell.Mount[ModalDialog, ModalDialogHost]("teaching-tip-center", ModalDialog{
            Open: Open, OnOpenChange: OnOpenChange, AccessibilityName: name,
            DismissPolicy: LightDismiss ? DialogDismissPolicy.EscapeAndBackdrop: DialogDismissPolicy.EscapeOnly,
            Width: width, MaxHeight: maximum, Padding: theme.PanelPadding, Gap: theme.ControlGap,
            BackgroundColor: theme.OverlayColor, Content: panel, Footer: Container{},
        })
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w TeachingTip) Blob -> w.Build()
