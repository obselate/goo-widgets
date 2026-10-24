package Goo.Widgets.Feedback

import Goo
import Goo.Widgets

/// A placement-neutral status badge. Nil Content renders a dot; non-nil Content renders a pill.
/// Factories receive resolved props and may replace the final Goo primitives.
public data struct Badge {
    /// Badge text. Nil selects dot mode; an empty string remains content mode.
    var Content string?
    var Tone Tone
    var Count int32?
    var MaxCount int32?
    var Anchor Blob?
    var Live bool
    /// Background color. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Text color. Nil uses the nearest theme.
    var TextColor Color?
    /// Border color. Nil uses the nearest theme.
    var BorderColor Color?
    /// Dot diameter. Zero uses the nearest theme spacing.
    var DotSize float64
    /// Content height. Nil uses caption size plus two spacing units.
    var Height float64?
    /// Minimum width. Nil uses the resolved height.
    var MinWidth float64?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Border width. Zero leaves the border unpainted.
    var BorderWidth float64
    /// Radius. Nil uses half the active height. Explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration in milliseconds. Nil uses theme motion. Explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Font family. Nil inherits Goo's font choice.
    var FontFamily string?
    /// Font size. Zero uses the nearest theme caption font size.
    var FontSize float64
    /// Font weight. Zero uses the nearest theme caption font weight.
    var FontWeight int32
    /// Accessible name. Content is the content-mode fallback; a nameless dot is decorative.
    var AccessibilityName string?
    /// Root opacity. Nil resolves to 1.
    var Opacity float64?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Creates the final Text from resolved props. Nil uses Badge's composition.
    var CreateText Func[Badge, Text]?
    /// Creates the final Container from resolved props and optional Text. Nil uses Badge's composition.
    var CreateRoot Func[Badge, Text?, Container]?

    /// Builds a fresh Goo tree, resolving props before invoking either primitive factory.
    public func Build() Blob {
        let theme = Theme.Read()
        if let anchor = Anchor {
            let badge = (this with{Anchor = nil}).Build()
            badge.Position = PositionType.Absolute
            badge.Top = 0.0
            badge.Right = 0.0
            return Container{Position: PositionType.Relative, anchor, badge}
        }
        let createText = CreateText
        let createRoot = CreateRoot
        let content = if let count = Count {
            count > (MaxCount ?? 99) ? (MaxCount ?? 99).ToString() + "+": count.ToString()
        } else {
            Content
        }
        let isDot = content == nil
        let dotSize = if DotSize == 0.0 {
            theme.Spacing * 2.0
        } else {
            DotSize
        }
        let height = Height ?? theme.CaptionFontSize + theme.Spacing * 2.0
        let minWidth = MinWidth ?? height
        let padding = PaddingHorizontal ?? theme.Spacing * 1.5
        var resolvedName string? = AccessibilityName
        if resolvedName == nil && !isDot {
            resolvedName = if let count = Count {
                count.ToString()
            } else {
                content
            }
        }
        let resolved = this with{
            Content = content,
            BackgroundColor = BackgroundColor ?? (isDot ? theme.ToneColor(Tone): theme.ToneFill(Tone)),
            TextColor = TextColor ?? theme.ToneColor(Tone),
            BorderColor = BorderColor ?? (Tone == Tone.Neutral ? theme.BorderColor: theme.ToneColor(Tone)),
            FontFamily = FontFamily ?? theme.FontFamily,
            DotSize = dotSize,
            Height = height,
            MinWidth = minWidth,
            PaddingHorizontal = padding,
            BorderRadius = BorderRadius ??
                (
                if isDot {
                    dotSize / 2.0
                } else {
                    height / 2.0
                }
            ),
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            FontSize = if FontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                theme.CaptionFontWeight
            } else {
                FontWeight
            },
            AccessibilityName = resolvedName,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateText = nil,
            CreateRoot = nil,
        }

