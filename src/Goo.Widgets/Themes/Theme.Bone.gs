package Goo.Widgets

import Goo
import System

public data partial struct Theme {
    shared {
        private let defaultVariant Func[bool, Theme] = (dark bool) -> dark ? Ink: Bone

        /// Neutral metrics with Bone colors in light mode and Ink colors in dark mode.
        public prop Default Theme {
            get -> Bone with{
                FontFamily = "",
                HeadingFontFamily = "",
                MonoFontFamily = "monospace",
                FontSize = 14.0,
                FontWeight = 400,
                ControlRadius = 6.0,
                PanelRadius = 10.0,
                Variant = defaultVariant,
            }
        }

        /// Light Bone palette, including darker semantic text colors for light surfaces.
        public prop Bone Theme {
            get -> Ink with{
                VariantDark = false,
                CanvasColor = "#f3f3f1",
                PanelColor = "#fafaf9",
                RaisedColor = "#ffffff",
                OverlayColor = "#ffffff",
                FieldColor = "#ffffff",
                HoverColor = "#e8e8e5",
                PressedColor = "#dededa",
                BorderColor = Color.Parse("#cbcbc6"),
                InputBorderColor = "#83868d",
                TextColor = "#17181c",
                MutedTextColor = "#4b4e57",
                PlaceholderColor = "#4b4e57",
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
                PanelShadows = []BoxShadow{
                    BoxShadow{OffsetY: 1.0, Color: Color.Rgba(16, 18, 24, 15)},
                    BoxShadow{OffsetY: 1.0, Blur: 3.0, Color: Color.Rgba(16, 18, 24, 20)},
                    BoxShadow{OffsetY: 10.0, Blur: 30.0, Color: Color.Rgba(16, 18, 24, 20)},
                },
                OverlayShadows = []BoxShadow{
                    BoxShadow{OffsetY: 16.0, Blur: 40.0, Color: Color.Rgba(16, 18, 24, 46)},
                    BoxShadow{OffsetY: 2.0, Blur: 6.0, Color: Color.Rgba(16, 18, 24, 31)},
                },
                ControlShadows = []BoxShadow{
                    BoxShadow{OffsetY: 1.0, Color: Color.Rgba(16, 18, 24, 71)},
                    BoxShadow{Inset: true, OffsetY: -1.0, Color: Color.Rgba(16, 18, 24, 15)},
                    BoxShadow{OffsetY: 3.0, Blur: 8.0, Color: Color.Rgba(16, 18, 24, 26)},
                },
                FieldShadows = []BoxShadow{
                    BoxShadow{Inset: true, OffsetY: 2.0, Blur: 4.0, Color: Color.Rgba(16, 18, 24, 41)},
                },
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

        /// Bone with glass chrome over the native window material.
        public prop BoneGlass Theme {
            get -> Bone.WithGlass()
        }
    }
}
