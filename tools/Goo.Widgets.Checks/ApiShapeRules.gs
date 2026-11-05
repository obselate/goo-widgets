package Goo.Widgets.Checks

import System
import System.Collections.Generic
import System.IO
import System.Linq
import System.Text.Json
import System.Text.RegularExpressions
import System.Xml.Linq
import System.Reflection.Metadata
import System.Reflection.PortableExecutable

class ApiShapeCheck {
    var Types List[ApiDeclaration] = List[ApiDeclaration]()
    var Findings List[ApiFinding] = List[ApiFinding]()
    var Exceptions List[ApiException] = List[ApiException]()
    var Summaries HashSet[string] = HashSet[string](StringComparer.Ordinal)
    var Widgets HashSet[string] = HashSet[string](StringComparer.Ordinal)
    var Descriptors HashSet[string] = HashSet[string](StringComparer.Ordinal)
    var Configuration List[string] = List[string]()

    func Simple(name string) string -> name.Substring(name.LastIndexOf('.') + 1)

    func Add(rule int32, symbol string, current string, expected string) {
        let parameters = symbol.IndexOf('(')
        let sourceSymbol = symbol.Substring(2, if parameters >= 0 { parameters - 2 } else { symbol.Length - 2 })
        let entry = Exceptions.FirstOrDefault(item -> current != "not declared" && item.Rule == rule && item.Symbol == sourceSymbol && item.Signature == current)
        if entry != nil {
            entry.Used = true
            return
        }
        if !Findings.Any(item -> item.Rule == rule && item.Symbol == symbol) {
            Findings.Add(ApiFinding { Rule: rule, Symbol: symbol, Current: current, Expected: expected })
        }
    }

    func Member(type ApiDeclaration, name string) ApiMember? -> type.Members.FirstOrDefault(item -> item.Name == name)

    func Field(type ApiDeclaration, rule int32, name string, expected string, aliases string = "") {
        let names = (name + "|" + aliases).Split('|', StringSplitOptions.RemoveEmptyEntries)
        let members = type.Members.Where(item -> names.Contains(item.Name)).ToArray()
        if members.Length == 0 {
            Add(rule, "F:" + type.Name + "." + name, "not declared", "var " + name + " " + expected)
        }
        for member in members {
            if member.Name != name || member.Type.Text() != expected {
                Add(rule, member.Id, member.Signature, "var " + name + " " + expected)
            }
        }
    }

    func IsVisual(type ApiType) bool -> []string{"Goo.Blob", "Goo.Container", "Goo.Text", "Goo.Button", "Goo.Virtual", "Goo.TextEntry", "Goo.TextEditor", "Goo.Image", "Goo.Canvas"}.Contains(type.Name)

    func Cell(type ApiDeclaration, seen HashSet[string]) ApiType? {
        Require(seen.Add(type.Name), "Cyclic widget inheritance: " + type.Id)
        if type.Base.Name == "Goo.Cell`1" { return type.Base }
        let parent = Types.FirstOrDefault(item -> item.Name == type.Base.Name)
        if parent != nil { return Cell(parent, seen) }
        return nil
    }

