package Goo.Widgets.Inputs

import Goo
import Goo.Widgets

/// A controlled switch composed from a Goo button track and thumb.
/// Factories receive resolved props and may replace the final Goo primitives.
public data struct ToggleSwitch {
    /// Whether the track displays its on state. Build does not invert this value.
    var Checked bool
    /// Whether the switch rejects input and uses disabled visuals.
    var Disabled bool
    /// Accessible name. Nil resolves to an empty string.
    var AccessibilityName string?
    /// Action forwarded directly to Goo.Button activation.
    var OnClick Action?
    /// Off-state track color. Nil resolves to the theme panel color.
    var OffTrackColor Color?
    /// On-state track color. Nil resolves to the theme accent color.
    var OnTrackColor Color?
    /// Disabled track color. Nil resolves to the theme faint text color.
    var DisabledTrackColor Color?
    /// Off-state thumb color. Nil uses theme text.
    var ThumbColor Color?
    /// Normal on-state thumb color. Nil resolves to the theme accent foreground color.
    var OnThumbColor Color?
    /// Disabled thumb color. Nil resolves to the theme faint text color.
    var DisabledThumbColor Color?
    /// Track border color. Nil resolves to the theme input border color.
    var BorderColor Color?
    /// Keyboard focus outline color. Nil uses theme accent.
    var FocusBorderColor Color?
    /// Track width. Zero uses eleven theme spacing units.
    var Width float64
    /// Visible track height. Nil uses six theme spacing units.
    var Height float64?
    /// Track padding. Nil uses half the theme spacing; explicit zero is preserved.
    var Padding float64?
    /// Thumb width and height. Zero uses five theme spacing units.
    var ThumbSize float64
    /// Border width. Nil uses the theme border width; explicit zero is preserved.
    var BorderWidth float64?
    /// Track corner radius. Nil uses half the track height; explicit zero is preserved.
    var BorderRadius float64?
    /// Thumb corner radius. Nil uses half the thumb size; explicit zero is preserved.
    var ThumbRadius float64?
    /// Transition duration. Nil uses theme motion. Explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Root opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Pressed transform. Nil uses the identity transform.
    var ActiveTransform PanelTransform?
    /// Creates the final thumb from resolved props. Nil uses the default thumb.
    var CreateThumb Func[ToggleSwitch, Container]?
    /// Creates the final Button from resolved props and exact final thumb.
    var CreateRoot Func[ToggleSwitch, Container, Button]?
    /// Builds a fresh Goo switch tree after resolving props and factories.
    public func Build() Blob {
        let theme = Theme.Read()
        let createThumb = CreateThumb
        let createRoot = CreateRoot
        let height = Height ?? theme.Spacing * 6.0
        let thumbSize = ThumbSize == 0.0 ? theme.Spacing * 5.0: ThumbSize
        let resolved = this with{
            AccessibilityName = AccessibilityName ?? "",
            OffTrackColor = OffTrackColor ?? theme.PanelColor,
            OnTrackColor = OnTrackColor ?? theme.AccentColor,
            DisabledTrackColor = DisabledTrackColor ?? theme.FaintTextColor,
            ThumbColor = ThumbColor ?? theme.TextColor,
            OnThumbColor = OnThumbColor ?? theme.OnAccentColor,
            DisabledThumbColor = DisabledThumbColor ?? theme.FaintTextColor,
            BorderColor = BorderColor ?? theme.InputBorderColor,
            FocusBorderColor = FocusBorderColor ?? theme.AccentColor,
            Width = if Width == 0.0 {
                theme.Spacing * 11.0
            } else {
                Width
            },
            Height = height,
            Padding = Padding ?? theme.Spacing / 2.0,
            ThumbSize = thumbSize,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? height / 2.0,
            ThumbRadius = ThumbRadius ?? thumbSize / 2.0,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            ActiveTransform = ActiveTransform ?? PanelTransform{},
            CreateThumb = nil,
            CreateRoot = nil,
        }
        let travel = Math.Max(
            0.0,
            resolved.Width - 2.0 * (resolved.Padding!! + resolved.BorderWidth!!) - resolved.ThumbSize
        )
        let marginLeft = if resolved.Checked {
            travel
        } else {
            0.0
        }
        let thumb = if let createThumb = createThumb {
            createThumb(resolved)
        } else {
            let thumbColor = if resolved.Disabled {
                resolved.DisabledThumbColor!!
            } else if resolved.Checked {
                resolved.OnThumbColor!!
            } else {
                resolved.ThumbColor!!
            }
            Container{
                Width: resolved.ThumbSize,
                Height: resolved.ThumbSize,
                BackgroundColor: thumbColor,
                BorderRadius: resolved.ThumbRadius!!,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
                Margin: Edges{Left: marginLeft},
            }
        }
        if let createRoot = createRoot {
            let button = createRoot(resolved, thumb)
            WidgetKeyBindings.BindActivation(button)
            return button
        }
        let trackColor = if resolved.Disabled {
            resolved.DisabledTrackColor!!
        } else if resolved.Checked {
            resolved.OnTrackColor!!
        } else {
            resolved.OffTrackColor!!
        }
        let button = Button{
            Width: resolved.Width,
            Height: Math.Max(resolved.Height!!, theme.ControlHeight),
            Padding: 0.0,
            BorderWidth: 0.0,
            BackgroundColor: Color.Transparent,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            Cursor: Cursor.Pointer,
            Focusable: true,
            Disabled: resolved.Disabled,
            OnClick: resolved.OnClick,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            Active: Style{Transform: resolved.ActiveTransform!!},
            Focus: Style{OutlineColor: resolved.FocusBorderColor!!, OutlineWidth: 2.0, OutlineOffset: 2.0},
            DisabledStyle: Style{},
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.FlexStart,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Switch,
                Name: resolved.AccessibilityName!!,
                Checked: if resolved.Checked {
                    AccessibilityChecked.True
                } else {
                    AccessibilityChecked.False
                },
            },
            Container{
                Width: resolved.Width,
                Height: resolved.Height!!,
                Padding: resolved.Padding!!,
                BorderWidth: resolved.BorderWidth!!,
                BorderRadius: resolved.BorderRadius!!,
                BorderColor: resolved.BorderColor!!,
                BackgroundColor: trackColor,
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                HitTestSelf: false,
                thumb,
            },
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }
}
