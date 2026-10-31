package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Icons
import System

/// A file attachment with a persistent filename suffix and optional transfer actions.
public data struct AttachmentChip {
    var Name string?
    var Detail string?
    var Leading Blob?
    var Progress float64?
    var Failed bool
    var Disabled bool
    var OnRemove Action?
    var OnOpen Action?
    var OnDownload Action?
    var Width Length?
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
            Gap: 2,
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
            Padding: 8,
            Gap: theme.ControlGap,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Disabled: Disabled,
            Focusable: !Disabled && OnOpen != nil,
            OnClick: OnOpen,
            Focus: theme.FocusStyle,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: name},
            Leading ?? ControlIcons.Create(ControlIcon.AttachFile, 24, theme.MutedTextColor),
            text,
        }
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
                    OnClick: remove,
                }.Build()
            )
        } else if let download = OnDownload {
            body.Children.Add(
                IconButton{
                    Icon: ControlIcons.Create(ControlIcon.Download, 16, theme.MutedTextColor),
                    AccessibilityName: theme.Text("Download {0}", name),
                    Disabled: Disabled,
                    OnClick: download,
                }.Build()
            )
        }
        var root = Container{
            Width: Width ?? defaultWidth,
            MinWidth: 0,
            BorderRadius: theme.ControlRadius,
            BorderWidth: theme.BorderWidth,
            BorderColor: Failed ? theme.DangerColor: theme.InputBorderColor,
            BackgroundColor: theme.FieldColor,
            Opacity: Disabled ? 0.5: 1,
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
        return root
    }
}
