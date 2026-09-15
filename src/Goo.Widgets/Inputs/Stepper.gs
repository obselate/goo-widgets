package Goo.Widgets.Inputs

import Goo

/// A multi-step progress and process stepper with customizable step pills, labels, and root container.
public data struct Stepper {
    /// Ordered list of step labels. Nil or empty renders an empty group container.
    var Labels[]?string
    /// Current zero-based active step index. Clamped to valid label range if nonempty.
    var CurrentIndex int32
    /// Accessible name for the stepper container.
    var AccessibilityName string?
    /// Custom accessible value text. Nil defaults to the current step label.
    var AccessibilityValueText string?
    /// Total width of the stepper container. Nil resolves to 100%.
    var Width Length?
    /// Height of each step pill container. Zero resolves to 32.0.
    var Height float64
    /// Spacing between step pills. Nil resolves to 8.0; explicit zero is preserved.
    var Gap float64?
    /// Horizontal padding inside each step pill. Nil resolves to 12.0; explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Corner border radius of each step pill. Nil resolves to 16.0; explicit zero is preserved.
    var BorderRadius float64?
    /// Background color for completed steps. Nil resolves to #d4d4d8.
    var CompletedColor Color?
    /// Background color for the current active step. Nil resolves to #fafafa.
    var CurrentColor Color?
    /// Background color for upcoming incomplete steps. Nil resolves to #27272a.
    var UpcomingColor Color?
    /// Text color for completed and current steps. Nil resolves to #09090b.
    var ActiveTextColor Color?
    /// Text color for upcoming incomplete steps. Nil resolves to #a1a1aa.
    var UpcomingTextColor Color?
    /// Font size for step label text. Zero resolves to 12.0.
    var FontSize float64
    /// Font weight for step label text. Zero resolves to 600.
    var FontWeight int32
    /// Background transition duration in milliseconds. Nil resolves to 150.0; explicit zero is preserved.
    var TransitionMs float64?
    /// Background transition easing. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Root container opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Optional visual transform applied to the root container. Nil resolves to identity.
    var Transform PanelTransform?
    /// Custom factory for step label text. Receives resolved props, step index, and label string.
    var CreateLabel Func[Stepper, int32, string, Text]?
    /// Custom factory for step pill container. Receives resolved props, step index, and label text.
    var CreateStep Func[Stepper, int32, Text, Container]?
    /// Custom factory for root container. Receives resolved props and array of step pill containers.
    var CreateRoot Func[Stepper, []Container, Container]?

    /// Builds a fresh Goo element tree after resolving props and factories.
    public func Build() Blob {
        let createLabel = CreateLabel
        let createStep = CreateStep
        let createRoot = CreateRoot
        let rawLabels = Labels ?? []string{}
        let count = rawLabels.Length
        var current = CurrentIndex
        if count > 0 {
            if current < 0 {
                current = 0
            } else if current >= count {
                current = count - 1
            }
        }

        let resolved = this with{
            Labels = rawLabels,
            CurrentIndex = current,
            Width = Width ?? Length.Percent(100.0),
            Height = if Height == 0.0 {
                32.0
            } else {
                Height
            },
            Gap = Gap ?? 8.0,
            PaddingHorizontal = PaddingHorizontal ?? 12.0,
            BorderRadius = BorderRadius ?? 16.0,
            CompletedColor = CompletedColor ?? Color.Parse("#d4d4d8"),
            CurrentColor = CurrentColor ?? Color.Parse("#fafafa"),
            UpcomingColor = UpcomingColor ?? Color.Parse("#27272a"),
            ActiveTextColor = ActiveTextColor ?? Color.Parse("#09090b"),
            UpcomingTextColor = UpcomingTextColor ?? Color.Parse("#a1a1aa"),
            FontSize = if FontSize == 0.0 {
                12.0
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                600
            } else {
                FontWeight
            },
            TransitionMs = TransitionMs ?? 150.0,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateLabel = nil,
            CreateStep = nil,
            CreateRoot = nil,
        }

        let pills = [count]Container
        for index in 0 ... count {
            let labelText = rawLabels[index]
            var text Text? = nil
            if let createLabel = createLabel {
                text = createLabel(resolved, index, labelText)
            } else {
                let textColor = if index <= current {
                    resolved.ActiveTextColor!!
                } else {
                    resolved.UpcomingTextColor!!
                }
                text = Text{
                    Content: labelText,
                    Color: textColor,
                    FontSize: resolved.FontSize,
                    FontWeight: resolved.FontWeight,
                    Accessibility: Accessibility{Hidden: true},
                }
            }

            var pill Container? = nil
            if let createStep = createStep {
                pill = createStep(resolved, index, text!!)
            } else {
                var fillColor = resolved.UpcomingColor!!
                if index < current {
                    fillColor = resolved.CompletedColor!!
                } else if index == current {
                    fillColor = resolved.CurrentColor!!
                }
                pill = Container{
                    Width: Length.Percent(100.0),
                    Height: resolved.Height,
                    PaddingLeft: resolved.PaddingHorizontal!!,
                    PaddingRight: resolved.PaddingHorizontal!!,
                    BorderRadius: resolved.BorderRadius!!,
                    BackgroundColor: fillColor,
                    TransitionMs: resolved.TransitionMs!!,
                    TransitionEasing: resolved.TransitionEasing!!,
                    FlexGrow: 1.0,
                    AlignItems: AlignItems.Center,
                    JustifyContent: JustifyContent.Center,
                    text!!,
                }
            }
            pills[index] = pill!!
        }

        if let createRoot = createRoot {
            return createRoot(resolved, pills)
        }

        var semantics Accessibility? = nil
        if count > 0 {
            let accessibilityRange = AccessibilityValue{
                Minimum: 0.0,
                Maximum: float64(count - 1),
                Now: float64(current),
                Text: resolved.AccessibilityValueText ?? rawLabels[current],
            }
            if resolved.AccessibilityName != nil {
                semantics = Accessibility{
                    Role: AccessibilityRole.ProgressBar,
                    Name: resolved.AccessibilityName!!,
                    Range: accessibilityRange
                }
            } else {
                semantics = Accessibility{Role: AccessibilityRole.ProgressBar, Range: accessibilityRange}
            }
        } else if resolved.AccessibilityName != nil {
            semantics = Accessibility{Role: AccessibilityRole.Group, Name: resolved.AccessibilityName!!}
        } else {
            semantics = Accessibility{Role: AccessibilityRole.Group}
        }

        let root = Container{
            Width: resolved.Width!!,
            Gap: resolved.Gap!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            FlexDirection: FlexDirection.Row,
            Accessibility: semantics,
        }
        for i in 0 ... count {
            root.Children.Add(Container{Key: "${i}", FlexGrow: 1.0, pills[i]})
        }
        return root
    }
}