    func ReadExceptions(path string) {
        using let document = JsonDocument.Parse(File.ReadAllText(path))
        let root = document.RootElement
        Require(root.ValueKind == JsonValueKind.Object && root.GetProperty("version").GetInt32() == 1, "Invalid API allowlist version.")
        Require(root.EnumerateObject().Count() == 2, "Invalid API allowlist fields.")
        let known = []int32{1,3,4,5,6,9,10,12,13,14,15,16,18,19,20,21,22,23,24,25,27}
        let keys = HashSet[string](StringComparer.Ordinal)
        var previous = ""
        for value in root.GetProperty("entries").EnumerateArray() {
            Require(value.ValueKind == JsonValueKind.Object && value.EnumerateObject().Count() == 4, "Invalid API allowlist entry fields.")
            let rule = value.GetProperty("rule").GetString() ?? ""
            let symbol = value.GetProperty("symbol").GetString() ?? ""
            let signature = value.GetProperty("signature").GetString() ?? ""
            let reason = value.GetProperty("reason").GetString() ?? ""
            Require(Regex.IsMatch(rule, "^S[1-9][0-9]*$") && known.Contains(int32.Parse(rule.Substring(1))), "Unknown API allowlist rule: " + rule)
            Require(Regex.IsMatch(symbol, "^[A-Za-z_][A-Za-z0-9_`]*(\\.[A-Za-z_][A-Za-z0-9_`]*)+$") && !string.IsNullOrWhiteSpace(signature) && !string.IsNullOrWhiteSpace(reason), "Malformed API allowlist entry: " + symbol)
            Require(!Regex.IsMatch(reason.Trim(), "^(legacy|temporary|ignore)\\.?$", RegexOptions.IgnoreCase), "API allowlist reason must state a domain need: " + symbol)
            let number = int32.Parse(rule.Substring(1))
            let key = number.ToString("D2") + "|" + symbol + "|" + signature
            Require(keys.Add(key), "Duplicate API allowlist entry: " + symbol)
            Require(StringComparer.Ordinal.Compare(previous, key) < 0, "API allowlist entries are not sorted: " + symbol)
            previous = key
            Exceptions.Add(ApiException { Rule: number, Symbol: symbol, Signature: signature })
        }
    }

    func Inventory() {
        let reviewed = HashSet[string](StringComparer.Ordinal)
        for group in []string{
            "Goo.Widgets|Kbd ShortcutList ThemeScope Typography",
            "Goo.Widgets.Actions|ActionButton IconButton ToggleButton",
            "Goo.Widgets.Charts|DonutChart StackedBar",
            "Goo.Widgets.Colors|ColorPicker",
            "Goo.Widgets.Content|CodeBlock",
            "Goo.Widgets.Data|AttachmentChip Chip DataGrid ListView TimeAxis TreeView",
            "Goo.Widgets.Feedback|Alert Badge Banner DismissibleContextBar EmptyState InlineMessage ProgressBar ProgressSummary Spinner StatusIndicator TeachingTip Toast ToastHost",
            "Goo.Widgets.Graphs|GraphCanvas GraphNodeCard",
            "Goo.Widgets.Inputs|Calendar Checkbox ComboBox DatePicker FindBar FormField FormSection NumberInput RadioButton RadioGroup SearchList Slider Stepper TextArea TextField TimePicker ToggleGroup ToggleSwitch TokenInput TouchTextEditing TriggerMenu UploadTile",
            "Goo.Widgets.Layout|AppBar Card Disclosure Drawer Grid HoverCard ListRow MasterDetail ModalDialog ModalDialogHost Popover PropertyGrid SectionHeader SettingsLayout SplitPane StatusBar Tooltip WindowChrome",
            "Goo.Widgets.Media|AsyncImage Avatar AvatarGroup MediaCard MediaTransport",
            "Goo.Widgets.Navigation|Breadcrumb CommandPalette Menu MenuButton NavigationRail PathBar SplitButton TabBar"
        } {
            let parts = group.Split('|')
            for name in parts[1].Split(' ') { reviewed.Add(parts[0] + "." + name) }
        }
        for type in Types {
            if type.Program { continue }
            let cell = Cell(type, HashSet[string](StringComparer.Ordinal))
            let build = type.Members.FirstOrDefault(item -> item.Name == "Build" && item.Parameters.Count == 0 && item.Arity == 0 && !item.Static && IsVisual(item.Type))
            if cell == nil && build == nil && !reviewed.Contains(type.Name) { continue }
            Widgets.Add(type.Name)
            if !reviewed.Contains(type.Name) { Configuration.Add("Unregistered widget role: " + type.Id) }
            if cell != nil {
                Require(cell.Arguments.Count == 1, "Unresolved widget input: " + type.Id)
                let input = Types.FirstOrDefault(item -> item.Name == cell.Arguments[0].Name)
                Require(input != nil, "Missing public widget input: " + type.Id)
                Descriptors.Add(input.Name)
                if type.Kind != "class" || !type.Open || Simple(input.Name) != Simple(type.Name) + "Input" || !input.Data || type.Base.Name != "Goo.Cell`1" {
                    Add(1, type.Id, TypeSignature(type), "public open class " + Simple(type.Name) + " : Cell[" + Simple(type.Name) + "Input] with a public data struct input")
                }
            } else {
                Descriptors.Add(type.Name)
                if !type.Data || build == nil { Add(1, type.Id, TypeSignature(type), "public data struct with public Build() Blob") }
            }
        }
        for type in Types {
            for method in type.Members.Where(item -> item.Kind == "func" && item.Arity > 0 && IsVisual(item.Type)) {
                Add(3, method.Id, method.Signature, "an exact registered generic visual factory")
            }
        }
    }

