package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import System
import System.Collections.Generic

/// Selects labels above editors or a shared label column.
public enum PropertyGridLayout {
    /// Places each editor below its label.
    Stacked;
    /// Places labels and editors in adjacent columns.
    Compact
}

/// One controlled property editor and its reset action.
public data struct PropertyGridItem {
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string
    /// Visible item label. Nil omits the label.
    var Label string?
    /// Property key displayed beside the label. Nil omits the key.
    var Key string?
    /// Supporting text shown with the label. Nil omits it.
    var Description string?
    /// Section heading used to group properties. Nil uses the unlabelled section.
    var Section string?
    /// Caller-built property editor. Nil leaves the slot empty unless CreateEditor supplies it.
    var Editor Blob?
    /// Builds an editor from the supplied accessibility relationships. Apply them to the actual editor. Nil uses Editor.
    var CreateEditor Func[AccessibilityRelationships, Blob]?
    /// Caller-owned handle of the labeled editor. Nil leaves the label without a focus target.
    var LabelFor ElementHandle?
    /// Marks the property as changed from its default.
    var Modified bool
    /// Requests restoring the property default. Nil hides the reset action.
    var OnReset Action?
    /// Validation text shown with invalid presentation. Nil means no validation message.
    var Error string?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
}

/// Searchable sections of labelled editors. Editors own their Tab stops.
public data struct PropertyGrid {
    /// Host-owned property descriptors in display order. Nil supplies no properties.
    var Items[]?PropertyGridItem
    /// Positions labels above editors or in a shared label column.
    var Layout PropertyGridLayout
    /// Filter text. Nil uses an empty query.
    var Query string?
    /// Receives the new query string after a user edit. Nil ignores the notification.
    var OnQueryChange Action[string]?
    /// Expanded section headings. Nil expands every section. A non-nil array is the explicit expanded set.
    var ExpandedSectionIds[]?string
    /// Receives the section heading and requested expanded state. Nil ignores the request.
    var OnSectionExpandedChange Action[string, bool]?
    /// Shared label column width. Nil resolves to 160.
    var LabelWidth float64?
    /// Receives the grid, property descriptor, and prepared content, and returns the replacement content. Nil uses the default composition.
    var CreateRow Func[PropertyGrid, PropertyGridItem, Blob, Blob]?

