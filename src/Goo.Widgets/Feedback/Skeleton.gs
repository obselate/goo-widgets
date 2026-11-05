package Goo.Widgets.Feedback

import Goo
import Goo.Widgets
import System

/// Selects placeholder geometry.
public enum SkeletonVariant {
    /// A stack of text lines with a shorter last line.
    Text;
    /// A circular placeholder.
    Circle;
    /// A rectangular placeholder.
    Rectangle
}

/// Placeholder appearance and animation policy. Loading state remains caller-owned.
public data struct SkeletonInput {
    /// Geometry. Defaults to Text.
    var Variant SkeletonVariant
    /// Whether the shimmer runs. Nil uses true. Reduced motion always uses static shapes.
    var Animated bool?
    /// Positive text line count. Nil uses three. Ignored for other variants.
    var Lines int32?
    /// Width for text and rectangle. Nil uses six theme control heights. Circle uses Size.
    var Width Length?
    /// Height for rectangle or text block. Nil fits text or uses two theme control heights for rectangle.
    var Height Length?
    /// Circle diameter in logical pixels. Nil uses the theme control height.
    var Size float64?
    /// Text line height in logical pixels. Nil uses the theme font size.
    var LineHeight float64?
    /// Text line gap in logical pixels. Nil uses the theme control gap.
    var Gap float64?
    /// Placeholder fill. Nil uses the theme sunken surface.
    var BackgroundColor Color?
    /// Shimmer highlight. Nil uses the theme hover surface.
    var ShimmerColor Color?
    /// Corner radius for text and rectangle. Nil uses the theme control radius.
    var BorderRadius float64?
    /// Nil hides decorative placeholders from accessibility. A name exposes one busy status node.
    var AccessibilityName string?
    /// Receives resolved input and the prepared root. Preserve its children and geometry.
    var CreateRoot Func[SkeletonInput, Container, Container]?
}

/// Retained placeholders with paint-only shimmer. The Cell owns and disposes its animation.
public open class Skeleton : Cell[SkeletonInput] {
    private let sweep Anim[Point]
    private let handle ElementHandle = ElementHandle()
    private var animated bool
    private var width float64
    private var period float64

    /// Creates the retained paint animation and observes width changes.
    public init() {
        sweep = AnimateValue(Point{}, MotionConverter[Point](1,
            ReadCoordinate,
            (coordinates []float64) -> Point{X: coordinates[0]}))
        handle.MetricsChanged += (metrics ElementMetrics) -> {
            if metrics.BorderBox.Width > 0.0 && width != metrics.BorderBox.Width {
                width = metrics.BorderBox.Width
                Start()
            }
        }
    }

    private func ReadCoordinate(value Point, coordinates []float64) {
        coordinates[0] = value.X
    }

    protected override func Build(input SkeletonInput) Blob {
        let theme = Theme.Read()
        let lines = input.Lines ?? 3
        if input.Variant == SkeletonVariant.Text && lines <= 0 { throw ArgumentOutOfRangeException("Lines") }
        let circle = input.Variant == SkeletonVariant.Circle
        let text = input.Variant == SkeletonVariant.Text
        let defaultWidth Length = theme.ControlHeight * 6
        let defaultHeight Length = text ? Length.Auto: theme.ControlHeight * 2
        let resolved = input with{
            Lines = lines, Animated = input.Animated != false && !theme.ReducedMotion,
            Width = input.Width ?? defaultWidth, Height = input.Height ?? defaultHeight,
            Size = input.Size ?? theme.ControlHeight, LineHeight = input.LineHeight ?? theme.FontSize,
            Gap = input.Gap ?? theme.ControlGap, BackgroundColor = input.BackgroundColor ?? theme.SunkenColor,
            ShimmerColor = input.ShimmerColor ?? theme.HoverColor, BorderRadius = input.BorderRadius ?? theme.ControlRadius!!,
        }
        let enabled = resolved.Animated!!
        let changed = animated != enabled || period != theme.SpinnerPeriodMs
        animated = enabled
        period = theme.SpinnerPeriodMs
        if changed || (animated && !sweep.Running) { Start() }
        let root = Container{
            Width: circle ? resolved.Size!!: resolved.Width!!,
            Height: circle ? resolved.Size!!: resolved.Height!!,
            MaxWidth: Percent(100), Gap: resolved.Gap!!, HitTestSelf: false,
        }
        let gradient Gradient? = animated ? LinearGradient(90, []Color{
            Color.Transparent, Color.Transparent, resolved.ShimmerColor!!, Color.Transparent, Color.Transparent,
        }): nil
        let count = text ? lines: 1
        for index in 0 ... count {
            let shape = Container{
                Position: PositionType.Relative, Overflow: Overflow.Hidden, FlexShrink: 0,
                Width: text && count > 1 && index == count - 1 ? Percent(65): Percent(100),
                Height: text ? resolved.LineHeight!!: Percent(100),
                BackgroundColor: resolved.BackgroundColor!!,
                BorderRadius: circle ? resolved.Size!! / 2: resolved.BorderRadius!!,
                HitTestSelf: false,
            }
            if animated {
                shape.Children.Add(Container{
                    Position: PositionType.Absolute, Left: Percent(-50), Top: 0, Bottom: 0, Width: Percent(200),
                    BackgroundGradient: gradient!!, TranslateAnim: sweep, HitTestSelf: false,
                })
            }
            root.Children.Add(shape)
        }
        let result = input.CreateRoot?.Invoke(resolved, root) ?? root
        result.Handle = handle
        result.Focusable = false
        result.TabStop = false
        result.Accessibility = Accessibility{
            Role: input.AccessibilityName == nil ? AccessibilityRole.None: AccessibilityRole.Status,
            Name: input.AccessibilityName ?? "", Hidden: input.AccessibilityName == nil, Busy: true,
        }
        return result
    }

    private func Start() {
        if !animated || width <= 0.0 {
            sweep.Snap(Point{})
            return
        }
        let distance = width
        let seconds = period / 1000.0
        sweep.To(Point{}, (from float64, to float64, velocity float64) -> SkeletonSweep(distance, seconds))
    }
}

internal sealed class SkeletonSweep(Width float64, Period float64) : Simulation {
    public override prop IsInfinite bool { get -> true }

    public override func Position(elapsed float64) float64 -> Width * (2 * (elapsed / Period - Math.Floor(elapsed / Period)) - 1)
    public override func Velocity(elapsed float64) float64 -> 2 * Width / Period
    public override func Done(elapsed float64) bool -> false
}
