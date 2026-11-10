package Goo.Widgets

import Goo

internal sealed class ThemeAttachment {
    private let window Window
    private var lastBackground Color = Color.White
    private var appBackdrop WindowBackdrop?
    private var appFallback Color
    private var appFrame SystemTheme
    private var glassFallback Color
    private var glassFrame SystemTheme
    private var setTransparent bool
    internal var Value Theme = Theme.Default.ResolveDefaults()
    internal var Mode ThemeMode

    internal init(owner Window) {
        window = owner
    }

    internal func Apply(preferences PlatformPreferences) {
        var value = Value
        if let variant = Value.Variant {
            let dark = Mode == ThemeMode.Dark || (Mode == ThemeMode.System && preferences.Theme == SystemTheme.Dark)
            let builtIn = Theme.IsBuiltIn(variant)
            var origin = builtIn ? variant(Value.VariantDark).ResolveDefaults(): Value
            if let applied = Value.SystemAccent {
                origin = origin with{
                    AccentColor = Value.AccentColor == applied.Item1 ? Value.AccentColor: origin.AccentColor,
                    AccentHoverColor = Value.AccentHoverColor == applied.Item2 ? Value.AccentHoverColor: origin.AccentHoverColor,
                    AccentPressedColor = Value.AccentPressedColor == applied.Item3 ? Value.AccentPressedColor: origin.AccentPressedColor,
                    OnAccentColor = Value.OnAccentColor == applied.Item4 ? Value.OnAccentColor: origin.OnAccentColor,
                }
            }
            value = value.WithPalette(variant(dark), origin)
            value.SystemAccent = nil
            let custom = builtIn && Value.AccentColor != origin.AccentColor
            var accent = builtIn ? preferences.AccentColor: nil
            if custom {
                accent = Value.AccentColor
            }
            if let accent = accent {
                let shaded = (custom ? value with{Controls = ControlStyle.Standard}: value).WithAccent(accent)
                value.AccentColor = shaded.AccentColor
                value.OnAccentColor = Theme.Pick(Value.OnAccentColor, origin.OnAccentColor, shaded.OnAccentColor)
                value.AccentHoverColor = Theme.Pick(Value.AccentHoverColor, origin.AccentHoverColor, shaded.AccentHoverColor)
                value.AccentPressedColor = Theme.Pick(Value.AccentPressedColor, origin.AccentPressedColor, shaded.AccentPressedColor)
                if !custom {
                    value.SystemAccent = (shaded.AccentColor, shaded.AccentHoverColor, shaded.AccentPressedColor, shaded.OnAccentColor)
                }
            }
        }
        value = value.WithAccessibility(preferences.HighContrast == true, float64(preferences.TextScaleFactor ?? 1.0F), preferences.ReducedMotion == true)
        Theme.Key.Set(window, value)
        var background = window.Background
        if (Value.Variant == nil && background != Color.Transparent) || background == lastBackground {
            background = value.CanvasColor
            if let glass = value.GlassColor {
                background = window.Decorated ? glass: Color.Transparent
            }
            lastBackground = background
        }
        if value.GlassColor != nil {
            if appBackdrop == nil {
                appBackdrop = window.Backdrop
                appFallback = window.BackdropFallbackColor
                appFrame = window.FrameTheme
                setTransparent = !window.IsOpen && !window.Transparent
            }
            if setTransparent {
                window.Transparent = true
            }
            glassFallback = value.CanvasColor.WithAlpha(1.0)
            glassFrame = value.FrameTheme
            window.FrameTheme = glassFrame
            window.WindowsBackdrop = WindowsBackdropOptions{
                Material: Value.Variant != nil ? WindowsBackdropMaterial.Mica: WindowsBackdropMaterial.MicaAlt
            }
            window.MacOSBackdrop = MacOSBackdropOptions{Material: MacOSBackdropMaterial.Sidebar}
            window.WaylandBackdrop = WaylandBackdropOptions{CornerRadius: value.PanelRadius!!}
            window.BackdropFallbackColor = glassFallback
            window.Backdrop = WindowBackdrop.Blur
        } else if let backdrop = appBackdrop {
            if window.Backdrop == WindowBackdrop.Blur {
                window.Backdrop = backdrop
            }
            if window.BackdropFallbackColor == glassFallback {
                window.BackdropFallbackColor = appFallback
            }
            if window.FrameTheme == glassFrame {
                window.FrameTheme = appFrame
            }
            if setTransparent {
                window.Transparent = false
            }
            appBackdrop = nil
            setTransparent = false
        }
        window.SetColors(background, value.TextColor)
    }
}
