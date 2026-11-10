package Goo.Widgets

import Goo

public data partial struct Theme {
    shared {
        /// GitHub Dark palette with Goo's typography and rounded controls.
        public prop GitHubDark Theme {
            get -> Ink with{
                CanvasColor = "#0d1117",
                PanelColor = "#161b22",
                RaisedColor = "#21262d",
                OverlayColor = "#1c2128",
                FieldColor = "#0d1117",
                HoverColor = "#21262d",
                PressedColor = "#161b22",
                BorderColor = Color.Parse("#21262d"),
                InputBorderColor = "#89929b",
                TextColor = "#ecf2f8",
                MutedTextColor = "#c6cdd5",
                PlaceholderColor = "#c6cdd5",
                FaintTextColor = "#89929b",
                AccentColor = "#77bdfb",
                OnAccentColor = "#0d1117",
                AccentHoverColor = "#a2d2fb",
                AccentPressedColor = "#77bdfb",
                InfoColor = "#cea5fb",
                SuccessColor = "#7ce38b",
                WarningColor = "#faa356",
                DangerColor = "#fa7970",
                DangerFillColor = "#fa7970",
                DangerHoverColor = "#fa7970",
                SunkenColor = "#010409",
                ActiveColor = "#1c334b",
                StrongBorderColor = "#89929b",
                SubtleTextColor = "#c6cdd5",
                DisabledTextColor = "#89929b",
                LinkColor = "#77bdfb",
                FocusColor = "#77bdfb",
                InfoFillColor = "#2c2c3c",
                SuccessFillColor = "#223329",
                WarningFillColor = "#312b28",
                DangerQuietColor = "#312629",
            }
        }
    }
}
