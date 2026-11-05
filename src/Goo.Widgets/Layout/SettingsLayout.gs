package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import System

/// One setting with searchable keywords and a labelled control.
public data struct SettingsRow {
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string
    /// Visible item label. Nil omits the label.
    var Label string?
    /// Supporting text shown with the label. Nil omits it.
    var Description string?
    /// Caller-built setting editor. Nil leaves the slot empty unless CreateControl supplies it.
    var Control Blob?
    /// Builds a control from the supplied accessibility relationships. Apply them to the actual editor. Nil uses Control.
    var CreateControl Func[AccessibilityRelationships, Blob]?
    /// Caller-owned handle of the labeled editor. Nil leaves the label without a focus target.
    var LabelFor ElementHandle?
    /// Places the control below its label even in the wide layout.
    var Stacked bool
    /// Extra search terms used with the visible label. Nil supplies no extra terms.
    var Keywords[]?string
}

/// A named settings category.
public data struct SettingsSection {
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string
    /// Heading shown above the content. Nil omits the heading.
    var Title string?
    /// Supporting text shown with the label. Nil omits it.
    var Description string?
    /// Leading visual indicator. Nil leaves this slot empty.
    var Icon Blob?
    /// Setting rows in display order. Nil supplies an empty section.
    var Rows[]?SettingsRow
}

/// Controlled settings selection and search.
public data struct SettingsLayoutInput {
    /// Settings categories in display order. Nil supplies no categories.
    var Sections[]?SettingsSection
    /// Controlled selected item ID. Nil means no selection.
    var SelectedId string?
    /// Receives the selected item ID after user selection. Nil ignores the request.
    var OnSelect Action[string]?
    /// Filter text. Nil uses an empty query.
    var Query string?
    /// Receives the new query string after a user edit. Nil ignores the notification.
    var OnQueryChange Action[string]?
    /// Stack navigation and labels below this measured width. Zero resolves to 640.
    var NarrowWidth float64
    /// Wide navigation width. Zero resolves to 180.
    var SidebarWidth float64
    /// Wide label column width. Zero resolves to 180.
    var LabelWidth float64
}

/// Moves section navigation above the editors when its own width is narrow.
public class SettingsLayout : Cell[SettingsLayoutInput], IDisposable {
    private let handle ElementHandle = ElementHandle()
    private var input SettingsLayoutInput
    private var width float64
    private var disposed bool

    /// Subscribes to root width changes for responsive layout. Dispose the layout to release the subscription.
    public init() {
        handle.MetricsChanged += Metrics
    }

    /// Releases the layout geometry subscription.
    public func Dispose() {
        disposed = true
        handle.MetricsChanged -= Metrics
    }