    func TypeSignature(type ApiDeclaration) string {
        let parents = List[string]()
        if type.Kind == "class" && type.Base.Name != "" && type.Base.Name != "System.Object" { parents.Add(type.Base.Text()) }
        if !type.Data {
            parents.AddRange(type.Interfaces.Select(name -> Regex.Replace(name, "([A-Za-z_][A-Za-z0-9_]*\\.)+", "")))
        }
        let modifier = if type.Data { "data " } else if type.Kind == "class" && type.Open { "open " } else { "" }
        return "public " + modifier + type.Kind + " " + Simple(type.Name) + (if parents.Count > 0 { " : " + String.Join(",", parents) } else { "" })
    }

    func Primary(type ApiDeclaration, name string) {
        let rows = []string{
            "Calendar|DateOnly?|DateOnly", "Checkbox|AccessibilityChecked|AccessibilityChecked", "ColorPicker|int32|int32",
            "DatePicker|DateOnly?|DateOnly?", "TimePicker|TimeOnly?|TimeOnly?", "NumberInput|float64|float64", "RadioButton|bool|bool", "Slider|float64|float64", "SplitPane|float64|float64",
            "TextArea|string?|string", "TextField|string?|string", "ToggleButton|bool|bool", "ToggleSwitch|bool|bool", "TokenInput|string[]?|string[]"
        }
        for row in rows {
            let parts = row.Split('|')
            if name != parts[0] { continue }
            Field(type, 4, "Value", parts[1], "State|Checked|Tokens")
            Field(type, 4, "OnChange", "Action[" + parts[2] + "]?", "OnValueChanged|OnTokensChange|" + (if name == "ToggleSwitch" { "OnClick" } else { "" }))
            if Member(type, "OnCommit") != nil || Member(type, "OnValueCommitted") != nil {
                Field(type, 5, "OnCommit", "Action[" + parts[2] + "]?", "OnValueCommitted")
            }
        }
    }

