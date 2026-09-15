package Goo.Widgets.Gallery.Pages.Data

import Goo
import Goo.Widgets.Data
import Goo.Widgets.Gallery
import System
import System.Collections.Generic

internal class DataGridExample : Cell {
    private var widths Dictionary[string, float64] = Dictionary[string, float64]()
    private var selected[]string = []string{"atlas"}
    private var expanded[]string = []string{"atlas"}
    private var sortId string = "name"
    private var sortDirection DataGridSort = DataGridSort.Ascending
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

    private func Sort(id string, direction DataGridSort) {
        sortId = id
        sortDirection = direction
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
            rows.Add(DataGridRow{Id: name, Label: name, Values: values, Disabled: name == "drift", HasDetail: true})
        }
        if sortDirection != DataGridSort.None {
            rows.Sort(
                (a DataGridRow, b DataGridRow) -> StringComparer.Ordinal.Compare(
                    a.Values!![sortId],
                    b.Values!![sortId]
                ) * (sortDirection == DataGridSort.Descending ? -1: 1)
            )
        }
        return rows.ToArray()
    }

    private func Detail(input DataGridInput, row DataGridRow) Blob -> Text{
        Content: "Managed host · " +
            row.Id!!+
            "\nLast checked 2 minutes ago. Review inventory, ownership, and deployment history here.",
        FontSize: 13,
        Color: "#a5b4fc"
    }

    public override func Build() Blob -> Container{
        Width: 700,
        Gap: 14,
        Text{
            Key: "hint",
            Content: "Shared columns · controlled sorting · multiple selection · measured details",
            FontSize: 14,
            Color: "#a1a1aa"
        },
        Cell.Mount[DataGridInput, DataGrid](
            "inventory",
            DataGridInput{
                Height: 335,
                AccessibilityName: "Managed hosts",
                Rows: Rows(),
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
                            Width: Length.Percent(100),
                            Height: 30,
                            Padding: 5,
                            Color: "#fafafa",
                            BackgroundColor: "#09090b"
                        }
                    },
                    DataGridColumn{Id: "status", Label: "Status", Flex: 1, Minimum: 120, Sortable: true},
                    DataGridColumn{Id: "owner", Label: "Team", Flex: 2, Minimum: 160, Sortable: true},
                },
                ColumnWidths: widths,
                OnColumnWidthChange: Width,
                SortColumnId: sortId,
                SortDirection: sortDirection,
                OnSort: Sort,
                Selection: DataGridSelection.Multiple,
                ShowSelection: true,
                SelectedIds: selected,
                OnSelectionChange: Select,
                ExpandedIds: expanded,
                OnExpandedChange: Expand,
                CreateDetail: Detail
            }
        ),
        Text{
            Key: "selection",
            Content: selected.Length.ToString() + " selected · use Ctrl/⌘ to toggle and Shift to extend",
            Color: "#a1a1aa",
            FontSize: 13
        }
    }
}

internal class DataGridPage : GalleryPage {
    override func Title() string -> "Data grid"

    override func Build() Blob -> Cell.Mount[DataGridExample]("data-grid-example")
}
