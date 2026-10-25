package Goo.Widgets.Media

import Goo
import Goo.Widgets
import Goo.Widgets.Feedback
import System

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
    var Presence StatusState?
    var RingColor Color?
    var NameTone Tone?
    var FallbackIcon Blob?
    /// Background color. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Fallback text color. Nil uses the nearest theme.
    var TextColor Color?
    /// Border color. Nil uses the nearest theme.
    var BorderColor Color?
    /// Avatar width and height. Zero resolves to 40.
    var Size float64
    /// Border width. A RingColor uses the theme border width when this is zero.
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
            TextColor = TextColor ?? (NameTone != nil ? theme.ToneColor(NameTone!!): theme.TextColor),
            BorderColor = RingColor ?? BorderColor ?? theme.BorderColor,
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
        } else if let icon = FallbackIcon {
            child = icon
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
        let root = Container{
            LineHeight: theme.LineHeight,
            Width: resolved.Size,
            Height: resolved.Size,
            BorderRadius: resolved.BorderRadius!!,
            BorderWidth: RingColor != nil && BorderWidth == 0.0 ? theme.BorderWidth: resolved.BorderWidth,
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
        if let presence = Presence {
            let marker = BuildPresence(theme, size)!!
            marker.End = 0.0
            if let name = resolved.AccessibilityName {
                semantics = Accessibility{Role: AccessibilityRole.Image, Name: name + ", " + presence.ToString()}
            }
            root.Accessibility = Accessibility{Role: AccessibilityRole.None, Hidden: true}
            return Container{
                Position: PositionType.Relative,
                Overflow: Overflow.Visible,
                Width: size,
                Height: size,
                Accessibility: semantics,
                root,
                marker,
            }
        }
        return root
    }

    internal func BuildPresence(theme Theme, size float64) Container? {
        guard let presence = Presence else {
            return nil
        }
        return Container{
            Position: PositionType.Absolute,
            Bottom: 0.0,
            Width: size / 4.0,
            Height: size / 4.0,
            BorderRadius: size / 8.0,
            BorderWidth: theme.BorderWidth * 2.0,
            BorderColor: theme.PanelColor,
            BackgroundColor: theme.ToneColor(
                switch presence {
                    case StatusState.Done: Tone.Success
                    case StatusState.Running: Tone.Info
                    case StatusState.Waiting: Tone.Warning
                    case StatusState.Failed: Tone.Danger
                    default: Tone.Neutral
                }
            ),
            Accessibility: Accessibility{Role: AccessibilityRole.None, Hidden: true},
        }
    }
}

/// Overlapping avatars with an overflow count and optional per-person actions.
public data struct AvatarGroup {
    var Items[]Avatar
    var Max int32?
    var Size float64
    var Overlap float64?
    var AccessibilityName string?
    var OnActivate Action[int32]?

    /// Builds a named group. Only actionable avatars enter the tab order.
    public func Build() Blob {
        let theme = Theme.Read()
        let size = Size == 0.0 ? 40.0: Size
        let overlap = Overlap ?? 12.0
        let items = Items ?? []Avatar{}
        let count = Math.Min(items.Length, Math.Max(0, Max ?? 5))
        let displayed = count + (items.Length > count ? 1: 0)
        let root = Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Position: PositionType.Relative,
            Overflow: Overflow.Visible,
            Width: displayed == 0 ? 0.0: size * float64(displayed) - overlap * float64(displayed - 1),
            Height: size,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: AccessibilityName ?? theme.Text("People")},
        }
        for index in 0 ... count {
            let avatar = (
                items[index]with{
                    Size = size,
                    AccessibilityName = nil,
                    Presence = nil,
                    BackgroundColor = items[index].BackgroundColor ?? theme.HoverColor,
                    RingColor = items[index].RingColor ?? theme.PanelColor,
                    BorderWidth = items[index].BorderWidth == 0.0 ? theme.BorderWidth * 2.0: items[index].BorderWidth,
                }
            ).Build()
            avatar.FlexShrink = 0.0
            let offset = index == 0 ? 0.0: -overlap
            if let activate = OnActivate {
                let itemIndex = index
                let button = Button{
                    MarginStart: offset,
                    OnClick: () -> activate(itemIndex),
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Button,
                        Name: items[index].AccessibilityName ?? items[index].FallbackText ?? theme.Text("Person")
                    },
                    avatar,
                }
                WidgetKeyBindings.BindActivation(button)
                root.Children.Add(button)
            } else {
                avatar.MarginStart = offset
                root.Children.Add(avatar)
            }
        }
        if items.Length > count {
            let more = Avatar{
                FallbackText: "+" + (items.Length - count).ToString(),
                Size: size,
                BackgroundColor: theme.HoverColor,
                RingColor: theme.PanelColor,
                BorderWidth: theme.BorderWidth * 2.0,
            }.Build()
            more.FlexShrink = 0.0
            more.MarginStart = count == 0 ? 0.0: -overlap
            root.Children.Add(more)
        }
        for index in 0 ... count {
            if let marker = items[index].BuildPresence(theme, size) {
                marker.Start = float64(index) * (size - overlap) + size * 0.75
                root.Children.Add(marker)
            }
        }
        return root
    }
}
