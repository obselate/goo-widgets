package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import Goo.Widgets.Navigation
import Hexa.NET.SDL3
import System

internal class LayoutHost : Cell {
    internal var DialogOpen bool
    internal var Preset ModalDialogPreset
    internal var Policy DialogDismissPolicy
    internal var Cancels int32
    internal var Confirms int32
    internal var Query string = ""
    internal var SettingsQuery string = ""
    internal var Modified bool = true
    internal var ResetCount int32
    internal let Trigger ElementHandle = ElementHandle()
    internal let Editor ElementHandle = ElementHandle()
    internal let PropertyEditor ElementHandle = ElementHandle()
    internal let SettingsEditor ElementHandle = ElementHandle()
    internal var ShowSettings bool

    public override func Build() Blob -> Container{
        Width: Percent(100),
        Height: Percent(100),
        Padding: 16,
        Gap: 16,
        Cell.Mount[StatusBarInput, StatusBar](
            "status",
            StatusBarInput{
                Start: []StatusBarItem{
                    StatusBarItem{Id: "ready", Text: "Ready", Priority: 10},
                    StatusBarItem{Id: "busy", Text: "Indexing", Busy: true, Priority: 5},
                    StatusBarItem{Id: "detail", Text: "Last synchronized thirty seconds ago", Priority: 0}
                },
                End: []StatusBarItem{
                    StatusBarItem{
                        Id: "language",
                        Text: "Language",
                        Priority: 10,
                        MenuItems: []MenuItem{MenuItem{Id: "gsharp", Label: "G#"}}
                    }
                }
            }
        ),
        Button{
            Handle: Trigger,
            Height: 30,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Open preset"}
        },
        !ShowSettings ? PropertyGrid{
            Layout: PropertyGridLayout.Compact,
            LabelWidth: 120,
            Query: Query,
            OnQueryChange: value -> {
                Query = value
                Rebuild()
            },
            Items: []PropertyGridItem{
                PropertyGridItem{
                    Id: "name",
                    Label: "Project name",
                    Section: "General",
                    Key: "project.title",
                    Modified: Modified,
                    OnReset: () -> {
                        Modified = false
                        ResetCount++
                        Rebuild()
                    },
                    Description: "Visible name",
                    LabelFor: PropertyEditor,
                    CreateEditor: relations -> TextEntry{
                        Handle: PropertyEditor,
                        Value: "Studio",
                        Height: 32,
                        Width: Percent(100),
                        Accessibility: Accessibility{
                            Role: AccessibilityRole.TextInput,
                            Name: "Project editor",
                            Relationships: relations
                        }
                    }
                },
                PropertyGridItem{
                    Id: "cache",
                    Label: "Cache size",
                    Section: "Storage",
                    Editor: TextEntry{
                        Value: "256",
                        Height: 32,
                        Accessibility: Accessibility{Role: AccessibilityRole.TextInput, Name: "Cache editor"}
                    }
                }
            }
        }.Build(): Cell.Mount[SettingsLayoutInput, SettingsLayout](
            "settings",
            SettingsLayoutInput{
                Query: SettingsQuery,
                OnQueryChange: value -> {
                    SettingsQuery = value
                    Rebuild()
                },
                Sections: []SettingsSection{
                    SettingsSection{
                        Id: "general",
                        Title: "General",
                        Rows: []SettingsRow{
                            SettingsRow{
                                Id: "alerts",
                                Label: "Notifications",
                                Description: "Desktop messages",
                                Keywords: []string{"sound", "alerts"},
                                CreateControl: relations -> TextEntry{
                                    Handle: SettingsEditor,
                                    Value: "On",
                                    Height: 32,
                                    Width: Percent(100),
                                    Accessibility: Accessibility{
                                        Role: AccessibilityRole.TextInput,
                                        Name: "Notification editor",
                                        Relationships: relations
                                    }
                                }
                            }
                        }
                    },
                    SettingsSection{
                        Id: "privacy",
                        Title: "Privacy",
                        Rows: []SettingsRow{
                            SettingsRow{Id: "data", Label: "Usage data", Control: TextEntry{Value: "Off", Height: 32}}
                        }
                    }
                }
            }
        ),
        Cell.Mount[ModalDialog, ModalDialogHost](
            "dialog",
            ModalDialog{
                Open: DialogOpen,
                Preset: Preset,
                DismissPolicy: Policy,
                AccessibilityName: "Preset dialog",
                Header: Text{Content: "Review project"},
                Content: TextEntry{
                    Handle: Editor,
                    Value: "Studio",
                    Height: 32,
                    Accessibility: Accessibility{Role: AccessibilityRole.TextInput, Name: "Form editor"}
                },
                OnCancel: () -> {
                    Cancels++
                    DialogOpen = false
                    Rebuild()
                },
                OnClose: () -> {
                    DialogOpen = false
                    Rebuild()
                },
                OnConfirm: () -> {
                    Confirms++
                    DialogOpen = false
                    Rebuild()
                }
            }
        )
    }
}

