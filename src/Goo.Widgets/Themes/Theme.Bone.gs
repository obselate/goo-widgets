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
                CanvasColor = Color.Parse("#f3f3f1"),
                PanelColor = Color.Parse("#fafaf9"),
                RaisedColor = Color.Parse("#ffffff"),
                OverlayColor = Color.Parse("#ffffff"),
                FieldColor = Color.Parse("#ffffff"),
                HoverColor = Color.Parse("#e8e8e5"),
                PressedColor = Color.Parse("#dededa"),
                BorderColor = Color.Parse("#cbcbc6"),
                InputBorderColor = Color.Parse("#83868d"),
                TextColor = Color.Parse("#17181c"),
                MutedTextColor = Color.Parse("#4b4e57"),
                PlaceholderColor = Color.Parse("#4b4e57"),
                FaintTextColor = Color.Parse("#61646d"),
                AccentHoverColor = Color.Parse("#2a5dcc"),
                AccentPressedColor = Color.Parse("#244fae"),
                InfoColor = Color.Parse("#2456c4"),
                SuccessColor = Color.Parse("#21703f"),
                WarningColor = Color.Parse("#8a5a00"),
                DangerColor = Color.Parse("#b8322a"),
                DangerHoverColor = Color.Parse("#b0322b"),
                SunkenColor = Color.Parse("#ebebe7"),
                ActiveColor = Color.Parse("#e4ecfc"),
                StrongBorderColor = Color.Parse("#6a6d75"),
                SubtleTextColor = Color.Parse("#4b4e57"),
                DisabledTextColor = Color.Parse("#9a9ca3"),
                LinkColor = Color.Parse("#2456c4"),
                FocusColor = Color.Parse("#2456c4"),
                InfoFillColor = Color.Parse("#e6eefc"),
                SuccessFillColor = Color.Parse("#e3f2e8"),
                WarningFillColor = Color.Parse("#f8eedb"),
                DangerQuietColor = Color.Parse("#fbe6e3"),
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
                SeriesPalette = []Color{Color.Parse("#245b91"), Color.Parse("#30672a"), Color.Parse("#805019"), Color.Parse("#71468c"), Color.Parse("#a43723"), Color.Parse("#19666c"), Color.Parse("#933f68"), Color.Parse("#62651d")},
                ColorBlindPalette = []Color{Color.Parse("#986800"), Color.Parse("#24769c"), Color.Parse("#007450"), Color.Parse("#777000"), Color.Parse("#0072b2"), Color.Parse("#b64d00"), Color.Parse("#9b4d79"), Color.Parse("#090b10")},
                Syntax = SyntaxPalette{Keyword: Color.Parse("#71468c"), String: Color.Parse("#30672a"), Number: Color.Parse("#805019"), Comment: Color.Parse("#5e6676"), Function: Color.Parse("#245b91"), Type: Color.Parse("#19666c"), Punctuation: Color.Parse("#4a5161")},
                Diff = DiffPalette{Added: Color.Parse("#30672a"), Removed: Color.Parse("#a43723"), Changed: Color.Parse("#805019"), AddedFill: Color.Parse("#e3f2e8"), RemovedFill: Color.Parse("#fbe6e3"), ChangedFill: Color.Parse("#f8eedb")},
                Ansi = AnsiPalette{
                    Colors: []Color{Color.Parse("#090b10"), Color.Parse("#a43723"), Color.Parse("#30672a"), Color.Parse("#805019"), Color.Parse("#245b91"), Color.Parse("#71468c"), Color.Parse("#19666c"), Color.Parse("#5e6676")},
                    BrightColors: []Color{Color.Parse("#4a5161"), Color.Parse("#b84c36"), Color.Parse("#3d7b35"), Color.Parse("#946025"), Color.Parse("#306ea9"), Color.Parse("#8555a3"), Color.Parse("#247b81"), Color.Parse("#f5f6f7")},
                },
            }
        }

        /// Bone with glass chrome over the native window material.
        public prop BoneGlass Theme {
            get -> Bone.WithGlass()
        }
    }
}
