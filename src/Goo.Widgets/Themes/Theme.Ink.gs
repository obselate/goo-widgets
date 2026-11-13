package Goo.Widgets

import Goo

public data partial struct Theme {
    shared {
        /// Dark Ink palette. Each access returns an independent value.
        public prop Ink Theme {
            get -> Theme{
                VariantDark: true,
                CanvasColor: Color.Parse("#08090c"),
                PanelColor: Color.Parse("#16181e"),
                RaisedColor: Color.Parse("#1f2229"),
                OverlayColor: Color.Parse("#22252e"),
                FieldColor: Color.Parse("#040506"),
                HoverColor: Color.Parse("#2b2f39"),
                PressedColor: Color.Parse("#25282f"),
                BorderColor: Color.Parse("#3d424d"),
                InputBorderColor: Color.Parse("#747a8a"),
                TextColor: Color.Parse("#f9f9fa"),
                MutedTextColor: Color.Parse("#bfc4cd"),
                PlaceholderColor: Color.Parse("#bfc4cd"),
                FaintTextColor: Color.Parse("#989eaa"),
                AccentColor: Color.Parse("#2f67e0"),
                OnAccentColor: Color.Parse("#ffffff"),
                AccentHoverColor: Color.Parse("#3a6ee6"),
                AccentPressedColor: Color.Parse("#2858c4"),
                InfoColor: Color.Parse("#95baff"),
                SuccessColor: Color.Parse("#77d79c"),
                WarningColor: Color.Parse("#f2c16e"),
                DangerColor: Color.Parse("#ff9487"),
                DangerFillColor: Color.Parse("#c93a32"),
                DangerHoverColor: Color.Parse("#ce3f37"),
                SunkenColor: Color.Parse("#1e2026"),
                ActiveColor: Color.Parse("#1b2a45"),
                StrongBorderColor: Color.Parse("#9097a5"),
                SubtleTextColor: Color.Parse("#bfc4cd"),
                DisabledTextColor: Color.Parse("#666c7a"),
                LinkColor: Color.Parse("#9cbdff"),
                FocusColor: Color.Parse("#89afff"),
                InfoFillColor: Color.Parse("#15213a"),
                SuccessFillColor: Color.Parse("#11281d"),
                WarningFillColor: Color.Parse("#2b2213"),
                DangerQuietColor: Color.Parse("#33191b"),
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
                SeriesPalette: []Color{Color.Parse("#6fa6de"), Color.Parse("#6cbc5f"), Color.Parse("#f9a238"), Color.Parse("#bd95dc"), Color.Parse("#ef6a4d"), Color.Parse("#58bdc3"), Color.Parse("#df89ae"), Color.Parse("#b9bd70")},
                ColorBlindPalette: []Color{Color.Parse("#e69f00"), Color.Parse("#56b4e9"), Color.Parse("#009e73"), Color.Parse("#f0e442"), Color.Parse("#0072b2"), Color.Parse("#d55e00"), Color.Parse("#cc79a7"), Color.Parse("#eeeeee")},
                Syntax: SyntaxPalette{Keyword: Color.Parse("#bd95dc"), String: Color.Parse("#6cbc5f"), Number: Color.Parse("#f9a238"), Comment: Color.Parse("#9099a8"), Function: Color.Parse("#6fa6de"), Type: Color.Parse("#58bdc3"), Punctuation: Color.Parse("#b8bfc9")},
                Diff: DiffPalette{Added: Color.Parse("#6cbc5f"), Removed: Color.Parse("#ef6a4d"), Changed: Color.Parse("#f9a238"), AddedFill: Color.Parse("#11281d"), RemovedFill: Color.Parse("#33191b"), ChangedFill: Color.Parse("#2b2213")},
                Ansi: AnsiPalette{
                    Colors: []Color{Color.Parse("#11141b"), Color.Parse("#ef6a4d"), Color.Parse("#6cbc5f"), Color.Parse("#f9a238"), Color.Parse("#6fa6de"), Color.Parse("#bd95dc"), Color.Parse("#58bdc3"), Color.Parse("#b8bfc9")},
                    BrightColors: []Color{Color.Parse("#9099a8"), Color.Parse("#f18b75"), Color.Parse("#8fd184"), Color.Parse("#ffbd69"), Color.Parse("#9bc2ec"), Color.Parse("#d5b5ed"), Color.Parse("#87d7dc"), Color.Parse("#eceded")},
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
