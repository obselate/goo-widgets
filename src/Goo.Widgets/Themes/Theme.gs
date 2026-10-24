package Goo.Widgets

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Feedback
import Goo.Widgets.Inputs
import System
import System.Runtime.CompilerServices

/// Selects the built-in window appearance policy.
public enum ThemeMode {
    System;
    Light;
    Dark
}

/// Selects absolute control metrics for a subtree.
public enum Density {
    Standard;
    Compact;
    Comfortable;
    Touch
}

/// Rounded widget presets in Ink, Bone, and GitHub Dark palettes. Copy with `with` to customize.
public data struct Theme {
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
    /// Panel borders and dividers.
    var BorderColor Color
    /// Input borders.
    var InputBorderColor Color
    /// Primary text.
    var TextColor Color
    /// Secondary text.
    var MutedTextColor Color
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
    var SunkenColor Color
    var ActiveColor Color
    var StrongBorderColor Color
    var SubtleTextColor Color
    var DisabledTextColor Color
    var LinkColor Color
    var FocusColor Color
    var InfoFillColor Color
    var SuccessFillColor Color
    var WarningFillColor Color
    var DangerQuietColor Color
    var RadiusSm float64 = 4.0
    var RadiusMd float64 = 8.0
    var RadiusLg float64 = 12.0
    var RadiusXl float64 = 20.0
    var ElevationSm BoxShadow
    var ElevationMd BoxShadow
    var ElevationLg BoxShadow
    var DisplayFontSize float64 = 40.0
    var H1FontSize float64 = 32.0
    var H2FontSize float64 = 28.0
    var H3FontSize float64 = 24.0
    var H4FontSize float64 = 20.0
    var H5FontSize float64 = 18.0
    var H6FontSize float64 = 16.0
    var SubtitleFontSize float64 = 16.0
    var OverlineFontSize float64 = 10.0
    var CodeFontSize float64 = 14.0
    var MotionFastMs float64 = 120.0
    var MotionNormalMs float64 = 200.0
    var MotionSlowMs float64 = 320.0
    var SpinnerPeriodMs float64 = 1000.0
    var SeriesPalette[]Color
    var ColorBlindPalette[]Color
    var Syntax SyntaxPalette
    var Diff DiffPalette
    var Ansi AnsiPalette
    internal var HighContrast bool
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
    var ControlRadius float64
    /// Panel corner radius in logical pixels.
    var PanelRadius float64
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

