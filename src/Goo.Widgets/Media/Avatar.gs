package Goo.Widgets.Media

import Goo
import Goo.Widgets

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
    /// Background color. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Fallback text color. Nil uses the nearest theme.
    var TextColor Color?
    /// Border color. Nil uses the nearest theme.
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
    /// Fallback font size. Zero uses the nearest theme font size.
    var FontSize float64
    /// Fallback font weight. Zero uses the nearest theme font weight.
    var FontWeight int32
    /// Creates the final image from resolved props. Nil uses Avatar's composition.
    var CreateImage Func[Avatar, Image]?
    /// Creates the final fallback text from resolved props. Nil uses Avatar's composition.
    var CreateFallback Func[Avatar, Text]?
    /// Creates the final root from resolved props and the selected child. Nil uses Avatar's composition.
    var CreateRoot Func[Avatar, Blob, Container]?

    /// Builds a fresh Goo tree, resolving props before invoking selected primitive factories.
    public func Build() Blob {
        let theme = Theme.Read()
        let createImage = CreateImage
        let createFallback = CreateFallback
        let createRoot = CreateRoot
        let imageMode = ImageSource != nil || (ImagePath ?? "") != ""
        let size = if Size == 0.0 {
            40.0
        } else {
            Size
        }
        let background = BackgroundColor ?? theme.PanelColor
        let resolved = this with{
            Size = size,
            BackgroundColor = background,
            TextColor = TextColor ?? theme.TextColor,
            BorderColor = BorderColor ?? theme.BorderColor,
            BorderRadius = BorderRadius ?? (size / 2.0),
            FontFamily = FontFamily ?? theme.FontFamily,
            FontSize = if FontSize == 0.0 {
                theme.FontSize
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                theme.FontWeight
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
                    Width: Percent(100.0),
                    Height: Percent(100.0),
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
            LineHeight: theme.LineHeight,
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
