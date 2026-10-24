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
    private let phase Anim[float64]
    private var reduced bool

    public init() {
        phase = Animate(0.0)
        phase.Completed += (reason MotionCompletionReason) -> {
            if !reduced && reason == MotionCompletionReason.Finished {
                phase.Snap(0.0)
                phase.To(1.0, Motion.Tween(1.0))
            }
        }
    }

    protected override func Build(input SpinnerInput) Blob {
        let theme = Theme.Read()
        let size = input.Size == 0.0 ? 24.0: input.Size
        let stroke = input.StrokeWidth ?? Math.Max(2.0, size / 10.0)
        if !Double.IsFinite(size) || size <= 0.0 || !Double.IsFinite(stroke) || stroke <= 0.0 || stroke > size / 2.0 {
            throw ArgumentOutOfRangeException("Size")
        }
        reduced = theme.ReducedMotion
        if reduced {
            phase.Snap(0.0)
        } else if !phase.Running {
            phase.To(1.0, Motion.Tween(1.0))
        }
        let resolved = input with{Size = size, Color = input.Color ?? theme.AccentColor, StrokeWidth = stroke}
        let root = Container{
            Position: PositionType.Relative,
            Width: size,
            Height: size,
            Accessibility: Accessibility{Role: AccessibilityRole.Status, Name: input.Label ?? "Loading", Busy: true},
        }
        let ring = input.Variant == SpinnerVariant.Ring
        let count = ring ? 12: 3
        let radius = (size - stroke) / 2.0
        let width = ring ? stroke: size / 5.0
        let value = phase.Value
        for index in 0 ... count {
            let fraction = float64(index) / float64(count)
            let angle = ring ? fraction * Math.PI * 2.0 - Math.PI / 2.0: 0.0
            let pulse = (Math.Sin((value - fraction) * Math.PI * 2.0) + 1.0) / 2.0
            let height = input.Variant == SpinnerVariant.Bars ? size * (0.35 + pulse * 0.65): width
            root.Children.Add(
                Container{
                    Position: PositionType.Absolute,
                    Left: ring ? radius + Math.Cos(angle) * radius: float64(index) * size * 0.4,
                    Top: ring ? radius + Math.Sin(angle) * radius: (size - height) / 2.0,
                    Width: width,
                    Height: height,
                    BorderRadius: width / 2.0,
                    BackgroundColor: resolved.Color!!,
                    Opacity: 0.25 + pulse * 0.75,
                }
            )
        }
        return input.CreateRoot?.Invoke(resolved, root) ?? root
    }
}
