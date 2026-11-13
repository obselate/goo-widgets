package Goo.Widgets

import Goo

public data partial struct Theme {
    shared {
        /// GitHub Dark palette with Goo's typography and rounded controls.
        public prop GitHubDark Theme {
            get -> Ink with{
                CanvasColor = Color.Parse("#0d1117"),
                PanelColor = Color.Parse("#161b22"),
                RaisedColor = Color.Parse("#21262d"),
                OverlayColor = Color.Parse("#1c2128"),
                FieldColor = Color.Parse("#0d1117"),
                HoverColor = Color.Parse("#21262d"),
                PressedColor = Color.Parse("#161b22"),
                BorderColor = Color.Parse("#21262d"),
                InputBorderColor = Color.Parse("#89929b"),
                TextColor = Color.Parse("#ecf2f8"),
                MutedTextColor = Color.Parse("#c6cdd5"),
                PlaceholderColor = Color.Parse("#c6cdd5"),
                FaintTextColor = Color.Parse("#89929b"),
                AccentColor = Color.Parse("#77bdfb"),
                OnAccentColor = Color.Parse("#0d1117"),
                AccentHoverColor = Color.Parse("#a2d2fb"),
                AccentPressedColor = Color.Parse("#77bdfb"),
                InfoColor = Color.Parse("#cea5fb"),
                SuccessColor = Color.Parse("#7ce38b"),
                WarningColor = Color.Parse("#faa356"),
                DangerColor = Color.Parse("#fa7970"),
                DangerFillColor = Color.Parse("#fa7970"),
                DangerHoverColor = Color.Parse("#fa7970"),
                SunkenColor = Color.Parse("#010409"),
                ActiveColor = Color.Parse("#1c334b"),
                StrongBorderColor = Color.Parse("#89929b"),
                SubtleTextColor = Color.Parse("#c6cdd5"),
                DisabledTextColor = Color.Parse("#89929b"),
                LinkColor = Color.Parse("#77bdfb"),
                FocusColor = Color.Parse("#77bdfb"),
                InfoFillColor = Color.Parse("#2c2c3c"),
                SuccessFillColor = Color.Parse("#223329"),
                WarningFillColor = Color.Parse("#312b28"),
                DangerQuietColor = Color.Parse("#312629"),
            }
        }
    }
}
