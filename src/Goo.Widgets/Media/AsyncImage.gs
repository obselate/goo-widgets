package Goo.Widgets.Media

import Goo

/// A presentation-only image state control with loading and failure fallbacks.
/// Factories receive resolved props and may replace the selected child or root.
public data struct AsyncImage {
    /// Accessible name. Nil keeps an unnamed ready image decorative and hidden.
    var AccessibilityName string?
    /// Local image path retained even when ImageSource wins.
    var ImagePath string?
    /// Provider-backed image source. A non-nil source wins over ImagePath.
    var ImageSource ImageSourceProvider?
    /// Whether the loading placeholder state is selected.
    var Loading bool
    /// Whether the error state wins over Loading.
    var Failed bool
    /// Loading text. Nil resolves to Loading.
    var PlaceholderText string?
    /// Failure text. Nil resolves to Image unavailable.
    var ErrorText string?
    /// Root background color. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Loading text color. Nil resolves to #a1a1aa.
    var PlaceholderTextColor Color?
    /// Failure text color. Nil resolves to #fca5a5.
    var ErrorTextColor Color?
    /// Root border color. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Root width. Zero resolves to 160.0.
    var Width float64
    /// Root height. Zero resolves to 120.0.
    var Height float64
    /// Border width. Nil resolves to 1.0; explicit zero survives.
    var BorderWidth float64?
    /// Border radius. Nil resolves to 8.0; explicit zero survives.
    var BorderRadius float64?
    /// Transition duration. Nil resolves to 150.0; explicit zero survives.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Root opacity. Nil resolves to 1.0; explicit zero survives.
    var Opacity float64?
    /// Optional fallback text font family.
    var FontFamily string?
    /// Image fit. Nil resolves to Cover.
    var Fit ImageFit?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Fallback text size. Zero resolves to 14.0.
    var FontSize float64
    /// Fallback text weight. Zero resolves to 500.
    var FontWeight int32
    /// Creates the selected image from resolved props.
    var CreateImage Func[AsyncImage, Image]?
    /// Creates the selected placeholder from resolved props.
    var CreatePlaceholder Func[AsyncImage, Blob]?
    /// Creates the selected error from resolved props.
    var CreateError Func[AsyncImage, Blob]?
    /// Creates the root from resolved props and the selected child.
    var CreateRoot Func[AsyncImage, Blob, Container]?

    /// Builds a fresh Goo tree after resolving props and selecting one child.
    public func Build() Blob {
        let createImage = CreateImage
        let createPlaceholder = CreatePlaceholder
        let createError = CreateError
        let createRoot = CreateRoot
        let placeholderText = PlaceholderText ?? "Loading"
        let errorText = ErrorText ?? "Image unavailable"
        let background = BackgroundColor ?? Color.Parse("#18181b")
        let resolved = this with{
            PlaceholderText = placeholderText,
            ErrorText = errorText,
            BackgroundColor = background,
            PlaceholderTextColor = PlaceholderTextColor ?? Color.Parse("#a1a1aa"),
            ErrorTextColor = ErrorTextColor ?? Color.Parse("#fca5a5"),
            BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
            Width = if Width == 0.0 {
                160.0
            } else {
                Width
            },
            Height = if Height == 0.0 {
                120.0
            } else {
                Height
            },
            BorderWidth = BorderWidth ?? 1.0,
            BorderRadius = BorderRadius ?? 8.0,
            TransitionMs = TransitionMs ?? 150.0,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            Fit = Fit ?? ImageFit.Cover,
            FontSize = if FontSize == 0.0 {
                14.0
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                500
            } else {
                FontWeight
            },
            Transform = Transform ?? PanelTransform{},
            CreateImage = nil,
            CreatePlaceholder = nil,
            CreateError = nil,
            CreateRoot = nil,
        }

        var child Blob? = nil
        var role = AccessibilityRole.Image
        var live = AccessibilityLive.Off
        var name = resolved.AccessibilityName
        if resolved.Failed {
            role = AccessibilityRole.Alert
            live = AccessibilityLive.Assertive
            name = name ?? resolved.ErrorText!!
            if let createError = createError {
                child = createError(resolved)
            } else {
                child = FallbackText(
                    resolved.ErrorText!!,
                    resolved.ErrorTextColor!!,
                    resolved.FontFamily,
                    resolved.FontSize,
                    resolved.FontWeight
                )
            }
        } else if resolved.Loading {
            role = AccessibilityRole.Status
            live = AccessibilityLive.Polite
            name = name ?? resolved.PlaceholderText!!
            if let createPlaceholder = createPlaceholder {
                child = createPlaceholder(resolved)
            } else {
                child = FallbackText(
                    resolved.PlaceholderText!!,
                    resolved.PlaceholderTextColor!!,
                    resolved.FontFamily,
                    resolved.FontSize,
                    resolved.FontWeight
                )
            }
        } else if let createImage = createImage {
            child = createImage(resolved)
        } else {
            child = Image{
                Path: resolved.ImagePath ?? "",
                Source: resolved.ImageSource,
                Fit: resolved.Fit!!,
                Width: Length.Percent(100.0),
                Height: Length.Percent(100.0),
            }
        }

        if let createRoot = createRoot {
            return createRoot(resolved, child)
        }
        var semantics = Accessibility{Role: role, Live: live}
        if resolved.Failed || resolved.Loading || resolved.AccessibilityName != nil {
            semantics = Accessibility{Role: role, Live: live, Name: name!!}
        } else {
            semantics = Accessibility{Role: AccessibilityRole.None, Hidden: true}
        }
        return Container{
            Width: resolved.Width,
            Height: resolved.Height,
            BorderRadius: resolved.BorderRadius!!,
            BorderWidth: resolved.BorderWidth!!,
            BorderColor: resolved.BorderColor!!,
            BackgroundColor: resolved.BackgroundColor!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            Overflow: Overflow.Hidden,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Accessibility: semantics,
            child
        }
    }

    private func FallbackText(
        content string,
        color Color,
        fontFamily string?,
        fontSize float64,
        fontWeight int32
    ) Text {
        let text = Text{Content: content, Color: color, FontSize: fontSize, FontWeight: fontWeight}
        if let fontFamily = fontFamily {
            text.FontFamily = fontFamily
        }
        return text
    }
}
