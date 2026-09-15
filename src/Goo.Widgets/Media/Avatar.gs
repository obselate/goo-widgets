package Goo.Widgets

import Goo

/// A fixed-size avatar that selects an image or fallback text child.
/// Factories receive resolved props and may replace the selected final primitives.
public data struct Avatar {
    /// Accessible name. Nil makes the root decorative and hidden from semantics.
    var AccessibilityName string?
    /// Local image path. A non-empty path selects image mode.
    var ImagePath string?
    /// Provider-backed image source. A non-nil source selects image mode and wins over the path.
    var ImageSource ImageSourceProvider?
    /// Fallback text. Nil renders as an empty string.
    var FallbackText string?
    /// Background color. Nil resolves to #27272a.
    var BackgroundColor Color?
    /// Fallback text color. Nil resolves to #fafafa.
    var TextColor Color?
    /// Border color. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Avatar width and height. Zero resolves to 40.
    var Size float64
    /// Border width. Preserved as supplied.
    var BorderWidth float64
    /// Corner radius. Nil resolves to half the size; explicit zero remains zero.
    var BorderRadius float64?
    /// Fallback font family. Nil inherits Goo's font choice.
    var FontFamily string?
    /// Image fit mode. Nil resolves to Cover.
    var Fit ImageFit?
    /// Root opacity. Nil resolves to 1.
    var Opacity float64?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Fallback font size. Zero resolves to 16.
    var FontSize float64
    /// Fallback font weight. Zero resolves to 600.
    var FontWeight int32
    /// Creates the final image from resolved props. Nil uses Avatar's composition.
    var CreateImage Func[Avatar, Image]?
    /// Creates the final fallback text from resolved props. Nil uses Avatar's composition.
    var CreateFallback Func[Avatar, Text]?
    /// Creates the final root from resolved props and the selected child. Nil uses Avatar's composition.
    var CreateRoot Func[Avatar, Blob, Container]?

    /// Builds a fresh Goo tree, resolving props before invoking selected primitive factories.
    public func Build() Blob {
        let createImage = CreateImage
        let createFallback = CreateFallback
        let createRoot = CreateRoot
        let imageMode = ImageSource != nil || (ImagePath ?? "") != ""
        let size = if Size == 0.0 {
            40.0
        } else {
            Size
        }
        let background = BackgroundColor ?? Color.Parse("#27272a")
        let resolved = this with{
            Size = size,
            BackgroundColor = background,
            TextColor = TextColor ?? Color.Parse("#fafafa"),
            BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
            BorderRadius = BorderRadius ?? (size / 2.0),
            FontSize = if FontSize == 0.0 {
                16.0
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                600
            } else {
                FontWeight
            },
            Fit = Fit ?? ImageFit.Cover,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateImage = nil,
            CreateFallback = nil,
            CreateRoot = nil,
        }

        var child Blob? = nil
        if imageMode {
            if let createImage = createImage {
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
        } else if let createFallback = createFallback {
            child = createFallback(resolved)
        } else {
            let fallback = Text{
                Content: resolved.FallbackText ?? "",
                Color: resolved.TextColor!!,
                FontSize: resolved.FontSize,
                FontWeight: resolved.FontWeight,
            }
            if let fontFamily = resolved.FontFamily {
                fallback.FontFamily = fontFamily
            }
            child = fallback
        }

        if let createRoot = createRoot {
            return createRoot(resolved, child)
        }
        var semantics = Accessibility{Role: AccessibilityRole.None, Hidden: true}
        if let accessibilityName = resolved.AccessibilityName {
            semantics = Accessibility{Role: AccessibilityRole.Image, Name: accessibilityName}
        }
        return Container{
            Width: resolved.Size,
            Height: resolved.Size,
            BorderRadius: resolved.BorderRadius!!,
            BorderWidth: resolved.BorderWidth,
            BorderColor: resolved.BorderColor!!,
            BackgroundColor: resolved.BackgroundColor!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            Overflow: Overflow.Hidden,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Accessibility: semantics,
            child,
        }
    }
}
