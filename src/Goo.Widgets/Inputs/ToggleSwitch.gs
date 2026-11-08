package Goo.Widgets.Inputs

import Goo
import Goo.Widgets

/// A controlled switch composed from a Goo button track and thumb.
/// Factories receive resolved props and may replace the final Goo primitives.
public data struct ToggleSwitch {
    /// Whether the track displays its on state. Build does not invert this value.
    var Value bool
    /// Whether the switch rejects input and uses disabled visuals.
    var Disabled bool
    /// Accessible name. Nil resolves to an empty string.
    var AccessibilityName string?
    /// Receives the new value when the switch is activated.
    var OnChange Action[bool]?
    /// Off-state track color. Nil resolves to the theme panel color.
    var OffTrackColor Color?
    /// On-state track color. Nil resolves to the theme accent color.
    var OnTrackColor Color?
    /// Disabled track color. Nil uses the theme sunken color.
    var DisabledTrackColor Color?
    /// Off-state thumb color. Nil uses theme text.
    var ThumbColor Color?
    /// Normal on-state thumb color. Nil resolves to the theme accent foreground color.
    var OnThumbColor Color?
    /// Disabled thumb color. Nil uses the theme disabled text color.
    var DisabledThumbColor Color?
    /// Track border color. Nil resolves to the theme input border color.
    var BorderColor Color?
    /// Keyboard focus outline color. Nil uses theme accent.
    var FocusBorderColor Color?
    /// Track width. Nil uses eleven theme spacing units.
    var Width Length?
    /// Visible track height. Nil uses six theme spacing units.
    var Height Length?
    /// Track padding. Nil uses half the theme spacing; explicit zero is preserved.
    var Padding float64?
    /// Thumb width and height. Nil uses five theme spacing units.
    var ThumbSize float64?
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
        let defaultHeight Length = theme.Spacing * 6.0
        let defaultWidth Length = theme.Spacing * 11.0
        let height = Height ?? defaultHeight
        let thumbSize = ThumbSize ?? theme.Spacing * 5.0
        let resolved = this with{
            AccessibilityName = AccessibilityName ?? "",
            OffTrackColor = OffTrackColor ?? theme.PanelColor,
            OnTrackColor = OnTrackColor ?? theme.AccentColor,
            DisabledTrackColor = DisabledTrackColor ?? theme.SunkenColor,
            ThumbColor = ThumbColor ?? theme.TextColor,
            OnThumbColor = OnThumbColor ?? theme.OnAccentColor,
            DisabledThumbColor = DisabledThumbColor ?? theme.DisabledTextColor,
            BorderColor = BorderColor ?? theme.InputBorderColor,
            FocusBorderColor = FocusBorderColor ?? theme.FocusColor,
            Width = Width ?? defaultWidth,
            Height = height,
            Padding = Padding ?? theme.Spacing / 2.0,
            ThumbSize = thumbSize,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? (height.HasMagnitude && !height.IsPercent ? height.Magnitude / 2.0: theme.Spacing * 3.0),
            ThumbRadius = ThumbRadius ?? thumbSize / 2.0,
            TransitionMs = theme.ReducedMotion ? 0.0: TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            ActiveTransform = ActiveTransform ?? PanelTransform{},
            CreateThumb = nil,
            CreateRoot = nil,
        }
        let thumb = if let createThumb = createThumb {
            createThumb(resolved)
        } else {
            let thumbColor = if resolved.Disabled {
                resolved.DisabledThumbColor!!
            } else if resolved.Value {
                resolved.OnThumbColor!!
            } else {
                resolved.ThumbColor!!
            }
            Container{
                Width: resolved.ThumbSize!!,
                Height: resolved.ThumbSize!!,
                BackgroundColor: thumbColor,
                BorderRadius: resolved.ThumbRadius!!,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
            }
        }
        let trackColor = resolved.Disabled ? resolved.DisabledTrackColor!!:
            resolved.Value ? resolved.OnTrackColor!!: resolved.OffTrackColor!!
        let button = if let createRoot = createRoot { createRoot(resolved, thumb) } else { Button{
            Width: resolved.Width!!,
            Height: resolved.Height!!,
            MinHeight: theme.ControlHeight,
            Padding: 0.0,
            BorderWidth: theme.HighContrast ? theme.BorderWidth: 0.0,
            BorderColor: Color.Transparent,
            BackgroundColor: Color.Transparent,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            Cursor: Cursor.Pointer,
            Focusable: true,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            TransitionProperties: ActiveTransform == nil ? theme.InteractionTransitions: theme.PressTransitions,
            Hover: Style{BackgroundColor: Color.Transparent},
            Active: Style{BackgroundColor: Color.Transparent, Transform: resolved.ActiveTransform!!},
            Focus: FocusBorderColor == nil ? nil: Style{OutlineColor: FocusBorderColor!!},
            DisabledStyle: Style{BackgroundColor: Color.Transparent},
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.FlexStart,
            Container{
                Width: Percent(100.0),
                Height: resolved.Height!!,
                Padding: resolved.Padding!!,
                BorderWidth: resolved.BorderWidth!!,
                BorderRadius: resolved.BorderRadius!!,
                BorderColor: resolved.BorderColor!!,
                BackgroundColor: trackColor,
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                JustifyContent: resolved.Value ? JustifyContent.FlexEnd: JustifyContent.FlexStart,
                HitTestSelf: false,
                thumb,
            },
        } }
        theme.ApplyInteraction(button, InteractionFamily.Toggle, Value)
        button.Disabled = Disabled
        button.Focusable = !Disabled
        button.OnClick = Disabled ? nil: () -> OnChange?.Invoke(!Value)
        button.Accessibility = Accessibility{Role: AccessibilityRole.Switch, Name: resolved.AccessibilityName!!, Checked: Value ? AccessibilityChecked.True: AccessibilityChecked.False}
        WidgetKeyBindings.BindActivation(button)
        return button
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w ToggleSwitch) Blob -> w.Build()
