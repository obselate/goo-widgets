import System
import System.Linq
import System.Reflection
import System.Threading
import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Content
import Goo.Widgets.Data
import Goo.Widgets.Feedback
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import Goo.Widgets.Media
import Goo.Widgets.Navigation

internal class SubsetLayoutHost : EmbeddedWindowHost {
    protected override func RequestFrame() {}
    protected override func LoadVulkanLibrary() bool -> throw NotSupportedException()
    protected override func GetVulkanGetInstanceProcAddr() nint -> throw NotSupportedException()
    protected override func UnloadVulkanLibrary() -> throw NotSupportedException()
    protected override func GetVulkanInstanceExtensions()[]string -> throw NotSupportedException()
    protected override func CreateVulkanSurface(instance nint, out surface uint64) bool {
        throw NotSupportedException()
    }
    protected override func DestroyVulkanSurface(instance nint, surface uint64) -> throw NotSupportedException()
}

internal class SubsetSemantics : AccessibilityAdapter {
    internal var Tree AccessibilityTree?
    public func Update(tree AccessibilityTree) {
        Tree = tree
    }
}

internal class ControlStateHost : Cell {
    internal var Scenario int32
    internal var Expanded bool
    internal var Tone Tone
    internal var Builds int32

    public override func Build() Blob {
        Builds++
        return switch Scenario {
            case 0: Banner{Content: "Subset banner", Tone: Tone, OnDismiss: () -> {}}.Build()
            case 1: Alert{Title: "Subset alert", Tone: Tone, OnDismiss: () -> {}}.Build()
            case 2: InlineMessage{Content: "Subset message", Tone: Tone}.Build()
            case 3: Expanded ?
                AttachmentChip{Name: "attachment.pdf", OnRemove: () -> {}}.Build():
                AttachmentChip{Name: "attachment.pdf", OnDownload: () -> {}}.Build()
            case 4: Chip{Label: "Subset chip", OnRemove: () -> {}}.Build()
            case 5: Checkbox{State: Expanded ? AccessibilityChecked.Mixed: AccessibilityChecked.True}.Build()
            case 6: Cell.Mount[ComboBoxInput, ComboBox]("combo", ComboBoxInput{
                Multiple: true, Open: true,
                Items: []ComboBoxOption{ComboBoxOption{Id: "selected", Label: "Selected"}, ComboBoxOption{Id: "other", Label: "Other"}},
                SelectedIds: []string{"selected"},
            })
            case 7: Cell.Mount[DatePickerInput, DatePicker]("date", DatePickerInput{Open: Expanded})
            case 8: FindBar{
                Query: "text", Replacement: "replacement", MatchCount: 1,
                Options: FindOptions{MatchCase: Expanded, WholeWord: Expanded, Regex: Expanded},
            }.Build()
            case 9: Cell.Mount[NumberInputInput, NumberInput]("number", NumberInputInput{
                ShowSpinButtons: true, Units: []ComboBoxOption{ComboBoxOption{Id: "unit", Label: "Unit"}},
            })
            case 10: TextField{
                Value: "password", Password: true, RevealButton: true, Clearable: true,
            }.Build()
            case 11: Disclosure{Label: "Subset section", Expanded: Expanded, Content: Text{Content: "Detail"}}.Build()
            case 12: PropertyGrid{
                Items: []PropertyGridItem{PropertyGridItem{Id: "value", Label: "Value", Section: "Section", Modified: true, OnReset: () -> {}}},
                OnQueryChange: (query string) -> {}, OnSectionToggle: (section string) -> {},
                CollapsedSections: Expanded ? []string{}: []string{"Section"},
            }.Build()
            case 13: Cell.Mount[SettingsLayoutInput, SettingsLayout]("settings", SettingsLayoutInput{
                OnQueryChange: (query string) -> {},
                Sections: []SettingsSection{SettingsSection{Id: "section", Title: "Section"}},
            })
            case 14: WindowChrome{
                IsMaximized: Expanded, OnMinimize: () -> {}, OnMaximize: () -> {}, OnRestore: () -> {}, OnClose: () -> {},
            }.Build()
            case 15: Cell.Mount[MediaTransportInput, MediaTransport]("media", MediaTransportInput{
                Playing: Expanded, OnPrevious: () -> {}, OnPlayPause: () -> {}, OnNext: () -> {},
            })
            case 16: Cell.Mount[CommandPaletteInput, CommandPalette]("commands", CommandPaletteInput{
                Open: true, Items: []CommandItem{CommandItem{Id: "command", Label: "Command"}},
            })
            case 17: Cell.Mount[MenuButtonInput, MenuButton]("menu", MenuButtonInput{
                Open: Expanded, Button: ActionButton{Content: "Menu"},
            })
            case 18: Cell.Mount[CodeBlockInput, CodeBlock]("code", CodeBlockInput{
                Code: "first\nsecond\nthird", CollapsedLines: 1, Expanded: Expanded,
            })
            case 19: Cell.Mount[DataGridInput, DataGrid]("grid", DataGridInput{
                Columns: []DataGridColumn{DataGridColumn{Id: "value", Label: "Value", Sortable: true}},
                Rows: []DataGridRow{
                    DataGridRow{Id: "row", Label: "Row", Detail: Text{Content: "Detail"}},
                    DataGridRow{Id: "other", Label: "Other"},
                },
                Selection: DataGridSelection.Multiple, ShowSelection: true,
                SelectedIds: Expanded ? []string{"row"}: []string{},
                SortColumnId: "value", SortDirection: Expanded ? DataGridSort.Ascending: DataGridSort.Descending,
                ExpandedIds: Expanded ? []string{"row"}: []string{},
            })
            case 20: Cell.Mount[TreeViewInput, TreeView]("tree", TreeViewInput{
                Nodes: []TreeNode{TreeNode{
                    Id: "parent", Label: "Parent", CheckState: Expanded ? AccessibilityChecked.Mixed: AccessibilityChecked.True,
                    Children: []TreeNode{TreeNode{Id: "child", Label: "Child", CheckState: AccessibilityChecked.True}},
                }},
                ExpandedIds: Expanded ? []string{"parent"}: []string{},
            })
            case 21: Cell.Mount[TokenInputInput, TokenInput]("tokens", TokenInputInput{Tokens: []string{"token"}})
            case 22: SplitButton{
                Button: ActionButton{Content: "Action"}, Menu: MenuButtonInput{Open: Expanded},
            }.Build()
            case 23: Cell.Mount[StatusBarInput, StatusBar]("status", StatusBarInput{
                Start: []StatusBarItem{StatusBarItem{Id: "status-menu", Text: "Status", MenuItems: []MenuItem{MenuItem{Id: "item", Label: "Item"}}}},
            })
            case 24: Cell.Mount[TabBarInput, TabBar]("tabs", TabBarInput{
                OverflowMenu: true, Items: []NavigationItem{NavigationItem{Id: "tab", Label: "Tab"}},
            })
            default: throw ArgumentOutOfRangeException("Scenario")
        }
    }
}

