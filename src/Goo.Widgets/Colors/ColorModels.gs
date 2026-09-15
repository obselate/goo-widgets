package Goo.Widgets

import System

/// Selects the color model used by the picker wheel and tone slider.
public enum ColorMode {
    Hsl;
    Hsv;
    Oklch
}

/// A hue, saturation, and lightness color.
public data struct HslColor {
    /// Hue in degrees.
    var Hue float64
    /// Saturation from zero through one.
    var Saturation float64
    /// Lightness from zero through one.
    var Lightness float64

    /// Converts this value to packed 24-bit sRGB.
    public func Rgb() int32 {
        let saturation = Math.Clamp(Saturation, 0.0, 1.0)
        let lightness = Math.Clamp(Lightness, 0.0, 1.0)
        let chroma = (1.0 - Math.Abs(2.0 * lightness - 1.0)) * saturation
        return ChromaRgb(Hue, chroma, lightness - chroma / 2.0)
    }

    shared {
        /// Converts packed 24-bit sRGB to HSL.
        public func FromRgb(rgb int32) HslColor {
            let red = float64((rgb >> 16) & 255) / 255.0
            let green = float64((rgb >> 8) & 255) / 255.0
            let blue = float64(rgb & 255) / 255.0
            let maximum = Math.Max(red, Math.Max(green, blue))
            let minimum = Math.Min(red, Math.Min(green, blue))
            let delta = maximum - minimum
            let lightness = (maximum + minimum) / 2.0
            var hue = 0.0
            if delta > 0.0 {
                hue = 60.0 * if maximum == red {
                    ((green - blue) / delta) % 6.0
                } else if maximum == green {
                    (blue - red) / delta + 2.0
                } else {
                    (red - green) / delta + 4.0
                }
            }
            return HslColor{
                Hue: WrapHue(hue),
                Saturation: if delta == 0.0 {
                    0.0
                } else {
                    delta / (1.0 - Math.Abs(2.0 * lightness - 1.0))
                },
                Lightness: lightness,
            }
        }
    }
}

/// A hue, saturation, and value color.
public data struct HsvColor {
    /// Hue in degrees.
    var Hue float64
    /// Saturation from zero through one.
    var Saturation float64
    /// Value from zero through one.
    var Value float64

    /// Converts this value to packed 24-bit sRGB.
    public func Rgb() int32 {
        let saturation = Math.Clamp(Saturation, 0.0, 1.0)
        let value = Math.Clamp(Value, 0.0, 1.0)
        let chroma = value * saturation
        return ChromaRgb(Hue, chroma, value - chroma)
    }

    shared {
        /// Converts packed 24-bit sRGB to HSV.
        public func FromRgb(rgb int32) HsvColor {
            let hsl = HslColor.FromRgb(rgb)
            let value = hsl.Lightness + hsl.Saturation * Math.Min(hsl.Lightness, 1.0 - hsl.Lightness)
            let saturation = if value == 0.0 {
                0.0
            } else {
                2.0 * (1.0 - hsl.Lightness / value)
            }
            return HsvColor{Hue: hsl.Hue, Saturation: saturation, Value: value}
        }
    }
}

/// An OKLCH color.
public data struct OklchColor {
    /// Perceptual lightness from zero through one.
    var Lightness float64
    /// Chroma magnitude.
    var Chroma float64
    /// Hue in degrees.
    var Hue float64

    /// Converts this value to packed 24-bit sRGB.
    public func Rgb() int32 -> Encode(
        Lightness,
        Chroma * Math.Cos(Hue * Math.PI / 180.0),
        Chroma * Math.Sin(Hue * Math.PI / 180.0)
    )