func LayoutInteractions() {
    RunContracts(
        () -> {
            let empty = (PropertyGrid{}.Build() as Container)!!
            Require(empty.Children.Count == 1, "Default property grid did not resolve nil items and query")
            Require(Card{}.Build().Accessibility?.Role == AccessibilityRole.Group, "Passive card was not a group")
            var rejected bool
            try {
                Card{OnClick: () -> { }, Content: Button{}}.Build()
            } catch (error ArgumentException) {
                rejected = true
            }
            Require(rejected, "Pressable card accepted a nested action")
        }
    )
    let host = LayoutHost()
    let semantics = SearchListSemantics()
    let root = ApplicationRoot(host)
    let window = Window{Title: "Layout contracts", Width: 900, Height: 640, Root: root, AccessibilityAdapter: semantics}
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 12)
        let id = OnlyNativeWindow()
        Require(
            FindSemantics(semantics.Tree?.Root, "Ready")?.Role == AccessibilityRole.Text,
            "Passive status became an action"
        )
        let menu = FindSemantics(semantics.Tree?.Root, "Language")!!
        Require(
            window.PerformAccessibilityAction(menu.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
            "Status menu trigger did not focus"
        )
        SendKey(id, SDLScancode.Down)
        PumpFrames(window, 12)
        Require(FindSemantics(semantics.Tree?.Root, "G#") != nil, "Status item did not open its menu")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 8)
        Require(OverlayFocus(semantics, "Language"), "Status menu did not restore its trigger")
        for preset in[]ModalDialogPreset{
            ModalDialogPreset.Confirm,
            ModalDialogPreset.Destructive,
            ModalDialogPreset.Form
        } {
            host.Trigger.Focus()
            host.Preset = preset
            host.DialogOpen = true
            host.Rebuild()
            PumpFrames(window, 12)
            Require(
                OverlayFocus(semantics, preset == ModalDialogPreset.Form ? "Form editor": "Cancel"),
                "Preset initial focus was not safe"
            )
            SendKey(id, SDLScancode.Escape)
            PumpFrames(window, 8)
            Require(
                !host.DialogOpen && host.Confirms == 0 && OverlayFocus(semantics, "Open preset"),
                "Preset Escape did not cancel and restore focus"
            )
        }
        Require(host.Cancels == 3, "Preset Escape did not invoke the safe action once")
        host.Policy = DialogDismissPolicy.Explicit
        host.DialogOpen = true
        host.Rebuild()
        PumpFrames(window, 12)
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 6)
        Require(host.DialogOpen && host.Cancels == 3, "Explicit dialog policy allowed Escape")
        host.DialogOpen = false
        host.Rebuild()
        PumpFrames(window, 8)
        let editor = FindSemantics(semantics.Tree?.Root, "Project editor")!!
        Require(
            editor.Relationships.LabelledBy.Count == 1 && editor.Relationships.DescribedBy.Count == 1,
            "Property grid lost FormField relationships"
        )
        let reset = FindSemantics(semantics.Tree?.Root, "Reset Project name")!!
        Require(
            window.PerformAccessibilityAction(reset.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Property reset action was not reachable"
        )
        PumpFrames(window, 6)
        Require(
            host.ResetCount == 1 && !host.Modified && FindSemantics(semantics.Tree?.Root, "Reset Project name") == nil,
            "Property reset did not clear the modified marker"
        )
        let search = FindSemantics(semantics.Tree?.Root, "Search properties")!!
        Require(
            window.PerformAccessibilityAction(search.Id, AccessibilityActionRequest.SetValue("project.title")),
            "Property search was not editable"
        )
        PumpFrames(window, 8)
        Require(
            FindSemantics(semantics.Tree?.Root, "Project editor") != nil &&
                FindSemantics(semantics.Tree?.Root, "Cache editor") == nil,
            "Property key search did not filter rows"
        )
        CaptureIssueProof(window, "property-grid-filtered")
        window.PerformAccessibilityAction(
            FindSemantics(semantics.Tree?.Root, "Search properties")!!.Id,
            AccessibilityActionRequest.SetValue("missing")
        )
        PumpFrames(window, 6)
        Require(
            FindSemantics(semantics.Tree?.Root, "No matching properties") != nil,
            "Empty property search had no result state"
        )
        host.ShowSettings = true
        host.Rebuild()
        PumpFrames(window, 12)
        let navigation = FindSemantics(semantics.Tree?.Root, "Settings sections")!!.Bounds
        let setting = host.SettingsEditor.BorderBox
        Require(setting.X > navigation.X + navigation.Width, "Wide settings did not keep navigation beside content")
        let settingsSearch = FindSemantics(semantics.Tree?.Root, "Search settings")!!
        window.PerformAccessibilityAction(settingsSearch.Id, AccessibilityActionRequest.SetValue("sound"))
        PumpFrames(window, 8)
        Require(host.SettingsQuery == "sound" && host.SettingsEditor.IsMounted, "Settings keywords did not match")
        window.Width = 460
        PumpFrames(window, 18)
        let narrowNavigation = FindSemantics(semantics.Tree?.Root, "Settings sections")!!.Bounds
        let narrowEditor = host.SettingsEditor.BorderBox
        Require(
            narrowEditor.Y >= narrowNavigation.Y + narrowNavigation.Height && narrowEditor.X < 40,
            "Narrow settings did not stack navigation and labels"
        )
        Require(narrowEditor.X + narrowEditor.Width <= 444.5, "Narrow settings editor exceeded the window")
        Require(
            FindSemantics(semantics.Tree?.Root, "Last synchronized thirty seconds ago") == nil &&
                FindSemantics(semantics.Tree?.Root, "Ready") != nil,
            "Status bar did not hide its lowest-priority detail"
        )
        CaptureIssueProof(window, "settings-narrow")
        window.Width = 900
        PumpFrames(window, 18)
        Require(host.SettingsEditor.BorderBox.X > 300, "Settings did not return to columns after widening")
        Require(
            FindSemantics(semantics.Tree?.Root, "Last synchronized thirty seconds ago") != nil,
            "Status bar did not restore its hidden detail"
        )
    } finally {
        window.RequestClose()
        window.Pump(0)
    }
    Console.WriteLine(
        "PASS: dialog preset focus and Escape, property search and reset, settings search and narrow stack"
    )
}
