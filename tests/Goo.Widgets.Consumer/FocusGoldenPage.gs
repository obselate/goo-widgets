package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Charts
import Goo.Widgets.Colors
import Goo.Widgets.Content
import Goo.Widgets.Data
import Goo.Widgets.Feedback
import Goo.Widgets.Graphs
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import Goo.Widgets.Media
import Goo.Widgets.Navigation
import System

internal class FocusGoldenPage : Cell {
    internal let Controls[]string = []string{
        "Button",
        "IconButton",
        "ToggleButton",
        "Checkbox",
        "RadioButton",
        "Switch",
        "TextField",
        "TextArea",
        "NumberInput",
        "ComboBox",
        "Slider",
        "TabBar",
        "ListView",
        "TreeView",
        "Menu",
        "SplitPane",
        "DataGrid",
        "ToggleGroup",
        "RadioGroup",
        "SearchList",
        "RatingControl",
        "Calendar",
        "DatePicker",
        "TimePicker",
        "ColorPicker",
        "Chip",
        "AttachmentChip",
        "ListRow",
        "Disclosure",
        "NavigationRail",
        "Breadcrumb",
        "PathBar",
        "MenuButton",
        "SplitButton",
        "Banner",
        "DismissibleContextBar",
        "GraphCanvas",
        "GraphNodeCard",
        "TimeAxis",
        "DonutChart",
        "StackedBar",
        "MediaTransport",
        "Card",
        "TextFieldActions",
        "WindowChrome",
        "ModalDialog",
        "CommandPalette",
        "PropertyGrid",
        "SettingsLayout",
        "TeachingTip",
        "Toast",
        "MasterDetail",
        "StatusBar",
        "MediaCard",
        "AvatarGroup",
        "CodeBlock",
        "TriggerMenu",
        "FindBar",
        "TokenInput",
        "ShortcutList"
    }
    internal var Control string = "Button"
    internal var Layout string = "plain"
    internal var Window Window?
    internal let FieldActionsHandle ElementHandle = ElementHandle()
    private let navigationItems[]NavigationItem = []NavigationItem{
        NavigationItem{Id: "first", Label: "First"},
        NavigationItem{Id: "last", Label: "Last"}
    }

    public override func Build() Blob {
        let theme = Theme.Read()
        let sample = Sample()
        sample.Key = Control
        let framed = Control == "NumberInput" || Control == "DatePicker" || Control == "TimePicker"
            || Control == "TokenInput" || Control == "SearchList"
        let content Blob = framed ? Container{
            Handle: FieldActionsHandle,
            AlignSelf: AlignSelf.FlexStart,
            AlignItems: AlignItems.FlexStart,
            sample,
        }: sample
        let padding = Layout == "plain" ? 0.0: theme.PanelRadius!! + theme.FocusRingWidth + Math.Max(0, theme.FocusRingOffset)
        let stage = Container{
            Width: 360 + padding * 2,
            MinHeight: theme.ControlHeight + padding * 2,
            Padding: padding,
            BackgroundColor: theme.PanelColor,
            content,
        }
        if Control == "GraphNodeCard" || Control == "MasterDetail" {
            stage.Height = theme.ControlHeight * 3 + padding * 2
        }
        if Control == "ModalDialog" {
            stage.Height = theme.ControlHeight * 8 + padding * 2
        }
        if Control == "DonutChart" {
            stage.Padding = Math.Max(padding, theme.ControlGap)
        }
        if Layout != "plain" {
            stage.BorderRadius = theme.PanelRadius ??
                throw InvalidOperationException("Theme panel radius is unresolved.")
            stage.Overflow = Overflow.Hidden
        }
        if Layout == "toolbar" {
            stage.FlexDirection = FlexDirection.Row
            stage.AlignItems = AlignItems.Center
        }
        return Container{
            Width: Percent(100),
            Height: Percent(100),
            Padding: theme.Spacing * 8,
            BackgroundColor: theme.PanelColor,
            Color: theme.TextColor,
            FontFamily: theme.FontFamily,
            AlignItems: AlignItems.FlexStart,
            stage
        }
    }

