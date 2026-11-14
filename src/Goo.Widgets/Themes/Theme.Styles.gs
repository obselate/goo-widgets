package Goo.Widgets

import Goo
import System

public data partial struct Theme {
    internal prop ChromeColor Color {
        get -> GlassColor == nil ? PanelColor: Color.Transparent
    }
    internal prop ChromeTextColor Color {
        get -> GlassColor == nil ? MutedTextColor: TextColor
    }

    internal func SelectedFill(tint Color) Color {
        if HighContrast {
            let foreground = Contrast(Color.Black, AccentColor) > Contrast(Color.White, AccentColor) ? Color.Black: Color.White
            return Legible(AccentColor, foreground == Color.Black ? Color.White: Color.Black, foreground, 7.0)
        }
        return Selection == SelectionStyle.Filled ? AccentColor: Selection == SelectionStyle.Indicator ? HoverColor: tint
    }

    internal func SelectedText(text Color, fill Color? = nil, backdrop Color? = nil) Color {
        let selected = fill ?? SelectedFill(ActiveColor)
        let surface = selected.A < 1.0F ? Mix(backdrop ?? PanelColor, selected, selected.A): selected
        let target = Contrast(Color.Black, surface) > Contrast(Color.White, surface) ? Color.Black: Color.White
        return Legible(text, target, surface, HighContrast ? 7.0: 4.5)
    }

    /// Stroke of buttons, text fields and combo boxes.
    internal prop ControlStroke Color {
        get -> Controls == ControlStyle.Fluent ? BorderColor: InputBorderColor
    }

    /// Text field border. Fluent adds a strong bottom edge.
    internal func FieldBorder(color Color, bottom Color? = nil) Edges[Color] -> Controls == ControlStyle.Fluent ?
        Edges[Color]{Top: color, Right: color, Left: color, Bottom: bottom ?? StrongBorderColor}: Edges[Color]{Top: color, Right: color, Bottom: color, Left: color}

    /// Focused text field: the focus ring, or a Fluent accent line at the bottom.
    internal prop FieldFocusStyle Style {
        get -> Controls == ControlStyle.Fluent ? Style{BackgroundColor: FieldColor, BorderColor: FieldBorder(BorderColor, AccentColor),
            BoxShadows: []BoxShadow{BoxShadow{Inset: true, OffsetY: -1.0, Color: AccentColor}}, OutlineColor: Color.Transparent}: FocusStyle
    }

    internal func ApplyInteraction(target Blob, family InteractionFamily, selected bool = false, interactive bool = true) {
        if target is Shape {
            if interactive {
                let focus = FocusStyle
                focus.BasedOn = target.FocusStyle
                target.FocusStyle = focus
            }
            target.DisabledStyle = Style{Color: DisabledTextColor, Opacity: DisabledOpacity, BasedOn: target.DisabledStyle}
            return
        }
        let field = family == InteractionFamily.Field
        let fluentField = field && Controls == ControlStyle.Fluent
        let row = family == InteractionFamily.Row || family == InteractionFamily.Toggle
        let tab = family == InteractionFamily.Tab
        if interactive {
            let fill = selected ? row ? SelectedFill(ActiveColor): ActiveColor: Color.Transparent
            let hover = fluentField ? Style{BackgroundColor: HoverColor}: field ? Style{BorderColor: StrongBorderColor}:
                Style{BackgroundColor: selected ? fill: HoverColor}
            let active = fluentField ? Style{}: field ? Style{BorderColor: AccentColor}:
                Style{BackgroundColor: selected ? fill: PressedColor}
            hover.BasedOn = target.HoverStyle
            active.BasedOn = target.ActiveStyle
            let focus = FocusStyle
            focus.BasedOn = target.FocusStyle
            target.HoverStyle = hover
            target.ActiveStyle = active
            target.FocusStyle = fluentField ? FieldFocusStyle: Style{BasedOn: focus, OutlineWidth: Math.Max(1.0, FocusRingWidth)}
            if family == InteractionFamily.Row {
                target.FocusStyle!!.OutlineOffset = -FocusRingWidth
            }
            if HighContrast {
                target.HoverStyle = Style{BasedOn: target.HoverStyle, BorderColor: StrongBorderColor}
            }
        }
        let disabled = Style{
            BackgroundColor: field || family == InteractionFamily.Toggle ? SunkenColor:
                tab ? ChromeColor: PanelColor,
            Color: DisabledTextColor,
            Opacity: DisabledOpacity,
        }
        if field { disabled.BorderColor = InputBorderColor }
        disabled.BasedOn = target.DisabledStyle
        target.DisabledStyle = disabled
    }

