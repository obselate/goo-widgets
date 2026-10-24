package Goo.Widgets.Inputs

import Goo
import Goo.Widgets

/// Shared label, description and error presentation for a control.
public data struct FormField {
    var Label string?
    var Required bool
    var Description string?
    var Help Blob?
    var Issue string?
    var Content Blob?
    var LabelFor ElementHandle?
    var Width Length?
    /// Creates a composite control with relationships attached to its input node.
    var CreateContent Func[AccessibilityRelationships, Blob]?
    var CreateRoot Func[FormField, Container, Container]?

    /// Builds the labelled control and its supporting text.
    public func Build() Blob {
        let theme = Theme.Read()
        let label = ElementHandle()
        let description = ElementHandle()
        let issue = ElementHandle()
        let relations = AccessibilityRelationships{
            LabelledBy: Label != nil ? []ElementHandle{label}: []ElementHandle{},
            DescribedBy: Description != nil ? []ElementHandle{description}: []ElementHandle{},
            ErrorMessage: Issue != nil ? []ElementHandle{issue}: []ElementHandle{},
        }
        let root = Container{
            Width: Width ?? Percent(100),
            MinWidth: 0,
            FlexDirection: FlexDirection.Column,
            Gap: theme.ControlGap
        }
        if let text = Label {
            root.Children.Add(
                Text{
                    Key: "label",
                    Handle: label,
                    Content: text + (Required ? " *": ""),
                    Color: theme.TextColor,
                    FontSize: theme.LabelFontSize,
                    FontWeight: theme.LabelFontWeight,
                    OnClick: () -> {
                        LabelFor?.Focus()
                    }
                }
            )
        }
        var content = Content
        if let create = CreateContent {
            content = create(relations)
        }
        if let control = content {
            if CreateContent == nil {
                let semantics = control.Accessibility ?? Accessibility{}
                semantics.Relationships = relations
                semantics.Required = Required
                semantics.Invalid = Issue != nil
                control.Accessibility = semantics
            }
            root.Children.Add(control)
        }
        if let text = Description {
            root.Children.Add(
                Text{
                    Key: "description",
                    Handle: description,
                    Content: text,
                    Color: theme.MutedTextColor,
                    FontSize: theme.CaptionFontSize
                }
            )
        }
        if let help = Help {
            root.Children.Add(help)
        }
        if let text = Issue {
            root.Children.Add(
                Text{
                    Key: "issue",
                    Handle: issue,
                    Content: text,
                    Color: theme.DangerColor,
                    FontSize: theme.CaptionFontSize,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Alert,
                        Name: text,
                        Live: AccessibilityLive.Polite
                    }
                }
            )
        }
        return CreateRoot?.Invoke(this, root) ?? root
    }
}

/// A named group of related form controls.
public data struct FormSection {
    var Legend string?
    var Description string?
    var Children[]?Blob
    var Width Length?
    var CreateRoot Func[FormSection, Container, Container]?

    /// Builds the named group and its controls.
    public func Build() Blob {
        let theme = Theme.Read()
        let root = Container{
            Width: Width ?? Percent(100),
            MinWidth: 0,
            FlexDirection: FlexDirection.Column,
            Gap: theme.ControlGap * 2,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Group,
                Name: Legend ?? "",
                Description: Description ?? ""
            }
        }
        if let legend = Legend {
            root.Children.Add(
                Text{
                    Content: legend,
                    FontSize: theme.LabelFontSize,
                    FontWeight: theme.LabelFontWeight,
                    Color: theme.TextColor
                }
            )
        }
        if let description = Description {
            root.Children.Add(Text{Content: description, FontSize: theme.CaptionFontSize, Color: theme.MutedTextColor})
        }
        for child in Children ?? []Blob{} {
            root.Children.Add(child)
        }
        return CreateRoot?.Invoke(this, root) ?? root
    }
}
