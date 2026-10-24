package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class TextAreaExample : Cell {
    private var notes string = "Ship the release on Friday.\nConfirm the rollout window with the team."
    private var submitted bool
    public override func Build() Blob -> Container{
        Width: Percent(100),
        MaxWidth: 560,
        MinWidth: 0,
        Gap: 20,
        Cell.Mount[TextAreaInput, TextArea](
            "notes",
            TextAreaInput{
                Label: submitted ? "Submitted": "Notes",
                Value: notes,
                OnChange: (value string) -> {
                    notes = value
                    Rebuild()
                },
                Width: Percent(100),
                MinimumRows: 2,
                MaximumRows: 5,
                MaxLength: 120,
                SubmitOnEnter: true,
                OnSubmit: value -> {
                    submitted = true
                    Rebuild()
                },
            }
        ),
        Cell.Mount[TextAreaInput, TextArea](
            "readonly",
            TextAreaInput{
                Label: "Read-only output",
                Value: "Build 4182 passed in 3m 12s.\nArtifacts uploaded at 14:05.",
                Width: Percent(100),
                ReadOnly: true,
                MinimumRows: 3,
                MaximumRows: 2,
                Wrap: TextWrap.NoWrap
            }
        ),
        Cell.Mount[TextAreaInput, TextArea](
            "invalid",
            TextAreaInput{
                Label: "Required explanation",
                Value: "",
                Placeholder: "Add context",
                Invalid: true,
                IssueText: "An explanation is required.",
                Width: Percent(100),
                MinimumRows: 2
            }
        )
    }
}

internal class TextAreaPage : GalleryPage {
    override func Title() string -> "Text area"

    override func Build() Blob -> Cell.Mount[TextAreaExample]("text-area-example")
}
