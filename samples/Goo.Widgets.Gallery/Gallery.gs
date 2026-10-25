package Goo.Widgets.Gallery

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import Goo.Widgets.Navigation
import Goo.Widgets.Gallery.Pages.Actions
import Goo.Widgets.Gallery.Pages.Colors
import Goo.Widgets.Gallery.Pages.Controls
import Goo.Widgets.Gallery.Pages.Feedback
import Goo.Widgets.Gallery.Pages.Inputs
import Goo.Widgets.Gallery.Pages.Layout
import Goo.Widgets.Gallery.Pages.Navigation
import Goo.Widgets.Gallery.Pages.Media
import Goo.Widgets.Gallery.Pages.Graphs
import Goo.Widgets.Gallery.Pages.Charts
import Goo.Widgets.Gallery.Pages.Data
import Goo.Widgets.Gallery.Pages.Content
import System.Collections.Generic

open class GalleryPage {
    internal var PlatformInput PlatformInput?
    internal var OwningWindow Window?
    var DisplayTitle string?
    func Name() string -> DisplayTitle ?? Title()
    open func Title() string;
    open func Build() Blob;
}

class GalleryCategory(Name string, Icon string, Pages[]GalleryPage) { }

class GalleryRegistry(Groups[]GalleryCategory) {
    func Count() int32 {
        var count int32 = 0
        for group in Groups {
            count = count + group.Pages.Length
        }
        return count
    }

    func CurrentPage(index int32) GalleryPage {
        let count = Count()
        if count == 0 {
            throw InvalidOperationException("Gallery registry contains no pages.")
        }
        var remaining int32 = ((index % count) + count) % count
        for group in Groups {
            if remaining < group.Pages.Length {
                return group.Pages[remaining]
            }
            remaining = remaining - group.Pages.Length
        }
        return Groups[0].Pages[0]
    }

    func IndexOf(title string) int32 {
        var index int32
        for group in Groups {
            for page in group.Pages {
                if page.Name() == title {
                    return index
                }
                index++
            }
        }
        throw InvalidOperationException("Unknown gallery page: " + title)
    }
}

class Gallery : Cell, IDisposable {
    private let Registry GalleryRegistry
    private let PageOnly bool
    private var currentIndex int32
    internal var RightToLeft bool
    private var query string = ""
    private var platformInput PlatformInput?
    private var owningWindow Window?
    private var sidePadding float64 = 24
    private let panelHandle ElementHandle = ElementHandle()
    internal let CardHandle ElementHandle = ElementHandle()
    private let searchHandle ElementHandle = ElementHandle()
    private let listHandle ElementHandle = ElementHandle()
    private let pageHandles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    private let stageLayout LayoutAlgorithm = GalleryStageLayout()

    public init(registry GalleryRegistry, initialIndex int32, pageOnly bool = false) {
        Registry = registry
        currentIndex = initialIndex
        PageOnly = pageOnly
        panelHandle.MetricsChanged += (metrics ElementMetrics) -> {
            let padding = metrics.BorderBox.Width >= 1000 ? 40.0: 24.0
            if metrics.IsMounted && padding != sidePadding {
                sidePadding = padding
                Rebuild()
            }
            if metrics.IsMounted { RevealPage() }
        }
    }

    internal func AttachWindow(window Window) {
        Theme.Attach(window, Theme.Default with{
            FontFamily = "Vend Sans", HeadingFontFamily = "Vend Sans",
            Direction = RightToLeft ? Direction.RightToLeft: Direction.Auto
        })
        Theme.SetMode(window, ThemeMode.Dark)
        platformInput = window.PlatformInput
        if let previous = owningWindow { previous.PreviewKeyPressed -= PreviewKey }
        window.PreviewKeyPressed += PreviewKey
        owningWindow = window
        Rebuild()
    }

    public func Dispose() {
        if let window = owningWindow { window.PreviewKeyPressed -= PreviewKey }
        owningWindow = nil
    }

    internal func Show(index int32) {
        currentIndex = index
        Rebuild()
        RevealPage()
    }

    private func RevealPage() {
        let title = Registry.CurrentPage(currentIndex).Name()
        if pageHandles.ContainsKey(title) && pageHandles[title].IsMounted {
            let row = pageHandles[title].BorderBox
            let viewport = listHandle.ContentBox
            let bottom = viewport.Y + viewport.Height - 40
            let offset = listHandle.ScrollOffset
            if row.Y < viewport.Y {
                listHandle.ScrollTo(offset.X, Math.Max(0.0, offset.Y + row.Y - viewport.Y))
            } else if row.Y + row.Height > bottom {
                listHandle.ScrollTo(offset.X, offset.Y + row.Y + row.Height - bottom)
            }
        }
    }

