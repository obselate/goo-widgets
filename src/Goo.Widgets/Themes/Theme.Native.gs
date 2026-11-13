package Goo.Widgets

import Goo
import System

public data partial struct Theme {
    shared {
        private let nativeVariant Func[bool, Theme] = (dark bool) -> NativePalette(dark)

        /// The platform's own look. Follows the mode, system accent, contrast and text scale.
        /// Windows uses Fluent over Mica, macOS uses vibrancy, Linux stays opaque.
        public prop Native Theme {
            get -> NativePalette(false) with{Variant = nativeVariant}
        }

        /// Native colors for one appearance, with Native metrics in the light palette.
        internal func NativePalette(dark bool) Theme {
            if OperatingSystem.IsWindows() {
                return FluentPalette(dark) with{FontFamily = "Segoe UI", HeadingFontFamily = "Segoe UI", GlassColor = Color.Transparent}
            }
            if OperatingSystem.IsMacOS() {
                return if dark {
                    Ink with{
                        CanvasColor = Color.Parse("#323232"),
                        PanelColor = Color.Parse("#1e1e1e"),
                        RaisedColor = Color.Parse("#3a3a3a"),
                        FieldColor = Color.Parse("#1e1e1e"),
                        HoverColor = Color.Parse("#353535"),
                        PressedColor = Color.Parse("#404040"),
                        BorderColor = Color.Parse("#353535"),
                        InputBorderColor = Color.Parse("#98989d"),
                        TextColor = Color.Parse("#dddddd"),
                        MutedTextColor = Color.Parse("#9a9a9a"),
                        PlaceholderColor = Color.Parse("#9a9a9a"),
                        FaintTextColor = Color.Parse("#9a9a9a"),
                        AccentColor = Color.Parse("#0a84ff"),
                        AccentHoverColor = Color.Parse("#0a84ff"),
                        AccentPressedColor = Color.Parse("#0a84ff"),
                        SunkenColor = Color.Parse("#1e1e1e"),
                        ActiveColor = Color.Parse("#464646"),
                        StrongBorderColor = Color.Parse("#98989d"),
                        SubtleTextColor = Color.Parse("#9a9a9a"),
                        DisabledTextColor = Color.Parse("#565656"),
                        FocusColor = Color.Parse("#0a84ff"),
                        GlassColor = Color.Transparent,
                    }
                } else {
                    Default with{
                        CanvasColor = Color.Parse("#ececec"),
                        PanelColor = Color.Parse("#ffffff"),
                        RaisedColor = Color.Parse("#ffffff"),
                        HoverColor = Color.Parse("#e5e5e5"),
                        PressedColor = Color.Parse("#d9d9d9"),
                        BorderColor = Color.Parse("#e5e5e5"),
                        InputBorderColor = Color.Parse("#8e8e93"),
                        TextColor = Color.Parse("#262626"),
                        MutedTextColor = Color.Parse("#666666"),
                        PlaceholderColor = Color.Parse("#666666"),
                        FaintTextColor = Color.Parse("#666666"),
                        AccentColor = Color.Parse("#007aff"),
                        AccentHoverColor = Color.Parse("#007aff"),
                        AccentPressedColor = Color.Parse("#007aff"),
                        SunkenColor = Color.Parse("#ececec"),
                        ActiveColor = Color.Parse("#ffffff"),
                        StrongBorderColor = Color.Parse("#8e8e93"),
                        SubtleTextColor = Color.Parse("#666666"),
                        DisabledTextColor = Color.Parse("#bfbfbf"),
                        FocusColor = Color.Parse("#007aff"),
                        FontFamily = "system-ui",
                        HeadingFontFamily = "system-ui",
                        FontSize = 13.0,
                        LabelFontSize = 13.0,
                        LineHeight = 16.0 / 13.0,
                        ControlHeight = 28.0,
                        GlassColor = Color.Transparent,
                        RowInset = 8.0,
                        Selection = SelectionStyle.Filled,
                    }
                }
            }
            return dark ? Ink: Default
        }
    }
}