    func Roles(type ApiDeclaration) {
        let name = Simple(type.Name)
        let role = if name.EndsWith("Input") { name.Substring(0, name.Length - 5) } else { name }
        Primary(type, role)
        for row in []string{"ColorPicker|Mode|ColorMode", "GraphCanvas|Viewport|GraphViewport", "GraphCanvas|NodePosition|GraphNodePositionChange", "MediaTransport|Position|float64", "MediaTransport|Volume|float64", "TimeAxis|Viewport|TimeAxisViewport"} {
            let parts = row.Split('|')
            if role != parts[0] { continue }
            let concept = parts[1]
            let old = if concept == "Position" { "Seek" } else { concept }
            Field(type, 6, "On" + concept + "Change", "Action[" + parts[2] + "]?", "On" + old + "Changed")
            if Member(type, "On" + concept + "Commit") != nil || Member(type, "On" + old + "Committed") != nil {
                Field(type, 6, "On" + concept + "Commit", "Action[" + parts[2] + "]?", "On" + old + "Committed")
            }
        }
        if []string{"ComboBox", "RadioGroup", "TabBar", "NavigationRail", "SearchList", "TreeView", "SettingsLayout", "TimeAxis"}.Contains(role) {
            Field(type, 10, "SelectedId", "string?")
            Field(type, 10, "OnSelect", "Action[string]?")
        }
        if role == "Breadcrumb" { Field(type, 10, "OnSelect", "Action[string]?") }
        if []string{"ComboBox", "DataGrid", "ListView", "TreeView", "ToggleGroup", "GraphCanvas"}.Contains(role) {
            let selected = Member(type, "SelectedIds") ?? Member(type, "SelectedNodeIds")
            if selected == nil || !(selected.Type.Text() == "string[]?" || selected.Type.Text() == "string[]") || selected.Name != "SelectedIds" {
                Add(10, if selected != nil { selected.Id } else { "F:" + type.Name + ".SelectedIds" }, if selected != nil { selected.Signature } else { "not declared" }, "var SelectedIds string[]?")
            }
            Field(type, 10, "OnSelectionChange", "Action[string[]]?", "OnSelectedIdsChange|OnSelectionChanged|" + (if role == "ToggleGroup" { "OnChange" } else { "" }))
        }
        if []string{"ComboBox", "DatePicker", "MenuButton", "Menu", "CommandPalette", "ModalDialog", "Popover", "TeachingTip", "Toast"}.Contains(role) {
            let state = Member(type, "Open")
            if state == nil || !(state.Type.Text() == "bool" || state.Type.Text() == "bool?") {
                Add(12, "F:" + type.Name + ".Open", if state == nil { "not declared" } else { state.Signature }, "var Open bool or bool?")
            }
            Field(type, 12, "OnOpenChange", "Action[bool]?", if []string{"Menu", "CommandPalette"}.Contains(role) { "OnDismiss" } else if role == "ModalDialog" { "OnClose" } else { "" })
        }
        if []string{"Disclosure", "CodeBlock"}.Contains(role) {
            Field(type, 13, "Expanded", "bool")
            Field(type, 13, "OnExpandedChange", "Action[bool]?")
        }
        if []string{"TreeView", "DataGrid"}.Contains(role) {
            Field(type, 13, "ExpandedIds", "string[]?")
            Field(type, 13, "OnExpandedChange", "Action[string,bool]?")
        }
        if role == "PropertyGrid" || role == "NavigationRail" {
            let part = if role == "PropertyGrid" { "Section" } else { "Group" }
            Field(type, 13, "Expanded" + part + "Ids", "string[]?", "Collapsed" + part + "s")
            Field(type, 13, "On" + part + "ExpandedChange", "Action[string,bool]?", "On" + part + "Toggle")
        }
        let queryEditors = []string{"ComboBox", "CommandPalette", "FindBar", "PropertyGrid", "SearchList", "SettingsLayout", "ShortcutList"}
        if Member(type, "Query") != nil || queryEditors.Contains(role) || role == "ListView" { Field(type, 14, "Query", "string?") }
        if queryEditors.Contains(role) {
            Field(type, 14, "OnQueryChange", "Action[string]?")
        }
        if []string{"FormField", "TextField", "TextArea", "NumberInput"}.Contains(role) {
            Field(type, 15, "Label", "string?")
            Field(type, 15, "Description", "string?")
            Field(type, 15, "Error", "string?", "Issue|IssueText")
        }
        if role == "FindBar" { Field(type, 15, "Error", "string?", "Issue") }
        if role == "TextField" && Member(type, "IssueFontSize") != nil {
            let member = Member(type, "IssueFontSize")!!
            Add(15, member.Id, member.Signature, "var ErrorFontSize float64?")
        }
        let fields = []string{"TextField", "TextArea", "DatePicker", "TimePicker", "NumberInput", "TokenInput", "Calendar", "Checkbox", "ColorPicker", "ComboBox", "RadioButton", "RadioGroup", "SearchList", "Slider", "ToggleButton", "ToggleGroup", "ToggleSwitch"}
        if fields.Contains(role) {
            Field(type, 16, "Disabled", "bool")
            Field(type, 16, "AccessibilityName", "string?")
            for property in []string{"Label", "Description", "Error"} {
                if Member(type, property) != nil { Field(type, 15, property, "string?") }
            }
        }
        if []string{"TextField", "TextArea", "DatePicker", "TimePicker", "NumberInput", "TokenInput"}.Contains(role) { Field(type, 16, "ReadOnly", "bool") }
        if role == "FormField" { Field(type, 16, "Required", "bool") }
        if role != "FormField" && Member(type, "Required") != nil {
            let member = Member(type, "Required")!!
            Add(16, member.Id, member.Signature, "compose FormField for Required metadata")
        }
    }