    shared {
        /// Converts an OKLab triplet to packed 24-bit sRGB.
        public func Encode(lightness float64, a float64, b float64) int32 {
            Channels(lightness, a, b, out var red, out var green, out var blue)
            return (Channel(red) << 16) | (Channel(green) << 8) | Channel(blue)
        }

        /// Finds the largest in-gamut chroma for a lightness and hue.
        public func MaxChroma(lightness float64, hue float64) float64 {
            if lightness <= 0.0 || lightness >= 1.0 {
                return 0.0
            }
            let x = Math.Cos(hue * Math.PI / 180.0)
            let y = Math.Sin(hue * Math.PI / 180.0)
            var low = 0.0
            var high = 0.4
            for _ in 0 ... 18 {
                let middle = (low + high) / 2.0
                Channels(lightness, middle * x, middle * y, out var red, out var green, out var blue)
                if red >= 0.0 && red <= 1.0 && green >= 0.0 && green <= 1.0 && blue >= 0.0 && blue <= 1.0 {
                    low = middle
                } else {
                    high = middle
                }
            }
            return low
        }

        /// Converts packed 24-bit sRGB to OKLCH.
        public func FromRgb(rgb int32) OklchColor {
            let red = LinearSrgb(float64((rgb >> 16) & 255) / 255.0)
            let green = LinearSrgb(float64((rgb >> 8) & 255) / 255.0)
            let blue = LinearSrgb(float64(rgb & 255) / 255.0)
            let l = Math.Cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
            let m = Math.Cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
            let s = Math.Cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)
            let a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
            let b = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
            let chroma = Math.Sqrt(a * a + b * b)
            return OklchColor{
                Lightness: Math.Clamp(0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 0.0, 1.0),
                Chroma: if chroma < 0.000001 {
                    0.0
                } else {
                    chroma
                },
                Hue: if chroma < 0.000001 {
                    0.0
                } else {
                    WrapHue(Math.Atan2(b, a) * 180.0 / Math.PI)
                },
            }
        }

        private func Channel(value float64) int32 {
            let clamped = Math.Clamp(value, 0.0, 1.0)
            return int32(
                Math.Round(
                    255.0 * if clamped <= 0.0031308 {
                        12.92 * clamped
                    } else {
                        1.055 * Math.Pow(clamped, 1.0 / 2.4) - 0.055
                    }
                )
            )
        }

        private func Channels(
            lightness float64,
            a float64,
            b float64,
            out red float64,
            out green float64,
            out blue float64
        ) {
            let l = lightness + 0.3963377774 * a + 0.2158037573 * b
            let m = lightness - 0.1055613458 * a - 0.0638541728 * b
            let s = lightness - 0.0894841775 * a - 1.2914855480 * b
            let ll = l * l * l
            let mm = m * m * m
            let ss = s * s * s
            red = 4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss
            green = -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss
            blue = -0.0041960863 * ll - 0.7034186147 * mm + 1.7076147010 * ss
        }
    }
}

/// Normalizes a hue to the half-open range from zero through 360 degrees.
public func WrapHue(hue float64) float64 -> ((hue % 360.0) + 360.0) % 360.0

internal func ChromaRgb(hueDegrees float64, chroma float64, offset float64) int32 {
    let hue = WrapHue(hueDegrees) / 60.0
    let x = chroma * (1.0 - Math.Abs(hue % 2.0 - 1.0))
    let (red, green, blue) = switch int32(hue) {
        case 0: (chroma, x, 0.0)
        case 1: (x, chroma, 0.0)
        case 2: (0.0, chroma, x)
        case 3: (0.0, x, chroma)
        case 4: (x, 0.0, chroma)
        default: (chroma, 0.0, x)
    }
    return (int32(Math.Round((red + offset) * 255.0)) << 16)
    | (int32(Math.Round((green + offset) * 255.0)) << 8)
    | int32(Math.Round((blue + offset) * 255.0))
}

internal func LinearSrgb(channel float64) float64 -> if channel <= 0.04045 {
    channel / 12.92
} else {
    Math.Pow((channel + 0.055) / 1.055, 2.4)
}
