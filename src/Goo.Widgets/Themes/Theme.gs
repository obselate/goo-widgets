package Goo.Widgets

import Goo
import System
import System.Globalization

internal enum InteractionFamily { Button; Row; Field; Toggle; Tab; }

/// Selects the built-in window appearance policy.
public enum ThemeMode {
    /// Follows the operating system appearance preference.
    System;
    /// Uses the light theme palette.
    Light;
    /// Uses the dark theme palette.
    Dark
}

/// Selects absolute control metrics for a subtree.
public enum Density {
    /// Uses standard control spacing and target sizes.
    Standard;
    /// Uses reduced spacing and target sizes.
    Compact;
    /// Uses increased spacing and target sizes.
    Comfortable;
    /// Uses larger touch-oriented spacing and target sizes.
    Touch
}

/// Selected-row look in lists, trees, grids and rails.
public enum SelectionStyle {
    /// Each widget's default tint.
    Tint;
    /// Neutral fill with an accent bar at the start, as in Windows 11.
    Indicator;
    /// Accent fill with OnAccentColor text, as in macOS source lists.
    Filled
}

/// Shape of switches, sliders, radio buttons, text fields, buttons and combo boxes.
public enum ControlStyle {
    /// Goo.Widgets shapes.
    Standard;
    /// Windows 11 shapes: a faint stroke with a strong bottom edge, an accent line under a focused field,
    /// a small switch knob, a ringed slider thumb, a filled radio mark, and system accent shades for the mode.
    Fluent
}