    private func Navigate(delta int32) {
        let count = Registry.Count()
        if count == 0 {
            return
        }
        Show((currentIndex + delta + count) % count)
    }

    private func Search(value string) {
        query = value
        Rebuild()
    }

    private func FirstMatch() string? {
        for group in Registry.Groups {
            for page in group.Pages {
                if FuzzyMatch.Match(query, page.Name()) != nil { return page.Name() }
            }
        }
        return nil
    }

    private func SearchKey(e KeyEvent) {
        if e.Key == Key.Down || e.Key == Key.Enter {
            if let first = FirstMatch() {
                if e.Key == Key.Enter { Show(Registry.IndexOf(first)) }
                else if pageHandles.ContainsKey(first) { pageHandles[first].Focus() }
            }
        } else if e.Key == Key.Escape { Search("") }
        else { return }
        e.PreventDefault()
        e.StopPropagation()
    }

    private func PreviewKey(key Key, modifiers KeyModifiers) bool {
        if modifiers == KeyModifiers{Ctrl: true} && (key == Key.PageUp || key == Key.PageDown) {
            Navigate(key == Key.PageUp ? -1: 1)
            return true
        }
        let primary = KeyModifiers{Ctrl: !OperatingSystem.IsMacOS(), Super: OperatingSystem.IsMacOS()}
        if key == Key.K && modifiers == primary && searchHandle.Focus() {
            platformInput?.Execute(TextCommand{Kind: TextCommandKind.SelectAll})
            return true
        }
        return false
    }