    protected override func Build(supplied SettingsLayoutInput) Blob {
        let value = supplied with{
            NarrowWidth = supplied.NarrowWidth == 0 ? 640: supplied.NarrowWidth,
            SidebarWidth = supplied.SidebarWidth == 0 ? 180: supplied.SidebarWidth,
            LabelWidth = supplied.LabelWidth == 0 ? 180: supplied.LabelWidth
        }
        input = value
        let query = value.Query ?? ""
        let sections = value.Sections ?? []SettingsSection{}
        let theme = Theme.Read()
        let narrow = width > 0 && width < value.NarrowWidth
        let root = Container{
            Handle: handle,
            Width: Percent(100),
            MinWidth: 0,
            Gap: theme.ControlGap * 2,
            Color: theme.TextColor,
            FontFamily: theme.FontFamily,
            FontSize: theme.FontSize,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: theme.Text("Settings")}
        }
        if value.OnQueryChange != nil {
            root.Children.Add(
                TextField{
                    Placeholder: theme.Text("Search"),
                    AccessibilityName: theme.Text("Search settings"),
                    Leading: ControlIcons.Create(ControlIcon.Search, 16, theme.MutedTextColor),
                    Value: value.Query,
                    Controlled: true,
                    OnChange: value.OnQueryChange,
                    Clearable: true,
                    Width: Percent(100)
                }.Build()
            )
        }
        let navigation = Container{
            Key: "navigation",
            Width: narrow ? Percent(100): value.SidebarWidth,
            FlexShrink: 0,
            MinWidth: 0,
            Gap: 2,
            FlexDirection: narrow ? FlexDirection.Row: FlexDirection.Column,
            FlexWrap: FlexWrap.Wrap,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: theme.Text("Settings sections")}
        }
        let content = Container{Key: "content", FlexGrow: 1, MinWidth: 0, Gap: theme.ControlGap * 2}
        let selected = value.SelectedId ?? (sections.Length > 0 ? sections[0].Id: "")
        var found bool
        for section in sections {
            let id = section.Id
            let row = Button{
                Width: narrow ? Length.Auto: Percent(100),
                Height: theme.ControlHeight - 4,
                Padding: Edges{Left: theme.ControlPadding, Right: theme.ControlPadding},
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.FlexStart,
                Gap: theme.Spacing,
                BorderRadius: theme.ControlRadius!!,
                BackgroundColor: selected == id ? theme.ActiveColor: Color.Transparent,
                Color: theme.TextColor,
                OnClick: () -> value.OnSelect?.Invoke(id),
                Hover: Style{BackgroundColor: selected == id ? theme.ActiveColor: theme.HoverColor},
                Focus: theme.FocusStyle,
                Accessibility: Accessibility{
                    Role: AccessibilityRole.Button,
                    Name: section.Title ?? id,
                    Checked: selected == id ? AccessibilityChecked.True: AccessibilityChecked.False
                }
            }
            if let icon = section.Icon {
                row.Children.Add(icon)
            }
            row.Children.Add(Text{Content: section.Title ?? id, FontWeight: selected == id ? theme.LabelFontWeight: theme.FontWeight})
            WidgetKeyBindings.BindActivation(row)
            navigation.Children.Add(row)
            if query.Length == 0 && selected != id {
                continue
            }
            let matchesSection = (section.Title?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false)
            || (section.Description?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false)
            let rows = Container{MinWidth: 0, Gap: theme.ControlGap * 2}
            for row in section.Rows ?? []SettingsRow{} {
                var matches = matchesSection ||
                    (row.Label?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false)
                || (row.Description?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false)
                for keyword in row.Keywords ?? []string{} {
                    matches = matches || keyword.Contains(query, StringComparison.OrdinalIgnoreCase)
                }
                if !matches {
                    continue
                }
                found = true
                rows.Children.Add(
                    PropertyGrid{
                        Layout: narrow || row.Stacked ? PropertyGridLayout.Stacked: PropertyGridLayout.Compact,
                        LabelWidth: value.LabelWidth
                    }
                        .BuildRow(
                        PropertyGridItem{
                            Id: row.Id,
                            Label: row.Label,
                            Description: row.Description,
                            Editor: row.Control,
                            CreateEditor: row.CreateControl,
                            LabelFor: row.LabelFor
                        }
                    )
                )
            }
            if rows.Children.Count > 0 {
                content.Children.Add(
                    FormSection{
                        Legend: query.Length > 0 ? section.Title: nil,
                        Description: query.Length > 0 ? section.Description: nil,
                        Children: []Blob{rows}
                    }.Build()
                )
            }
        }
        if !found {
            content.Children.Add(
                Text{
                    Content: theme.Text("No matching settings"),
                    Color: theme.MutedTextColor,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Status,
                        Name: theme.Text("No matching settings"),
                        Live: AccessibilityLive.Polite
                    }
                }
            )
        }
        root.Children.Add(
            Container{
                Width: Percent(100),
                MinWidth: 0,
                Gap: theme.ControlGap * 2,
                FlexDirection: narrow ? FlexDirection.Column: FlexDirection.Row,
                navigation,
                content
            }
        )
        return root
    }

    private func Metrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        let next = metrics.BorderBox.Width
        let changed = (width > 0 && width < input.NarrowWidth) != (next > 0 && next < input.NarrowWidth)
        width = next
        if changed {
            Rebuild()
        }
    }
}