    internal prop InteractionTransitions []TransitionProperty {
        get -> interactionTransitions
    }

    internal prop PressTransitions []TransitionProperty { get -> pressTransitions }

    /// Accent for the Indicator pill and rail marker, kept at 3:1 against the selected row.
    internal prop IndicatorColor Color {
        get -> Legible(AccentColor, TextColor, HighContrast ? SelectedFill(ActiveColor): HoverColor, 3.0)
    }

    /// Accent bar for an Indicator row. Add it to the selected row only.
    internal func SelectionBar() Container -> Container{
        Key: "selection-bar",
        Position: PositionType.Absolute,
        Start: 0,
        Top: 0,
        Bottom: 0,
        JustifyContent: JustifyContent.Center,
        HitTestSelf: false,
        Container{Width: 3, Height: 16, BorderRadius: 1.5, BackgroundColor: IndicatorColor},
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

    /// Fresh glass window root: GlassColor in PanelRadius corners with a hairline and a top highlight.
    /// Drop the radius and border while the window is maximized.
    public prop GlassStyle Style {
        get -> Style{
            BasedOn: CanvasStyle,
            BackgroundColor: GlassColor ?? CanvasColor,
            BorderColor: HairlineColor,
            BorderWidth: BorderWidth,
            BorderRadius: PanelRadius ?? Default.PanelRadius!!,
            BoxShadows: []BoxShadow{Highlight},
        }
    }

    /// Fresh panel declarations. WithGlass themes add a hairline, a top highlight and a contact shadow.
    /// Native themes over a system material float the panel on ElevationMd.
    public prop PanelStyle Style {
        get -> Style{
            BackgroundColor: PanelColor,
            BorderColor: Glass ? HairlineColor: BorderColor,
            BorderWidth: BorderWidth,
            BorderRadius: PanelRadius ?? Default.PanelRadius!!,
            BoxShadows: Glass ? []BoxShadow{ElevationSm, Highlight}:
                GlassColor == nil ? PanelShadows: []BoxShadow{ElevationMd},
        }
    }

    /// Fresh menu, popover, tooltip and dialog declarations. WithGlass themes blur what is behind and add depth.
    public prop OverlayStyle Style {
        get -> Glass ? Style{
            BackdropBlur: OverlayBlur,
            BoxShadows: []BoxShadow{ElevationLg, ElevationSm, Highlight},
        }: Style{BoxShadows: OverlayShadows}
    }

    private prop Glass bool { get -> GlassColor != nil && !NativeLook }

    private prop Highlight BoxShadow {
        get -> BoxShadow{Inset: true, OffsetY: BorderWidth, Color: HighlightColor}
    }

    /// Fresh keyboard focus declarations. Use an inset offset for clipped targets.
    public prop FocusStyle Style {
        get -> Style{OutlineWidth: Math.Max(1.0, FocusRingWidth), OutlineColor: FocusColor, OutlineOffset: FocusRingOffset}
    }

    /// Fresh overlay scrollbar with real pointer-controlled track and thumb parts.
    public prop Scrollbar Scrollbar {
        get {
            let thumb = Container{
                BackgroundColor: ScrollbarColor == Color{} ? MutedTextColor.WithAlpha(0.5): ScrollbarColor, BorderRadius: 3.0,
                HoverStyle: Style{BackgroundColor: ScrollbarColor == Color{} ? AccentColor: ScrollbarColor},
                ActiveStyle: Style{BackgroundColor: ScrollbarColor == Color{} ? AccentColor: ScrollbarColor},
                TransitionMs: TransitionMs, TransitionEasing: Easing.EaseOut, TransitionProperties: InteractionTransitions,
            }
            (this with{Controls = ControlStyle.Standard}).ApplyInteraction(thumb, InteractionFamily.Field)
            return Goo.Scrollbar{
                Thickness: Controls == ControlStyle.Fluent ? 2.0: 6.0,
                HitThickness: 12.0,
                Inset: 2.0,
                MinThumbLength: 24.0,
                HideDelayMs: 1000.0,
                FadeMs: ReducedMotion ? 0.0: 250.0,
                ReserveSpace: false,
                Track: Container{BackgroundColor: Color.Transparent},
                Thumb: thumb,
            }
        }
    }

    shared {
        private let interactionTransitions []TransitionProperty = []TransitionProperty{TransitionProperty.BackgroundColor, TransitionProperty.BorderColor, TransitionProperty.Color}
        private let pressTransitions []TransitionProperty = []TransitionProperty{TransitionProperty.BackgroundColor, TransitionProperty.BorderColor, TransitionProperty.Color, TransitionProperty.Transform}
    }
}
