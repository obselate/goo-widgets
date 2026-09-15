package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

class StepperPage : GalleryPage {
    public override func Title() string -> "Stepper"

    public override func Build() Blob {
        let firstStep = Stepper{
            Labels: []string{"Account", "Profile", "Confirm"},
            CurrentIndex: 0,
            AccessibilityName: "Checkout setup progress",
        }

        let middleStep = Stepper{
            Labels: []string{"Cart", "Shipping", "Payment", "Review"},
            CurrentIndex: 1,
            AccessibilityName: "Order fulfillment steps",
        }

        let finalStep = Stepper{
            Labels: []string{"Select Plan", "Configure", "Checkout"},
            CurrentIndex: 2,
            AccessibilityName: "Subscription setup progress",
        }

        let customCompact = Stepper{
            Labels: []string{"PLAN", "BUILD", "DEPLOY"},
            CurrentIndex: 1,
            Height: 24.0,
            Gap: 6.0,
            PaddingHorizontal: 8.0,
            BorderRadius: 4.0,
            FontSize: 11.0,
            FontWeight: 700,
            CompletedColor: Color.Parse("#52525b"),
            CurrentColor: Color.Parse("#e4e4e7"),
            UpcomingColor: Color.Parse("#18181b"),
            ActiveTextColor: Color.Parse("#09090b"),
            UpcomingTextColor: Color.Parse("#a1a1aa"),
            AccessibilityName: "Release pipeline stage",
        }

        return Container{
            Width: 640.0,
            FlexDirection: FlexDirection.Column,
            Gap: 20.0,
            Container{
                Width: Length.Percent(100.0),
                FlexDirection: FlexDirection.Column,
                Gap: 6.0,
                Text{Content: "FIRST STEP (INITIAL)", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa"},
                firstStep.Build(),
            },
            Container{
                Width: Length.Percent(100.0),
                FlexDirection: FlexDirection.Column,
                Gap: 6.0,
                Text{Content: "MIDDLE STEP (ACTIVE PROGRESSION)", FontSize: 10.0, FontWeight: 700, Color: "#d4d4d8"},
                middleStep.Build(),
            },
            Container{
                Width: Length.Percent(100.0),
                FlexDirection: FlexDirection.Column,
                Gap: 6.0,
                Text{Content: "FINAL STEP (ALL COMPLETED/CURRENT)", FontSize: 10.0, FontWeight: 700, Color: "#fafafa"},
                finalStep.Build(),
            },
            Container{
                Width: Length.Percent(100.0),
                FlexDirection: FlexDirection.Column,
                Gap: 6.0,
                Text{Content: "CUSTOM COMPACT / PALETTE VARIANT", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa"},
                customCompact.Build(),
            },
        }
    }
}
