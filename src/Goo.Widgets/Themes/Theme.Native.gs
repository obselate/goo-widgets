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
                        CanvasColor = "#323232",
                        PanelColor = "#1e1e1e",
                        RaisedColor = "#3a3a3a",
                        FieldColor = "#1e1e1e",
                        HoverColor = "#353535",
                        PressedColor = "#404040",
                        BorderColor = Color.Parse("#353535"),
                        InputBorderColor = "#98989d",
                        TextColor = "#dddddd",
                        MutedTextColor = "#9a9a9a",
                        PlaceholderColor = "#9a9a9a",
                        FaintTextColor = "#9a9a9a",
                        AccentColor = "#0a84ff",
                        AccentHoverColor = "#0a84ff",
                        AccentPressedColor = "#0a84ff",
                        SunkenColor = "#1e1e1e",
                        ActiveColor = "#464646",
                        StrongBorderColor = "#98989d",
                        SubtleTextColor = "#9a9a9a",
                        DisabledTextColor = "#565656",
                        FocusColor = "#0a84ff",
                        GlassColor = Color.Transparent,
                    }
                } else {
                    Default with{
                        CanvasColor = "#ececec",
                        PanelColor = "#ffffff",
                        RaisedColor = "#ffffff",
                        HoverColor = "#e5e5e5",
                        PressedColor = "#d9d9d9",
                        BorderColor = Color.Parse("#e5e5e5"),
                        InputBorderColor = "#8e8e93",
                        TextColor = "#262626",
                        MutedTextColor = "#666666",
                        PlaceholderColor = "#666666",
                        FaintTextColor = "#666666",
                        AccentColor = "#007aff",
                        AccentHoverColor = "#007aff",
                        AccentPressedColor = "#007aff",
                        SunkenColor = "#ececec",
                        ActiveColor = "#ffffff",
                        StrongBorderColor = "#8e8e93",
                        SubtleTextColor = "#666666",
                        DisabledTextColor = "#bfbfbf",
                        FocusColor = "#007aff",
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