    private func Sample() Blob {
        let theme = Theme.Read()
        let date = DateOnly(2026, 9, 14)
        switch Control {
            case "Button" {
                return ActionButton{Content: "Button"}.Build()
            }
            case "IconButton" {
                return IconButton{AccessibilityName: "Icon button", Icon: Text{Content: "+"}}.Build()
            }
            case "ToggleButton" {
                return ToggleButton{Content: "Toggle button", Value: true}.Build()
            }
            case "Checkbox" {
                return Checkbox{Label: "Checkbox"}.Build()
            }
            case "RadioButton" {
                return RadioButton{Label: "Radio button"}.Build()
            }
            case "Switch" {
                return ToggleSwitch{AccessibilityName: "Switch"}.Build()
            }
            case "TextField" {
                return TextField{Value: "Text field", AccessibilityName: "Text field"}.Build()
            }
            case "TextFieldActions" {
                return Container{
                    Handle: FieldActionsHandle,
                    AlignSelf: AlignSelf.FlexStart,
                    AlignItems: AlignItems.FlexStart,
                    TextField{Value: "Search", AccessibilityName: "Search", Clearable: true}.Build()
                }
            }
            case "TextArea" {
                return Cell.Mount[TextAreaInput, TextArea](
                    "area",
                    TextAreaInput{Value: "Text area", MinimumRows: 2, AccessibilityName: "Text area"}
                )
            }
            case "NumberInput" {
                return Cell.Mount[NumberInputInput, NumberInput](
                    "number",
                    NumberInputInput{Value: 42, AccessibilityName: "Number input"}
                )
            }
            case "ComboBox" {
                return Cell.Mount[ComboBoxInput, ComboBox](
                    "combo",
                    ComboBoxInput{
                        AccessibilityName: "Combo box",
                        Items: []ComboBoxOption{
                            ComboBoxOption{Id: "first", Label: "First"},
                            ComboBoxOption{Id: "last", Label: "Last"}
                        }
                    }
                )
            }
            case "Slider" {
                return Cell.Mount[SliderInput, Slider]("slider", SliderInput{Value: 0.5, AccessibilityName: "Slider"})
            }
            case "TabBar" {
                return Cell.Mount[TabBarInput, TabBar](
                    "tabs",
                    TabBarInput{Items: navigationItems, OnClose: (id string) -> { }}
                )
            }
            case "ListView" {
                return Cell.Mount[ListViewInput, ListView](
                    "list",
                    ListViewInput{
                        Height: theme.ControlHeight * 2,
                        RowHeight: theme.ControlHeight,
                        Items: []ListViewItem{
                            ListViewItem{Id: "first", Label: "First row"},
                            ListViewItem{Id: "last", Label: "Last row"}
                        }
                    }
                )
            }
            case "TreeView" {
                return Cell.Mount[TreeViewInput, TreeView](
                    "tree",
                    TreeViewInput{
                        Height: theme.ControlHeight * 2,
                        RowHeight: theme.ControlHeight,
                        Virtualize: false,
                        Nodes: []TreeNode{
                            TreeNode{Id: "first", Label: "First row"},
                            TreeNode{Id: "last", Label: "Last row"}
                        }
                    }
                )
            }
            case "Menu" {
                return Cell.Mount[MenuInput, Menu](
                    "menu",
                    MenuInput{
                        Open: true,
                        WindowPoint: Point{X: theme.Spacing * 8, Y: theme.Spacing * 8},
                        Items: []MenuItem{
                            MenuItem{Id: "first", Label: "First item"},
                            MenuItem{Id: "last", Label: "Last item"}
                        }
                    }
                )
            }
            case "SplitPane" {
                return Cell.Mount[SplitPaneInput, SplitPane](
                    "split",
                    SplitPaneInput{
                        Value: 0.5,
                        Height: theme.ControlHeight * 2,
                        First: Text{Content: "First pane"},
                        Second: Text{Content: "Last pane"}
                    }
                )
            }
            case "DataGrid" {
                return Cell.Mount[DataGridInput, DataGrid](
                    "grid",
                    DataGridInput{
                        Height: theme.ControlHeight * 3,
                        RowHeight: theme.ControlHeight,
                        Columns: []DataGridColumn{DataGridColumn{Id: "name", Label: "Name", Sortable: true}},
                        Rows: []DataGridRow{DataGridRow{Id: "first"}, DataGridRow{Id: "last"}},
                        OnSort: (id string, direction DataGridSort) -> { }
                    }
                )
            }
            case "ToggleGroup" {
                return Cell.Mount[ToggleGroupInput, ToggleGroup](
                    "toggles",
                    ToggleGroupInput{
                        Items: []ToggleOption{
                            ToggleOption{Id: "first", Label: "First"},
                            ToggleOption{Id: "last", Label: "Last"}
                        }
                    }
                )
            }
            case "RadioGroup" {
                return Cell.Mount[RadioGroupInput, RadioGroup](
                    "radios",
                    RadioGroupInput{
                        Items: []RadioOption{
                            RadioOption{Id: "first", Label: "First"},
                            RadioOption{Id: "last", Label: "Last"}
                        }
                    }
                )
            }
            case "SearchList" {
                return SearchList{
                    Items: []SelectionItem{
                        SelectionItem{Id: "first", Label: "First"},
                        SelectionItem{Id: "last", Label: "Last"}
                    }
                }.Build()
            }
            case "RatingControl" {
                return Cell.Mount[RatingControlInput, RatingControl]("rating", RatingControlInput{Value: 3})
            }
            case "Calendar" {
                return Cell.Mount[CalendarInput, Calendar]("calendar", CalendarInput{Value: date, Today: date})
            }
            case "DatePicker" {
                return Cell.Mount[DatePickerInput, DatePicker]("date", DatePickerInput{Value: date})
            }
            case "TimePicker" {
                return Cell.Mount[TimePickerInput, TimePicker]("time", TimePickerInput{Value: TimeOnly(9, 30)})
            }
            case "ColorPicker" {
                return Cell.Mount[ColorPickerInput, ColorPicker](
                    "color",
                    ColorPickerInput{Value: 0x4F8FEA, WheelSize: theme.ControlHeight * 4}
                )
            }
            case "Chip" {
                return Chip{Label: "Chip", OnRemove: () -> { }}.Build()
            }
            case "AttachmentChip" {
                return AttachmentChip{
                    Name: "Attachment",
                    OnClick: () -> { },
                    OnDownload: () -> { },
                    OnRemove: () -> { }
                }.Build()
            }
            case "ListRow" {
                return ListRow{Title: "List row", OnClick: () -> { }}.Build()
            }
            case "Disclosure" {
                return Disclosure{Label: "Disclosure", Content: Text{Content: "Details"}}.Build()
            }
            case "NavigationRail" {
                return Cell.Mount[NavigationRailInput, NavigationRail](
                    "rail",
                    NavigationRailInput{Items: navigationItems, Height: theme.ControlHeight * 2 + theme.ControlGap}
                )
            }
            case "Breadcrumb" {
                return Cell.Mount[BreadcrumbInput, Breadcrumb](
                    "breadcrumb",
                    BreadcrumbInput{
                        Items: []BreadcrumbItem{
                            BreadcrumbItem{Id: "first", Label: "First"},
                            BreadcrumbItem{Id: "last", Label: "Last"}
                        },
                        OnSelect: (id string) -> { }
                    }
                )
            }
            case "PathBar" {
                return Cell.Mount[BreadcrumbInput, PathBar](
                    "path",
                    BreadcrumbInput{
                        Items: []BreadcrumbItem{
                            BreadcrumbItem{Id: "first", Label: "First"},
                            BreadcrumbItem{Id: "last", Label: "Last"}
                        },
                        OnSelect: (id string) -> { }
                    }
                )
            }
            case "MenuButton" {
                return Cell.Mount[MenuButtonInput, MenuButton](
                    "menu-button",
                    MenuButtonInput{Button: ActionButton{Content: "Menu button"}}
                )
            }
            case "SplitButton" {
                return SplitButton{Button: ActionButton{Content: "Split button"}, Menu: MenuButtonInput{}}.Build()
            }
            case "Banner" {
                return Banner{Content: "Banner", OnDismiss: () -> { }}.Build()
            }
            case "DismissibleContextBar" {
                return DismissibleContextBar{Content: Text{Content: "Context"}, OnDismiss: () -> { }}.Build()
            }
            case "GraphCanvas" {
                return Cell.Mount[GraphCanvasInput, GraphCanvas](
                    "graph",
                    GraphCanvasInput{Width: 360, Height: theme.ControlHeight * 3}
                )
            }
            case "GraphNodeCard" {
                return GraphNodeCard{Node: GraphNode{Id: "node", Label: "Node", Position: Point{X: 80, Y: 32}}}.Build()
            }
            case "TimeAxis" {
                let start = DateTimeOffset(2026, 9, 14, 8, 0, 0, TimeSpan.Zero)
                return Cell.Mount[TimeAxisInput, TimeAxis](
                    "axis",
                    TimeAxisInput{
                        Start: start,
                        End: start.AddHours(2),
                        Width: 360,
                        Height: theme.ControlHeight * 3,
                        OnSelect: (id string) -> { },
                        Events: []TimeAxisEvent{
                            TimeAxisEvent{Id: "event", Label: "Event", Start: start, End: start.AddHours(1)}
                        }
                    }
                )
            }
            case "DonutChart" {
                return DonutChart{
                    Size: theme.ControlHeight * 3,
                    OnClick: (id string) -> { },
                    Series: []ChartSeries{ChartSeries{Id: "first", Label: "First", Value: 1}}
                }.Build()
            }
            case "StackedBar" {
                return StackedBar{
                    OnClick: (id string) -> { },
                    Series: []ChartSeries{ChartSeries{Id: "first", Label: "First", Value: 1}}
                }.Build()
            }
            case "MediaTransport" {
                return Cell.Mount[MediaTransportInput, MediaTransport](
                    "media",
                    MediaTransportInput{
                        Position: 30,
                        Duration: 120,
                        Volume: 0.5,
                        OnPrevious: () -> { },
                        OnPlayPause: () -> { },
                        OnNext: () -> { }
                    }
                )
            }
            case "Card" {
                return Card{Content: Text{Content: "Card"}, OnClick: () -> { }}.Build()
            }
            case "WindowChrome" {
                return WindowChrome{OnMinimize: () -> { }, OnMaximize: () -> { }, OnClose: () -> { }}.Build()
            }
            case "ModalDialog" {
                return ModalDialog{
                    Open: true,
                    Header: Text{Content: "Dialog"},
                    Content: Text{Content: "Content"},
                    OnConfirm: () -> { },
                    OnCancel: () -> { }
                }.Build()
            }
            case "CommandPalette" {
                return Cell.Mount[CommandPaletteInput, CommandPalette](
                    "commands",
                    CommandPaletteInput{
                        Open: true,
                        Items: []CommandItem{
                            CommandItem{Id: "first", Label: "First command"},
                            CommandItem{Id: "last", Label: "Last command"}
                        }
                    }
                )
            }
            case "PropertyGrid" {
                return PropertyGrid{
                    ExpandedSectionIds: []string{"Section"},
                    OnSectionExpandedChange: (id string, value bool) -> { },
                    Items: []PropertyGridItem{
                        PropertyGridItem{
                            Id: "first",
                            Label: "Property",
                            Section: "Section",
                            Modified: true,
                            OnReset: () -> { },
                            Editor: TextField{Value: "Value"}.Build()
                        }
                    }
                }.Build()
            }
            case "SettingsLayout" {
                return Cell.Mount[SettingsLayoutInput, SettingsLayout](
                    "settings",
                    SettingsLayoutInput{
                        Sections: []SettingsSection{
                            SettingsSection{
                                Id: "first",
                                Title: "Section",
                                Rows: []SettingsRow{
                                    SettingsRow{
                                        Id: "value",
                                        Label: "Value",
                                        Control: Checkbox{Label: "Enabled"}.Build()
                                    }
                                }
                            }
                        }
                    }
                )
            }
            case "TeachingTip" {
                return TeachingTip{Open: true, Title: "Tip", ActionText: "Action"}.Build()
            }
            case "Toast" {
                return Cell.Mount[ToastInput, Toast](
                    "toast",
                    ToastInput{
                        Window: Window ?? throw InvalidOperationException("The focus fixture window is not attached."),
                        Item: ToastItem{Id: "first", Title: "Toast", ActionLabel: "Action", DurationMs: 0}
                    }
                )
            }
            case "MasterDetail" {
                return MasterDetail{
                    Narrow: true,
                    Selected: true,
                    Detail: Text{Content: "Detail"},
                    OnBack: () -> { }
                }.Build()
            }
            case "StatusBar" {
                return Cell.Mount[StatusBarInput, StatusBar](
                    "status",
                    StatusBarInput{
                        Start: []StatusBarItem{StatusBarItem{Id: "first", Text: "Status", OnClick: () -> { }}}
                    }
                )
            }
            case "MediaCard" {
                return MediaCard{Title: "Media", OnClick: () -> { }}.Build()
            }
            case "AvatarGroup" {
                return AvatarGroup{
                    Items: []Avatar{Avatar{FallbackText: "AB", AccessibilityName: "Person"}},
                    OnClick: (index int32) -> { }
                }.Build()
            }
            case "CodeBlock" {
                return Cell.Mount[CodeBlockInput, CodeBlock](
                    "code",
                    CodeBlockInput{
                        Code: "let first = 1\nlet last = 2",
                        CollapsedLines: 1,
                        FontFamily: theme.MonoFontFamily,
                        OnCopy: (value string) -> { }
                    }
                )
            }
            case "TriggerMenu" {
                return Cell.Mount[Goo.Widgets.Gallery.Pages.Inputs.TriggerMenuExample]("trigger")
            }
            case "FindBar" {
                return FindBar{
                    Query: "value",
                    Replacement: "text",
                    MatchCount: 2,
                    ActiveMatch: 1,
                    OnNext: () -> { },
                    OnPrevious: () -> { },
                    OnReplace: () -> { },
                    OnReplaceAll: () -> { },
                    OnClose: () -> { }
                }.Build()
            }
            case "TokenInput" {
                return Cell.Mount[TokenInputInput, TokenInput](
                    "tokens",
                    TokenInputInput{Value: []string{"First"}, Suggestions: []string{"Last"}}
                )
            }
            case "ShortcutList" {
                return Cell.Mount[ShortcutListInput, ShortcutList](
                    "shortcuts",
                    ShortcutListInput{OnQueryChange: (value string) -> { }}
                )
            }
            default {
                throw InvalidOperationException(Control)
            }
        }
    }
}
