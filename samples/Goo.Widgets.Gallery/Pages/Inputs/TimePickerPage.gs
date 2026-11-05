package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class TimePickerExample : Cell {
    private var time TimeOnly? = TimeOnly(14, 30)

    public override func Build() Blob -> Container{
        Width: Percent(100),
        MaxWidth: 420,
        Cell.Mount[TimePickerInput, TimePicker]("time", TimePickerInput{
            Value: time,
            Width: Percent(100),
            MinuteIncrement: 15,
            AccessibilityName: "Time",
            OnChange: value -> {
                time = value
                Rebuild()
            }
        })
    }
}

internal class TimePickerPage : GalleryPage {
    override func Title() string -> "Time picker"

    override func Build() Blob -> Cell.Mount[TimePickerExample]("time-picker-example")
}