    private func Sidebar() Blob {
        let theme = Theme.Read()
        let list = Container{
            Key: "page-list", Handle: listHandle, FlexGrow: 1, FlexBasis: 0, MinHeight: 0, Gap: 10,
            OverflowY: Overflow.Scroll, ScrollbarY: theme.Scrollbar,
            Padding: Edges{Bottom: 40}
        }
        var matches int32
        for group in Registry.Groups {
            let items = List[NavigationItem]()
            for page in group.Pages {
                if FuzzyMatch.Match(query, page.Name()) != nil {
                    items.Add(NavigationItem{Id: page.Name(), Label: page.Name()})
                }
            }
            if items.Count == 0 { continue }
            matches += items.Count
            list.Children.Add(Container{
                Key: group.Name, Gap: 2,
                Container{
                    Height: 28, Padding: Edges{Left: 8, Right: 8}, Gap: 8,
                    FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center,
                    Accessibility: Accessibility{Role: AccessibilityRole.Heading, Name: group.Name, Level: 2},
                    MaterialIcons.Create(group.Icon, 16, theme.FaintTextColor),
                    Text{Content: group.Name, FontSize: 13, FontWeight: 600, Color: theme.TextColor}
                },
                Container{
                    MarginStart: 15, BorderStartWidth: 1, BorderColor: theme.BorderColor,
                    PaddingStart: 6,
                    Cell.Mount[NavigationRailInput, NavigationRail](group.Name, NavigationRailInput{
                        Items: items.ToArray(), SelectedId: Registry.CurrentPage(currentIndex).Name(),
                        AccessibilityName: group.Name, Expanded: true, ExpandedWidth: 202,
                        Height: Length.Auto, ItemHeight: 28, Gap: 1, ItemBorderRadius: 6,
                        ItemPaddingHorizontal: 10, FontSize: 13, FontWeight: 400,
                        BackgroundColor: Color.Transparent, TextColor: theme.MutedTextColor,
                        SelectedTextColor: theme.TextColor, SelectedBackgroundColor: theme.ActiveColor,
                        HoverBackgroundColor: theme.HoverColor,
                        OnSelect: (id string) -> Show(Registry.IndexOf(id)),
                        CreateRoot: (input NavigationRailInput, buttons[]Button) -> {
                            let root = Container{Gap: 1, Accessibility: Accessibility{
                                Role: AccessibilityRole.TabList, Name: group.Name,
                                Orientation: AccessibilityOrientation.Vertical}}
                            for button in buttons {
                                pageHandles[button.Key!!] = button.Handle!!
                                button.Hover = Style{
                                    BackgroundColor: button.Key == input.SelectedId ? theme.ActiveColor: theme.HoverColor,
                                    Color: theme.TextColor
                                }
                                button.Active = Style{BackgroundColor: theme.PressedColor, Color: theme.TextColor}
                                for child in button.Children {
                                    if child is Text { child.FontWeight = button.Key == input.SelectedId ? 500: 400 }
                                }
                                button.Focus = Style{OutlineColor: theme.FocusColor, OutlineWidth: 2, OutlineOffset: -2}
                                root.Children.Add(button)
                            }
                            return root
                        }
                    })
                }
            })
        }
        if matches == 0 {
            list.Children.Add(Container{
                Padding: 8, Gap: 8,
                Text{Content: "No widgets match \"" + query + "\"", FontSize: 13, Color: theme.FaintTextColor,
                    TextWrap: TextWrap.NoWrap, TextTrimming: TextTrimming.Ellipsis},
                (theme.LinkButton with{Content = "Clear search", OnClick = () -> Search("")}).Build()
            })
        }
        return Container{
            Key: "sidebar", Width: 248, FlexShrink: 0, Padding: Edges{Top: 14, Left: 12, Right: 12, Bottom: 12},
            Gap: 14,
            Container{
                Height: 32, FlexShrink: 0, Padding: Edges{Left: 4, Right: 4}, Gap: 10,
                FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center,
                Container{
                    Width: 26, Height: 26, BorderRadius: 7,
                    BackgroundGradient: LinearGradient(135.0, []GradientStop{
                        GradientStop{Offset: 0, Color: Color.Parse("#4a80f0")},
                        GradientStop{Offset: 1, Color: Color.Parse("#2452c0")}}),
                    AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center,
                    MaterialIcons.Create("widgets", 16, Color.White)
                },
                Text{Content: "Goo Widgets", FontSize: 15, FontWeight: 600, LetterSpacing: -0.15}
            },
            (theme.TextField with{
                Value = query, Controlled = true, Width = 224, EntryHeight = 32,
                Placeholder = "Search", AccessibilityName = "Search widgets",
                OnChange = Search,
                CreateRoot = (input TextField, label Text?, entry TextEntry, issue Text?) -> {
                    entry.Handle = searchHandle
                    entry.OnKeyDown = SearchKey
                    entry.Width = Length.Auto
                    entry.FlexGrow = 1
                    entry.MinWidth = 0
                    entry.Padding = 0
                    entry.BorderWidth = 0
                    entry.BackgroundColor = Color.Transparent
                    return Container{
                        Height: 32, FlexShrink: 0, Padding: Edges{Left: 10, Right: 10}, Gap: 8,
                        FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center,
                        BackgroundColor: theme.FieldColor, BorderWidth: 1, BorderColor: theme.InputBorderColor, BorderRadius: 6,
                        MaterialIcons.Create("search", 16, theme.FaintTextColor), entry
                    }
                }
            }).Build(),
            Container{
                FlexGrow: 1, FlexBasis: 0, MinHeight: 0, Overflow: Overflow.Hidden, Position: PositionType.Relative, list,
                Container{Position: PositionType.Absolute, Left: 0, Right: 0, Bottom: 0, Height: 40,
                    HitTestSelf: false,
                    BackgroundGradient: LinearGradient(180.0, []GradientStop{
                        GradientStop{Offset: 0, Color: theme.CanvasColor.WithAlpha(0.0)},
                        GradientStop{Offset: 1, Color: theme.CanvasColor}})}
            },
            Container{
                FlexShrink: 0, Margin: Edges{Left: -12, Right: -12},
                BorderWidth: Edges{Top: 1}, BorderColor: theme.BorderColor,
                Padding: Edges{Top: 12, Left: 12, Right: 12},
                Cell.Mount[ToggleGroupInput, ToggleGroup]("appearance", ToggleGroupInput{
                    Look: ToggleGroupLook.Segmented, Stretch: true, AccessibilityName: "Appearance",
                    Orientation: AccessibilityOrientation.Horizontal,
                    SelectedIds: []string{theme.CanvasColor == Theme.Ink.CanvasColor ? "dark": "light"},
                    Items: []ToggleOption{
                        ToggleOption{Id: "dark", Label: "Dark", Leading: MaterialIcons.Create("dark_mode", 16)},
                        ToggleOption{Id: "light", Label: "Light", Leading: MaterialIcons.Create("light_mode", 16)}
                    },
                    CreateItem: (input ToggleGroupInput, item ToggleOption, button Button) -> {
                        button.MinHeight = 24
                        button.Height = 24
                        button.BorderWidth = 1
                        return button
                    },
                    OnChange: (ids[]string) -> {
                        if ids.Length > 0 && owningWindow != nil { Theme.SetMode(owningWindow!!, ids[0] == "dark" ? ThemeMode.Dark: ThemeMode.Light) }
                    }
                })
            }
        }
    }