    func Members(type ApiDeclaration) {
        let descriptor = Descriptors.Contains(type.Name)
        for member in type.Members {
            if !Summaries.Contains(member.Id) { Add(27, member.Id, member.Signature, "a nonempty XML summary") }
            if member.Kind != "var" && member.Kind != "property" { continue }
            let name = member.Name
            let value = member.Type.Text()
            if name.StartsWith("On") && (name.EndsWith("Changed") || name.EndsWith("Committed")) && ![]string{"OnValueChanged", "OnValueCommitted", "OnSelectionChanged"}.Contains(name) {
                var expected = name.Replace("Committed", "Commit").Replace("Changed", "Change")
                if expected.StartsWith("OnSeek") { expected = expected.Replace("OnSeek", "OnPosition") }
                Add(6, member.Id, member.Signature, "var " + expected + " " + value)
            }
            if descriptor && name.StartsWith("On") && (name.EndsWith("Change") || name.EndsWith("Commit")) {
                let concept = name.Substring(2, name.Length - 8)
                let state = Member(type, concept) ?? Member(type, concept + "Id")
                if state != nil && concept != "Value" && concept != "Selection" {
                    let emitted = state.Type.Text().TrimEnd('?')
                    if value != "Action[" + emitted + "]?" { Add(6, member.Id, member.Signature, "var " + name + " Action[" + emitted + "]?") }
                }
            }
            if name == "OnInvoke" || name == "OnRowInvoke" || (name.StartsWith("On") && name.EndsWith("Activate")) || (Simple(type.Name) == "AttachmentChip" && name == "OnOpen") {
                Add(9, member.Id, member.Signature, "var " + (if name == "OnMenuActivate" { "OnMenuClick" } else { "OnClick" }) + " " + value)
            }
            if name.StartsWith("On") && name.EndsWith("Click") {
                if !value.StartsWith("Action") || member.Type.Arguments.Count > 1 || !member.Type.Optional || (member.Type.Arguments.Count == 1 && member.Type.Arguments[0].Text() != (if Simple(type.Name) == "AvatarGroup" { "int32" } else { "string" })) {
                    if Simple(type.Name) != "ToggleSwitch" { Add(9, member.Id, member.Signature, "a nullable Action with zero or one identity argument") }
                }
            }
            if Simple(type.Name) == "PropertyGridItem" && name == "Issue" { Add(15, member.Id, member.Signature, "var Error string?") }
            if []string{"Disabled", "ReadOnly", "Required"}.Contains(name) && value != "bool" { Add(16, member.Id, member.Signature, "var " + name + " bool") }
            if name == "AccessibilityName" && value != "string?" { Add(16, member.Id, member.Signature, "var AccessibilityName string?") }
            if descriptor && member.Type.Name == "Goo.Style" && (!member.Type.Optional || !name.EndsWith("Style") || name == "Style") { Add(18, member.Id, member.Signature, "a nullable RootStyle or named part Style") }
            if name.StartsWith("Create") || name.StartsWith("Customize") {
                let owner = member.Type.Arguments.FirstOrDefault()
                if name.StartsWith("Customize") || !value.StartsWith("Func[") || !member.Type.Optional || owner == nil || owner.Name != type.Name {
                    Add(19, member.Id, member.Signature, if name == "CreateText" && member.Type.Arguments.Count > 0 && member.Type.Arguments.Last().Name == "System.String" { "var FormatCreateText " + value } else { "nullable Create<Part> Func with the owner first, context next, and prepared part last" })
                }
                for slot in []string{"DonutChart.CreateLabel|Text", "StackedBar.CreateLabel|Text", "GraphCanvasInput.CreateNode|Container", "GraphCanvasInput.CreateEdge|Container", "SearchList.CreateEntry|TextEntry", "SearchList.CreateRow|Button", "SearchList.CreateRoot|Container", "CodeBlockInput.CreateEditor|TextEditor", "MenuButtonInput.CreateMenu|MenuInput", "PropertyGrid.CreateRow|Blob", "ToastHostInput.CreateToast|Container"} {
                    let parts = slot.Split('|')
                    if Simple(type.Name) + "." + name == parts[0] && (member.Type.Arguments.Count < 3 || Simple(member.Type.Arguments[member.Type.Arguments.Count - 2].Name) != parts[1]) {
                        Add(19, member.Id, member.Signature, "the prepared " + parts[1] + " immediately before the return type")
                    }
                }
            }
            if descriptor {
                let root = []string{"Width", "Height", "MinWidth", "MinHeight", "MaxWidth", "MaxHeight"}.Contains(name)
                let token = Regex.IsMatch(name, "(Color|FontSize|FontWeight|FontFamily|Gap|Padding|PaddingHorizontal|PaddingVertical|BorderWidth|BorderRadius|Opacity|TransitionMs|TransitionEasing|Transform|BoxShadow)$")
                let metric = !root && name != "Size" && Regex.IsMatch(name, "(Width|Height|Size|Thickness|Spacing)$") && []string{"System.Double", "System.Single", "System.Int32", "System.Int64"}.Contains(member.Type.Name)
                let fixedCoordinate = []string{"GraphCanvasInput", "GraphNodeCard"}.Contains(Simple(type.Name)) && (name == "Width" || name == "Height")
                if ((token || fixedCoordinate) && !member.Type.Optional) || (metric && value != "float64?") { Add(20, member.Id, member.Signature, "var " + name + " " + (if metric { "float64?" } else { value + "?" })) }
                if root && value != "Length?" { Add(21, member.Id, member.Signature, "var " + name + " Length?") }
                if name == "Size" && value != "float64?" { Add(21, member.Id, member.Signature, "var Size float64?") }
                if name == "MinimumHeight" || name == "MinimumWidth" || name.EndsWith("Px") { Add(22, member.Id, member.Signature, "use MinWidth, MinHeight, or an unsuffixed logical-pixel part metric") }
                if name == "Look" || member.Type.Name.EndsWith("DataGridDensity") || member.Type.Name.EndsWith("Look") { Add(23, member.Id, member.Signature, "use Variant with a Variant enum, or the shared Density") }
                if name == "Variant" && ![]string{Simple(type.Name).Replace("Input", "") + "Variant", "MessageVariant", "TextVariant", "StatusVariant"}.Contains(Simple(member.Type.Name)) {
                    Add(23, member.Id, member.Signature, "a widget Variant enum or a registered shared semantic variant")
                }
                if name == "Density" && Simple(member.Type.Name) != "Density" { Add(23, member.Id, member.Signature, "var Density Density") }
            }
            if (name.StartsWith("On") && member.Type.Name != "Goo.Color") || name == "LoadChildren" {
                if name == "LoadChildren" || !(value.StartsWith("Action") || value.StartsWith("Func[")) || !member.Type.Optional || value.Contains("Task") || value.Contains("ValueTask") { Add(24, member.Id, member.Signature, "a nullable synchronous Action or Func named On<Operation>") }
                if member.Type.Arguments.Any(argument -> argument.Name == type.Name || argument.Name + "Input" == type.Name || argument.Name == "System.Object") { Add(25, member.Id, member.Signature, "event arguments without sender or owning descriptor") }
            }
        }
        if !type.Program && !Summaries.Contains(type.Id) { Add(27, type.Id, TypeSignature(type), "a nonempty XML summary") }
        if type.Name.EndsWith("DataGridDensity") || type.Name.EndsWith("Look") {
            Add(23, type.Id, TypeSignature(type), "the shared Density or a Variant enum")
            if type.Name.EndsWith("DataGridDensity") {
                for member in type.Members { Add(23, member.Id, member.Signature, "use the corresponding shared Density value") }
            }
        }
        if type.Name == "Goo.Widgets.Density" {
            for name in []string{"Standard", "Compact", "Comfortable", "Touch"} {
                if Member(type, name) == nil { Add(23, "F:" + type.Name + "." + name, "not declared", "a shared Density value") }
            }
        }
    }

