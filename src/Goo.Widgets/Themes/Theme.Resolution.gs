package Goo.Widgets

import Goo
import System
import System.Collections.Generic

public data partial struct Theme {
    internal func ResolveDefaults() Theme {
        let defaults = Default
        return this with{
            CanvasColor = CanvasColor == Color{} ? defaults.CanvasColor: CanvasColor,
            PanelColor = PanelColor == Color{} ? defaults.PanelColor: PanelColor,
            RaisedColor = RaisedColor == Color{} ? defaults.RaisedColor: RaisedColor,
            OverlayColor = OverlayColor == Color{} ? defaults.OverlayColor: OverlayColor,
            FieldColor = FieldColor == Color{} ? defaults.FieldColor: FieldColor,
            BorderColor = BorderColor == Color{} ? defaults.BorderColor: BorderColor,
            InputBorderColor = InputBorderColor == Color{} ? defaults.InputBorderColor: InputBorderColor,
            TextColor = TextColor == Color{} ? defaults.TextColor: TextColor,
            MutedTextColor = MutedTextColor == Color{} ? defaults.MutedTextColor: MutedTextColor,
            PlaceholderColor = PlaceholderColor != Color{} ? PlaceholderColor: MutedTextColor != Color{} ? MutedTextColor: defaults.PlaceholderColor,
            FaintTextColor = FaintTextColor == Color{} ? defaults.FaintTextColor: FaintTextColor,
            AccentColor = AccentColor == Color{} ? defaults.AccentColor: AccentColor,
            OnAccentColor = OnAccentColor == Color{} ? defaults.OnAccentColor: OnAccentColor,
            AccentHoverColor = AccentHoverColor == Color{} ? defaults.AccentHoverColor: AccentHoverColor,
            AccentPressedColor = AccentPressedColor == Color{} ? defaults.AccentPressedColor: AccentPressedColor,
            InfoColor = InfoColor == Color{} ? defaults.InfoColor: InfoColor,
            SuccessColor = SuccessColor == Color{} ? defaults.SuccessColor: SuccessColor,
            WarningColor = WarningColor == Color{} ? defaults.WarningColor: WarningColor,
            DangerColor = DangerColor == Color{} ? defaults.DangerColor: DangerColor,
            DangerFillColor = DangerFillColor == Color{} ? defaults.DangerFillColor: DangerFillColor,
            DangerHoverColor = DangerHoverColor == Color{} ? defaults.DangerHoverColor: DangerHoverColor,
            SunkenColor = SunkenColor == Color{} ? defaults.SunkenColor: SunkenColor,
            StrongBorderColor = StrongBorderColor == Color{} ? defaults.StrongBorderColor: StrongBorderColor,
            SubtleTextColor = SubtleTextColor == Color{} ? defaults.SubtleTextColor: SubtleTextColor,
            DisabledTextColor = DisabledTextColor == Color{} ? defaults.DisabledTextColor: DisabledTextColor,
            DisabledOpacity = DisabledOpacity == 0 ? defaults.DisabledOpacity: DisabledOpacity,
            LinkColor = LinkColor == Color{} ? defaults.LinkColor: LinkColor,
            FocusColor = FocusColor == Color{} ? defaults.FocusColor: FocusColor,
            RadiusSm = RadiusSm ?? defaults.RadiusSm,
            RadiusMd = RadiusMd ?? defaults.RadiusMd,
            RadiusLg = RadiusLg ?? defaults.RadiusLg,
            RadiusXl = RadiusXl ?? defaults.RadiusXl,
            DisplayFontSize = DisplayFontSize == 0 ? defaults.DisplayFontSize: DisplayFontSize,
            H1FontSize = H1FontSize == 0 ? defaults.H1FontSize: H1FontSize,
            H2FontSize = H2FontSize == 0 ? defaults.H2FontSize: H2FontSize,
            H3FontSize = H3FontSize == 0 ? defaults.H3FontSize: H3FontSize,
            H4FontSize = H4FontSize == 0 ? defaults.H4FontSize: H4FontSize,
            H5FontSize = H5FontSize == 0 ? defaults.H5FontSize: H5FontSize,
            H6FontSize = H6FontSize == 0 ? defaults.H6FontSize: H6FontSize,
            SubtitleFontSize = SubtitleFontSize == 0 ? defaults.SubtitleFontSize: SubtitleFontSize,
            OverlineFontSize = OverlineFontSize == 0 ? defaults.OverlineFontSize: OverlineFontSize,
            CodeFontSize = CodeFontSize == 0 ? defaults.CodeFontSize: CodeFontSize,
            MotionFastMs = ReducedMotion || MotionFastMs != 0.0 ? MotionFastMs: defaults.MotionFastMs,
            MotionNormalMs = ReducedMotion || MotionNormalMs != 0.0 ? MotionNormalMs: defaults.MotionNormalMs,
            MotionSlowMs = ReducedMotion || MotionSlowMs != 0.0 ? MotionSlowMs: defaults.MotionSlowMs,
            SpinnerPeriodMs = ReducedMotion || SpinnerPeriodMs != 0.0 ? SpinnerPeriodMs: defaults.SpinnerPeriodMs,
            PanelShadows = PanelShadows ?? defaults.PanelShadows,
            OverlayShadows = OverlayShadows ?? defaults.OverlayShadows,
            ControlShadows = ControlShadows ?? defaults.ControlShadows,
            FieldShadows = FieldShadows ?? defaults.FieldShadows,
            SeriesPalette = SeriesPalette ?? defaults.SeriesPalette,
            ColorBlindPalette = ColorBlindPalette ?? defaults.ColorBlindPalette,
            Syntax = Syntax == SyntaxPalette{} ? defaults.Syntax: Syntax,
            Diff = Diff == DiffPalette{} ? defaults.Diff: Diff,
            Ansi = Ansi == AnsiPalette{} ? defaults.Ansi: Ansi,
            TextScaleFactor = TextScaleFactor == 0 ? defaults.TextScaleFactor: TextScaleFactor,
            PlatformTextScaleFactor = PlatformTextScaleFactor == 0 ? defaults.PlatformTextScaleFactor: PlatformTextScaleFactor,
            FontFamily = FontFamily ?? defaults.FontFamily,
            HeadingFontFamily = HeadingFontFamily ?? defaults.HeadingFontFamily,
            MonoFontFamily = MonoFontFamily ?? defaults.MonoFontFamily,
            FontSize = FontSize == 0 ? defaults.FontSize: FontSize,
            FontWeight = FontWeight == 0 ? defaults.FontWeight: FontWeight,
            ControlHeight = ControlHeight == 0 ? defaults.ControlHeight: ControlHeight,
            ControlRadius = ControlRadius ?? defaults.ControlRadius,
            PanelRadius = PanelRadius ?? defaults.PanelRadius,
            BorderWidth = BorderWidth == 0 ? defaults.BorderWidth: BorderWidth,
            Spacing = Spacing == 0 ? defaults.Spacing: Spacing,
            LineHeight = LineHeight == 0 ? defaults.LineHeight: LineHeight,
            LabelFontSize = LabelFontSize == 0 ? defaults.LabelFontSize: LabelFontSize,
            LabelFontWeight = LabelFontWeight == 0 ? defaults.LabelFontWeight: LabelFontWeight,
            CaptionFontSize = CaptionFontSize == 0 ? defaults.CaptionFontSize: CaptionFontSize,
            CaptionFontWeight = CaptionFontWeight == 0 ? defaults.CaptionFontWeight: CaptionFontWeight,
            HeadingFontSize = HeadingFontSize == 0 ? defaults.HeadingFontSize: HeadingFontSize,
            HeadingFontWeight = HeadingFontWeight == 0 ? defaults.HeadingFontWeight: HeadingFontWeight,
            ControlMinWidth = ControlMinWidth == 0 ? defaults.ControlMinWidth: ControlMinWidth,
            ControlPadding = ControlPadding == 0 ? defaults.ControlPadding: ControlPadding,
            ControlGap = ControlGap == 0 ? defaults.ControlGap: ControlGap,
            PanelPadding = PanelPadding == 0 ? defaults.PanelPadding: PanelPadding,
        }
    }

