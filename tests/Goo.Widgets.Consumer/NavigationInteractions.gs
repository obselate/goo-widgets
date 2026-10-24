package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Icons
import Goo.Widgets.Navigation
import Hexa.NET.SDL3
import System.Collections.Generic

internal class NavigationHost : Cell {
    internal var MenuOpen bool
    internal var PaletteOpen bool
    internal var Query string = ""
    internal var Invoked string = ""
    internal var Selected string = "one"
    internal var Closed string = ""
    internal let Tabs Dictionary[string, Button] = Dictionary[string, Button]()
    internal let Highlights Dictionary[string, FuzzyMatchResult] = Dictionary[string, FuzzyMatchResult]()
    internal let Viewport ElementHandle = ElementHandle()
    internal let Launch ElementHandle = ElementHandle()
    internal var RailSelected string = "files"
    internal var GroupCollapsed bool
    internal var RailExpanded bool = true

    public override func Build() Blob {
        let theme = Theme.Read()
        let items = List[NavigationItem]()
        for id in[]string{"one", "two", "three", "four", "five", "six", "seven", "eight"} {
            if id != Closed {
                items.Add(NavigationItem{Id: id, Label: "Document " + id})
            }
        }
        return Container{
            Width: Percent(100),
            Height: Percent(100),
            Padding: 24,
            Gap: 16,
            BackgroundColor: theme.CanvasColor,
            Color: theme.TextColor,
            Text{Content: "Navigation widgets", FontSize: 24},
            Cell.Mount[MenuButtonInput, MenuButton](
                "menu",
                MenuButtonInput{
                    Button: ActionButton{Content: "File actions"},
                    Open: MenuOpen,
                    OnOpenChange: (isOpen bool) -> {
                        MenuOpen = isOpen
                        Rebuild()
                    },
                    Items: []MenuItem{
                        MenuItem{Id: "first", Label: "First command"},
                        MenuItem{Id: "disabled", Label: "Disabled command", Disabled: true},
                        MenuItem{Id: "last", Label: "Last command"},
                    },
                }
            ),
            SplitButton{
                Button: ActionButton{
                    Content: "Primary action",
                    OnClick: () -> {
                        Invoked = "primary"
                        Rebuild()
                    }
                },
                Menu: MenuButtonInput{Button: ActionButton{Disabled: true}},
            }.Build(),
            Cell.Mount[TabBarInput, TabBar](
                "tabs",
                TabBarInput{
                    Items: items.ToArray(),
                    SelectedId: Selected,
                    Width: 420,
                    OverflowMenu: true,
                    PinnedIds: []string{"one"},
                    DirtyIds: []string{"two"},
                    PreviewId: "three",
                    OnSelect: (id string) -> {
                        Selected = id
                        Rebuild()
                    },
                    OnClose: (id string) -> {
                        Closed = id
                        Rebuild()
                    },
                    CreateItem: (input TabBarInput, item NavigationItem, button Button) -> {
                        Tabs[item.Id!!] = button
                        return button
                    },
                    CreateRoot: (input TabBarInput, root Container) -> {
                        root.Handle = Viewport
                        return root
                    },
                }
            ),
            Cell.Mount[NavigationRailInput, NavigationRail](
                "rail",
                NavigationRailInput{
                    Expanded: RailExpanded,
                    Height: 210,
                    SelectedId: RailSelected,
                    Groups: []NavigationGroup{
                        NavigationGroup{
                            Id: "workspace",
                            Label: "Workspace",
                            Items: []NavigationItem{
                                NavigationItem{Id: "files", Label: "Files", Content: MaterialIcons.Create("folder")},
                                NavigationItem{Id: "search", Label: "Search", Content: MaterialIcons.Create("search")},
                            }
                        }
                    },
                    CollapsedGroups: GroupCollapsed ? []string{"workspace"}: []string{},
                    OnGroupToggle: (id string) -> {
                        GroupCollapsed = !GroupCollapsed
                        Rebuild()
                    },
                    Counts: Dictionary[string, int32](){["files"] = 12},
                    OnSelect: (id string) -> {
                        RailSelected = id
                        Rebuild()
                    },
                    BottomItems: []NavigationItem{
                        NavigationItem{Id: "settings", Label: "Settings", Content: MaterialIcons.Create("settings")}
                    },
                }
            ),
            ActionButton{
                Content: "Open palette",
                CreateRoot: (input ActionButton, text Text) -> Button{
                    Handle: Launch,
                    Height: 36,
                    Focusable: true,
                    Text{Content: "Open palette"},
                    OnClick: () -> {
                        PaletteOpen = true
                        Query = ""
                        Rebuild()
                    },
                }
            }.Build(),
            Cell.Mount[CommandPaletteInput, CommandPalette](
                "palette",
                CommandPaletteInput{
                    Open: PaletteOpen,
                    Query: Query,
                    RecentIds: []string{"save"},
                    OnQueryChange: (value string) -> {
                        Query = value
                        Rebuild()
                    },
                    OnDismiss: () -> {
                        PaletteOpen = false
                        Rebuild()
                    },
                    OnActivate: (id string) -> Invoked = id,
                    CreateItem: (item CommandItem, match FuzzyMatchResult, button Button) -> {
                        Highlights[item.Id] = match
                        return button
                    },
                    Groups: []CommandGroup{CommandGroup{Id: "file", Label: "File"}},
                    Items: []CommandItem{
                        CommandItem{Id: "open", Label: "Open file", GroupId: "file"},
                        CommandItem{
                            Id: "save",
                            Label: "Save file",
                            GroupId: "file",
                            Shortcut: KeyBinding{Key: Key.S, Modifiers: KeyModifiers{Ctrl: true}}
                        },
                        CommandItem{Id: "format", Label: "Format document", GroupId: "file"},
                        CommandItem{Id: "locked", Label: "Format locked", Disabled: true},
                        CommandItem{Id: "find", Label: "Find references"},
                    },
                }
            ),
        }
    }
}