    public override func Build() Blob {
        let theme = Theme.Read()
        let page = Registry.CurrentPage(currentIndex)
        page.PlatformInput = platformInput
        page.OwningWindow = owningWindow
        let root = Container{
            BasedOn: theme.CanvasStyle, Direction: theme.Direction, KeyBindings: WidgetKeyBindings.Editing(platformInput), Width: Percent(100), Height: Percent(100),
            FlexDirection: FlexDirection.Row
        }
        if !PageOnly { root.Children.Add(Sidebar()) }
        root.Children.Add(Container{
            Key: "page", Handle: panelHandle, FlexGrow: 1, FlexBasis: 0, MinWidth: 0, MinHeight: 0,
            Margin: 8, MarginStart: PageOnly ? 8: 0,
            BackgroundColor: theme.PanelColor, BorderColor: theme.BorderColor, BorderWidth: 1,
            BorderRadius: theme.PanelRadius, BoxShadow: theme.ElevationSm, Overflow: Overflow.Hidden,
            Padding: Edges{Top: 26, Left: sidePadding, Right: sidePadding, Bottom: 32}, Gap: 20,
            Text{Content: page.Name(), FontSize: 28, FontWeight: 600, LetterSpacing: -0.4,
                Accessibility: Accessibility{Role: AccessibilityRole.Heading, Name: page.Name(), Level: 1, Live: AccessibilityLive.Polite}},
            Container{
                Handle: CardHandle, FlexShrink: 1, MinHeight: 180, BorderWidth: 1, BorderColor: theme.BorderColor, BorderRadius: 10, Overflow: Overflow.Hidden,
                Container{
                    FlexGrow: 1, FlexShrink: 1, MinHeight: 0, MinWidth: 0, Padding: 32, BackgroundColor: theme.CanvasColor,
                    Container{
                        FlexGrow: 1, FlexShrink: 1, MinHeight: 0, MinWidth: 0,
                        OverflowY: Overflow.Scroll, OverflowX: Overflow.Scroll, ScrollbarY: theme.Scrollbar, ScrollbarX: theme.Scrollbar,
                        Layout: stageLayout,
                        page.Build()
                    }
                }
            }
        })
        return root
    }
}

class GalleryStageLayout : LayoutAlgorithm {
    public func Measure(context LayoutContext, available LayoutSize) LayoutSize -> context.MeasureChild(0, available)

    public func Arrange(context LayoutContext, finalSize LayoutSize) {
        let natural = context.MeasureChild(0, finalSize)
        context.ArrangeChild(0, ElementRect{
            X: Math.Max(0, (finalSize.Width - natural.Width) / 2),
            Y: Math.Max(0, (finalSize.Height - natural.Height) / 2),
            Width: natural.Width,
            Height: natural.Height
        })
    }
}

