package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Icons
import System

/// A file attachment with a persistent filename suffix and optional transfer actions.
public data struct AttachmentChip {
    /// Attachment filename. Nil uses localized Attachment text. The suffix stays visible when space is limited.
    var Name string?
    /// Secondary information shown with the item. Nil omits it.
    var Detail string?
    /// Content before the label. Nil leaves this slot empty.
    var Leading Blob?
    /// Transfer fraction clamped to 0 through 1. Nil hides the progress track.
    var Progress float64?
    /// Uses failure presentation for the transfer status.
    var Failed bool
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Requests removal when the remove action is activated. Nil hides the action.
    var OnRemove Action?
    /// Requests opening the attachment when its name is activated. Nil supplies no open action.
    var OnClick Action?
    /// Requests download when the download action is activated. Nil hides the action.
    var OnDownload Action?
    /// Root layout width. Nil uses 280 logical pixels.
    var Width Length?
    /// Receives the widget input and the prepared container, and returns the replacement container. Nil uses the default composition.
    var CreateRoot Func[AttachmentChip, Container, Container]?

    /// Builds the attachment and its independent transfer action.
    public func Build() Blob {
        let defaultWidth Length = 280
        let theme = Theme.Read()
        let name = Name ?? theme.Text("Attachment")
        let extension = name.LastIndexOf('.')
        var suffix = extension > 0 ? Math.Max(name.Length - extension, Math.Min(8, name.Length / 2)): Math.Min(
            8,
            name.Length / 2
        )
        if suffix > 0 && suffix < name.Length && Char.IsLowSurrogate(name[name.Length - suffix]) {
            suffix++
        }
        let text = Container{
            FlexGrow: 1,
            FlexBasis: 0,
            MinWidth: 0,
            Gap: theme.Spacing / 2,
            Container{
                Width: Percent(100),
                MinWidth: 0,
                FlexDirection: FlexDirection.Row,
                Text{
                    Content: name.Substring(0, name.Length - suffix),
                    MinWidth: 0,
                    FlexShrink: 1,
                    TextWrap: TextWrap.NoWrap,
                    TextTrimming: TextTrimming.Ellipsis,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.FontSize,
                    Color: Failed ? theme.DangerColor: theme.TextColor,
                },
                Text{
                    Content: name.Substring(name.Length - suffix),
                    FlexShrink: 0,
                    TextWrap: TextWrap.NoWrap,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.FontSize,
                    Color: Failed ? theme.DangerColor: theme.TextColor,
                },
            },
            Text{
                Content: Failed ? theme.Text("Failed") + (Detail == nil ? "": " · " + Detail!!): Detail ?? "",
                FontSize: theme.CaptionFontSize,
                Color: Failed ? theme.DangerColor: theme.MutedTextColor,
            },
        }
        let trigger = Button{
            Key: "open",
            FlexGrow: 1,
            FlexBasis: 0,
            MinWidth: 0,
            Padding: theme.ControlGap,
            Gap: theme.ControlGap,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Disabled: Disabled,
            Focusable: !Disabled && OnClick != nil,
            OnClick: OnClick,
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            DisabledStyle: Style{BackgroundColor: Color.Transparent, Opacity: 1.0},
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: name},
            Leading ?? ControlIcons.Create(ControlIcon.AttachFile, 24, theme.MutedTextColor),
            text,
        }
        theme.ApplyInteraction(trigger, InteractionFamily.Button)
        WidgetKeyBindings.BindActivation(trigger)
        let body = Container{
            Width: Percent(100),
            MinWidth: 0,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            trigger,
        }
        if let remove = OnRemove {
            body.Children.Add(
                IconButton{
                    Icon: ControlIcons.Create(ControlIcon.Close, 16, theme.MutedTextColor),
                    AccessibilityName: theme.Text("Remove {0}", name),
                    Disabled: Disabled,
                    DisabledOpacity: 1.0,
                    OnClick: remove,
                }.Build()
            )
        } else if let download = OnDownload {
            body.Children.Add(
                IconButton{
                    Icon: ControlIcons.Create(ControlIcon.Download, 16, theme.MutedTextColor),
                    AccessibilityName: theme.Text("Download {0}", name),
                    Disabled: Disabled,
                    DisabledOpacity: 1.0,
                    OnClick: download,
                }.Build()
            )
        }
        var root = Container{
            Width: Width ?? defaultWidth,
            MinWidth: 0,
            BorderRadius: theme.ControlRadius!!,
            BorderWidth: theme.BorderWidth,
            BorderColor: Failed ? theme.DangerColor: theme.InputBorderColor,
            BackgroundColor: theme.FieldColor,
            Overflow: Overflow.Hidden,
            body,
        }
        if let progress = Progress {
            root.Children.Add(
                Container{
                    Height: 2,
                    BackgroundColor: theme.SunkenColor,
                    Container{
                        Width: Percent(Double.IsFinite(progress) ? Math.Clamp(progress, 0, 1) * 100: 0),
                        Height: 2,
                        BackgroundColor: Failed ? theme.DangerColor: theme.AccentColor,
                        Accessibility: Accessibility{
                            Role: AccessibilityRole.ProgressBar,
                            Name: theme.Text("Transfer {0}", name),
                            Range: AccessibilityValue{
                                Minimum: 0,
                                Maximum: 1,
                                Now: Double.IsFinite(progress) ? Math.Clamp(progress, 0, 1): 0,
                            },
                        },
                    },
                }
            )
        }
        if let create = CreateRoot {
            root = create(this, root)
        }
        root.Disabled = Disabled
        root.DisabledStyle = Style{BasedOn: root.DisabledStyle, Opacity: theme.DisabledOpacity}
        return root
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w AttachmentChip) Blob -> w.Build()
