package Goo.Widgets.Inputs

import Goo
import System
import System.Numerics

public open partial class TouchTextEditing {
    private var magnifier ShaderEffect?

    shared {
        private let magnifierProgram Lazy[ShaderEffectProgram] =
            Lazy[ShaderEffectProgram](() -> LoadMagnifierProgram())

        private func LoadMagnifierProgram() ShaderEffectProgram {
            using let stream = typeof(TouchTextEditing).Assembly.GetManifestResourceStream("Goo.Widgets.TouchMagnifier")
            if stream == nil { throw InvalidOperationException("Touch magnifier shader is missing") }
            let bytes = [int32(stream.Length)]uint8
            stream.ReadExactly(bytes)
            return ShaderEffectProgram(bytes, replacesBackdrop: true)
        }
    }

    private func Magnifier() Blob {
        let viewportWidth = Math.Max(1.0, viewport.Width)
        let viewportHeight = Math.Max(1.0, viewport.Height)
        let width = Math.Min(120.0, viewportWidth)
        let height = Math.Min(64.0, viewportHeight)
        let content = handle.ContentBox
        let leftBound = Math.Clamp(content.X, viewport.X, viewport.X + viewportWidth)
        let topBound = Math.Clamp(content.Y, viewport.Y, viewport.Y + viewportHeight)
        let sourceX = Math.Clamp(dragPoint.X, leftBound,
            Math.Clamp(content.X + content.Width, leftBound, viewport.X + viewportWidth))
        let sourceY = Math.Clamp(dragPoint.Y, topBound,
            Math.Clamp(content.Y + content.Height, topBound, viewport.Y + viewportHeight))
        let left = Math.Clamp(sourceX - width * 0.5, viewport.X, viewport.X + viewportWidth - width)
        let preferredTop = sourceY >= viewport.Y + height + 32.0 ? sourceY - height - 32.0 : sourceY + 32.0
        let top = Math.Clamp(preferredTop, viewport.Y, viewport.Y + viewportHeight - height)
        magnifier ??= ShaderEffect(magnifierProgram.Value, samplesBackdrop: true, backdropOutset: 128.0F)
        magnifier!!.SetParameter(0, Vector4(float32((sourceX - left - width * 0.5) / width),
            float32((sourceY - top - height * 0.5) / height), 2.0F, 0.0F))
        return Container{
            Key: "magnifier", Position: PositionType.Absolute,
            Left: left, Top: top, Width: width, Height: height,
            BorderRadius: 10, BorderWidth: 1, BorderColor: theme.BorderColor,
            Overflow: Overflow.Hidden,
            HitTestSelf: false, Accessibility: Accessibility{Hidden: true},
            Container{Width: Percent(100), Height: Percent(100), BorderRadius: 10,
                ShaderEffect: magnifier, HitTestSelf: false, Accessibility: Accessibility{Hidden: true}},
        }
    }
}
