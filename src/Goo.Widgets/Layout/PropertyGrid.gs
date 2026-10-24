package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Inputs
import System
import System.Collections.Generic

/// Selects labels above editors or a shared label column.
public enum PropertyGridLayout {
    Stacked;
    Compact
}

/// One controlled property editor and its reset action.
public data struct PropertyGridItem {
    var Id string
    var Label string?
    var Key string?
    var Description string?
    var Section string?
    var Editor Blob?
    var CreateEditor Func[AccessibilityRelationships, Blob]?
    var LabelFor ElementHandle?
    var Modified bool
    var OnReset Action?
    var Issue string?
    var Disabled bool
}

/// Searchable sections of labelled editors. Editors own their Tab stops.
public data struct PropertyGrid {
    var Items[]?PropertyGridItem
    var Layout PropertyGridLayout
    var Query string?
    var OnQueryChange Action[string]?
    var CollapsedSections[]?string
    var OnSectionToggle Action[string]?
    /// Shared label column width. Zero resolves to 160.
    var LabelWidth float64
    var CreateRow Func[PropertyGridItem, Blob, Blob]?

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
                        Label: "Search properties",
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
            let collapsed = Array.IndexOf(CollapsedSections ?? []string{}, section) >= 0 && query.Length == 0
            if section.Length > 0 {
                if let toggle = OnSectionToggle {
                    let name = section
                    group.Children.Add(
                        ActionButton{
                            Content: (collapsed ? "+ ": "- ") + name,
                            OnClick: () -> toggle(name),
                            CreateRoot: (input, text) -> Button{
                                Key: "heading",
                                Accessibility: Accessibility{
                                    Role: AccessibilityRole.Button,
                                    Name: name,
                                    Expanded: !collapsed
                                },
                                OnClick: input.OnClick,
                                Height: theme.ControlHeight,
                                Color: theme.TextColor,
                                Focus: theme.FocusStyle,
                                text
                            }
                        }.Build()
                    )
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
                        let result = CreateRow?.Invoke(row, content) ?? content
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
                    Content: "No matching properties",
                    Color: theme.MutedTextColor,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Status,
                        Name: "No matching properties",
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
        let labelWidth = LabelWidth == 0 ? 160: LabelWidth
        let field = FormField{
            Label: item.Label ?? "",
            Description: item.Description,
            Issue: item.Issue,
            Content: item.Editor,
            CreateContent: item.CreateEditor,
            LabelFor: item.LabelFor,
            CreateRoot: (input, root) -> {
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
                    root.AlignItems = AlignItems.FlexStart
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
        if item.Modified {
            if let reset = item.OnReset {
                row.Children.Add(
                    ActionButton{
                        Content: "Reset",
                        AccessibilityName: "Reset " + item.Label,
                        OnClick: reset,
                        Disabled: item.Disabled,
                        MinWidth: 0,
                        FontSize: theme.CaptionFontSize
                    }.Build()
                )
            } else {
                row.Children.Add(Text{Content: "Modified", Color: theme.WarningColor, FontSize: theme.CaptionFontSize})
            }
        }
        return row
    }
}