func NavigationInteractions() {
    let host = NavigationHost()
    let semantics = SearchListSemantics()
    let root = ApplicationRoot(host)
    let window = Window{Title: "Navigation acceptance", Width: 800, Height: 650, Root: root}
    window.AccessibilityAdapter = semantics
    BindApplicationInput(root, window)
    Theme.Attach(window)
    window.Open()
    try {
        PumpFrames(window, 16)
        let native = OnlyNativeWindow()
        let trigger = FindSemantics(semantics.Tree?.Root, "File actions")!!
        Require(trigger.HasPopup == true && trigger.Expanded == false, "Menu trigger omitted popup or collapsed state")
        host.Launch.Focus()
        Require(
            window.PerformAccessibilityAction(trigger.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Menu trigger did not activate"
        )
        PumpFrames(window, 12)
        ChoiceKey(window, SDLScancode.Escape)
        Require(OverlayFocus(semantics, "File actions"), "Accessibility activation did not restore trigger focus")
        ChoiceKey(window, SDLScancode.Up)
        Require(
            host.MenuOpen && FindSemantics(semantics.Tree?.Root, "File actions")!!.Expanded == true,
            "Up did not set menu expanded state"
        )
        Require(OverlayFocus(semantics, "Last command"), "Up did not open at last item")
        ChoiceKey(window, SDLScancode.Escape)
        Require(!host.MenuOpen && OverlayFocus(semantics, "File actions"), "Menu did not close and restore focus")
        ChoiceKey(window, SDLScancode.Down)
        Require(OverlayFocus(semantics, "First command"), "Down did not open first item")
        ChoiceKey(window, SDLScancode.Escape)
        window.PerformAccessibilityAction(
            FindSemantics(semantics.Tree?.Root, "Primary action")!!.Id,
            AccessibilityActionRequest(AccessibilityAction.Activate)
        )
        Require(host.Invoked == "primary" && !host.MenuOpen, "Split primary action opened the menu or did not run")
        Require(host.Tabs["two"].Handle!!.Focus(), "Editor tab did not focus")
        ChoiceKey(window, SDLScancode.Delete)
        Require(
            host.Closed == "two" && FindSemantics(semantics.Tree?.Root, "Document two, unsaved") == nil,
            "Tab close did not remove the dirty tab"
        )
        host.Tabs["one"].Handle!!.Focus()
        ChoiceKey(window, SDLScancode.End)
        let last = host.Tabs["eight"].Handle!!.BorderBox
        let strip = host.Viewport.BorderBox
        Require(
            host.Selected == "eight" && last.X >= strip.X && last.X + last.Width <= strip.X + strip.Width,
            "Tab End did not select and reveal the last whole tab"
        )
        let overflow = FindSemantics(semantics.Tree?.Root, "All tabs")!!
        Require(
            overflow.Bounds.X + overflow.Bounds.Width <= host.Viewport.BorderBox.X + 420,
            "Tab overflow trigger exceeded the controlled width"
        )
        Require(
            window.PerformAccessibilityAction(overflow.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Overflow menu did not activate"
        )
        PumpFrames(window, 12)
        Require(FindSemantics(semantics.Tree?.Root, "All tabs")!!.Expanded == true, "Overflow menu did not expand")
        ChoiceKey(window, SDLScancode.End)
        ChoiceKey(window, SDLScancode.Return)
        Require(host.Selected == "eight", "Overflow menu did not select a tab")
        for mode in[]ThemeMode{ThemeMode.Light, ThemeMode.Dark} {
            Theme.SetMode(window, mode)
            PumpFrames(window, 10)
            CaptureIssueProof(window, "navigation-" + mode.ToString())
            host.RailExpanded = false
            host.Rebuild()
            PumpFrames(window, 6)
            Require(FindSemantics(semantics.Tree?.Root, "Files, 12") != nil, "Activity bar lost its label or count")
            CaptureIssueProof(window, "activity-" + mode.ToString())
            host.RailExpanded = true
            host.Rebuild()
            PumpFrames(window, 6)
            host.Launch.Focus()
            ChoiceKey(window, SDLScancode.Return)
            Require(
                host.PaletteOpen && OverlayFocus(semantics, "Search commands"),
                "Palette did not open with query focus"
            )
            Require(FindSemantics(semantics.Tree?.Root, "Recent") != nil, "Palette omitted recent group")
            CaptureIssueProof(window, "palette-recent-" + mode.ToString())
            SelectorType(window, native, "fr")
            PumpFrames(window, 8)
            Require(
                host.Query == "fr" && FindSemantics(semantics.Tree?.Root, "Open file") == nil,
                "Palette query did not filter commands"
            )
            Require(
                FindSemantics(semantics.Tree?.Root, "Find references")!!.Selected == true,
                "Palette did not select the highest fuzzy score"
            )
            Require(
                host.Highlights["find"].Ranges.Length == 2,
                "Palette retained stale match highlights after query edits"
            )
            ChoiceKey(window, SDLScancode.Down)
            Require(
                FindSemantics(semantics.Tree?.Root, "Format document")!!.Selected == true,
                "Palette Down did not select next ranked command"
            )
            ChoiceKey(window, SDLScancode.Up)
            Require(
                FindSemantics(semantics.Tree?.Root, "Find references")!!.Selected == true,
                "Palette Up did not restore previous command"
            )
            CaptureIssueProof(window, "palette-filter-" + mode.ToString())
            ChoiceKey(window, SDLScancode.Return)
            Require(
                !host.PaletteOpen && host.Invoked == "find" && OverlayFocus(semantics, "Open palette"),
                "Palette Enter did not activate and restore focus"
            )
            ChoiceKey(window, SDLScancode.Return)
            ChoiceKey(window, SDLScancode.Escape)
            Require(
                !host.PaletteOpen && OverlayFocus(semantics, "Open palette"),
                "Palette Escape did not dismiss and restore focus"
            )
            ChoiceKey(window, SDLScancode.Return)
            window.Width = 390
            window.Height = 420
            PumpFrames(window, 14)
            let entry = FindSemantics(semantics.Tree?.Root, "Search commands")!!.Bounds
            Require(entry.X >= 0 && entry.X + entry.Width <= 390, "Palette search clipped at the minimum window width")
            CaptureIssueProof(window, "palette-narrow-" + mode.ToString())
            ChoiceKey(window, SDLScancode.Escape)
            window.Width = 800
            window.Height = 650
            PumpFrames(window, 8)
        }
        Console.WriteLine(
            "PASS: menu expanded/first/last/focus, editor tab close and overflow, palette open/filter/rank/arrows/Enter/Escape in light and dark"
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
}
