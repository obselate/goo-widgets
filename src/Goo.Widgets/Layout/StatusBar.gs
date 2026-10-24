package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Feedback
import Goo.Widgets.Navigation
import System
import System.Collections.Generic

/// A status item. Higher priority remains visible longer.
public data struct StatusBarItem {
    var Id string
    var Icon Blob?
    var Text string?
    var OnActivate Action?
    var Tooltip string?
    var Busy bool
    var Priority int32
    var Disabled bool
    var MenuItems[]?MenuItem
    var OnMenuActivate Action[string]?
}

/// Items anchored to the two ends of a status bar.
public data struct StatusBarInput {
    var Start[]?StatusBarItem
    var Window Window?
    var End[]?StatusBarItem
}

/// Hides low-priority items when the measured contents do not fit.
public class StatusBar : Cell[StatusBarInput], IDisposable {
    private let handle ElementHandle = ElementHandle()
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    private let widths Dictionary[string, float64] = Dictionary[string, float64]()
    private let previous Dictionary[string, StatusBarItem] = Dictionary[string, StatusBarItem]()
    private var width float64
    private var openId string?
    private var disposed bool

    public init() {
        handle.MetricsChanged += Metrics
    }

    /// Releases the bar geometry subscription.
    public func Dispose() {
        disposed = true
        handle.MetricsChanged -= Metrics
    }

    protected override func Build(input StatusBarInput) Blob {
        let theme = Theme.Read()
        let startItems = input.Start ?? []StatusBarItem{}
        let items = List[StatusBarItem](startItems)
        items.AddRange(input.End ?? []StatusBarItem{})
        let ids = HashSet[string](StringComparer.Ordinal)
        for item in items {
            if String.IsNullOrEmpty(item.Id) || !ids.Add(item.Id) {
                throw ArgumentException("Status items require unique, nonempty IDs.")
            }
            if previous.TryGetValue(item.Id, out let old) &&
                (
                old.Text != item.Text ||
                    old.Busy != item.Busy ||
                    old.Icon != item.Icon ||
                    (old.MenuItems == nil) != (item.MenuItems == nil)
            ) {
                widths.Remove(item.Id)
            }
            previous[item.Id] = item
        }
        let removed = List[string]()
        for id in handles.Keys {
            if !ids.Contains(id) {
                removed.Add(id)
            }
        }
        for id in removed {
            handles.Remove(id)
            widths.Remove(id)
            previous.Remove(id)
        }
        let hidden = HashSet[string](StringComparer.Ordinal)
        var total float64
        for item in items {
            if widths.TryGetValue(item.Id, out let measured) {
                total += measured
            }
        }
        if width > 0 {
            let priority = List[StatusBarItem](items)
            priority.Sort((a, b) -> a.Priority.CompareTo(b.Priority))
            for item in priority {
                if total <= width - 2 * theme.BorderWidth {
                    break
                }
                if widths.TryGetValue(item.Id, out let measured) {
                    total -= measured
                    hidden.Add(item.Id)
                }
            }
        }
        if openId != nil && hidden.Contains(openId!!) {
            openId = nil
        }
        let start = Container{FlexDirection: FlexDirection.Row, FlexShrink: 0, AlignItems: AlignItems.Center}
        let end = Container{FlexDirection: FlexDirection.Row, FlexShrink: 0, AlignItems: AlignItems.Center}
        for index in 0 ... items.Count {
            let item = items[index]
            if hidden.Contains(item.Id) {
                continue
            }
            let target = index < startItems.Length ? start: end
            target.Children.Add(BuildItem(item, input.Window))
        }
        return Container{
            Handle: handle,
            Width: Percent(100),
            MinWidth: 0,
            Height: theme.ControlHeight,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Overflow: Overflow.Hidden,
            BackgroundColor: theme.PanelColor,
            BorderWidth: theme.BorderWidth,
            BorderColor: theme.BorderColor,
            BorderRadius: theme.ControlRadius,
            Color: theme.TextColor,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: "Status bar"},
            start,
            Container{FlexGrow: 1, MinWidth: 0},
            end
        }
    }

    private func BuildItem(item StatusBarItem, window Window?) Blob {
        let theme = Theme.Read()
        let leading = Container{FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center, Gap: theme.Spacing}
        if item.Busy {
            leading.Children.Add(
                Cell.Mount[SpinnerInput, Spinner]("busy", SpinnerInput{Size: theme.CaptionFontSize, Label: item.Text})
            )
        }
        if let icon = item.Icon {
            leading.Children.Add(icon)
        }
        var content Blob
        if item.MenuItems != nil || item.OnActivate != nil {
            let button = ActionButton{
                Content: item.Text,
                Leading: leading,
                Disabled: item.Disabled,
                AccessibilityName: item.Text,
                OnClick: item.OnActivate,
                MinWidth: 0,
                PaddingHorizontal: theme.ControlPadding,
                BorderWidth: 0,
                BorderRadius: 0,
                BackgroundColor: Color.Transparent,
                DisabledBackgroundColor: Color.Transparent,
                FontSize: theme.CaptionFontSize
            }
            if item.MenuItems != nil {
                let id = item.Id
                content = Cell.Mount[MenuButtonInput, MenuButton](
                    id,
                    MenuButtonInput{
                        Button: button,
                        Items: item.MenuItems,
                        Open: openId == id,
                        OnOpenChange: isOpen -> {
                            openId = isOpen ? id: nil
                            Rebuild()
                        },
                        OnActivate: item.OnMenuActivate
                    }
                )
            } else {
                content = button.Build()
            }
        } else {
            leading.Children.Add(Text{Content: item.Text ?? "", FontSize: theme.CaptionFontSize})
            content = Container{
                Padding: Edges{Left: theme.ControlPadding, Right: theme.ControlPadding},
                leading,
                Accessibility: Accessibility{Role: AccessibilityRole.Text, Name: item.Text ?? "", Busy: item.Busy}
            }
        }
        if item.Tooltip != nil && window != nil {
            content = Cell.Mount[TooltipInput, Tooltip](
                "tooltip:" + item.Id,
                TooltipInput{Window: window, Target: content, Text: item.Tooltip}
            )
        }
        if !handles.TryGetValue(item.Id, out var itemHandle) {
            let id = item.Id
            itemHandle = ElementHandle()
            itemHandle.MetricsChanged += metrics -> {
                if disposed || !metrics.IsMounted {
                    return
                }
                let measured = metrics.BorderBox.Width
                if !widths.TryGetValue(id, out let previous) || Math.Abs(measured - previous) > 0.5 {
                    widths[id] = measured
                    Rebuild()
                }
            }
            handles[item.Id] = itemHandle
        }
        return Container{Key: item.Id, Handle: itemHandle, FlexShrink: 0, content}
    }

    private func Metrics(metrics ElementMetrics) {
        if !disposed && metrics.IsMounted && Math.Abs(metrics.BorderBox.Width - width) > 0.5 {
            width = metrics.BorderBox.Width
            Rebuild()
        }
    }
}