        var text Text? = nil
        if !isDot {
            if let createText = createText {
                text = createText(resolved)
            } else {
                text = Text{
                    Content: resolved.Content!!,
                    Color: resolved.TextColor!!,
                    FontSize: resolved.FontSize,
                    FontWeight: resolved.FontWeight,
                }
                if let fontFamily = resolved.FontFamily {
                    text.FontFamily = fontFamily
                }
            }
        }
        if let createRoot = createRoot {
            return createRoot(resolved, text)
        }

        var semantics = Accessibility{Role: AccessibilityRole.None, Hidden: true}
        if let accessibilityName = resolved.AccessibilityName {
            semantics = Accessibility{
                Role: AccessibilityRole.Status,
                Name: accessibilityName,
                Live: Live ? AccessibilityLive.Polite: AccessibilityLive.Off
            }
        }
        if isDot {
            return Container{
                Width: resolved.DotSize,
                Height: resolved.DotSize,
                BorderRadius: resolved.BorderRadius!!,
                BorderWidth: resolved.BorderWidth,
                BorderColor: resolved.BorderColor!!,
                BackgroundColor: resolved.BackgroundColor!!,
                Opacity: resolved.Opacity!!,
                Transform: resolved.Transform!!,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
                Accessibility: semantics,
            }
        }
        return Container{
            LineHeight: theme.LineHeight,
            Height: resolved.Height!!,
            MinWidth: resolved.MinWidth!!,
            Padding: Edges{Right: resolved.PaddingHorizontal!!, Left: resolved.PaddingHorizontal!!},
            BorderRadius: resolved.BorderRadius!!,
            BorderWidth: resolved.BorderWidth,
            BorderColor: resolved.BorderColor!!,
            BackgroundColor: resolved.BackgroundColor!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Accessibility: semantics,
            text!!,
        }
    }
}

/// Shared status values for indicators and avatar presence.
public enum StatusState {
    Idle;
    Running;
    Waiting;
    Done;
    Failed;
    Offline
}

/// Dot, icon or filled pill status presentation.
public enum StatusVariant {
    Dot;
    Icon;
    Pill
}

/// A text-labelled semantic status using the shared tone palette.
public data struct StatusIndicator {
    var State StatusState
    var Variant StatusVariant
    var Tone Tone?
    var Label string?
    var Icon Blob?
    var Live bool

    /// Builds a status marker and label. Running uses Spinner.
    public func Build() Blob {
        let theme = Theme.Read()
        let tone = Tone ??
            (
            switch State {
                case StatusState.Running: Goo.Widgets.Tone.Info
                case StatusState.Waiting: Goo.Widgets.Tone.Warning
                case StatusState.Done: Goo.Widgets.Tone.Success
                case StatusState.Failed: Goo.Widgets.Tone.Danger
                default: Goo.Widgets.Tone.Neutral
            }
        )
        let label = Label ?? State.ToString()
        let indicator = if State == StatusState.Running {
            Cell.Mount[SpinnerInput, Spinner](nil, SpinnerInput{Size: 14.0, Color: theme.ToneColor(tone), Label: label})
        } else if Variant == StatusVariant.Icon {
            Icon ??
                Text{
                Content: switch State {
                    case StatusState.Done: "✓"
                    case StatusState.Failed: "!"
                    case StatusState.Waiting: "…"
                    default: "○"
                },
                Color: theme.ToneColor(tone)
            }
        } else {
            Badge{Tone: tone}.Build()
        }
        return Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: theme.Spacing,
            Padding: Variant == StatusVariant.Pill ? theme.Spacing: 0.0,
            BorderRadius: theme.ControlRadius,
            BackgroundColor: Variant == StatusVariant.Pill ? theme.ToneFill(tone): Color.Transparent,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Status,
                Name: label,
                Live: Live ? AccessibilityLive.Polite: AccessibilityLive.Off
            },
            indicator,
            Text{Content: label, Color: theme.ToneColor(tone), FontSize: theme.CaptionFontSize},
        }
    }
}
