package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import System

internal class RetainedContractRoot(content Blob) : Cell {
    internal var Builds int32
    public override func Build() Blob {
        Builds++
        return content
    }
}

internal class RetainedFieldEditor : Cell {
    internal let Handle ElementHandle = ElementHandle()
    internal let Semantics Accessibility = Accessibility{Role: AccessibilityRole.Checkbox, Name: "Retained editor"}
    internal var Alternate bool
    public override func Build() Blob {
        let editor = Button{Handle: Handle, Accessibility: Semantics}
        return Alternate ? Column(){editor} : Container(){editor}
    }
}

internal class RetainedFieldRoot(editor RetainedFieldEditor) : Cell {
    private let content Blob = Cell.Mount[RetainedFieldEditor]("editor", () -> editor)
    internal var Required bool = true
    internal var Error string? = "Invalid value"
    public override func Build() Blob -> FormField{
        Label: "Retained field", Required: Required, Error: Error,
        LabelFor: editor.Handle, Content: content,
    }.Build()
}

internal class RetainedActivationRoot : Cell {
    internal let Handle ElementHandle = ElementHandle()
    internal var Activations int32
    internal var CustomKeys int32
    internal let OtherHandle ElementHandle = ElementHandle()
    internal var OtherActivations int32
    internal let Content Button
    internal let OtherContent Container
    public init() {
        Content = Button{
            Handle: Handle, Width: Percent(100), Height: 40,
            OnClick: () -> Activations++,
            KeyBindings: []KeyBinding{KeyBinding{Key: Key.A, OnPress: () -> CustomKeys++}},
            Text{Content: "Activate"},
        }
        WidgetKeyBindings.BindActivation(Content)
        OtherContent = Container{Handle: OtherHandle, Focusable: true, Width: Percent(100), Height: 32,
            OnClick: () -> OtherActivations++}
        WidgetKeyBindings.BindActivation(OtherContent)
    }
    public override func Build() Blob -> Container(){
        Content,
        OtherContent,
    }
}

internal class RetainedTouchRoot : Cell {
    internal let Handle ElementHandle = ElementHandle()
    internal let Editor TextEntry
    internal let Content Container
    internal let Editing TouchTextEditing = TouchTextEditing()
    internal var Grow bool
    public init() {
        Editor = TextEntry{Handle: Handle, Width: Percent(100), Height: 40, Value: "Alpha beta gamma"}
        Content = Container{Width: Percent(100), Editor}
    }
    public override func Build() Blob -> Container{
        Width: Percent(100), FlexDirection: FlexDirection.Row,
        Cell.Mount[TouchTextEditingInput, TouchTextEditing]("editing", TouchTextEditingInput{
            Content: Content, Editor: Handle,
            RootStyle: Grow ? Style{FlexGrow: 1, FlexBasis: 0, MinWidth: 0} : Style{Width: Percent(50)},
        }, () -> Editing),
        Container{Width: 80, Height: 40},
    }
}

internal class ConfiguredIconRoot : Cell {
    internal let Metadata Accessibility = Accessibility{Expanded: true, Description: "App description"}
    public override func Build() Blob {
        var rejected = false
        try {
            TextField{ConfigureEntry: (input TextField, entry TextEntry) -> { entry.Password = true }}.Build()
        } catch (error InvalidOperationException) {
            Require(error.Message == "TextField owns Password; set TextField.Password instead of changing it in ConfigureEntry",
                "ConfigureEntry did not name the owned field and its input: " + error.Message)
            rejected = true
        }
        Require(rejected, "ConfigureEntry silently discarded a password override")
        rejected = false
        try {
            TextField{ConfigureRoot: (input, label, entry, issue, root) -> root.Children.Clear()}.Build()
        } catch (error InvalidOperationException) {
            Require(error.Message == "TextField owns the editor child of its root; add content around it instead of replacing Children in ConfigureRoot",
                "ConfigureRoot did not name its owned editor child: " + error.Message)
            rejected = true
        }
        Require(rejected, "ConfigureRoot silently removed touch editing")
        rejected = false
        try {
            TextField{ConfigureRoot: (input, label, entry, issue, root) -> entry.Handle = ElementHandle()}.Build()
        } catch (error InvalidOperationException) {
            Require(error.Message == "TextField owns its editor handle during ConfigureRoot; set TextField.Handle instead",
                "ConfigureRoot did not name the editor handle input: " + error.Message)
            rejected = true
        }
        Require(rejected, "ConfigureRoot silently changed the editor handle")
        return Container(){
            Button{Accessibility: Metadata},
            IconButton{
                AccessibilityName: "Configured icon", Icon: Text{Content: "i"},
                ConfigureRoot: (input IconButton, content Blob, button Button) -> {
                    button.Accessibility = Metadata
                },
            }.Build(),
        }
    }
}

