package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Data
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class DataGridProbe : DataGrid {
    internal func Render(input DataGridInput) Blob -> base.Build(input)
}

func DataGridContracts() {
    using let probe = DataGridProbe()
    var rejected bool
    try {
        probe.Render(DataGridInput{Columns: []DataGridColumn{DataGridColumn{Id: "a"}, DataGridColumn{Id: "a"}}})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Grid accepted duplicate column IDs")
    rejected = false
    try {
        probe.Render(DataGridInput{Rows: []DataGridRow{DataGridRow{Id: "a"}, DataGridRow{Id: "a"}}})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Grid accepted duplicate row IDs")
    rejected = false
    try {
        probe.Render(DataGridInput{Columns: []DataGridColumn{DataGridColumn{Id: "a", Width: Double.NaN}}})
    } catch (error ArgumentOutOfRangeException) {
        rejected = true
    }
    Require(rejected, "Grid accepted non-finite column width")
    let root = (
        probe.Render(
            DataGridInput{
                Columns: []DataGridColumn{
                    DataGridColumn{Id: "a", Width: 5, Minimum: 70},
                    DataGridColumn{Id: "b", Width: 900, Maximum: 150}
                },
                Selection: DataGridSelection.Multiple
            }
        ) as Container
    )!!
    Require(
        root.Accessibility!!.Role == AccessibilityRole.Grid && root.Accessibility!!.MultiSelectable == true,
        "Grid failed controlled grid semantics"
    )
}

internal class DataGridHost : Cell {
    internal var Root Container?
    internal let RowBlobs Dictionary[string, Container] = Dictionary[string, Container]()
    internal let Headers Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    internal let Cells Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle]()
    internal let Checks Dictionary[string, Button] = Dictionary[string, Button]()
    internal var Widths Dictionary[string, float64] = Dictionary[string, float64]()
    internal var Selected[]string = []string{"alpha"}
    internal var Expanded[]string = []string{}
    internal var SortId string = ""
    internal var SortDirection DataGridSort
    internal var SortCalls int32
    internal var Commits int32
    internal var DetailBuilds int32
    internal var Large bool
    internal var Single bool
    internal var Disabled bool
    internal var SwapColumns bool
    internal let FilterHandle ElementHandle = ElementHandle()

    private func CaptureRoot(input DataGridInput, prepared Container) Container {
        Root = prepared
        return prepared
    }

    private func CaptureRow(input DataGridInput, row DataGridRow, prepared Container) Container {
        RowBlobs[row.Id!!] = prepared
        return prepared
    }

    private func CaptureHeader(input DataGridInput, column DataGridColumn, content Blob) Blob {
        if !Headers.ContainsKey(column.Id!!) {
            Headers.Add(column.Id!!, ElementHandle())
        }
        return Container(){.Handle: Headers[column.Id!!], .Width: Length.Percent(100), .MinWidth: 0, content}
    }

    private func CaptureCell(input DataGridInput, row DataGridRow, column DataGridColumn, content Blob) Blob {
        let key = row.Id!!+ ":" + column.Id!!
        if !Cells.ContainsKey(key) {
            Cells.Add(key, ElementHandle())
        }
        return Container(){.Handle: Cells[key], .Width: Length.Percent(100), .MinWidth: 0, content}
    }

    private func CaptureCheck(input DataGridInput, row DataGridRow, prepared Button) Button {
        prepared.Handle = ElementHandle()
        Checks[row.Id!!] = prepared
        return prepared
    }

    private func Detail(input DataGridInput, row DataGridRow) Blob {
        DetailBuilds++
        return Text{
            Content: "Expanded host details use measured text. A longer note wraps at the shared table width and moves the next row without a fixed detail-height estimate.",
            Color: "#a5b4fc",
            FontSize: 16
        }
    }

    private func Width(id string, value float64) {
        Widths = Dictionary[string, float64](Widths)
        Widths[id] = value
        Rebuild()
    }

    private func Commit(id string, value float64) {
        Commits++
    }

    private func Sort(id string, direction DataGridSort) {
        SortCalls++
        SortId = id
        SortDirection = direction
        Rebuild()
    }

    private func Selection(ids[]string) {
        Selected = ids
        Rebuild()
    }

    private func Expand(id string, state bool) {
        Expanded = state ? []string{id}: []string{}
        Rebuild()
    }

    internal func Rows()[]DataGridRow {
        let count = Large ? 1500: 5
        let output = [count]DataGridRow
        let names = []string{"alpha", "beta", "locked", "delta", "echo"}
        for index in 0 ... count {
            let id = Large ? "host-" + index.ToString(): names[index]
            let values = Dictionary[string, string]()
            values.Add("name", id)
            values.Add("state", index % 2 == 0 ? "Healthy": "Review")
            values.Add("owner", "Platform team")
            output[index] = DataGridRow{
                Id: id,
                Label: "Host " + id,
                Disabled: !Large && id == "locked",
                HasDetail: !Large && id == "alpha",
                Values: values
            }
        }
        if SortDirection == DataGridSort.Descending {
            Array.Reverse(output)
        }
        return output
    }

    public override func Build() Blob {
        let name = DataGridColumn{
            Id: "name",
            Label: "Name",
            Width: 170,
            Minimum: 100,
            Maximum: 300,
            Sortable: true,
            Filter: TextEntry{
                Handle: FilterHandle,
                Value: "",
                Placeholder: "Host filter",
                Width: Length.Percent(100),
                Height: 30,
                Padding: 5,
                Color: "#fafafa",
                BackgroundColor: "#09090b"
            }
        }
        let state = DataGridColumn{Id: "state", Label: "State", Flex: 1, Minimum: 110, Maximum: 220, Sortable: true}
        let owner = DataGridColumn{Id: "owner", Label: "Owner", Flex: 2, Minimum: 140, Maximum: 500}
        return Container(){
            .Width: Length.Percent(100),
            .Height: Length.Percent(100),
            .Padding: 20,
            .Gap: 14,
            .BackgroundColor: "#111318",
            Text{Key: "title", Content: "DataGrid · controlled inventory", FontSize: 24, Color: "#fafafa"},
            Text{
                Key: "hint",
                Content: "Sort headers, drag column edges, and select rows. Details are measured.",
                Color: "#a1a1aa"
            },
            Cell.Mount[DataGridInput, DataGrid](
                "grid",
                DataGridInput{
                    Columns: SwapColumns ? []DataGridColumn{owner, state, name}: []DataGridColumn{name, state, owner},
                    Rows: Rows(),
                    Height: 300,
                    Disabled: Disabled,
                    ColumnWidths: Widths,
                    OnColumnWidthChange: Width,
                    OnColumnWidthCommit: Commit,
                    SortColumnId: SortId,
                    SortDirection: SortDirection,
                    OnSort: Sort,
                    Selection: Single ? DataGridSelection.Single: DataGridSelection.Multiple,
                    SelectedIds: Selected,
                    OnSelectionChange: Selection,
                    ShowSelection: true,
                    ExpandedIds: Expanded,
                    OnExpandedChange: Expand,
                    CreateRoot: CaptureRoot,
                    CreateRow: CaptureRow,
                    CreateHeader: CaptureHeader,
                    CreateCell: CaptureCell,
                    CreateSelection: CaptureCheck,
                    CreateDetail: Detail,
                    AccessibilityName: "Inventory grid"
                }
            )
        }
    }
}

func GridElement(root Blob, name string) Blob? {
    if root.Accessibility?.Name == name {
        return root
    }
    if root is Container {
        for child in root.Children {
            let found = GridElement(child, name)
            if found != nil {
                return found
            }
        }
    }
    return nil
}

func GridAligned(host DataGridHost, id string) {
    let header = host.Headers[id].BorderBox
    let cell = host.Cells["alpha:" + id].BorderBox
    Require(
        Math.Abs(header.X - cell.X) < .1 && Math.Abs(header.Width - cell.Width) < .1,
        "Grid header/body columns diverged: " + id
    )
}

func GridModifiedClick(window Window, handle ElementHandle, modifiers SDLKeymod) {
    SDL.SetModState(uint16(modifiers))
    CompositeClick(window, handle)
    SDL.SetModState(uint16(0))
}

func DataGridInteractions() {
    DataGridContracts()
    let host = DataGridHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "DataGrid verification",
        Width: 720,
        Height: 450,
        Root: host,
        AccessibilityAdapter: semantics
    }
    window.Open()
    try {
        PumpFrames(window, 20)
        let id = OnlyNativeWindow()
        GridAligned(host, "name")
        GridAligned(host, "state")
        Require(host.DetailBuilds == 0, "Collapsed detail factory ran eagerly")
        CompositeClick(window, host.Headers["name"])
        PumpFrames(window, 8)
        Require(
            host.SortDirection == DataGridSort.Ascending && host.SortCalls == 1,
            "Controlled grid sort request failed"
        )
        CompositeClick(window, host.Headers["name"])
        PumpFrames(window, 10)
        Require(
            host.SortDirection == DataGridSort.Descending &&
                host
                .RowBlobs["echo"]
                .Handle!!
                .BorderBox
                .Y < host
                .RowBlobs["alpha"]
                .Handle!!
                .BorderBox
                .Y,
            "Host sort did not reorder stable virtual rows"
        )
        CompositeClick(window, host.Headers["name"])
        PumpFrames(window, 8)
        Require(host.SortDirection == DataGridSort.None, "Grid sort did not cycle to None")
        CompositeClick(window, host.Cells["beta:name"])
        Require(host.Selected.Length == 1 && host.Selected[0] == "beta", "Grid pointer single replacement failed")
        GridModifiedClick(window, host.Cells["echo:name"], SDLKeymod.Ctrl)
        Require(host.Selected.Length == 2, "Grid Ctrl toggle failed")
        GridModifiedClick(window, host.Cells["beta:name"], SDLKeymod.Shift)
        Require(
            host.Selected.Length == 3 && Array.IndexOf(host.Selected, "locked") < 0,
            "Grid Shift range failed to skip disabled rows"
        )
        CompositeClick(window, host.Cells["locked:name"])
        Require(host.Selected.Length == 3, "Disabled grid row changed selection")
        CompositeClick(window, host.Checks["alpha"].Handle!!)
        Require(host.Selected.Length == 4, "Leading selection control lost controlled toggle")
        let alpha = FindSemantics(semantics.Tree!!.Root, "Host alpha")!!
        Require(
            window.PerformAccessibilityAction(alpha.Id, AccessibilityActionRequest(AccessibilityAction.Expand)),
            "Grid detail accessibility expansion failed"
        )
        PumpFrames(window, 15)
        Require(
            host.DetailBuilds > 0 &&
                host
                .RowBlobs["alpha"]
                .Handle!!
                .BorderBox
                .Height > 60.0 &&
                host
                .RowBlobs["beta"]
                .Handle!!
                .BorderBox
                .Y >= (host.RowBlobs["alpha"].Handle!!.BorderBox.Y + host.RowBlobs["alpha"].Handle!!.BorderBox.Height),
            "Measured expanded detail overlapped the next row"
        )
        CaptureIssueProof(window, "datagrid-expanded")
        let resize = GridElement(host.Root!!, "Resize Name")!!.Handle!!
        let box = resize.BorderBox
        let x = float32(box.X + box.Width / 2.0)
        let y = float32(box.Y + 15.0)
        MouseMove(id, x, y)
        MouseButton(id, x, y, true)
        MouseMove(id, x + 80.0F, y + 70.0F)
        PumpFrames(window, 8)
        MouseButton(id, x + 80.0F, y + 70.0F, false)
        PumpFrames(window, 10)
        Require(
            Math.Abs(host.Widths["name"] - 250.0) < .1 && host.Commits == 1 && host.SortCalls == 3,
            "Captured grid drag failed or accidentally sorted"
        )
        GridAligned(host, "name")
        GridAligned(host, "state")
        let cancelBox = GridElement(host.Root!!, "Resize Name")!!.Handle!!.BorderBox
        let cx = float32(cancelBox.X + 3.0)
        MouseMove(id, cx, y)
        MouseButton(id, cx, y, true)
        MouseMove(id, cx - 400.0F, y)
        PumpFrames(window, 8)
        var lost = SDLEvent{Window: SDLWindowEvent{Type: SDLEventType.WindowFocusLost, WindowID: id}}
        SDL.PushEvent(ref lost)
        PumpFrames(window, 6)
        let cancelledWidth = host.Widths["name"]
        MouseMove(id, 5, 5)
        MouseButton(id, 5, 5, false)
        PumpFrames(window, 8)
        Require(
            cancelledWidth == 100.0 && host.Widths["name"] == cancelledWidth && host.Commits == 1,
            "Grid cancel failed to stop drag or minimum clamp"
        )
        GridElement(host.Root!!, "Resize Name")!!.Handle!!.Focus()
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 8)
        Require(host.Widths["name"] == 108.0 && host.Commits == 2, "Grid keyboard column resize failed")
        host.Single = true
        host.Selected = []string{"alpha"}
        host.Rebuild()
        PumpFrames(window, 8)
        host.Root!!.Handle!!.Focus()
        SendKey(id, SDLScancode.Home)
        SendKey(id, SDLScancode.Down)
        SendKey(id, SDLScancode.Down)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 10)
        Require(
            host.Selected.Length == 1 && host.Selected[0] == "delta",
            "Grid keyboard selection did not skip disabled rows"
        )
        host.FilterHandle.Focus()
        SendKey(id, SDLScancode.Home)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 6)
        Require(host.Selected[0] == "delta", "Grid stole keyboard input from a filter")
        host.Widths["name"] = 300.0
        host.Widths["owner"] = 450.0
        host.Rebuild()
        PumpFrames(window, 10)
        let ownerResize = GridElement(host.Root!!, "Resize Owner")!!.Handle!!
        ownerResize.Focus()
        ownerResize.ScrollIntoView()
        PumpFrames(window, 12)
        Require(
            host.Headers["owner"].BorderBox.X < 650.0,
            "Shared horizontal viewport failed to reveal the last column"
        )
        GridAligned(host, "name")
        GridAligned(host, "owner")
        CaptureIssueProof(window, "datagrid-horizontal")
        host.SwapColumns = true
        host.Rebuild()
        PumpFrames(window, 10)
        GridAligned(host, "name")
        GridAligned(host, "owner")
        host.Large = true
        host.Expanded = []string{}
        host.Rebuild()
        PumpFrames(window, 15)
        host.Root!!.Handle!!.Focus()
        SendKey(id, SDLScancode.End)
        PumpFrames(window, 20)
        let grid = FindSemantics(semantics.Tree!!.Root, "Inventory grid")!!
        let last = FindSemantics(semantics.Tree!!.Root, "Host host-1499")!!
        Require(
            grid.Focused && grid.Relationships.ActiveDescendant == last.Id,
            "Grid End failed to reveal a virtual active descendant"
        )
        var mounted int32
        for row in host.RowBlobs.Values {
            if row.Handle!!.IsMounted {
                mounted++
            }
        }
        Require(mounted < 30, "Grid realized all 1500 rows")
        CaptureIssueProof(window, "datagrid-virtual-end")
        host.Disabled = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(
            !window.PerformAccessibilityAction(last.Id, AccessibilityActionRequest(AccessibilityAction.Select)),
            "Disabled grid accepted accessible selection"
        )
    } finally {
        SDL.SetModState(uint16(0))
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine(
        "PASS: DataGrid shared columns, controlled sort/selection, range/disabled input, captured resize/cancel/keyboard, measured detail, horizontal overflow and 1500-row virtualization"
    )
}