/// Rounded widget presets in Ink, Bone, and GitHub Dark palettes. Copy with `with` to customize.
public data partial struct Theme {
    /// Window background.
    var CanvasColor Color
    /// Panel background.
    var PanelColor Color
    /// Raised controls and active segments.
    var RaisedColor Color
    /// Menus, popovers and dialogs.
    var OverlayColor Color
    /// Text entry and unchecked control background.
    var FieldColor Color
    /// Neutral hovered surface.
    var HoverColor Color
    /// Neutral pressed surface.
    var PressedColor Color
    /// Text on highlighted and pressed menu items. Zero keeps the normal text colors.
    var HoverTextColor Color
    /// Panel borders and dividers.
    var BorderColor Color
    /// Input borders.
    var InputBorderColor Color
    /// Primary text.
    var TextColor Color
    /// Secondary text.
    var MutedTextColor Color
    /// Entry placeholder text. Zero resolves to MutedTextColor. WithHighContrast keeps it weaker than TextColor.
    var PlaceholderColor Color
    /// Help text and disabled text.
    var FaintTextColor Color
    /// Primary action and selected control fill.
    var AccentColor Color
    /// Text and marks on accent fills.
    var OnAccentColor Color
    /// Hovered primary action fill.
    var AccentHoverColor Color
    /// Pressed primary action fill.
    var AccentPressedColor Color
    /// Informational text on this palette's surfaces.
    var InfoColor Color
    /// Success text on this palette's surfaces.
    var SuccessColor Color
    /// Warning text on this palette's surfaces.
    var WarningColor Color
    /// Error text on this palette's surfaces.
    var DangerColor Color
    /// Destructive action fill.
    var DangerFillColor Color
    /// Hovered destructive action fill.
    var DangerHoverColor Color
    /// Background for recessed surfaces. Supplied by the selected theme palette.
    var SunkenColor Color
    /// Background for active neutral controls. Supplied by the selected theme palette.
    var ActiveColor Color
    /// High-emphasis border color. Supplied by the selected theme palette.
    var StrongBorderColor Color
    /// Low-emphasis text color. Supplied by the selected theme palette.
    var SubtleTextColor Color
    /// Text color for disabled content. Supplied by the selected theme palette.
    var DisabledTextColor Color
    /// Final disabled interaction opacity. Defaults to 0.5. High contrast uses 1.
    var DisabledOpacity float64 = 0.5
    /// Foreground color for links. Supplied by the selected theme palette.
    var LinkColor Color
    /// Outline color for keyboard focus. Supplied by the selected theme palette.
    var FocusColor Color
    /// Keyboard-focus outline width in logical pixels. Defaults to 2.
    var FocusRingWidth float64 = 2.0
    /// Keyboard-focus outline offset in logical pixels. Defaults to 2.
    var FocusRingOffset float64 = 2.0
    /// Quiet informational background. Supplied by the selected theme palette.
    var InfoFillColor Color
    /// Quiet success background. Supplied by the selected theme palette.
    var SuccessFillColor Color
    /// Quiet warning background. Supplied by the selected theme palette.
    var WarningFillColor Color
    /// Quiet danger background. Supplied by the selected theme palette.
    var DangerQuietColor Color
    /// Small corner radius in logical pixels. Nil selects the built-in theme radius.
    var RadiusSm float64?
    /// Medium corner radius in logical pixels. Nil selects the built-in theme radius.
    var RadiusMd float64?
    /// Large corner radius in logical pixels. Nil selects the built-in theme radius.
    var RadiusLg float64?
    /// Extra-large corner radius in logical pixels. Nil selects the built-in theme radius.
    var RadiusXl float64?
    /// Shadow for small raised surfaces. Supplied by the selected theme palette.
    var ElevationSm BoxShadow
    /// Shadow for medium raised surfaces. Supplied by the selected theme palette.
    var ElevationMd BoxShadow
    /// Shadow for large raised surfaces. Supplied by the selected theme palette.
    var ElevationLg BoxShadow
    /// Shadows under panels and cards. Nil or empty keeps them flat. Supplied by the selected theme palette.
    var PanelShadows[]BoxShadow
    /// Shadows under menus, popovers, dialogs, toasts and tooltips. Supplied by the selected theme palette.
    var OverlayShadows[]BoxShadow
    /// Shadows under buttons at rest. Disabled buttons drop them. Supplied by the selected theme palette.
    var ControlShadows[]BoxShadow
    /// Inset shadows for text fields, check boxes, radio buttons and pressed buttons. Supplied by the selected theme palette.
    var FieldShadows[]BoxShadow
    /// Text size for display typography in logical pixels. Defaults to 40.0.
    var DisplayFontSize float64 = 40.0
    /// Text size for h1 typography in logical pixels. Defaults to 32.0.
    var H1FontSize float64 = 32.0
    /// Text size for h2 typography in logical pixels. Defaults to 28.0.
    var H2FontSize float64 = 28.0
    /// Text size for h3 typography in logical pixels. Defaults to 24.0.
    var H3FontSize float64 = 24.0
    /// Text size for h4 typography in logical pixels. Defaults to 20.0.
    var H4FontSize float64 = 20.0
    /// Text size for h5 typography in logical pixels. Defaults to 18.0.
    var H5FontSize float64 = 18.0
    /// Text size for h6 typography in logical pixels. Defaults to 16.0.
    var H6FontSize float64 = 16.0
    /// Text size for subtitle typography in logical pixels. Defaults to 16.0.
    var SubtitleFontSize float64 = 16.0
    /// Text size for overline typography in logical pixels. Defaults to 10.0.
    var OverlineFontSize float64 = 10.0
    /// Text size for code typography in logical pixels. Defaults to 14.0.
    var CodeFontSize float64 = 14.0
    /// Fast transition duration in milliseconds. Defaults to 120.0.
    var MotionFastMs float64 = 120.0
    /// Standard transition duration in milliseconds. Defaults to 200.0.
    var MotionNormalMs float64 = 200.0
    /// Slow transition duration in milliseconds. Defaults to 320.0.
    var MotionSlowMs float64 = 320.0
    /// Spinner animation cycle duration in milliseconds. Defaults to 1000.0.
    var SpinnerPeriodMs float64 = 1000.0
    /// Ordered chart-series colors. The selected theme supplies the default palette.
    var SeriesPalette[]Color
    /// Ordered chart-series colors for color-vision accessibility. The selected theme supplies the default palette.
    var ColorBlindPalette[]Color
    /// Default foreground roles for host-provided syntax highlighting.
    var Syntax SyntaxPalette
    /// Default foreground and background roles for change displays.
    var Diff DiffPalette
    /// Default standard and bright terminal color tables.
    var Ansi AnsiPalette
    internal var HighContrast bool
    internal prop NativeLook bool { get -> Variant == nativeVariant }
    /// Current absolute text scale. Use WithTextScale to change it.
    var TextScaleFactor float64 = 1.0
    /// Applied platform scale, preserved by consumer copy-update expressions.
    var PlatformTextScaleFactor float64 = 1.0
    /// UI font family. Resolved by Goo or supplied by the host through FontSource.
    var FontFamily string
    /// Heading font family.
    var HeadingFontFamily string
    /// Numeric and code font family.
    var MonoFontFamily string
    /// UI text size in logical pixels.
    var FontSize float64
    /// General text weight.
    var FontWeight int32
    /// Control height in logical pixels. Use 28 for compact controls.
    var ControlHeight float64
    /// Control corner radius in logical pixels.
    var ControlRadius float64?
    /// Panel corner radius in logical pixels.
    var PanelRadius float64?
    /// Border width in logical pixels.
    var BorderWidth float64
    /// Base spacing unit. Use multiples for 4, 8, 12, 16, and 24 pixel spacing.
    var Spacing float64
    /// Color transition duration in milliseconds. Zero disables transitions.
    var TransitionMs float64
    internal var ReducedMotion bool
    /// Body line height.
    var LineHeight float64 = 1.4
    /// Label size.
    var LabelFontSize float64 = 12.0
    /// Label weight.
    var LabelFontWeight int32 = 500
    /// Caption size.
    var CaptionFontSize float64 = 12.0
    /// Caption weight.
    var CaptionFontWeight int32 = 400
    /// Heading size.
    var HeadingFontSize float64 = 20.0
    /// Heading weight.
    var HeadingFontWeight int32 = 600
    /// Minimum action width.
    var ControlMinWidth float64 = 64.0
    /// Horizontal control padding.
    var ControlPadding float64 = 12.0
    /// Control content gap.
    var ControlGap float64 = 8.0
    /// Panel content padding.
    var PanelPadding float64 = 16.0
    /// Modal backdrop paint.
    var BackdropColor Color = Color.Rgba(0, 0, 0, 204)
    /// Window tint behind tab strips, rails and title areas. Nil keeps an opaque window. Set by WithGlass.
    /// Undecorated windows clear to transparent, so paint GlassStyle on the root.
    var GlassColor Color?
    /// Horizontal inset of list, tree and grid rows. Nonzero also rounds tree and grid rows.
    var RowInset float64
    /// Selected-row look in lists, trees, grids and rails.
    var Selection SelectionStyle
    /// Shape of switches, sliders, radio buttons, text fields, buttons and combo boxes.
    var Controls ControlStyle
    /// Light 1 px top edge of glass, panels and overlays. Set by WithGlass.
    var HighlightColor Color
    /// Dark 1 px outline that separates glass and panels from any wallpaper. Set by WithGlass.
    var HairlineColor Color
    /// Solid scrollbar thumb. Zero keeps a half-opacity MutedTextColor thumb that turns AccentColor on hover.
    var ScrollbarColor Color
    /// Backdrop blur radius of glass overlays in logical pixels. Defaults to 24.
    var OverlayBlur float64 = 24.0
    /// Returns this theme's light or dark variant, given true for dark. Nil means a fixed theme.
    /// An attached theme with a Variant follows Theme.SetMode. The built-in themes also keep colors set on the attached theme
    /// and follow the system accent. A custom Variant's output is used verbatim, accent included. It can read PlatformPreferences itself.
    var Variant Func[bool, Theme]?
    internal var VariantDark bool
    internal var SystemAccent ValueTuple[Color, Color, Color, Color]?
    /// Widget layout and arrow-key direction. Auto lays out left to right. Give the app root the same Direction.
    var Direction Direction

    internal prop RightToLeft bool { get -> Direction == Goo.Direction.RightToLeft }

    /// Number and date culture. Nil follows CultureInfo.CurrentCulture.
    var Culture CultureInfo?
    /// Translates default widget text. Receives the English text, where {0} and {1} mark inserted values. Nil keeps English.
    var Translate Func[string, string?]?

    internal prop Locale CultureInfo { get -> Culture ?? CultureInfo.CurrentCulture }

    /// Default widget text through Translate.
    public func Text(english string) string -> Translate?.Invoke(english) ?? english

    internal func Text(english string, value object) string -> String.Format(Locale, Text(english), value)

    internal func Text(english string, first object, second object) string ->
        String.Format(Locale, Text(english), first, second)
}