func ConfiguredIconSemanticsContract() {
    using let host = ThemePreferenceHost()
    host.Resize(320, 240, 320, 240)
    let root = ConfiguredIconRoot()
    let authoredName = root.Metadata.Name
    let semantics = SearchListSemantics()
    let window = Window{Root: root, AccessibilityAdapter: semantics}
    Theme.Attach(window)
    window.Attach(host)
    try {
        ThemeFrames(host)
        root.Rebuild()
        ThemeFrames(host)
        let icon = FindSemantics(semantics.Tree?.Root, "Configured icon")
        Require(icon?.Role == AccessibilityRole.Button && icon?.Expanded == true && icon?.Description == "App description",
            "IconButton replaced configured accessibility fields")
        Require(root.Metadata.Name == authoredName && root.Metadata.Expanded == true,
            "IconButton edited the configured shared accessibility object")
    } finally { window.RequestClose() }
}

func ReceivedElementContracts() {
    using let host = ThemePreferenceHost()
    host.Resize(320, 480, 320, 480)
    let editor = RetainedFieldEditor()
    let root = RetainedFieldRoot(editor)
    let semantics = SearchListSemantics()
    let window = Window{Root: root, AccessibilityAdapter: semantics}
    Theme.Attach(window)
    window.Attach(host)
    try {
        ThemeFrames(host)
        let first = FindSemantics(semantics.Tree?.Root, "Retained editor")
        Require(first?.Required == true && first?.Invalid == true && first?.Relationships.LabelledBy.Count == 1,
            "FormField did not label the inner retained editor")
        editor.Alternate = true
        editor.Rebuild()
        ThemeFrames(host)
        root.Required = false
        root.Error = nil
        root.Rebuild()
        ThemeFrames(host)
        let second = FindSemantics(semantics.Tree?.Root, "Retained editor")
        Require(second?.Required == false && second?.Invalid == false && second?.Relationships.LabelledBy.Count == 1,
            "FormField lost its target after the inner Cell changed root")
        Require(editor.Semantics.Relationships == nil && editor.Semantics.Required != true && editor.Semantics.Invalid != true,
            "FormField edited the authored accessibility")
    } finally { window.RequestClose() }
    ConfiguredIconSemanticsContract()
    RetainedSettingsContract()
    RetainedHoverContract()
    RetainedActivationContract()
    RetainedTouchLayoutContract()
    ConfiguredTextLayoutContract()
    Console.WriteLine("PASS retained FormField, width-320 SettingsLayout, HoverCard geometry, activation and touch layout")
}

func RetainedSettingsContract() {
    using let host = ThemePreferenceHost()
    host.Resize(320, 240, 320, 240)
    let authored = Accessibility{Role: AccessibilityRole.Checkbox, Name: "Retained setting"}
    let control = Button{Accessibility: authored}
    let root = RetainedContractRoot(Cell.Mount[SettingsLayoutInput, SettingsLayout]("settings", SettingsLayoutInput{
        Sections: []SettingsSection{SettingsSection{Id: "section", Rows: []SettingsRow{
            SettingsRow{Id: "value", Label: "Setting", Control: control},
        }}},
    }))
    let semantics = SearchListSemantics()
    let window = Window{Root: root, AccessibilityAdapter: semantics}
    Theme.Attach(window)
    window.Attach(host)
    try {
        host.RenderFrame(0.016)
        host.RenderFrame(0.016)
        Require(root.Builds == 1 && FindSemantics(semantics.Tree?.Root, "Retained setting")?.Relationships.LabelledBy.Count == 1,
            "SettingsLayout lost its retained control during the width-320 responsive rebuild")
        Require(authored.Relationships == nil, "SettingsLayout edited the supplied control")
    } finally { window.RequestClose() }
}

