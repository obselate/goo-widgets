package Goo.Widgets.Feedback

import Goo
import Goo.Widgets

/// A semantic message with optional title, action and delayed dismissal.
/// Factories receive fully resolved props and may replace the final Goo primitives.
public data struct Banner {
    /// Banner content. Nil resolves to an empty string.
    var Content string?
    /// Accessible name. Nil resolves to the resolved content.
    var AccessibilityName string?
    var Tone Tone
    var Title string?
    var Body Blob?
    var Icon Blob?
    var Action Blob?
    var Actions Blob?
    var OnDismiss Action?
    var DismissAccessibilityName string?
    var Live bool?
    var Variant MessageVariant
    /// Background override. Nil uses the tone's quiet fill.
    var BackgroundColor Color?
    /// Text override. Nil uses the theme text color.
    var TextColor Color?
    /// Border override. Nil uses the tone color.
    var BorderColor Color?
    /// Minimum height. Nil uses the theme control height.
    var MinHeight float64?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Vertical padding. Explicit zero is preserved.
    var PaddingVertical float64?
    /// Text font size. Zero uses the nearest theme font size.
    var FontSize float64
    /// Text font weight. Zero uses the nearest theme font weight.
    var FontWeight int32
    /// Border width. Nil uses the nearest theme border width; explicit zero is preserved.
    var BorderWidth float64?
    /// Border radius. Nil uses the nearest theme radius; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration. Nil uses theme motion. Explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Root opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Optional text font family.
    var FontFamily string?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Creates Text from resolved props. Nil uses the default Text composition.
    var CreateText Func[Banner, Text]?
    /// Creates the root Container from resolved props and final Text.
    var CreateRoot Func[Banner, Text, Container]?

    /// Builds a fresh Goo banner tree after resolving props and factories.
    public func Build() Blob -> OnDismiss == nil ? BuildContent(): Cell.Mount[Banner, BannerState](nil, this)

    internal func BuildContent() Blob {
        let theme = Theme.Read()
        let createText = CreateText
        let createRoot = CreateRoot
        let content = Content ?? ""
        let textColor = theme.TextColor
        let border = Tone == Tone.Neutral ? theme.BorderColor: theme.ToneColor(Tone)
        let background = Variant == MessageVariant.Rule || Variant == MessageVariant.Inline ?
            Color.Transparent: theme.ToneFill(Tone)
        let resolved = this with{
            Content = content,
            AccessibilityName = AccessibilityName ?? content,
            Live = Live ?? true,
            BackgroundColor = BackgroundColor ?? background,
            TextColor = TextColor ?? textColor,
            BorderColor = BorderColor ?? border,
            MinHeight = MinHeight ?? theme.ControlHeight,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            PaddingVertical = PaddingVertical ?? theme.Spacing * 2.0,
            FontFamily = FontFamily ?? theme.FontFamily,
            FontSize = if FontSize == 0.0 {
                theme.FontSize
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                theme.FontWeight
            } else {
                FontWeight
            },
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.ControlRadius,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateText = nil,
            CreateRoot = nil,
        }

        let text = if let createText = createText {
            createText(resolved)
        } else {
            let value = Text{
                Content: resolved.Content!!,
                Color: resolved.TextColor!!,
                FontSize: resolved.FontSize,
                FontWeight: resolved.FontWeight,
                FlexGrow: 1.0,
            }
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }
        if let createRoot = createRoot {
            return createRoot(resolved, text)
        }

        var role = AccessibilityRole.Status
        var live = AccessibilityLive.Polite
        if resolved.Tone == Tone.Danger {
            role = AccessibilityRole.Alert
            live = AccessibilityLive.Assertive
        }
        let root = Container{
            LineHeight: theme.LineHeight,
            Color: resolved.TextColor!!,
            FontSize: resolved.FontSize,
            FontFamily: resolved.FontFamily!!,
            FlexDirection: FlexDirection.Row,
            Gap: theme.ControlGap,
            Width: Percent(100),
            MinWidth: 0,
            MinHeight: resolved.MinHeight!!,
            Padding: Edges(resolved.PaddingVertical!!, resolved.PaddingHorizontal!!),
            BackgroundColor: resolved.BackgroundColor!!,
            BorderColor: resolved.BorderColor!!,
            BorderWidth: Variant == MessageVariant.Inline ? Edges(0.0):
                Variant == MessageVariant.Rule ? Edges{Left: 3.0}: Edges(resolved.BorderWidth!!),
            BorderRadius: resolved.BorderRadius!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            AlignItems: AlignItems.Center,
            Accessibility: Accessibility{
                Role: role,
                Live: resolved.Live!! ? live: AccessibilityLive.Off,
                Name: resolved.AccessibilityName!!
            },
        }
        if let icon = Icon {
            root.Children.Add(icon)
        } else if Tone != Tone.Neutral {
            let name = switch Tone {
                case Tone.Info: "info"
                case Tone.Success: "check_circle"
                case Tone.Warning: "warning"
                default: "error"
            }
            root.Children.Add(MaterialIcons.Create(name, resolved.FontSize + 4.0, theme.ToneColor(Tone)))
        }
        let body = Container{FlexGrow: 1.0, MinWidth: 0}
        if let title = Title {
            body.Children.Add(Text{
                Content: title, Color: resolved.TextColor!!, FontSize: resolved.FontSize,
                FontFamily: resolved.FontFamily!!, FontWeight: theme.HeadingFontWeight
            })
        }
        body.Children.Add(Body ?? text)
        if let actions = Actions {
            body.Children.Add(actions)
        }
        root.Children.Add(body)
        if let action = Action {
            root.Children.Add(action)
        }
        if let dismiss = OnDismiss {
            let button = Button{
                Width: theme.ControlHeight, Height: theme.ControlHeight,
                FlexShrink: 0, OnClick: dismiss, Color: theme.TextColor,
                Focusable: true, Cursor: Cursor.Pointer,
                BackgroundColor: Color.Transparent, Focus: theme.FocusStyle,
                Accessibility: Accessibility{
                    Role: AccessibilityRole.Button, Name: DismissAccessibilityName ?? "Dismiss"
                },
                MaterialIcons.Create("close", resolved.FontSize + 4.0, theme.TextColor)
            }
            WidgetKeyBindings.BindActivation(button)
            root.Children.Add(button)
        }
        return root
    }
}