func CreateRegistry() GalleryRegistry -> GalleryRegistry([]GalleryCategory{
    GalleryCategory("Actions", "smart_button", []GalleryPage{
        ActionButtonPage{DisplayTitle: "Action button"},
        IconButtonPage{DisplayTitle: "Icon button"}
    }),
    GalleryCategory("Inputs", "input", []GalleryPage{
        CheckboxPage{DisplayTitle: "Checkbox"},
        RadioGroupPage{DisplayTitle: "Radio group"},
        ToggleGroupPage{DisplayTitle: "Toggle group"},
        TextFieldPage{DisplayTitle: "Text field"},
        TokenInputPage{DisplayTitle: "Token input"},
        NumberInputPage{DisplayTitle: "Number input"},
        FormFieldPage{DisplayTitle: "Form field"},
        TextAreaPage{DisplayTitle: "Text area"},
        FindBarPage{DisplayTitle: "Find bar"},
        TriggerMenuPage{DisplayTitle: "Trigger menu"},
        TouchTextEditingPage{DisplayTitle: "Touch text editing"},
        ToggleSwitchPage{DisplayTitle: "Toggle switch"},
        StepperPage{DisplayTitle: "Stepper"},
        UploadTilePage{DisplayTitle: "Upload tile"},
        SearchListPage{DisplayTitle: "Search list"},
        ComboBoxPage{DisplayTitle: "Combo box"},
        CalendarPage{DisplayTitle: "Calendar"},
        DatePickerPage{DisplayTitle: "Date picker"},
        SliderPage{DisplayTitle: "Slider"}
    }),
    GalleryCategory("Data", "table_chart", []GalleryPage{
        ChipPage{DisplayTitle: "Chip"},
        AttachmentChipPage{DisplayTitle: "Attachment chip"},
        TimeAxisPage{DisplayTitle: "Time axis"},
        ListViewPage{DisplayTitle: "List view"},
        TreeViewPage{DisplayTitle: "Tree view"},
        DataGridPage{DisplayTitle: "Data grid"}
    }),
    GalleryCategory("Feedback", "notifications", []GalleryPage{
        ToastPage{DisplayTitle: "Toast"},
        SpinnerPage{DisplayTitle: "Spinner"},
        BadgePage{DisplayTitle: "Badge"},
        BannerPage{DisplayTitle: "Banner"},
        DismissibleContextBarPage{DisplayTitle: "Dismissible context bar"},
        EmptyStatePage{DisplayTitle: "Empty state"},
        ProgressBarPage{DisplayTitle: "Progress bar"},
        ProgressSummaryPage{DisplayTitle: "Progress summary"}
    }),
    GalleryCategory("Layout", "dashboard", []GalleryPage{
        AppBarPage{DisplayTitle: "App bar"},
        DrawerPage{DisplayTitle: "Drawer"},
        SectionHeaderPage{DisplayTitle: "Section header"},
        ListRowPage{DisplayTitle: "List row"},
        MasterDetailPage{DisplayTitle: "Master detail"},
        ModalDialogPage{DisplayTitle: "Modal dialog"},
        ModalDialogHostPage{DisplayTitle: "Modal dialog host"},
        CardPage{DisplayTitle: "Card"},
        StatusBarPage{DisplayTitle: "Status bar"},
        PropertyGridPage{DisplayTitle: "Property grid"},
        SettingsLayoutPage{DisplayTitle: "Settings layout"},
        PopoverPage{DisplayTitle: "Popover"},
        TooltipPage{DisplayTitle: "Tooltip"},
        HoverCardPage{DisplayTitle: "Hover card"},
        DisclosurePage{DisplayTitle: "Disclosure"},
        SplitPanePage{DisplayTitle: "Split pane"},
        GridPage{DisplayTitle: "Grid"},
        WindowChromePage{DisplayTitle: "Window chrome"},
        ThemeScopePage{DisplayTitle: "Theme scope"}
    }),
    GalleryCategory("Navigation", "explore", []GalleryPage{
        NavigationRailPage{DisplayTitle: "Navigation rail"},
        TabBarPage{DisplayTitle: "Tab bar"},
        MenuPage{DisplayTitle: "Menu"},
        BreadcrumbPage{DisplayTitle: "Breadcrumb"},
        MenuButtonPage{DisplayTitle: "Menu button"},
        SplitButtonPage{DisplayTitle: "Split button"},
        CommandPalettePage{DisplayTitle: "Command palette"}
    }),
    GalleryCategory("Media", "image", []GalleryPage{
        AsyncImagePage{DisplayTitle: "Async image"},
        AvatarPage{DisplayTitle: "Avatar"},
        MediaCardPage{DisplayTitle: "Media card"},
        MediaTransportPage{DisplayTitle: "Media transport"}
    }),
    GalleryCategory("Charts", "bar_chart", []GalleryPage{
        DonutChartPage{DisplayTitle: "Donut chart"},
        StackedBarPage{DisplayTitle: "Stacked bar"}
    }),
    GalleryCategory("Graphs", "hub", []GalleryPage{
        GraphCanvasPage{DisplayTitle: "Graph canvas"},
        GraphNodeCardPage{DisplayTitle: "Graph node card"}
    }),
    GalleryCategory("Colors", "palette", []GalleryPage{
        ColorPickerPage{DisplayTitle: "Color picker"}
    }),
    GalleryCategory("Content", "article", []GalleryPage{
        MarkdownViewPage{DisplayTitle: "Markdown view"},
        TypographyPage{DisplayTitle: "Typography"},
        KbdPage{DisplayTitle: "Kbd"},
        CodeBlockPage{DisplayTitle: "Code block"}
    })
})