    /// Builds the filtered sections and optional search field.
    public func Build() Blob {
        let theme = Theme.Read()
        let query = Query ?? ""
        let items = Items ?? []PropertyGridItem{}
        let root = Container{Width: Percent(100), MinWidth: 0, Gap: theme.ControlGap * 2}
        if OnQueryChange != nil {
            root.Children.Add(
                Container{
                    Key: "search",
                    TextField{
                        Placeholder: theme.Text("Search"),
                        AccessibilityName: theme.Text("Search properties"),
                        Leading: ControlIcons.Create(ControlIcon.Search, 16, theme.MutedTextColor),
                        Value: query,
                        Controlled: true,
                        OnChange: OnQueryChange,
                        Clearable: true,
                        Width: Percent(100)
                    }.Build()
                }
            )
        }
        let sections = HashSet[string](StringComparer.Ordinal)
        var found bool
        for item in items {
            let section = item.Section ?? ""
            if !Matches(item, query) || !sections.Add(section) {
                continue
            }
            found = true
            let group = Container{
                Key: "section:" + section,
                MinWidth: 0,
                Gap: theme.ControlGap,
                Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: section}
            }
            let collapsed = ExpandedSectionIds != nil && Array.IndexOf(ExpandedSectionIds!!, section) < 0 && query.Length == 0
            if section.Length > 0 {
                group.Children.Add(Container{Key: "divider", Height: 1, BackgroundColor: theme.BorderColor})
                if let change = OnSectionExpandedChange {
                    let name = section
                    let heading = Button{
                        Key: "heading",
                        Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: name, Expanded: !collapsed},
                        OnClick: () -> change(name, collapsed),
                        Height: theme.ControlHeight - 8,
                        FlexDirection: FlexDirection.Row,
                        AlignItems: AlignItems.Center,
                        JustifyContent: JustifyContent.FlexStart,
                        Gap: theme.Spacing,
                        Color: theme.TextColor,
                        TransitionMs: theme.TransitionMs,
                        TransitionEasing: Easing.EaseOut,
                        TransitionProperties: theme.InteractionTransitions,
                        ControlIcons.Create(collapsed ? (theme.RightToLeft ? ControlIcon.ChevronLeft: ControlIcon.ChevronRight): ControlIcon.ExpandMore, 16, theme.MutedTextColor),
                        Text{Content: name, FontWeight: theme.HeadingFontWeight}
                    }
                    theme.ApplyInteraction(heading, InteractionFamily.Row)
                    WidgetKeyBindings.BindActivation(heading)
                    group.Children.Add(heading)
                } else {
                    group.Children.Add(
                        Text{
                            Key: "heading",
                            Content: section,
                            Color: theme.TextColor,
                            FontWeight: theme.HeadingFontWeight
                        }
                    )
                }
            }
            if !collapsed {
                for row in items {
                    if (row.Section ?? "") == section && Matches(row, query) {
                        let content = BuildRow(row)
                        let result = CreateRow?.Invoke(this, row, content) ?? content
                        result.Key = "row:" + row.Id
                        group.Children.Add(result)
                    }
                }
            }
            root.Children.Add(group)
        }
        if !found {
            root.Children.Add(
                Text{
                    Key: "empty",
                    Content: theme.Text("No matching properties"),
                    Color: theme.MutedTextColor,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Status,
                        Name: theme.Text("No matching properties"),
                        Live: AccessibilityLive.Polite
                    }
                }
            )
        }
        return root
    }

    private func Matches(item PropertyGridItem, query string) bool -> query.Length == 0 ||
        (item.Label?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false) ||
        (item.Key?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false) ||
        (item.Section?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false) ||
        (item.Description?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false)

    /// Builds one row using FormField accessibility relationships.
    public func BuildRow(item PropertyGridItem) Blob {
        let theme = Theme.Read()
        let layout = Layout
        let labelWidth = LabelWidth ?? 160
        let reset Blob? = if item.Modified && item.OnReset != nil {
            let button = Button{
                Width: 24,
                Height: 24,
                FlexShrink: 0,
                BorderRadius: theme.ControlRadius!!,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.Center,
                Disabled: item.Disabled,
                OnClick: item.OnReset,
                Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: theme.Text("Reset {0}", item.Label)},
                TransitionMs: theme.TransitionMs,
                TransitionEasing: Easing.EaseOut,
                TransitionProperties: theme.InteractionTransitions,
                ControlIcons.Create(ControlIcon.RestartAlt, 16, theme.MutedTextColor)
            }
            theme.ApplyInteraction(button, InteractionFamily.Button)
            WidgetKeyBindings.BindActivation(button)
            button
        } else {
            nil
        }
        let field = FormField{
            Label: item.Label ?? "",
            Description: item.Description,
            Error: item.Error,
            Content: item.Editor,
            CreateContent: item.CreateEditor,
            LabelFor: item.LabelFor,
            CreateRoot: (input, root) -> {
                if reset != nil && root.Children.Count > 1 {
                    root.Children[1] = Container{
                        MinWidth: 0,
                        FlexDirection: FlexDirection.Row,
                        AlignItems: AlignItems.Center,
                        Gap: theme.Spacing,
                        root.Children[1],
                        reset
                    }
                }
                if layout == PropertyGridLayout.Compact {
                    let label = root.Children[0]
                    label.Width = labelWidth
                    label.FlexShrink = 0
                    let editor = Container{FlexGrow: 1, MinWidth: 0, Gap: theme.Spacing}
                    for index in 1 ... root.Children.Count {
                        editor.Children.Add(root.Children[index])
                    }
                    root.Children.Clear()
                    root.Children.Add(label)
                    root.Children.Add(editor)
                    root.FlexDirection = FlexDirection.Row
                    root.AlignItems = editor.Children.Count > 1 ? AlignItems.FlexStart: AlignItems.Center
                }
                root.FlexGrow = 1
                root.Width = Length.Auto
                root.FlexBasis = 0
                return root
            }
        }.Build()
        let row = Container{
            Key: item.Id,
            Width: Percent(100),
            MinWidth: 0,
            Disabled: item.Disabled,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.FlexStart,
            Gap: theme.ControlGap,
            field
        }
        if item.Modified && item.OnReset == nil {
            row.Children.Add(Text{Content: theme.Text("Modified"), Color: theme.WarningColor, FontSize: theme.CaptionFontSize})
        }
        return row
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w PropertyGrid) Blob -> w.Build()