    shared {
        internal let Key Context[Theme] = Context[Theme]()
        private let attachments ConditionalWeakTable[Window, ThemeAttachment] =
        ConditionalWeakTable[Window, ThemeAttachment]()

        /// Neutral metrics with Bone colors. This is a fixed light snapshot.
        public prop Default Theme {
            get -> Bone with{
                FontFamily = "",
                HeadingFontFamily = "",
                MonoFontFamily = "monospace",
                FontSize = 14.0,
                FontWeight = 400,
                ControlRadius = 6.0,
                PanelRadius = 10.0,
            }
        }

        /// Attaches System appearance, preserving an app-set background and following the system accent.
        public func Attach(window Window) {
            let state = attachment(window)
            state.Value = Default
            state.Mode = ThemeMode.System
            state.Fixed = false
            state.Apply(window.Preferences)
        }

        /// Attaches an exact palette and metrics, independent of system appearance.
        public func Attach(window Window, value Theme) {
            let state = attachment(window)
            state.Value = value
            state.Fixed = true
            state.Apply(window.Preferences)
        }

        /// Replaces palette roles while preserving the current typography and metrics.
        public func SetMode(window Window, mode ThemeMode) {
            let state = attachment(window)
            state.Mode = mode
            state.Fixed = false
            state.Apply(window.Preferences)
        }

        /// Reads the nearest retained theme during an owned build or virtual callback.
        public func Read() Theme {
            let window = Key.Window
            if !attachments.TryGetValue(window, out var state) {
                Attach(window)
            }
            return Key.Read()
        }

        /// Reads the window snapshot, not a subtree override.
        public func Read(window Window) Theme {
            if !Key.TryRead(window, out var value) {
                Attach(window)
                return Key.Read(window)
            }
            return value
        }

        private func attachment(window Window) ThemeAttachment {
            Key.TryRead(window, out var value)
            if attachments.TryGetValue(window, out var state) {
                return state
            }
            let created = ThemeAttachment(window)
            attachments.Add(window, created)
            window.PreferencesChanged += created.Apply
            return created
        }

        /// GitHub Dark palette with Goo's typography and rounded controls.
        public prop GitHubDark Theme {
            get -> Ink with{
                CanvasColor = "#0d1117",
                PanelColor = "#161b22",
                RaisedColor = "#21262d",
                OverlayColor = "#1c2128",
                FieldColor = "#0d1117",
                HoverColor = "#21262d",
                PressedColor = "#161b22",
                BorderColor = Color.Parse("#21262d"),
                InputBorderColor = "#89929b",
                TextColor = "#ecf2f8",
                MutedTextColor = "#c6cdd5",
                FaintTextColor = "#89929b",
                AccentColor = "#77bdfb",
                OnAccentColor = "#0d1117",
                AccentHoverColor = "#a2d2fb",
                AccentPressedColor = "#77bdfb",
                InfoColor = "#cea5fb",
                SuccessColor = "#7ce38b",
                WarningColor = "#faa356",
                DangerColor = "#fa7970",
                DangerFillColor = "#fa7970",
                DangerHoverColor = "#fa7970",
                SunkenColor = "#010409",
                ActiveColor = "#1c334b",
                StrongBorderColor = "#89929b",
                SubtleTextColor = "#c6cdd5",
                DisabledTextColor = "#89929b",
                LinkColor = "#77bdfb",
                FocusColor = "#77bdfb",
                InfoFillColor = "#2c2c3c",
                SuccessFillColor = "#223329",
                WarningFillColor = "#312b28",
                DangerQuietColor = "#312629",
            }
        }

        /// Dark Ink palette. Each access returns an independent value.
        public prop Ink Theme {
            get -> Theme{
                CanvasColor: "#0c0d11",
                PanelColor: "#13151b",
                RaisedColor: "#1a1d24",
                OverlayColor: "#1f222b",
                FieldColor: "#0f1116",
                HoverColor: "#262a34",
                PressedColor: "#1e2129",
                BorderColor: Color.Parse("#272b35"),
                InputBorderColor: "#6b7282",
                TextColor: "#ececf1",
                MutedTextColor: "#b4b9c4",
                FaintTextColor: "#8e95a3",
                AccentColor: "#2f67e0",
                OnAccentColor: "#ffffff",
                AccentHoverColor: "#3a6ee6",
                AccentPressedColor: "#2858c4",
                InfoColor: "#86b0ff",
                SuccessColor: "#5fcf8a",
                WarningColor: "#f0b450",
                DangerColor: "#ff8577",
                DangerFillColor: "#c93a32",
                DangerHoverColor: "#ce3f37",
                SunkenColor: Color.Rgba(255, 255, 255, 12),
                ActiveColor: "#1b2a45",
                StrongBorderColor: "#878e9d",
                SubtleTextColor: "#b4b9c4",
                DisabledTextColor: "#606674",
                LinkColor: "#8cb2ff",
                FocusColor: "#7aa5ff",
                InfoFillColor: "#15213a",
                SuccessFillColor: "#11281d",
                WarningFillColor: "#2b2213",
                DangerQuietColor: "#33191b",
                RadiusMd: 6.0,
                RadiusLg: 10.0,
                RadiusXl: 14.0,
                LineHeight: 1.43,
                LabelFontSize: 13.0,
                OverlineFontSize: 11.0,
                CodeFontSize: 13.0,
                ElevationSm: BoxShadow{OffsetY: 1.0, Blur: 2.0, Color: Color.Black.WithAlpha(0.50)},
                ElevationMd: BoxShadow{OffsetY: 8.0, Blur: 24.0, Color: Color.Black.WithAlpha(0.45)},
                ElevationLg: BoxShadow{OffsetY: 20.0, Blur: 48.0, Color: Color.Black.WithAlpha(0.55)},
                SeriesPalette: []Color{"#6fa6de", "#6cbc5f", "#f9a238", "#bd95dc", "#ef6a4d", "#58bdc3", "#df89ae", "#b9bd70"},
                ColorBlindPalette: []Color{"#e69f00", "#56b4e9", "#009e73", "#f0e442", "#0072b2", "#d55e00", "#cc79a7", "#eeeeee"},
                Syntax: SyntaxPalette{Keyword: "#bd95dc", String: "#6cbc5f", Number: "#f9a238", Comment: "#9099a8", Function: "#6fa6de", Type: "#58bdc3", Punctuation: "#b8bfc9"},
                Diff: DiffPalette{Added: "#6cbc5f", Removed: "#ef6a4d", Changed: "#f9a238", AddedFill: "#11281d", RemovedFill: "#33191b", ChangedFill: "#2b2213"},
                Ansi: AnsiPalette{
                    Colors: []Color{"#11141b", "#ef6a4d", "#6cbc5f", "#f9a238", "#6fa6de", "#bd95dc", "#58bdc3", "#b8bfc9"},
                    BrightColors: []Color{"#9099a8", "#f18b75", "#8fd184", "#ffbd69", "#9bc2ec", "#d5b5ed", "#87d7dc", "#eceded"},
                },
                FontFamily: "Vend Sans",
                HeadingFontFamily: "Vend Sans",
                MonoFontFamily: "JetBrains Mono",
                FontSize: 14.0,
                FontWeight: 400,
                ControlHeight: 32.0,
                ControlRadius: 6.0,
                PanelRadius: 10.0,
                BorderWidth: 1.0,
                Spacing: 4.0,
                TransitionMs: 0.0,
            }
        }

        /// Light Bone palette, including darker semantic text colors for light surfaces.
        public prop Bone Theme {
            get -> Ink with{
                CanvasColor = "#f3f3f1",
                PanelColor = "#fafaf9",
                RaisedColor = "#ffffff",
                OverlayColor = "#ffffff",
                FieldColor = "#ffffff",
                HoverColor = "#e8e8e5",
                PressedColor = "#dededa",
                BorderColor = Color.Parse("#e0e0dc"),
                InputBorderColor = "#83868d",
                TextColor = "#17181c",
                MutedTextColor = "#4b4e57",
                FaintTextColor = "#61646d",
                AccentHoverColor = "#2a5dcc",
                AccentPressedColor = "#244fae",
                InfoColor = "#2456c4",
                SuccessColor = "#21703f",
                WarningColor = "#8a5a00",
                DangerColor = "#b8322a",
                DangerHoverColor = "#b0322b",
                SunkenColor = "#ebebe7",
                ActiveColor = "#e4ecfc",
                StrongBorderColor = "#6a6d75",
                SubtleTextColor = "#4b4e57",
                DisabledTextColor = "#9a9ca3",
                LinkColor = "#2456c4",
                FocusColor = "#2456c4",
                InfoFillColor = "#e6eefc",
                SuccessFillColor = "#e3f2e8",
                WarningFillColor = "#f8eedb",
                DangerQuietColor = "#fbe6e3",
                ElevationSm = BoxShadow{OffsetY: 1.0, Blur: 2.0, Color: Color.Rgba(16, 18, 24, 20)},
                ElevationMd = BoxShadow{OffsetY: 6.0, Blur: 20.0, Color: Color.Rgba(16, 18, 24, 26)},
                ElevationLg = BoxShadow{OffsetY: 16.0, Blur: 40.0, Color: Color.Rgba(16, 18, 24, 36)},
                SeriesPalette = []Color{"#245b91", "#30672a", "#805019", "#71468c", "#a43723", "#19666c", "#933f68", "#62651d"},
                ColorBlindPalette = []Color{"#986800", "#24769c", "#007450", "#777000", "#0072b2", "#b64d00", "#9b4d79", "#090b10"},
                Syntax = SyntaxPalette{Keyword: "#71468c", String: "#30672a", Number: "#805019", Comment: "#5e6676", Function: "#245b91", Type: "#19666c", Punctuation: "#4a5161"},
                Diff = DiffPalette{Added: "#30672a", Removed: "#a43723", Changed: "#805019", AddedFill: "#e3f2e8", RemovedFill: "#fbe6e3", ChangedFill: "#f8eedb"},
                Ansi = AnsiPalette{
                    Colors: []Color{"#090b10", "#a43723", "#30672a", "#805019", "#245b91", "#71468c", "#19666c", "#5e6676"},
                    BrightColors: []Color{"#4a5161", "#b84c36", "#3d7b35", "#946025", "#306ea9", "#8555a3", "#247b81", "#f5f6f7"},
                },
            }
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
    public func WithHighContrast() Theme -> this with{
        HighContrast = true,
        BorderColor = TextColor,
        InputBorderColor = TextColor,
        StrongBorderColor = TextColor,
        MutedTextColor = TextColor,
        FaintTextColor = TextColor,
        SubtleTextColor = TextColor,
        DisabledTextColor = TextColor,
        FocusColor = TextColor,
        BorderWidth = Math.Max(2.0, BorderWidth),
    }

    /// Sets absolute text and minimum-control scale without compounding.
    public func WithTextScale(scale float64) Theme {
        if !Double.IsFinite(scale) || scale <= 0.0 {
            throw ArgumentOutOfRangeException("scale")
        }
        let ratio = scale / TextScaleFactor
        return this with{
            TextScaleFactor = scale,
            FontSize = FontSize * ratio,
            LabelFontSize = LabelFontSize * ratio,
            CaptionFontSize = CaptionFontSize * ratio,
            HeadingFontSize = HeadingFontSize * ratio,
            DisplayFontSize = DisplayFontSize * ratio,
            H1FontSize = H1FontSize * ratio,
            H2FontSize = H2FontSize * ratio,
            H3FontSize = H3FontSize * ratio,
            H4FontSize = H4FontSize * ratio,
            H5FontSize = H5FontSize * ratio,
            H6FontSize = H6FontSize * ratio,
            SubtitleFontSize = SubtitleFontSize * ratio,
            OverlineFontSize = OverlineFontSize * ratio,
            CodeFontSize = CodeFontSize * ratio,
            ControlHeight = ControlHeight * ratio,
            ControlMinWidth = ControlMinWidth * ratio,
        }
    }

    /// Fresh root declarations. Place BasedOn before application overrides.
    public prop CanvasStyle Style {
        get -> Style{
            BackgroundColor: CanvasColor,
            Color: TextColor,
            FontFamily: FontFamily,
            FontSize: FontSize,
            FontWeight: FontWeight,
            LineHeight: LineHeight,
        }
    }

    /// Fresh panel declarations.
    public prop PanelStyle Style {
        get -> Style{
            BackgroundColor: PanelColor,
            BorderColor: BorderColor,
            BorderWidth: BorderWidth,
            BorderRadius: PanelRadius
        }
    }

    /// Rounded neutral action with visible keyboard focus.
    public prop Button ActionButton {
        get -> ActionButton{
            BackgroundColor: RaisedColor,
            TextColor: TextColor,
            BorderColor: InputBorderColor,
            HoverBackgroundColor: HoverColor,
            ActiveBackgroundColor: PressedColor,
            DisabledBackgroundColor: PanelColor,
            DisabledTextColor: FaintTextColor,
            Height: ControlHeight,
            MinWidth: ControlMinWidth,
            PaddingHorizontal: ControlPadding,
            FontFamily: FontFamily,
            FontSize: FontSize,
            FontWeight: LabelFontWeight,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius,
            TransitionMs: TransitionMs,
            ActiveTransform: PanelTransform{},
        }
    }

    /// Primary action with contrasting text.
    public prop PrimaryButton ActionButton {
        get -> Button with{
            BackgroundColor = AccentColor,
            BorderColor = AccentColor,
            TextColor = OnAccentColor,
            HoverBackgroundColor = AccentHoverColor,
            ActiveBackgroundColor = AccentPressedColor,
        }
    }

    /// Transparent action that gains a neutral surface on hover.
    public prop GhostButton ActionButton {
        get -> Button with{BackgroundColor = Color.Transparent, BorderColor = Color.Transparent}
    }

    /// Transparent action with a visible border.
    public prop OutlineButton ActionButton {
        get -> Button with{BackgroundColor = Color.Transparent}
    }

    /// Quiet action on a sunken surface.
    public prop SubtleButton ActionButton {
        get -> Button with{BackgroundColor = SunkenColor, BorderColor = Color.Transparent}
    }

    /// Link-colored action with no resting border or fill.
    public prop LinkButton ActionButton {
        get -> GhostButton with{TextColor = LinkColor}
    }

    /// Destructive action with contrasting text.
    public prop DangerButton ActionButton {
        get -> Button with{
            BackgroundColor = DangerFillColor,
            BorderColor = DangerFillColor,
            TextColor = OnAccentColor,
            HoverBackgroundColor = DangerHoverColor,
            ActiveBackgroundColor = DangerFillColor,
        }
    }

    /// Single-line field with sentence-case labels and palette-aware validation colors.
    public prop TextField TextField {
        get -> TextField{
            BackgroundColor: FieldColor,
            TextColor: TextColor,
            MutedTextColor: MutedTextColor,
            BorderColor: InputBorderColor,
            InvalidColor: DangerColor,
            DisabledBackgroundColor: SunkenColor,
            DisabledTextColor: DisabledTextColor,
            EntryHeight: ControlHeight,
            PaddingHorizontal: ControlPadding,
            FontFamily: FontFamily,
            FontSize: FontSize,
            LabelFontSize: LabelFontSize,
            LabelFontWeight: LabelFontWeight,
            LabelTextTransform: TextTransform.None,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius,
            TransitionMs: TransitionMs,
        }
    }

    /// Rounded checkbox with the palette's accent fill and contrasting mark.
    public prop Checkbox Checkbox {
        get -> Checkbox{
            LabelColor: TextColor,
            LabelFontSize: FontSize,
            LabelFontWeight: FontWeight,
            LabelGap: ControlGap,
            Size: Spacing * 5.0,
            MarkSize: Spacing * 3.5,
            BackgroundColor: FieldColor,
            BorderColor: InputBorderColor,
            CheckedBackgroundColor: AccentColor,
            CheckedBorderColor: AccentColor,
            MarkColor: OnAccentColor,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius / 2.0,
            TransitionMs: TransitionMs,
        }
    }

    /// Rounded slider track with a palette-aware thumb. Mount with a stable Cell key.
    public prop Slider SliderInput {
        get -> SliderInput{
            LabelColor: TextColor,
            ValueColor: MutedTextColor,
            LabelFontSize: LabelFontSize,
            ValueFontSize: CaptionFontSize,
            Height: ControlHeight,
            TrackThickness: Spacing * 2.0,
            TrackRadius: Spacing,
            TrackColor: BorderColor,
            FillColor: AccentColor,
            ThumbSize: Spacing * 5.0,
            ThumbRadius: Spacing * 2.5,
            ThumbBorderWidth: BorderWidth,
            ThumbColor: AccentColor,
            ThumbBorderColor: OnAccentColor,
        }
    }

    /// Status banner that resolves semantic colors from its tone.
    public prop Banner Banner {
        get -> Banner{
            MinHeight: ControlHeight,
            PaddingHorizontal: ControlPadding,
            PaddingVertical: Spacing * 2.0,
            FontFamily: FontFamily,
            FontSize: FontSize,
            FontWeight: FontWeight,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius,
            TransitionMs: TransitionMs,
        }
    }

    /// Applies absolute density metrics without scaling inherited custom values.
    internal func WithDensity(density Density) Theme {
        let height = switch density {
            case Density.Compact: 28.0
            case Density.Comfortable: 40.0
            case Density.Touch: 44.0
            default: 32.0
        }
        let padding = switch density {
            case Density.Compact: 8.0
            case Density.Comfortable: 16.0
            case Density.Touch: 16.0
            default: 12.0
        }
        return this with{
            ControlHeight = height * TextScaleFactor,
            ControlPadding = padding,
            ControlGap = if density == Density.Compact {
                4.0
            } else {
                8.0
            },
        }
    }

    /// Fresh keyboard focus declarations. Use an inset offset for clipped targets.
    public prop FocusStyle Style {
        get -> Style{OutlineWidth: 2.0, OutlineColor: FocusColor, OutlineOffset: 2.0}
    }

    /// Fresh overlay scrollbar with real pointer-controlled track and thumb parts.
    public prop Scrollbar Scrollbar {
        get -> Goo
            .Scrollbar{
            Thickness: 6.0,
            HitThickness: 12.0,
            Inset: 2.0,
            MinThumbLength: 24.0,
            HideDelayMs: 1000.0,
            FadeMs: ReducedMotion ? 0.0: 250.0,
            ReserveSpace: false,
            Track: Container{BackgroundColor: Color.Transparent},
            Thumb: Container{
                BackgroundColor: MutedTextColor.WithAlpha(0.5),
                BorderRadius: 3.0,
                Hover: Style{BackgroundColor: AccentColor},
                Active: Style{BackgroundColor: AccentColor},
            },
        }
    }
}

internal sealed class ThemeAttachment {
    private let window Window
    private var lastBackground Color = Color.White
    internal var Value Theme = Theme.Default
    internal var Mode ThemeMode
    internal var Fixed bool

    internal init(owner Window) {
        window = owner
    }

    internal func Apply(preferences PlatformPreferences) {
        var value = Value with{ReducedMotion = preferences.ReducedMotion == true}
        if !Fixed {
            let palette = if Mode == ThemeMode.Dark
            || (Mode == ThemeMode.System && preferences.Theme == SystemTheme.Dark) {
                Theme.Ink
            } else {
                Theme.Bone
            }
            value = value with{
                CanvasColor = palette.CanvasColor,
                PanelColor = palette.PanelColor,
                RaisedColor = palette.RaisedColor,
                OverlayColor = palette.OverlayColor,
                FieldColor = palette.FieldColor,
                HoverColor = palette.HoverColor,
                PressedColor = palette.PressedColor,
                BorderColor = palette.BorderColor,
                InputBorderColor = palette.InputBorderColor,
                TextColor = palette.TextColor,
                MutedTextColor = palette.MutedTextColor,
                FaintTextColor = palette.FaintTextColor,
                AccentColor = palette.AccentColor,
                OnAccentColor = palette.OnAccentColor,
                AccentHoverColor = palette.AccentHoverColor,
                AccentPressedColor = palette.AccentPressedColor,
                InfoColor = palette.InfoColor,
                SuccessColor = palette.SuccessColor,
                WarningColor = palette.WarningColor,
                DangerColor = palette.DangerColor,
                DangerFillColor = palette.DangerFillColor,
                DangerHoverColor = palette.DangerHoverColor,
                SunkenColor = palette.SunkenColor,
                ActiveColor = palette.ActiveColor,
                StrongBorderColor = palette.StrongBorderColor,
                SubtleTextColor = palette.SubtleTextColor,
                DisabledTextColor = palette.DisabledTextColor,
                LinkColor = palette.LinkColor,
                FocusColor = palette.FocusColor,
                InfoFillColor = palette.InfoFillColor,
                SuccessFillColor = palette.SuccessFillColor,
                WarningFillColor = palette.WarningFillColor,
                DangerQuietColor = palette.DangerQuietColor,
                ElevationSm = palette.ElevationSm,
                ElevationMd = palette.ElevationMd,
                ElevationLg = palette.ElevationLg,
                SeriesPalette = palette.SeriesPalette,
                ColorBlindPalette = palette.ColorBlindPalette,
                Syntax = palette.Syntax,
                Diff = palette.Diff,
                Ansi = palette.Ansi,
            }
            if Mode == ThemeMode.System {
                if let accent = preferences.AccentColor {
                    value.AccentColor = accent
                }
            }
        }
        if preferences.HighContrast == true {
            value = value.WithHighContrast()
        }
        let scale = float64(preferences.TextScaleFactor ?? 1.0F)
        value = value.WithTextScale(value.TextScaleFactor * scale / value.PlatformTextScaleFactor)
        value.PlatformTextScaleFactor = scale
        if preferences.ReducedMotion == true {
            value.TransitionMs = 0.0
            value.MotionFastMs = 0.0
            value.MotionNormalMs = 0.0
            value.MotionSlowMs = 0.0
            value.SpinnerPeriodMs = 0.0
        }
        Theme.Key.Set(window, value)
        var background = window.Background
        if Fixed || background == lastBackground {
            background = value.CanvasColor
            lastBackground = background
        }
        window.SetColors(background, value.TextColor)
    }
}
