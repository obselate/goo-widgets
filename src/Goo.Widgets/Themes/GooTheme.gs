package Goo.Widgets.Themes

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Feedback
import Goo.Widgets.Inputs

/// Goo's rounded widget presets in Ink and Bone palettes. Copy with `with` to customize.
public data struct GooTheme {
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

    shared {
        /// Dark Ink palette. Each access returns an independent value.
        public prop Ink GooTheme {
            get -> GooTheme{
                CanvasColor: "#090b10",
                PanelColor: "#11141b",
                FieldColor: "#090b10",
                HoverColor: "#232834",
                PressedColor: "#181c25",
                BorderColor: "#333947",
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
        public prop Bone GooTheme {
            get -> Ink with{
                CanvasColor = "#eceded",
                PanelColor = "#f5f6f7",
                FieldColor = "#eceded",
                HoverColor = "#e0e3e7",
                PressedColor = "#d8dce2",
                BorderColor = "#c3c8d0",
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

    /// Rounded neutral action with no pressed scaling or focus highlight.
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
            PaddingHorizontal: 14.0,
            FontFamily: FontFamily,
            FontSize: FontSize,
            FontWeight: 600,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius,
            TransitionMs: TransitionMs,
            ActiveTransform: PanelTransform{},
        }
    }

    /// Blue primary action with Ink text.
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

    /// Red-orange destructive action with Ink text.
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
            PaddingHorizontal: 10.0,
            FontFamily: FontFamily,
            FontSize: FontSize,
            LabelFontSize: FontSize,
            LabelFontWeight: FontWeight,
            LabelTextTransform: TextTransform.None,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius,
            TransitionMs: TransitionMs,
        }
    }

    /// Rounded checkbox with blue selection and an Ink mark.
    public prop Checkbox Checkbox {
        get -> Checkbox{
            LabelColor: TextColor,
            LabelFontSize: FontSize,
            LabelFontWeight: FontWeight,
            LabelGap: 9.0,
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

    /// Rounded slider track with a circular Bone thumb. Mount with a stable Cell key.
    public prop Slider SliderInput {
        get -> SliderInput{
            LabelColor: TextColor,
            ValueColor: MutedTextColor,
            LabelFontSize: FontSize,
            ValueFontSize: FontSize - 2.0,
            Height: 22.0,
            TrackThickness: 6.0,
            TrackRadius: 3.0,
            TrackColor: BorderColor,
            FillColor: AccentColor,
            ThumbSize: 18.0,
            ThumbRadius: 9.0,
            ThumbBorderWidth: BorderWidth,
            ThumbColor: "#eceded",
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
            PaddingHorizontal: 10.0,
            PaddingVertical: 8.0,
            FontFamily: FontFamily,
            FontSize: FontSize - 2.0,
            FontWeight: FontWeight,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius,
            TransitionMs: TransitionMs,
        }
    }
}