/// Message layout. Rule and Inline use a transparent background.
public enum MessageVariant {
    Banner;
    Alert;
    Rule;
    Inline
}

internal sealed class BannerState : Cell[Banner] {
    private let handle ElementHandle = ElementHandle()
    private let height Anim[float64]
    private var current Banner
    private var closing bool
    private var closed bool
    private var duration float64

    public init() {
        height = Animate(0.0)
        height.Completed += (reason MotionCompletionReason) -> {
            if closing && !closed {
                closed = true
                current.OnDismiss?.Invoke()
                Rebuild()
            }
        }
    }

    protected override func Build(input Banner) Blob {
        current = input
        let theme = Theme.Read()
        duration = theme.ReducedMotion ? 0.0: input.TransitionMs ?? theme.TransitionMs
        if closed {
            return Container{}
        }
        let root = Container{
            Handle: handle, Overflow: Overflow.Hidden,
            (input with{OnDismiss = Dismiss}).BuildContent()
        }
        if closing {
            root.Height = height.Value
        }
        return root
    }

    private func Dismiss() {
        if closing {
            return
        }
        closing = true
        if duration <= 0.0 {
            closed = true
            current.OnDismiss?.Invoke()
        } else {
            height.Snap(handle.BorderBox.Height)
            height.To(0.0, Motion.Tween(duration / 1000.0, current.TransitionEasing ?? Easing.EaseOut))
        }
        Rebuild()
    }
}

/// Filled panel or a transparent panel with a leading rule.
public enum AlertVariant {
    Filled;
    Rule
}

/// A title and description with optional content and actions.
public data struct Alert {
    var Title string?
    var Description string?
    var Content Blob?
    var Tone Tone
    var Variant AlertVariant
    var Icon Blob?
    var Actions Blob?
    var OnDismiss Action?
    var DismissAccessibilityName string?
    var Live bool?

    /// Builds an alert using the shared semantic message renderer.
    public func Build() Blob -> Banner{
        Title: Title,
        Content: Description,
        Body: Content,
        Tone: Tone,
        Variant: Variant == AlertVariant.Rule ? MessageVariant.Rule: MessageVariant.Alert,
        Icon: Icon,
        Actions: Actions,
        OnDismiss: OnDismiss,
        DismissAccessibilityName: DismissAccessibilityName,
        Live: Live,
    }.Build()
}

/// A compact, polite semantic message.
public data struct InlineMessage {
    var Content string?
    var Tone Tone
    var Icon Blob?
    var Live bool?

    /// Builds a single-line message without a border or outer padding.
    public func Build() Blob -> Banner{
        Content: Content, Tone: Tone, Icon: Icon, Live: Live,
        Variant: MessageVariant.Inline, MinHeight: 0.0,
        PaddingHorizontal: 0.0, PaddingVertical: 0.0,
    }.Build()
}
