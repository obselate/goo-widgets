package Goo.Widgets.Feedback

import Goo
import Goo.Widgets
import System

/// Loading visuals driven by the window animation clock.
public enum SpinnerVariant {
    Ring;
    Dots;
    Bars
}

/// Spinner appearance. Zero Size uses 24 pixels.
public data struct SpinnerInput {
    var Variant SpinnerVariant
    var Size float64
    var StrokeWidth float64?
    var Color Color?
    var Label string?
    var CreateRoot Func[SpinnerInput, Container, Container]?
}

/// An animated loading indicator with a still frame under reduced motion.
public open class Spinner : Cell[SpinnerInput] {
    private let opacities []Anim[float64] = [12]Anim[float64]
    private let scales []Anim[float64] = [3]Anim[float64]
    private var variant SpinnerVariant?
    private var period float64

    shared {
        private let bar VectorPath = PathBuilder().MoveTo(0.5, 0.1).LineTo(0.5, 0.9).Build()
    }

    public init() {
        for index in 0 ... 12 {
            opacities[index] = AnimateValue(1.0)
        }
        for index in 0 ... 3 {
            scales[index] = AnimateValue(1.0)
        }
    }

    protected override func Build(input SpinnerInput) Blob {
        let theme = Theme.Read()
        let size = input.Size == 0.0 ? 24.0: input.Size
        let stroke = input.StrokeWidth ?? Math.Max(2.0, size / 10.0)
        if !Double.IsFinite(size) || size <= 0.0 || !Double.IsFinite(stroke) || stroke <= 0.0 || stroke > size / 2.0 {
            throw ArgumentOutOfRangeException("Size")
        }
        let ring = input.Variant == SpinnerVariant.Ring
        let bars = input.Variant == SpinnerVariant.Bars
        let count = ring ? 12: 3
        if theme.ReducedMotion || !opacities[0].Running || variant != input.Variant || period != theme.SpinnerPeriodMs {
            variant = input.Variant
            period = theme.SpinnerPeriodMs
            for anim in opacities {
                anim.Snap(1.0)
            }
            for anim in scales {
                anim.Snap(1.0)
            }
            for index in 0 ... count {
                let offset = float64(index) / float64(count)
                Pulse(opacities[index], SpinnerPulse(period / 1000.0, offset, 0.25), theme.ReducedMotion)
                if bars {
                    Pulse(scales[index], SpinnerPulse(period / 1000.0, offset, 0.1875), theme.ReducedMotion)
                }
            }
        }
        let resolved = input with{Size = size, Color = input.Color ?? theme.AccentColor, StrokeWidth = stroke}
        let root = Container{
            Position: PositionType.Relative,
            Width: size,
            Height: size,
            Accessibility: Accessibility{Role: AccessibilityRole.Status, Name: input.Label ?? theme.Text("Loading"), Busy: true},
        }
        let radius = (size - stroke) / 2.0
        let width = ring ? stroke: size / 5.0
        for index in 0 ... count {
            let angle = float64(index) / float64(count) * Math.PI * 2.0 - Math.PI / 2.0
            if bars {
                root.Children.Add(
                    Shape{
                        Position: PositionType.Absolute,
                        Left: float64(index) * size * 0.4 - width / 2.0,
                        Top: 0.0,
                        Width: width * 2.0,
                        Height: size,
                        Path: bar,
                        Fit: ShapeFit.Fill,
                        StrokeCap: StrokeCap.Round,
                        VectorEffect: VectorEffect.NonScalingStroke,
                        BorderWidth: width,
                        BorderColor: resolved.Color!!,
                        OpacityAnim: opacities[index],
                        ScaleAnim: scales[index],
                    }
                )
            } else {
                root.Children.Add(
                    Container{
                        Position: PositionType.Absolute,
                        Left: ring ? radius + Math.Cos(angle) * radius: float64(index) * size * 0.4,
                        Top: ring ? radius + Math.Sin(angle) * radius: (size - width) / 2.0,
                        Width: width,
                        Height: width,
                        BorderRadius: width / 2.0,
                        BackgroundColor: resolved.Color!!,
                        OpacityAnim: opacities[index],
                    }
                )
            }
        }
        return input.CreateRoot?.Invoke(resolved, root) ?? root
    }

    private func Pulse(anim Anim[float64], pulse SpinnerPulse, reduced bool) {
        if reduced {
            anim.Snap(pulse.At(0.0))
        } else {
            anim.To(pulse.At(0.0), (from float64, to float64, velocity float64) -> pulse)
        }
    }
}

internal sealed class SpinnerPulse(Period float64, Offset float64, Low float64) : Simulation {
    public override func Position(elapsed float64) float64 -> At(elapsed / Period)

    public override func Velocity(elapsed float64) float64 ->
        (1.0 - Low) * Math.PI / Period * Math.Cos((elapsed / Period - Offset) * Math.PI * 2.0)

    public override func Done(elapsed float64) bool -> false

    internal func At(phase float64) float64 -> Low + (1.0 - Low) * (Math.Sin((phase - Offset) * Math.PI * 2.0) + 1.0) / 2.0
}
