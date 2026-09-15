package Goo.Widgets

import Goo
import System
import System.Globalization

/// Utilities for packed 24-bit sRGB values.
public class ColorMath {
    shared {
        /// Parses an optional leading-hash six-digit hexadecimal color.
        public func ParseHex(value string) int32? {
            let hex = value.Trim().TrimStart('#')
            if hex.Length != 6 || !Int32.TryParse(
                hex,
                NumberStyles.HexNumber,
                CultureInfo.InvariantCulture,
                out var rgb
            ) {
                return nil
            }
            return rgb
        }

        /// Formats a packed color as six uppercase hexadecimal digits.
        public func Hex(rgb int32) string -> (rgb & 0xFFFFFF).ToString("X6", CultureInfo.InvariantCulture)

        /// Interpolates two packed sRGB colors.
        public func Mix(a int32, b int32, amount float64) int32 {
            let t = Math.Clamp(amount, 0.0, 1.0)
            let red = int32(Math.Round(float64((a >> 16) & 255) * (1.0 - t) + float64((b >> 16) & 255) * t))
            let green = int32(Math.Round(float64((a >> 8) & 255) * (1.0 - t) + float64((b >> 8) & 255) * t))
            let blue = int32(Math.Round(float64(a & 255) * (1.0 - t) + float64(b & 255) * t))
            return (red << 16) | (green << 8) | blue
        }

        /// Selects a dark or light foreground from relative luminance.
        public func Foreground(rgb int32, dark int32 = 0x101216, light int32 = 0xF1F3F7) int32 {
            let luminance = 0.2126 * LinearSrgb(float64((rgb >> 16) & 255) / 255.0)
            + 0.7152 * LinearSrgb(float64((rgb >> 8) & 255) / 255.0)
            + 0.0722 * LinearSrgb(float64(rgb & 255) / 255.0)
            return if luminance > 0.179 {
                dark
            } else {
                light
            }
        }

        /// Converts a packed color to a Goo color.
        public func GooColor(rgb int32) Color -> Color.Rgb((rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255)
    }
}
