package Goo.Widgets.Gallery.Pages.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Data
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
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

    private func Detail(input DataGridInput, row DataGridRow) Blob -> Container{
        FlexDirection: FlexDirection.Row,
        Gap: 24,
        Container{
            FlexGrow: 1,
            Gap: 4,
            Typography{Content: "Environment", Variant: TextVariant.Caption, Color: Theme.Read().MutedTextColor}.Build(),
            Text{Content: "Production", FontSize: Theme.Read().FontSize}
        },
        Container{
            FlexGrow: 1,
            Gap: 4,
            Typography{Content: "Region", Variant: TextVariant.Caption, Color: Theme.Read().MutedTextColor}.Build(),
            Text{Content: "Europe West", FontSize: Theme.Read().FontSize}
        },
        Container{
            FlexGrow: 1,
            Gap: 4,
            Typography{Content: "Last checked", Variant: TextVariant.Caption, Color: Theme.Read().MutedTextColor}.Build(),
            Text{Content: "2 minutes ago", FontSize: Theme.Read().FontSize}
        }
    }

    public override func Build() Blob {
        let rows = Rows()
        var total = 0
        for row in rows {
            total += int32.Parse(row.Values!!["load"])
        }
        return Container{
            Width: Percent(100),
            Gap: 16,
            Container{
                Key: "toolbar",
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: 12,
                Container{
                    FlexGrow: 1,
                    Gap: 4,
                    Typography{Content: "Managed hosts", Variant: TextVariant.Subtitle}.Build(),
                    Typography{Content: rows.Length.ToString() + " hosts", Variant: TextVariant.Caption, Color: Theme.Read().MutedTextColor}.Build()
                },
                TextField{
                    Value: query,
                    Placeholder: "Search hosts",
                    AccessibilityName: "Search hosts",
                    OnChange: Filter,
                    Width: 220,
                    EntryHeight: 36,
                    Leading: MaterialIcons.Create("search", 16, Theme.Read().MutedTextColor),
                    Clearable: true
                }.Build(),
                ActionButton{
                    Content: selected.Length > 0 ? "Clear selection": "Select all",
                    Height: 36,
                    OnClick: () -> {
                        let ids = List[string]()
                        if selected.Length == 0 {
                            for row in rows {
                                if !row.Disabled {
                                    ids.Add(row.Id!!)
                                }
                            }
                        }
                        Select(ids.ToArray())
                    }
                }.Build()
            },
            Cell.Mount[DataGridInput, DataGrid](
                "inventory",
                DataGridInput{
                    Height: 390,
                    RowHeight: 40,
                    HeaderHeight: 40,
                    ScrollbarVisibilityY: ScrollbarVisibility.Always,
                    AccessibilityName: "Managed hosts",
                    Rows: rows,
                    EmptyContent: Container{
                        Gap: 8,
                        AlignItems: AlignItems.Center,
                        MaterialIcons.Create("search_off", 24, Theme.Read().MutedTextColor),
                        Typography{Content: "No hosts found", Variant: TextVariant.Subtitle}.Build(),
                        Typography{Content: "Try a different hostname or clear the search.", Variant: TextVariant.Caption, Color: Theme.Read().MutedTextColor}.Build()
                    },
                    Columns: []DataGridColumn{
                        DataGridColumn{
                            Id: "name",
                            Label: "Host",
                            Width: 190,
                            Minimum: 110,
                            Sortable: true
                        },
                        DataGridColumn{Id: "status", Label: "Status", Flex: 1, Minimum: 120, Sortable: true},
                        DataGridColumn{Id: "owner", Label: "Team", Flex: 2, Minimum: 160, Sortable: true},
                        DataGridColumn{Id: "load", Label: "Load", Width: 100, Minimum: 80, Alignment: TextAlign.Right},
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
                    Density: DataGridDensity.Normal,
                    OnRowInvoke: (id string) -> Expand(id, true),
                    Footer: Container{
                        FlexDirection: FlexDirection.Row,
                        JustifyContent: JustifyContent.SpaceBetween,
                        Typography{Content: selected.Length.ToString() + " selected", Variant: TextVariant.Caption, Color: Theme.Read().MutedTextColor}.Build(),
                        Typography{
                            Content: rows.Length == 0 ? "No load data": "Average load " + (total / rows.Length).ToString() + "%",
                            Variant: TextVariant.Caption,
                            Color: Theme.Read().MutedTextColor
                        }.Build()
                    },
                    CreateCell: (input DataGridInput, row DataGridRow, column DataGridColumn, content Blob) -> {
                        if column.Id != "load" {
                            return content
                        }
                        return Text{
                            Content: row.Values!!["load"] + "%",
                            TextAlign: TextAlign.Right,
                            FontSize: Theme.Read().FontSize
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
            )
        }
    }
}

internal class DataGridPage : GalleryPage {
    override func Title() string -> "Data grid"

    override func Build() Blob -> Cell.Mount[DataGridExample]("data-grid-example")
}
