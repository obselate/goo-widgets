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
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string
    /// Leading visual indicator. Nil leaves this slot empty.
    var Icon Blob?
    /// Visible status text. Nil omits the text.
    var Text string?
    /// Runs when the enabled status item is activated. Nil renders no primary action.
    var OnClick Action?
    /// Hover hint. Nil supplies no tooltip.
    var Tooltip string?
    /// Shows ongoing work without changing the host-owned action.
    var Busy bool
    /// Relative item importance used when space is limited. Larger values have higher priority.
    var Priority int32
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Actions for this status item. Nil supplies no menu.
    var MenuItems[]?MenuItem
    /// Receives the selected menu item ID after activation. Nil ignores the request.
    var OnMenuClick Action[string]?
}

/// Items anchored to the two ends of a status bar.
public data struct StatusBarInput {
    /// Status items placed at the leading edge. Nil supplies no leading items.
    var Start[]?StatusBarItem
    /// Caller-owned window for status menus. Nil uses the mounted window.
    var Window Window?
    /// Status items placed at the trailing edge. Nil supplies no trailing items.
    var End[]?StatusBarItem
}

/// Hides low-priority items when the measured contents do not fit.
public open class StatusBar : Cell[StatusBarInput], IDisposable {
    private let handle ElementHandle = ElementHandle()
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    private let widths Dictionary[string, float64] = Dictionary[string, float64]()
    private let previous Dictionary[string, StatusBarItem] = Dictionary[string, StatusBarItem]()
    private var width float64
    private var openId string?
    private var disposed bool

    /// Subscribes to root geometry to fit status items. Dispose the bar to release the subscription.
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
            BorderRadius: theme.ControlRadius!!,
            Color: theme.TextColor,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: theme.Text("Status bar")},
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
        if item.MenuItems != nil || item.OnClick != nil {
            let button = ActionButton{
                Content: item.Text,
                Leading: leading,
                Disabled: item.Disabled,
                AccessibilityName: item.Text,
                OnClick: () -> InvokeInputCallback(item.OnClick),
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
                        Items: forwardMenuCallbacks(item.MenuItems, callback -> InvokeInputCallback(callback)),
                        Open: openId == id,
                        OnOpenChange: isOpen -> {
                            openId = isOpen ? id: nil
                            Rebuild()
                        },
                        OnClick: id -> InvokeInputCallback(item.OnMenuClick, id)
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
