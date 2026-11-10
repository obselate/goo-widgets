package Goo.Widgets

import Goo
import System.Runtime.CompilerServices

public data partial struct Theme {
    shared {
        internal let Key Context[Theme] = Context[Theme]()
        private let attachments ConditionalWeakTable[Window, ThemeAttachment] =
        ConditionalWeakTable[Window, ThemeAttachment]()

        /// Attaches the Bone and Ink pair in the current mode, preserving an app-set background and following the system accent.
        public func Attach(window Window) {
            let state = attachment(window)
            state.Value = Default.ResolveDefaults()
            state.Apply(window.Preferences)
        }

        /// Attaches a theme with Default fallbacks for zero metrics, opaque colors and nil fields.
        /// A theme with a Variant keeps the current mode and follows it live. Other themes are fixed.
        /// Glass themes also request native window blur, so attach them before Open.
        public func Attach(window Window, value Theme) {
            let state = attachment(window)
            state.Value = value.ResolveDefaults()
            state.Apply(window.Preferences)
        }

        /// Selects the light or dark variant of the attached theme, preserving its typography and metrics.
        /// Fixed themes stay unchanged.
        public func SetMode(window Window, mode ThemeMode) {
            let state = attachment(window)
            state.Mode = mode
            state.Apply(window.Preferences)
        }

        /// Reads the nearest retained theme during an owned build or virtual callback.
        public func Read() Theme {
            let window = Key.Window
            if !attachments.TryGetValue(window, out var state) {
                Attach(window)
            }
            return Key.Read()
        }

        /// Reads the window snapshot, not a subtree override.
        public func Read(window Window) Theme {
            if !Key.TryRead(window, out var value) {
                Attach(window)
                return Key.Read(window)
            }
            return value
        }

        private func attachment(window Window) ThemeAttachment {
            Key.TryRead(window, out var value)
            if attachments.TryGetValue(window, out var state) {
                return state
            }
            let created = ThemeAttachment(window)
            attachments.Add(window, created)
            window.PreferencesChanged += created.Apply
            return created
        }
    }
}
