package Goo.Widgets.Colors

import Goo
import System

/// A stable, versioned image provider for a circular color field.
public sealed class ColorWheelSource : ImageSourceProvider, IDisposable {
    private let resolution int32
    private var source ImageSource?
    private var version uint64 = 1uL
    private var currentMode ColorMode
    private var currentTone float64 = -1.0
    private var hasFrame bool

    /// Creates a stable color wheel provider.
    public init(resolution int32) {
        if resolution < 16 || resolution > 2048 {
            throw ArgumentOutOfRangeException("resolution")
        }
        this.resolution = resolution
    }

    /// Gets the pixel width and height of generated frames.
    public prop Resolution int32 {
        get -> resolution
    }
    /// Identifies the current immutable frame.
    public prop ContentVersion uint64 {
        get -> version
    }
    /// Notifies mounted Goo image bindings after a complete frame is available.
    public event ContentChanged Action

    /// Acquires the current immutable frame.
    public func Acquire() ImageSourceLease {
        if let current = source {
            return current.Acquire()
        }
        return ImageSourceLease()
    }

    /// Generates a frame when the mode or tone changed.
    public func Update(mode ColorMode, tone float64) {
        if !Double.IsFinite(tone) {
            throw ArgumentOutOfRangeException("tone")
        }
        let clampedTone = Math.Clamp(tone, 0.0, 1.0)
        if hasFrame && currentMode == mode && Math.Abs(currentTone - clampedTone) <= 0.000001 {
            return
        }
        let pixels = [resolution * resolution * 4]uint8
        for y in 0 ... resolution {
            for x in 0 ... resolution {
                let dx = 2.0 * (float64(x) + 0.5) / float64(resolution) - 1.0
                let dy = 2.0 * (float64(y) + 0.5) / float64(resolution) - 1.0
                let radius = Math.Sqrt(dx * dx + dy * dy)
                let alpha = Math.Clamp((1.0 - radius) * float64(resolution) / 2.0 + 0.5, 0.0, 1.0)
                if alpha == 0.0 {
                    continue
                }
                let hue = WrapHue(Math.Atan2(dy, dx) * 180.0 / Math.PI)
                let rgb = Sample(mode, hue, Math.Min(radius, 1.0), clampedTone)
                let index = (y * resolution + x) * 4
                pixels[index] = uint8(Math.Round(float64((rgb >> 16) & 255) * alpha))
                pixels[index + 1] = uint8(Math.Round(float64((rgb >> 8) & 255) * alpha))
                pixels[index + 2] = uint8(Math.Round(float64(rgb & 255) * alpha))
                pixels[index + 3] = uint8(Math.Round(255.0 * alpha))
            }
        }
        let previous = source
        source = ImageSource(resolution, resolution, pixels)
        currentMode = mode
        currentTone = clampedTone
        hasFrame = true
        version++
        ContentChanged?.Invoke()
        previous?.Dispose()
    }

    /// Releases the provider's current frame.
    public func Dispose() {
        let previous = source
        source = nil
        hasFrame = false
        previous?.Dispose()
    }

    shared {
        /// Samples one wheel coordinate in the requested color model.
        public func Sample(mode ColorMode, hue float64, radius float64, tone float64) int32 {
            let normalizedHue = WrapHue(hue)
            let normalizedRadius = Math.Clamp(radius, 0.0, 1.0)
            let normalizedTone = Math.Clamp(tone, 0.0, 1.0)
            if mode == ColorMode.Hsl {
                return HslColor{Hue: normalizedHue, Saturation: normalizedRadius, Lightness: normalizedTone}.Rgb()
            }
            if mode == ColorMode.Hsv {
                return HsvColor{Hue: normalizedHue, Saturation: normalizedRadius, Value: normalizedTone}.Rgb()
            }
            let chroma = normalizedRadius * OklchColor.MaxChroma(normalizedTone, normalizedHue)
            return OklchColor{Lightness: normalizedTone, Chroma: chroma, Hue: normalizedHue}.Rgb()
        }
    }
}
