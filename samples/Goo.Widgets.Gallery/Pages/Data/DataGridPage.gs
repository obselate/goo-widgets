package Goo.Widgets.Gallery.Pages.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import Goo.Widgets.Gallery
import System
import System.Collections.Generic

internal class DataGridExample : Cell {
    private var widths Dictionary[string, float64] = Dictionary[string, float64]()
    private var selected[]string = []string{"atlas"}
    private var expanded[]string = []string{"atlas"}
    private var sorts[]DataGridSortColumn = []DataGridSortColumn{
        DataGridSortColumn{ColumnId: "name", Direction: DataGridSort.Ascending}
    }
    private var order[]string = []string{"name", "status", "owner", "load"}
    private var invoked string = "Enter or double-click a host to open it"
    private var query string = ""
    private func Width(id string, value float64) {
        widths = Dictionary[string, float64](widths)
        widths[id] = value
        Rebuild()
    }

    private func Select(ids[]string) {
        selected = ids
        Rebuild()
    }

    private func Expand(id string, value bool) {
        expanded = value ? []string{id}: []string{}
        Rebuild()
    }

    private func Sort(value[]DataGridSortColumn) {
        sorts = value
        Rebuild()
    }

    private func Filter(value string) {
        query = value
        Rebuild()
    }

    private func Rows()[]DataGridRow {
        let rows = List[DataGridRow]()
        let names = []string{"atlas", "borealis", "cirrus", "drift", "ember", "fjord", "grove", "harbor"}
        for index in 0 ... names.Length {
            let name = names[index]
            if !name.Contains(query, StringComparison.OrdinalIgnoreCase) {
                continue
            }
            let values = Dictionary[string, string]()
            values.Add("name", name)
            values.Add("status", index % 3 == 0 ? "Review": "Healthy")
            values.Add("owner", index % 2 == 0 ? "Infrastructure": "Platform")
            values.Add("load", ((index + 1) * 10).ToString())
            rows.Add(DataGridRow{Id: name, Label: name, Values: values, Disabled: name == "drift", HasDetail: true})
        }
        rows.Sort(
            (a DataGridRow, b DataGridRow) -> {
                for sort in sorts {
                    let compared = StringComparer.Ordinal.Compare(
                        a.Values!![sort.ColumnId!!],
                        b.Values!![sort.ColumnId!!]
                    )
                    if compared != 0 {
                        return compared * (sort.Direction == DataGridSort.Descending ? -1: 1)
                    }
                }
                return 0
            }
        )
        return rows.ToArray()
    }

    private func Detail(input DataGridInput, row DataGridRow) Blob -> Text{
        Content: "Managed host · " +
            row.Id!!+
            "\nLast checked 2 minutes ago. Review inventory, ownership, and deployment history here.",
        FontSize: 13,
    }

    public override func Build() Blob {
        let rows = Rows()
        var total = 0
        for row in rows {
            total += int32.Parse(row.Values!!["load"])
        }
        return Container{
            Width: Percent(100),
            Gap: 14,
            Text{
                Key: "hint",
                Content: "Multi-sort · pinned host · Alt+Left/Right to reorder · compact rows",
                FontSize: 14,
            },
            Cell.Mount[DataGridInput, DataGrid](
                "inventory",
                DataGridInput{
                    Height: 335,
                    AccessibilityName: "Managed hosts",
                    Rows: rows,
                    Columns: []DataGridColumn{
                        DataGridColumn{
                            Id: "name",
                            Label: "Host",
                            Width: 190,
                            Minimum: 110,
                            Sortable: true,
                            Filter: TextEntry{
                                Value: query,
                                Placeholder: "Filter hosts",
                                OnChange: Filter,
                                Width: Percent(100),
                                Height: 30,
                                Padding: 5,
                                Color: "#fafafa",
                                BackgroundColor: "#09090b"
                            }
                        },
                        DataGridColumn{Id: "status", Label: "Status", Flex: 1, Minimum: 120, Sortable: true},
                        DataGridColumn{Id: "owner", Label: "Team", Flex: 2, Minimum: 160, Sortable: true},
                        DataGridColumn{Id: "load", Label: "Load", Width: 120, Minimum: 100},
                    },
                    ColumnWidths: widths,
                    OnColumnWidthChange: Width,
                    Sorts: sorts,
                    OnSortsChange: Sort,
                    PinnedColumns: []string{"name"},
                    ColumnOrder: order,
                    OnColumnOrderChange: (value[]string) -> {
                        order = value
                        Rebuild()
                    },
                    Density: DataGridDensity.Compact,
                    OnRowInvoke: (id string) -> {
                        invoked = "Opened " + id
                        Rebuild()
                    },
                    Footer: Typography{
                        Content: rows.Length.ToString() + " hosts · total load " + total.ToString(),
                        Variant: TextVariant.Caption
                    }.Build(),
                    CreateCell: (input DataGridInput, row DataGridRow, column DataGridColumn, content Blob) -> {
                        if column.Id != "load" {
                            return content
                        }
                        return Container{
                            Position: PositionType.Relative,
                            Height: 20,
                            JustifyContent: JustifyContent.Center,
                            Container{
                                Position: PositionType.Absolute,
                                Left: 0,
                                Top: 0,
                                Bottom: 0,
                                Width: Percent(float64.Parse(row.Values!!["load"])),
                                BackgroundColor: Theme.Read().AccentColor.WithAlpha(0.25)
                            },
                            content
                        }
                    },
                    Selection: DataGridSelection.Multiple,
                    ShowSelection: true,
                    SelectedIds: selected,
                    OnSelectionChange: Select,
                    ExpandedIds: expanded,
                    OnExpandedChange: Expand,
                    CreateDetail: Detail
                }
            ),
            Text{Key: "selection", Content: selected.Length.ToString() + " selected · " + invoked, FontSize: 13}
        }
    }
}

internal class DataGridPage : GalleryPage {
    override func Title() string -> "Data grid"

    override func Build() Blob -> Cell.Mount[DataGridExample]("data-grid-example")
}