func RetainedHoverContract() {
    using let host = ThemePreferenceHost()
    host.Resize(320, 240, 320, 240)
    let handle = ElementHandle()
    let popup = ElementHandle()
    let target = Button{Handle: handle, Width: 80, Height: 32}
    let card = HoverCard()
    let root = RetainedContractRoot(Cell.Mount[HoverCardInput, HoverCard]("card", HoverCardInput{
        Target: target, Content: Text{Handle: popup, Content: "Details"}, OpenDelayMs: 0,
    }, () -> card))
    let window = Window{Root: root}
    Theme.Attach(window)
    window.Attach(host)
    host.SetFocused(true)
    try {
        ThemeFrames(host)
        let bounds = handle.BorderBox
        Require(handle.Focus(), "Retained hover target did not focus")
        ThemeFrames(host)
        Require(popup.IsMounted && popup.BorderBox.Y >= bounds.Y + bounds.Height,
            "HoverCard did not anchor its popup below the retained target")
        let popupBounds = popup.BorderBox
        card.Rebuild()
        ThemeFrames(host)
        Require(handle.BorderBox == bounds && popup.BorderBox == popupBounds && target.Handle == handle,
            "HoverCard changed the target handle or popup anchor geometry")
    } finally { window.RequestClose() }
}

func RetainedActivationContract() {
    using let host = ThemePreferenceHost()
    host.Resize(320, 240, 320, 240)
    let root = RetainedActivationRoot()
    let window = Window{Root: root}
    window.Attach(host)
    host.SetFocused(true)
    try {
        ThemeFrames(host)
        root.Rebuild()
        ThemeFrames(host)
        Require(root.Handle.Focus(), "Retained activation content did not focus")
        for key in []Key{Key.Enter, Key.Space, Key.A} {
            window.PlatformInput.KeyPress(key, KeyModifiers{})
            window.PlatformInput.KeyRelease(key)
        }
        ThemeFrames(host)
        Require(root.Activations == 2 && root.CustomKeys == 1 && root.Content.KeyBindings!!.Length == 3,
            "Owned activation lost activation or replaced the authored binding")
        Require(root.OtherHandle.Focus(), "Clickable container did not focus")
        window.PlatformInput.KeyPress(Key.Enter, KeyModifiers{})
        window.PlatformInput.KeyRelease(Key.Enter)
        ThemeFrames(host)
        Require(root.OtherActivations == 1, "Owned activation tried to activate a non-Button handle")
    } finally { window.RequestClose() }
}

func RetainedTouchLayoutContract() {
    using let host = ThemePreferenceHost()
    host.Resize(320, 240, 320, 240)
    let root = RetainedTouchRoot()
    let window = Window{Root: root}
    Theme.Attach(window)
    window.Attach(host)
    try {
        ThemeFrames(host)
        Require(Math.Abs(root.Handle.BorderBox.Width - 160) < 0.5, "Touch RootStyle lost percentage width")
        root.Editing.Rebuild()
        ThemeFrames(host)
        root.Grow = true
        root.Rebuild()
        ThemeFrames(host)
        Require(Math.Abs(root.Handle.BorderBox.Width - 240) < 0.5 && root.Content.Children.Count == 1 && root.Editor.Gestures == nil,
            "Touch RootStyle lost flex growth or edited the retained declaration")
    } finally { window.RequestClose() }
}
internal class ConfiguredTextLayoutRoot : Cell {
    internal let Handle ElementHandle = ElementHandle()
    internal let Editor ElementHandle = ElementHandle()
    internal var Grow bool
    internal var Focuses int32

    public override func Build() Blob {
        let row = Container{Width: 320, FlexDirection: FlexDirection.Row}
        if Grow { row.Children.Add(Container{Width: 80}) }
        row.Children.Add(TextField{
            Width: Length.Auto, Handle: Editor,
            ConfigureRoot: (input, label, editor, issue, root) -> {
                root.Handle = Handle
                root.MinWidth = 0
                if Grow { root.FlexGrow = 1 } else { root.Width = Percent(50) }
                root.OnFocus = (event FocusEvent) -> { Focuses++ }
            },
        }.Build())
        return row
    }
}

func ConfiguredTextLayoutContract() {
    using let host = ThemePreferenceHost()
    host.Resize(320, 240, 320, 240)
    let root = ConfiguredTextLayoutRoot()
    let window = Window{Root: root}
    window.Attach(host)
    host.SetFocused(true)
    try {
        ThemeFrames(host)
        Require(Math.Abs(root.Handle.BorderBox.Width - 160) < 0.5,
            "ConfigureRoot percentage width did not reach the returned element")
        Require(root.Editor.Focus(), "Configured text editor did not focus")
        ThemeFrames(host)
        Require(root.Focuses > 0, "Touch composition dropped the configured root focus handler")
        root.Grow = true
        root.Rebuild()
        ThemeFrames(host)
        Require(Math.Abs(root.Handle.BorderBox.Width - 240) < 0.5,
            "ConfigureRoot flex growth did not reach the returned element")
    } finally { window.RequestClose() }
}

