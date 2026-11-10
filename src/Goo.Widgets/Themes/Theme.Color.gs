package Goo.Widgets

import Goo
import Goo.Widgets.Colors
import System

public data partial struct Theme {
    internal func WithAccent(accent Color) Theme {
        let dark = FrameTheme == SystemTheme.Dark
        let fill = Controls == ControlStyle.Standard ? accent:
            Legible(Mix(accent, dark ? Color.White: Color.Black, dark ? 0.6F: 0.2F), dark ? Color.White: Color.Black, PanelColor, 3.0)
        let white = Contrast(Color.White, fill) >= Contrast(Color.Black, fill)
        let away = white ? Color.Black: Color.White
        return this with{
            AccentColor = fill,
            OnAccentColor = white ? Color.White: Color.Black,
            AccentHoverColor = Mix(fill, away, 0.1F),
            AccentPressedColor = Mix(fill, away, 0.2F),
        }
    }

    /// Resolves semantic foreground paint.
    public func ToneColor(tone Tone) Color -> switch tone {
        case Tone.Info: InfoColor
        case Tone.Success: SuccessColor
        case Tone.Warning: WarningColor
        case Tone.Danger: DangerColor
        default: TextColor
    }

    /// Resolves a semantic quiet surface.
    public func ToneFill(tone Tone) Color -> switch tone {
        case Tone.Info: InfoFillColor
        case Tone.Success: SuccessFillColor
        case Tone.Warning: WarningFillColor
        case Tone.Danger: DangerQuietColor
        default: PanelColor
    }

    /// Strengthens text, borders and focus without replacing the palette.
    public func WithHighContrast() Theme {
        var surface = CanvasColor
        for color in []Color{PanelColor, RaisedColor, OverlayColor, FieldColor, HoverColor, PressedColor, SunkenColor, ActiveColor, InfoFillColor, SuccessFillColor, WarningFillColor, DangerQuietColor} {
            if color.A == 1.0F && Contrast(TextColor, color) < Contrast(TextColor, surface) {
                surface = color
            }
        }
        let accent = Legible(AccentColor, TextColor, surface, 7.0)
        return this with{
            HighContrast = true,
            BorderColor = TextColor,
            InputBorderColor = TextColor,
            StrongBorderColor = TextColor,
            MutedTextColor = TextColor,
            FaintTextColor = TextColor,
            SubtleTextColor = TextColor,
            DisabledTextColor = TextColor,
            DisabledOpacity = 1.0,
            AccentColor = accent,
            AccentHoverColor = Legible(AccentHoverColor, TextColor, surface, 7.0),
            AccentPressedColor = Legible(AccentPressedColor, TextColor, surface, 7.0),
            OnAccentColor = Legible(OnAccentColor, CanvasColor, accent, 7.0),
            InfoColor = Legible(InfoColor, TextColor, surface, 7.0),
            SuccessColor = Legible(SuccessColor, TextColor, surface, 7.0),
            WarningColor = Legible(WarningColor, TextColor, surface, 7.0),
            DangerColor = Legible(DangerColor, TextColor, surface, 7.0),
            DangerFillColor = Legible(DangerFillColor, TextColor, surface, 7.0),
            DangerHoverColor = Legible(DangerHoverColor, TextColor, surface, 7.0),
            LinkColor = Legible(LinkColor, TextColor, surface, 7.0),
            FocusColor = Legible(FocusColor, TextColor, surface, 3.0),
            BorderWidth = Math.Max(2.0, BorderWidth),
        }
    }

    /// Makes chrome translucent over the native window material. Content panels stay opaque.
    /// Overlays turn translucent and blur what is behind them through OverlayStyle.
    /// Hosts without blur or with reduced transparency show CanvasColor.
    public func WithGlass() Theme {
        let value = ResolveDefaults()
        let alpha = OperatingSystem.IsWindows() || OperatingSystem.IsMacOS() ? 0.0: value.GlassAlpha()
        let dark = value.FrameTheme == SystemTheme.Dark
        return value with{
            GlassColor = value.CanvasColor.WithAlpha(alpha),
            RowInset = value.Spacing,
            OverlayColor = value.OverlayColor.WithAlpha(0.88),
            HighlightColor = Color.White.WithAlpha(dark ? 0.1: 0.6),
            HairlineColor = Color.Black.WithAlpha(dark ? 0.55: 0.14),
        }
    }

    /// Lowest tint alpha that keeps MutedTextColor at 4.5:1 over black or white. Compositors such as KWin blend in sRGB.
    private func GlassAlpha() float64 {
        let text = Luminance(MutedTextColor.R, MutedTextColor.G, MutedTextColor.B)
        let tint = CanvasColor
        for percent in 0 ... 100 {
            let alpha = float64(percent) / 100.0
            var legible = true
            for backdrop in[]float64{0.0, 1.0} {
                let rest = (1.0 - alpha) * backdrop
                let surface = Luminance(alpha * tint.R + rest, alpha * tint.G + rest, alpha * tint.B + rest)
                legible = legible && (Math.Max(text, surface) + 0.05) / (Math.Min(text, surface) + 0.05) >= 4.5
            }
            if legible {
                return alpha
            }
        }
        return 1.0
    }

    private func Luminance(red float64, green float64, blue float64) float64 ->
    0.2126 * LinearSrgb(red) + 0.7152 * LinearSrgb(green) + 0.0722 * LinearSrgb(blue)

    internal func Contrast(first Color, second Color) float64 {
        let x = Luminance(first.R, first.G, first.B) + 0.05
        let y = Luminance(second.R, second.G, second.B) + 0.05
        return Math.Max(x, y) / Math.Min(x, y)
    }

    internal func Mix(color Color, target Color, amount float32) Color -> Color.FromNormalized(
        color.R + (target.R - color.R) * amount,
        color.G + (target.G - color.G) * amount,
        color.B + (target.B - color.B) * amount,
        color.A
    )

    /// Moves color toward target in 1% steps until it reaches ratio against other.
    internal func Legible(color Color, target Color, other Color, ratio float64) Color {
        for percent in 0 ... 100 {
            let value = Mix(color, target, float32(percent) / 100.0F)
            if Contrast(value, other) >= ratio {
                return value
            }
        }
        return target
    }

    internal prop FrameTheme SystemTheme {
        get -> Luminance(TextColor.R, TextColor.G, TextColor.B) > Luminance(CanvasColor.R, CanvasColor.G, CanvasColor.B)
        ? SystemTheme.Dark: SystemTheme.Light
    }
}