    internal func WithPalette(palette Theme, origin Theme) Theme -> this with{
        VariantDark = palette.VariantDark,
        CanvasColor = Pick(CanvasColor, origin.CanvasColor, palette.CanvasColor),
        PanelColor = Pick(PanelColor, origin.PanelColor, palette.PanelColor),
        RaisedColor = Pick(RaisedColor, origin.RaisedColor, palette.RaisedColor),
        OverlayColor = Pick(OverlayColor, origin.OverlayColor, palette.OverlayColor),
        FieldColor = Pick(FieldColor, origin.FieldColor, palette.FieldColor),
        HoverColor = Pick(HoverColor, origin.HoverColor, palette.HoverColor),
        PressedColor = Pick(PressedColor, origin.PressedColor, palette.PressedColor),
        HoverTextColor = Pick(HoverTextColor, origin.HoverTextColor, palette.HoverTextColor),
        BorderColor = Pick(BorderColor, origin.BorderColor, palette.BorderColor),
        InputBorderColor = Pick(InputBorderColor, origin.InputBorderColor, palette.InputBorderColor),
        TextColor = Pick(TextColor, origin.TextColor, palette.TextColor),
        MutedTextColor = Pick(MutedTextColor, origin.MutedTextColor, palette.MutedTextColor),
        PlaceholderColor = Pick(PlaceholderColor, origin.PlaceholderColor, palette.PlaceholderColor),
        FaintTextColor = Pick(FaintTextColor, origin.FaintTextColor, palette.FaintTextColor),
        AccentColor = Pick(AccentColor, origin.AccentColor, palette.AccentColor),
        OnAccentColor = Pick(OnAccentColor, origin.OnAccentColor, palette.OnAccentColor),
        AccentHoverColor = Pick(AccentHoverColor, origin.AccentHoverColor, palette.AccentHoverColor),
        AccentPressedColor = Pick(AccentPressedColor, origin.AccentPressedColor, palette.AccentPressedColor),
        InfoColor = Pick(InfoColor, origin.InfoColor, palette.InfoColor),
        SuccessColor = Pick(SuccessColor, origin.SuccessColor, palette.SuccessColor),
        WarningColor = Pick(WarningColor, origin.WarningColor, palette.WarningColor),
        DangerColor = Pick(DangerColor, origin.DangerColor, palette.DangerColor),
        DangerFillColor = Pick(DangerFillColor, origin.DangerFillColor, palette.DangerFillColor),
        DangerHoverColor = Pick(DangerHoverColor, origin.DangerHoverColor, palette.DangerHoverColor),
        SunkenColor = Pick(SunkenColor, origin.SunkenColor, palette.SunkenColor),
        ActiveColor = Pick(ActiveColor, origin.ActiveColor, palette.ActiveColor),
        StrongBorderColor = Pick(StrongBorderColor, origin.StrongBorderColor, palette.StrongBorderColor),
        SubtleTextColor = Pick(SubtleTextColor, origin.SubtleTextColor, palette.SubtleTextColor),
        DisabledTextColor = Pick(DisabledTextColor, origin.DisabledTextColor, palette.DisabledTextColor),
        LinkColor = Pick(LinkColor, origin.LinkColor, palette.LinkColor),
        FocusColor = Pick(FocusColor, origin.FocusColor, palette.FocusColor),
        InfoFillColor = Pick(InfoFillColor, origin.InfoFillColor, palette.InfoFillColor),
        SuccessFillColor = Pick(SuccessFillColor, origin.SuccessFillColor, palette.SuccessFillColor),
        WarningFillColor = Pick(WarningFillColor, origin.WarningFillColor, palette.WarningFillColor),
        DangerQuietColor = Pick(DangerQuietColor, origin.DangerQuietColor, palette.DangerQuietColor),
        ScrollbarColor = Pick(ScrollbarColor, origin.ScrollbarColor, palette.ScrollbarColor),
        GlassColor = Pick(GlassColor, origin.GlassColor, palette.GlassColor),
        HighlightColor = Pick(HighlightColor, origin.HighlightColor, palette.HighlightColor),
        HairlineColor = Pick(HairlineColor, origin.HairlineColor, palette.HairlineColor),
        OverlayBlur = Pick(OverlayBlur, origin.OverlayBlur, palette.OverlayBlur),
        ElevationSm = Pick(ElevationSm, origin.ElevationSm, palette.ElevationSm),
        ElevationMd = Pick(ElevationMd, origin.ElevationMd, palette.ElevationMd),
        ElevationLg = Pick(ElevationLg, origin.ElevationLg, palette.ElevationLg),
        PanelShadows = Same(PanelShadows, origin.PanelShadows) ? palette.PanelShadows: PanelShadows,
        OverlayShadows = Same(OverlayShadows, origin.OverlayShadows) ? palette.OverlayShadows: OverlayShadows,
        ControlShadows = Same(ControlShadows, origin.ControlShadows) ? palette.ControlShadows: ControlShadows,
        FieldShadows = Same(FieldShadows, origin.FieldShadows) ? palette.FieldShadows: FieldShadows,
        SeriesPalette = Same(SeriesPalette, origin.SeriesPalette) ? palette.SeriesPalette: SeriesPalette,
        ColorBlindPalette = Same(ColorBlindPalette, origin.ColorBlindPalette) ? palette.ColorBlindPalette: ColorBlindPalette,
        Syntax = Pick(Syntax, origin.Syntax, palette.Syntax),
        Diff = Pick(Diff, origin.Diff, palette.Diff),
        Ansi = Same(Ansi.Colors, origin.Ansi.Colors) && Same(Ansi.BrightColors, origin.Ansi.BrightColors) ? palette.Ansi: Ansi,
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

    internal func WithAccessibility(highContrast bool, platformScale float64, reducedMotion bool) Theme {
        var value = this
        if highContrast {
            value = value.WithHighContrast()
        }
        value = value.WithTextScale(value.TextScaleFactor * platformScale / value.PlatformTextScaleFactor)
        value.PlatformTextScaleFactor = platformScale
        value.ReducedMotion = reducedMotion
        if reducedMotion {
            value.TransitionMs = 0.0
            value.MotionFastMs = 0.0
            value.MotionNormalMs = 0.0
            value.MotionSlowMs = 0.0
            value.SpinnerPeriodMs = 0.0
        }
        return value
    }

    shared {
        internal func Pick[T](own T, origin T, next T) T -> EqualityComparer[T].Default.Equals(own, origin) ? next: own

        private func Same[T](own []T, origin []T) bool -> System.Linq.Enumerable.SequenceEqual(own, origin)

        internal func IsBuiltIn(variant Func[bool, Theme]) bool ->
        variant == defaultVariant || variant == nativeVariant || variant == fluentVariant || variant == fluentMicaVariant
    }
}
