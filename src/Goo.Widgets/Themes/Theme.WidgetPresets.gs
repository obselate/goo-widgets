package Goo.Widgets

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Feedback
import Goo.Widgets.Inputs

public data partial struct Theme {
    /// Rounded neutral action with visible keyboard focus.
    public prop Button ActionButton {
        get -> ActionButton{
            BackgroundColor: RaisedColor,
            TextColor: TextColor,
            BorderColor: ControlStroke,
            Height: ControlHeight,
            MinWidth: ControlMinWidth,
            PaddingHorizontal: ControlPadding,
            FontFamily: FontFamily,
            FontSize: FontSize,
            FontWeight: LabelFontWeight,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius ?? Default.ControlRadius!!,
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
        get -> Button with{BackgroundColor = Color.Transparent, BorderColor = Color.Transparent, DisabledBackgroundColor = Color.Transparent}
    }

    /// Transparent action with a visible border.
    public prop OutlineButton ActionButton {
        get -> Button with{BackgroundColor = Color.Transparent, DisabledBackgroundColor = Color.Transparent}
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
            BorderColor: ControlStroke,
            InvalidColor: DangerColor,
            EntryHeight: ControlHeight,
            PaddingHorizontal: ControlPadding,
            FontFamily: FontFamily,
            FontSize: FontSize,
            LabelFontSize: LabelFontSize,
            LabelFontWeight: LabelFontWeight,
            LabelTextTransform: TextTransform.None,
            BorderWidth: BorderWidth,
            BorderRadius: ControlRadius ?? Default.ControlRadius!!,
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
            BorderRadius: (ControlRadius ?? Default.ControlRadius!!) / 2.0,
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
            BorderRadius: ControlRadius ?? Default.ControlRadius!!,
            TransitionMs: TransitionMs,
        }
    }
}