    public func Run(assembly string, xml string, allowlist string) bool {
        ReadExceptions(allowlist)
        using let stream = File.OpenRead(assembly)
        using let pe = PEReader(stream)
        let metadata = ApiMetadata(pe.GetMetadataReader())
        using let debug = pe.ReadEmbeddedPortablePdbDebugDirectoryData(pe.ReadDebugDirectory().Single(entry -> entry.Type == DebugDirectoryEntryType.EmbeddedPortablePdb))
        metadata.DebugReader = debug.GetMetadataReader()
        metadata.Read()
        Types = metadata.Types
        let document = XDocument.Load(xml)
        for member in document.Descendants("member") {
            let summary = member.Element("summary")
            if summary != nil && !string.IsNullOrWhiteSpace(summary.Value) { Summaries.Add(member.Attribute("name")!!.Value) }
        }
        Inventory()
        for type in Types {
            if Descriptors.Contains(type.Name) { Roles(type) }
            Members(type)
        }
        for entry in Exceptions.Where(item -> !item.Used) {
            Configuration.Add("Unused or stale allowlist entry: S" + entry.Rule.ToString() + " " + entry.Symbol + " | " + entry.Signature)
        }
        for finding in Findings.OrderBy(item -> item.Symbol, StringComparer.Ordinal).ThenBy(item -> item.Rule) {
            Console.WriteLine(finding.Symbol + " | S" + finding.Rule.ToString() + " | " + finding.Current + " | expected: " + finding.Expected)
        }
        for error in Configuration.OrderBy(item -> item, StringComparer.Ordinal) { Console.WriteLine("CONFIG | " + error) }
        Console.WriteLine("S27 constructors not checked: G# emits no CompilerGeneratedAttribute, https://github.com/DavidObando/gsharp/issues/5761")
        let count = Types.Count(item -> !item.Program)
        Console.WriteLine("Inventory: " + count.ToString() + " public types, " + Widgets.Count.ToString() + " widgets, " + (count - Widgets.Count).ToString() + " support types, " + Types.Where(item -> item.Program).Sum(item -> item.Members.Count).ToString() + " free functions.")
        for rule in []int32{1,3,4,5,6,9,10,12,13,14,15,16,18,19,20,21,22,23,24,25,27} {
            Console.WriteLine("S" + rule.ToString() + ": " + Findings.Count(item -> item.Rule == rule).ToString())
        }
        Console.WriteLine("Exceptions: " + Exceptions.Count(item -> item.Used).ToString() + "/" + Exceptions.Count.ToString() + " used. Findings: " + Findings.Count.ToString() + ". Configuration errors: " + Configuration.Count.ToString() + ".")
        return Findings.Count == 0 && Configuration.Count == 0
    }
}

func ApiShape(args[]string) {
    Require(args.Length == 1 && args[0] == "--check", "Usage: api-shape --check")
    let root = Root()
    let directory = Path.Combine(root, "src/Goo.Widgets/bin/Release/net10.0")
    Require(ApiShapeCheck().Run(Path.Combine(directory, "Goo.Widgets.dll"), Path.Combine(directory, "Goo.Widgets.xml"), Path.Combine(root, "docs/api-shape-allowlist.json")), "API shape conformance failed.")
}
