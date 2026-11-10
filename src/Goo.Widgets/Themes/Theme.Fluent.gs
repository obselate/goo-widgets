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
                CanvasColor = "#f3f3f3",
                PanelColor = "#f9f9f9",
                RaisedColor = "#fdfdfd",
                OverlayColor = "#fcfcfc",
                FieldColor = "#ffffff",
                HoverColor = "#f0f0f0",
                PressedColor = "#f3f3f3",
                BorderColor = Color.Parse("#eaeaea"),
                InputBorderColor = "#8d8d8d",
                TextColor = "#1a1a1a",
                MutedTextColor = "#5f5f5f",
                PlaceholderColor = "#5f5f5f",
                FaintTextColor = "#5f5f5f",
                AccentColor = "#005fb8",
                AccentHoverColor = "#196fbf",
                AccentPressedColor = "#337fc6",
                InfoColor = "#005fb7",
                SuccessColor = "#0f7b0f",
                WarningColor = "#9d5d00",
                DangerColor = "#c42b1c",
                DangerFillColor = "#c42b1c",
                SunkenColor = "#f3f3f3",
                ActiveColor = "#f0f0f0",
                StrongBorderColor = "#8d8d8d",
                SubtleTextColor = "#5f5f5f",
                DisabledTextColor = "#9f9f9f",
                LinkColor = "#003e92",
                FocusColor = "#1a1a1a",
                InfoFillColor = "#f6f6f6",
                SuccessFillColor = "#dff6dd",
                WarningFillColor = "#fff4ce",
                DangerQuietColor = "#fde7e9",
                ScrollbarColor = "#8d8d8d",
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
                    CanvasColor = "#202020",
                    PanelColor = "#282828",
                    RaisedColor = "#2d2d2d",
                    OverlayColor = "#2c2c2c",
                    FieldColor = "#2d2d2d",
                    HoverColor = "#353535",
                    PressedColor = "#303030",
                    BorderColor = Color.Parse("#3a3a3a"),
                    InputBorderColor = "#9d9d9d",
                    TextColor = "#ffffff",
                    MutedTextColor = "#cecece",
                    PlaceholderColor = "#cecece",
                    FaintTextColor = "#cecece",
                    AccentColor = "#60cdff",
                    OnAccentColor = "#000000",
                    AccentHoverColor = "#5abce9",
                    AccentPressedColor = "#53aad2",
                    InfoColor = "#60cdff",
                    SuccessColor = "#6ccb5f",
                    WarningColor = "#fce100",
                    DangerColor = "#ff99a4",
                    SunkenColor = "#1c1c1c",
                    ActiveColor = "#353535",
                    StrongBorderColor = "#9d9d9d",
                    SubtleTextColor = "#cecece",
                    DisabledTextColor = "#767676",
                    LinkColor = "#99ebff",
                    FocusColor = "#ffffff",
                    InfoFillColor = "#2e2e2e",
                    SuccessFillColor = "#393d1b",
                    WarningFillColor = "#433519",
                    DangerQuietColor = "#442726",
                    ScrollbarColor = "#9d9d9d",
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
