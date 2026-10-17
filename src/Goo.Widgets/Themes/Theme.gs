package Goo.Widgets

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Feedback
import Goo.Widgets.Inputs
import System
import System.Runtime.CompilerServices

/// Selects the built-in window appearance policy.
public enum ThemeMode { System; Light; Dark }

/// Selects absolute control metrics for a subtree.
public enum Density { Standard; Compact; Comfortable; Touch }

/// Rounded widget presets in Goo Light, Goo Dark, and GitHub Dark palettes. Copy with `with` to customize.
public data struct Theme {
    /// Window background.
    var CanvasColor Color
    /// Panels and popovers.
    var PanelColor Color
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
                PanelRadius = 8.0,
            }
        }

        /// Attaches System appearance before the window opens.
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
            Read(window)
            let value = Key.Read()
            return if window.Preferences.ReducedMotion == true {
                value with{TransitionMs = 0.0}
            } else {
                value
            }
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

        /// Goo Dark palette. Each access returns an independent value.
        public prop GooDark Theme {
            get -> Ink
        }

        /// Goo Light palette. Each access returns an independent value.
        public prop GooLight Theme {
            get -> Bone
        }

        /// GitHub Dark palette with Goo's typography and rounded controls.
        public prop GitHubDark Theme {
            get -> GooDark with{
                CanvasColor = "#0d1117",
                PanelColor = "#161b22",
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
            }
        }

        /// Dark Ink palette. Each access returns an independent value.
        public prop Ink Theme {
            get -> Theme{
                CanvasColor: "#090b10",
                PanelColor: "#11141b",
                FieldColor: "#090b10",
                HoverColor: "#232834",
                PressedColor: "#181c25",
                BorderColor: Color.Parse("#333947"),
                InputBorderColor: "#6b7385",
                TextColor: "#eceded",
                MutedTextColor: "#b8bfc9",
                FaintTextColor: "#9099a8",
                AccentColor: "#478ad1",
                OnAccentColor: "#090b10",
                AccentHoverColor: "#6fa6de",
                AccentPressedColor: "#3e80c5",
                InfoColor: "#6fa6de",
                SuccessColor: "#6cbc5f",
                WarningColor: "#f9a238",
                DangerColor: "#ef6a4d",
                DangerFillColor: "#ef6a4d",
                DangerHoverColor: "#f18b75",
                FontFamily: "Vend Sans",
                HeadingFontFamily: "Space Grotesk",
                MonoFontFamily: "JetBrains Mono",
                FontSize: 16.0,
                FontWeight: 500,
                ControlHeight: 32.0,
                ControlRadius: 12.0,
                PanelRadius: 20.0,
                BorderWidth: 1.0,
                Spacing: 4.0,
                TransitionMs: 0.0,
            }
        }

        /// Light Bone palette, including darker semantic text colors for light surfaces.
        public prop Bone Theme {
            get -> Ink with{
                CanvasColor = "#eceded",
                PanelColor = "#f5f6f7",
                FieldColor = "#eceded",
                HoverColor = "#e0e3e7",
                PressedColor = "#d8dce2",
                BorderColor = Color.Parse("#c3c8d0"),
                InputBorderColor = "#7f8795",
                TextColor = "#090b10",
                MutedTextColor = "#4a5161",
                FaintTextColor = "#5e6676",
                InfoColor = "#245b91",
                SuccessColor = "#30672a",
                WarningColor = "#805019",
                DangerColor = "#a43723",
            }
        }
    }

    /// Fresh root declarations. Place BasedOn before application overrides.
    public prop CanvasStyle Style {
        get -> Style{
            BackgroundColor: CanvasColor,
            Color: TextColor,
            FontFamily: FontFamily,
            FontSize: FontSize,
            FontWeight: FontWeight
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
            BackgroundColor: PanelColor,
            TextColor: TextColor,
            BorderColor: InputBorderColor,
            HoverBackgroundColor: HoverColor,
            ActiveBackgroundColor: PressedColor,
            DisabledBackgroundColor: PanelColor,
            DisabledTextColor: FaintTextColor,
            Height: ControlHeight,
            MinWidth: 64.0,
            PaddingHorizontal: ControlPadding,
            FontFamily: FontFamily,
            FontSize: FontSize,
            FontWeight: 600,
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
            MutedTextColor: TextColor,
            BorderColor: InputBorderColor,
            InvalidColor: DangerColor,
            DisabledBackgroundColor: PanelColor,
            DisabledTextColor: FaintTextColor,
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
            Size: 18.0,
            MarkSize: 12.0,
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
            LabelFontSize: FontSize,
            ValueFontSize: FontSize - 2.0,
            Height: ControlHeight,
            TrackThickness: 6.0,
            TrackRadius: 3.0,
            TrackColor: BorderColor,
            FillColor: AccentColor,
            ThumbSize: 18.0,
            ThumbRadius: 9.0,
            ThumbBorderWidth: BorderWidth,
            ThumbColor: AccentColor,
            ThumbBorderColor: OnAccentColor,
        }
    }

    /// Status banner on the palette's panel surface. Override BorderColor for a semantic status.
    public prop Banner Banner {
        get -> Banner{
            BackgroundColor: PanelColor,
            TextColor: TextColor,
            BorderColor: BorderColor,
            MinHeight: ControlHeight,
            PaddingHorizontal: ControlPadding,
            PaddingVertical: Spacing * 2.0,
            FontFamily: FontFamily,
            FontSize: FontSize - 2.0,
            FontWeight: FontWeight,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius,
            TransitionMs: TransitionMs,
        }
    }

    /// Applies absolute density metrics without scaling inherited custom values.
    public func WithDensity(density Density) Theme {
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
            ControlHeight = height,
            ControlPadding = padding,
            ControlGap = if density == Density.Compact { 4.0 } else { 8.0 },
        }
    }

    /// Fresh keyboard focus declarations. Use an inset offset for clipped targets.
    public prop FocusStyle Style {
        get -> Style{OutlineWidth: 2.0, OutlineColor: AccentColor, OutlineOffset: 2.0}
    }

    /// Fresh overlay scrollbar with real pointer-controlled track and thumb parts.
    public prop Scrollbar Scrollbar {
        get -> Goo.Scrollbar{
            Thickness: 6.0,
            HitThickness: 12.0,
            Inset: 2.0,
            MinThumbLength: 24.0,
            HideDelayMs: 1000.0,
            FadeMs: if Key.Window.Preferences.ReducedMotion == true { 0.0 } else { 250.0 },
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
    internal var Value Theme = Theme.Default
    internal var Mode ThemeMode
    internal var Fixed bool

    internal init(owner Window) {
        window = owner
    }

    internal func Apply(preferences PlatformPreferences) {
        var value = Value
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
            }
        }
        if preferences.ReducedMotion == true {
            value.TransitionMs = 0.0
        }
        Theme.Key.Set(window, value)
        window.SetColors(value.CanvasColor, value.TextColor)
    }
}
