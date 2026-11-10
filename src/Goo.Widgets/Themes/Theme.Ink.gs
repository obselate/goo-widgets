package Goo.Widgets

import Goo

public data partial struct Theme {
    shared {
        /// Dark Ink palette. Each access returns an independent value.
        public prop Ink Theme {
            get -> Theme{
                VariantDark: true,
                CanvasColor: "#08090c",
                PanelColor: "#16181e",
                RaisedColor: "#1f2229",
                OverlayColor: "#22252e",
                FieldColor: "#040506",
                HoverColor: "#2b2f39",
                PressedColor: "#25282f",
                BorderColor: Color.Parse("#3d424d"),
                InputBorderColor: "#747a8a",
                TextColor: "#f9f9fa",
                MutedTextColor: "#bfc4cd",
                PlaceholderColor: "#bfc4cd",
                FaintTextColor: "#989eaa",
                AccentColor: "#2f67e0",
                OnAccentColor: "#ffffff",
                AccentHoverColor: "#3a6ee6",
                AccentPressedColor: "#2858c4",
                InfoColor: "#95baff",
                SuccessColor: "#77d79c",
                WarningColor: "#f2c16e",
                DangerColor: "#ff9487",
                DangerFillColor: "#c93a32",
                DangerHoverColor: "#ce3f37",
                SunkenColor: "#1e2026",
                ActiveColor: "#1b2a45",
                StrongBorderColor: "#9097a5",
                SubtleTextColor: "#bfc4cd",
                DisabledTextColor: "#666c7a",
                LinkColor: "#9cbdff",
                FocusColor: "#89afff",
                InfoFillColor: "#15213a",
                SuccessFillColor: "#11281d",
                WarningFillColor: "#2b2213",
                DangerQuietColor: "#33191b",
                RadiusSm: 4.0,
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
                PanelShadows: []BoxShadow{
                    BoxShadow{Inset: true, OffsetY: 1.0, Color: Color.White.WithAlpha(0.10)},
                    BoxShadow{OffsetY: 1.0, Blur: 3.0, Color: Color.Black.WithAlpha(0.60)},
                },
                OverlayShadows: []BoxShadow{
                    BoxShadow{Inset: true, OffsetY: 1.0, Color: Color.White.WithAlpha(0.12)},
                    BoxShadow{OffsetY: 16.0, Blur: 40.0, Color: Color.Black.WithAlpha(0.70)},
                    BoxShadow{OffsetY: 2.0, Blur: 6.0, Color: Color.Black.WithAlpha(0.50)},
                },
                ControlShadows: []BoxShadow{
                    BoxShadow{Inset: true, OffsetY: 1.0, Color: Color.White.WithAlpha(0.20)},
                    BoxShadow{Inset: true, OffsetY: -1.0, Color: Color.Black.WithAlpha(0.35)},
                    BoxShadow{OffsetY: 1.0, Blur: 2.0, Color: Color.Black.WithAlpha(0.80)},
                },
                FieldShadows: []BoxShadow{
                    BoxShadow{Inset: true, OffsetY: 2.0, Blur: 4.0, Color: Color.Black.WithAlpha(0.80)},
                },
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

        /// Ink with glass chrome over the native window material.
        public prop InkGlass Theme {
            get -> Ink.WithGlass()
        }
    }
}