func FindAction(node AccessibilityNode?, name string) AccessibilityNode? {
    guard let node = node else {
        return nil
    }
    if node.Name == name {
        return node
    }
    for child in node.Children {
        if let found = FindAction(child, name) {
            return found
        }
    }
    return nil
}

func VerifyControlStates() {
    using let host = SubsetLayoutHost()
    host.Resize(900, 700, 900, 700)
    let root = ControlStateHost()
    let semantics = SubsetSemantics()
    let window = Window{Root: root, AccessibilityAdapter: semantics}
    window.Attach(host)
    for rightToLeft in[]bool{false, true} {
        Theme.Attach(window, Theme.Bone with{Direction = rightToLeft ? Direction.RightToLeft: Direction.LeftToRight})
        for expanded in[]bool{false, true} {
            root.Expanded = expanded
            for scenario in 0 ... 25 {
                root.Scenario = scenario
                for tone in[]Tone{Tone.Neutral, Tone.Info, Tone.Success, Tone.Warning, Tone.Danger} {
                    root.Tone = tone
                    root.Rebuild()
                    for frame in 0 ... 3 {
                        host.RenderFrame(0.016)
                    }
                    if scenario == 10 {
                        let reveal = FindAction(semantics.Tree?.Root, "Show password") ?? throw Exception("Password reveal action was not built.")
                        if !window.PerformAccessibilityAction(reveal.Id, AccessibilityActionRequest(AccessibilityAction.Activate)) {
                            throw Exception("Password reveal action was not activated.")
                        }
                        host.RenderFrame(0.016)
                    }
                    if scenario > 2 {
                        break
                    }
                }
            }
        }
    }
    Console.WriteLine("PASS: every built-in Material icon control state in subset mode.")
}

func VerifyNativeBanner() {
    let root = ControlStateHost{Tone: Tone.Danger}
    let window = Window{Title: "Subset error banner", Root: root, Width: 640, Height: 180}
    window.Open()
    try {
        for frame in 0 ... 30 {
            window.Pump(0.016)
            Thread.Sleep(16)
        }
        if !window.IsVisible || root.Builds == 0 {
            throw Exception("Native subset error banner was not rendered.")
        }
        if window.RequestCapture() != WindowCaptureRequestStatus.Accepted {
            throw Exception("Native subset banner capture was not accepted.")
        }
        var capture = window.PollCapture()
        for frame in 0 ... 200 {
            if capture != nil {
                break
            }
            window.Pump(0.0)
            Thread.Sleep(1)
            capture = window.PollCapture()
        }
        if capture == nil || capture.Width == 0 || capture.Height == 0 {
            throw Exception("Native subset banner capture did not complete.")
        }
        Console.WriteLine("PASS: NativeAOT subset Banner severity error rendered.")
    } finally {
        window.RequestClose()
        while window.IsOpen {
            window.Pump(0.0)
        }
    }
}

func Main() {
    let expected = []string{
        "arrow_downward", "arrow_upward", "attach_file", "calendar_month", "check", "check_box",
        "check_box_outline_blank", "check_circle", "chevron_left", "chevron_right", "close", "content_copy",
        "create_new_folder", "crop_square", "done_all", "download", "error", "expand_less", "expand_more",
        "filter_none", "find_replace", "info", "match_case", "match_word", "pause", "play_arrow",
        "regular_expression", "remove", "restart_alt", "search", "skip_next", "skip_previous",
        "visibility", "visibility_off", "warning"
    }
    let names = MaterialIcons.Names()
    if !names.SequenceEqual(expected) {
        throw Exception("Material icon subset does not match the selected names and widget defaults.")
    }
    for name in names {
        MaterialIcons.Create(name, 24.0, Color.Black)
    }
    let embedded = Assembly.GetExecutingAssembly().GetManifestResourceNames()
        .Count(name -> name.StartsWith("Goo.Widgets.MaterialSymbols.", StringComparison.Ordinal)
            && name.EndsWith(".svg", StringComparison.Ordinal))
    if embedded != expected.Length {
        throw Exception("Material icon resources were not embedded in the executable.")
    }
    try {
        MaterialIcons.Create("add")
        throw Exception("An icon outside the selected subset was accepted.")
    } catch (error InvalidOperationException) when error.Message.Contains("Material icon resource not found") {
    }
    VerifyControlStates()
    if Environment.GetCommandLineArgs().Contains("--native") {
        VerifyNativeBanner()
    }
    Console.WriteLine("PASS: packaged Material icon subset.")
}
