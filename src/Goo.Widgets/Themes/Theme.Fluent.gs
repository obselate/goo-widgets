package Goo.Widgets

import Goo
import System

public data partial struct Theme {
    shared {
        private let fluentVariant Func[bool, Theme] = (dark bool) -> FluentPalette(dark)
        private let fluentMicaVariant Func[bool, Theme] = (dark bool) -> FluentMicaPalette(dark)

        /// Windows 11 Fluent look with the toolkit font. Follows the mode and the system accent.
        public prop Fluent Theme {
            get -> FluentPalette(false)
        }

        /// Fluent over the Mica window material, with blurred acrylic menus and popups. Attach before Open.
        public prop FluentMica Theme {
            get -> FluentMicaPalette(false)
        }

        private func FluentPalette(dark bool) Theme {
            let light = Default with{
                CanvasColor = Color.Parse("#f3f3f3"),
                PanelColor = Color.Parse("#f9f9f9"),
                RaisedColor = Color.Parse("#fdfdfd"),
                OverlayColor = Color.Parse("#fcfcfc"),
                FieldColor = Color.Parse("#ffffff"),
                HoverColor = Color.Parse("#f0f0f0"),
                PressedColor = Color.Parse("#f3f3f3"),
                BorderColor = Color.Parse("#eaeaea"),
                InputBorderColor = Color.Parse("#8d8d8d"),
                TextColor = Color.Parse("#1a1a1a"),
                MutedTextColor = Color.Parse("#5f5f5f"),
                PlaceholderColor = Color.Parse("#5f5f5f"),
                FaintTextColor = Color.Parse("#5f5f5f"),
                AccentColor = Color.Parse("#005fb8"),
                AccentHoverColor = Color.Parse("#196fbf"),
                AccentPressedColor = Color.Parse("#337fc6"),
                InfoColor = Color.Parse("#005fb7"),
                SuccessColor = Color.Parse("#0f7b0f"),
                WarningColor = Color.Parse("#9d5d00"),
                DangerColor = Color.Parse("#c42b1c"),
                DangerFillColor = Color.Parse("#c42b1c"),
                SunkenColor = Color.Parse("#f3f3f3"),
                ActiveColor = Color.Parse("#f0f0f0"),
                StrongBorderColor = Color.Parse("#8d8d8d"),
                SubtleTextColor = Color.Parse("#5f5f5f"),
                DisabledTextColor = Color.Parse("#9f9f9f"),
                LinkColor = Color.Parse("#003e92"),
                FocusColor = Color.Parse("#1a1a1a"),
                InfoFillColor = Color.Parse("#f6f6f6"),
                SuccessFillColor = Color.Parse("#dff6dd"),
                WarningFillColor = Color.Parse("#fff4ce"),
                DangerQuietColor = Color.Parse("#fde7e9"),
                ScrollbarColor = Color.Parse("#8d8d8d"),
                ElevationSm = BoxShadow{OffsetY: 2.0, Blur: 4.0, Color: Color.Black.WithAlpha(0.04)},
                ElevationLg = BoxShadow{OffsetY: 8.0, Blur: 16.0, Color: Color.Black.WithAlpha(0.14)},
                PanelShadows = []BoxShadow{},
                OverlayShadows = []BoxShadow{BoxShadow{OffsetY: 8.0, Blur: 16.0, Color: Color.Black.WithAlpha(0.14)}},
                ControlShadows = []BoxShadow{BoxShadow{Inset: true, OffsetY: -1.0, Color: Color.Rgba(0, 0, 0, 26)}},
                FieldShadows = []BoxShadow{},
                BackdropColor = Color.Rgba(0, 0, 0, 77),
                LineHeight = 20.0 / 14.0,
                LabelFontSize = 14.0,
                LabelFontWeight = 400,
                SubtitleFontSize = 20.0,
                H1FontSize = 40.0,
                DisplayFontSize = 68.0,
                ControlRadius = 4.0,
                PanelRadius = 8.0,
                RadiusMd = 4.0,
                RadiusLg = 8.0,
                RadiusXl = 8.0,
                RowInset = 4.0,
                Selection = SelectionStyle.Indicator,
                Controls = ControlStyle.Fluent,
                TransitionMs = 83.0,
                Variant = fluentVariant,
            }
            return if dark {
                light.WithPalette(Ink, light) with{
                    CanvasColor = Color.Parse("#202020"),
                    PanelColor = Color.Parse("#282828"),
                    RaisedColor = Color.Parse("#2d2d2d"),
                    OverlayColor = Color.Parse("#2c2c2c"),
                    FieldColor = Color.Parse("#2d2d2d"),
                    HoverColor = Color.Parse("#353535"),
                    PressedColor = Color.Parse("#303030"),
                    BorderColor = Color.Parse("#3a3a3a"),
                    InputBorderColor = Color.Parse("#9d9d9d"),
                    TextColor = Color.Parse("#ffffff"),
                    MutedTextColor = Color.Parse("#cecece"),
                    PlaceholderColor = Color.Parse("#cecece"),
                    FaintTextColor = Color.Parse("#cecece"),
                    AccentColor = Color.Parse("#60cdff"),
                    OnAccentColor = Color.Parse("#000000"),
                    AccentHoverColor = Color.Parse("#5abce9"),
                    AccentPressedColor = Color.Parse("#53aad2"),
                    InfoColor = Color.Parse("#60cdff"),
                    SuccessColor = Color.Parse("#6ccb5f"),
                    WarningColor = Color.Parse("#fce100"),
                    DangerColor = Color.Parse("#ff99a4"),
                    SunkenColor = Color.Parse("#1c1c1c"),
                    ActiveColor = Color.Parse("#353535"),
                    StrongBorderColor = Color.Parse("#9d9d9d"),
                    SubtleTextColor = Color.Parse("#cecece"),
                    DisabledTextColor = Color.Parse("#767676"),
                    LinkColor = Color.Parse("#99ebff"),
                    FocusColor = Color.Parse("#ffffff"),
                    InfoFillColor = Color.Parse("#2e2e2e"),
                    SuccessFillColor = Color.Parse("#393d1b"),
                    WarningFillColor = Color.Parse("#433519"),
                    DangerQuietColor = Color.Parse("#442726"),
                    ScrollbarColor = Color.Parse("#9d9d9d"),
                    ElevationSm = BoxShadow{OffsetY: 2.0, Blur: 4.0, Color: Color.Black.WithAlpha(0.26)},
                    ElevationLg = BoxShadow{OffsetY: 8.0, Blur: 16.0, Color: Color.Black.WithAlpha(0.26)},
                    PanelShadows = []BoxShadow{},
                    OverlayShadows = []BoxShadow{BoxShadow{OffsetY: 8.0, Blur: 16.0, Color: Color.Black.WithAlpha(0.26)}},
                    ControlShadows = []BoxShadow{BoxShadow{Inset: true, OffsetY: 1.0, Color: Color.Rgba(255, 255, 255, 6)}},
                    FieldShadows = []BoxShadow{},
                }
            } else {
                light
            }
        }

        private func FluentMicaPalette(dark bool) Theme {
            let value = FluentPalette(dark)
            return value.WithGlass() with{
                OverlayColor = value.OverlayColor.WithAlpha(dark ? 0.5: 0.6),
                OverlayBlur = 30.0,
                HoverColor = dark ? Color.Rgba(255, 255, 255, 15): Color.Rgba(0, 0, 0, 9),
                PressedColor = dark ? Color.Rgba(255, 255, 255, 10): Color.Rgba(0, 0, 0, 6),
                ActiveColor = dark ? Color.Rgba(255, 255, 255, 15): Color.Rgba(0, 0, 0, 9),
                HighlightColor = Color.Transparent,
                HairlineColor = dark ? Color.Rgba(255, 255, 255, 24): Color.Rgba(0, 0, 0, 41),
                Variant = fluentMicaVariant,
            }
        }
    }
}
