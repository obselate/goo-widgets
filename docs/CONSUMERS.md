# Consumer and component catalog

Survey date: 2026-09-09. Scope: Goo `0.5.1` package consumers found in the local
Projects directory, including centrally managed package versions. Source projects remain
unchanged. This repository builds without them.

## Consumers

| Consumer | Package declaration | Source revision |
| --- | --- | --- |
| Gex and Gex.Gallery | `Gex/Gex.gsproj`, `apps/Gex.Gallery/Gex.Gallery.gsproj` | Uncommitted local repository |
| Carbon (Waxxer) | `Waxxer.gsproj`, `Directory.Packages.props` | `35e5d9c655c3d10970eb4da331fc01fb32a607d8` plus working files |
| Hivemind-Goo | `apps/Hivemind/Hivemind.gsproj` | `a15457782520184895646eb701ce0729f8e72251` plus working files |
| Reaver GUI | `gui/Reaver.Gui.gsproj`, exact `[0.5.1]` | Local directory without Git history |

[Source fingerprints](SOURCE-SHA256.txt) identify the package declarations and inspected
component/view files. Revisions alone do not identify uncommitted sources. Goo package
smoke fixtures and templates also declare 0.5.1 but add no distinct widget patterns.
Project-reference consumers are outside this survey. Public FunGoo RaznorGoo at
`f7eef9ef4569a9370039759f23edf8bbebf81c68` uses Goo 0.5.0 and was excluded.

## Extracted building blocks

Each namespace starts with `Goo.Widgets.`. The 31 widgets have 30 gallery pages.
The graph page demonstrates both graph widgets. Input and data types are not widgets.

| Category | Widgets | Source and adaptation |
| --- | --- | --- |
| Actions | `ActionButton` | Gex control. Resolved appearance and primitive factories. |
| Actions | `IconButton` | Carbon `Components/IconButton.gs`. Caller supplies a blob instead of an icon font. |
| Inputs | `TextField`, `ToggleSwitch`, `Stepper`, `UploadTile` | Corresponding Gex controls. Caller owns values and actions. |
| Inputs | `SearchList` | Reaver `ReaverSharedViews.gs`, Hivemind `HostScopeDrawerCell.gs`. Controlled query/selection over generic items, virtual rows, stable IDs, and factories. |
| Inputs | `Checkbox` | Reaver `ReaverManagementViews.gs`, Hivemind settings/host selection. Controlled two-state or three-state value and accessible activation. |
| Inputs | `Slider` | Carbon `ColorField.gs`, `TransportControls.gs`. Numeric range, primary pointer capture, keyboard/accessibility actions, change/commit callbacks. |
| Feedback | `Badge`, `Banner`, `DismissibleContextBar`, `EmptyState`, `ProgressBar` | Corresponding Gex controls. Reaver/Hivemind status views map to the same primitives. |
| Feedback | `ProgressSummary` | Reaver `ReaverScanViews.gs`, Hivemind compliance progress. Label/detail/actions and progress without job state or polling. |
| Layout | `AppBar`, `Drawer`, `SectionHeader`, `ListRow` | Corresponding Gex controls, with composition slots and factories. |
| Layout | `WindowChrome` | Carbon `WindowChrome.gs`, Hivemind `Components/WindowChrome/`. Host window actions, drag region, content slot, geometric control icons. |
| Layout | `MasterDetail` | Reaver `ReaverManagementViews.gs`, Hivemind host details. Caller chooses wide/narrow composition and supplies panes. |
| Layout | `ModalDialog` | Reaver `ReaverScanViews.gs`. In-parent scrim/panel, slots, close/cancel/confirm callbacks, Escape handling. |
| Media | `AsyncImage`, `Avatar` | Corresponding Gex controls. Host supplies image state, source, placeholder, and failure presentation. |
| Media | `MediaCard`, `MediaTransport` | Carbon `SongCard.gs`, `TransportControls.gs`. Generic artwork/content and playback/seek/volume callbacks. No player service. |
| Data | `Chip` | Gex control. Label, leading content, removal activation. |
| Navigation | `NavigationRail` | Hivemind `NavigationDrawerCell.gs`. Generic items, selection/expansion callbacks, icons, root/item factories. |
| Colors | `ColorPicker` | Carbon `ColorField.gs` and color models. HSL/HSV/Oklch wheel, tone slider, RGB values, owned image disposal. |
| Graphs | `GraphCanvas`, `GraphNodeCard` | Hivemind `TopologyCanvasCell.gs`, `TopologyNodeCardCell.gs`. Generic nodes/edges and host-owned positions, selection, viewport. Pan, cursor zoom, marquee, node dragging. |

## Patterns kept in applications

| Source area | Decision |
| --- | --- |
| Carbon `Typography`, `ThemeColors`, account/browse/player/appearance views | Font assets, palette roles, authentication, music sessions, services, and settings remain host behavior. Useful interaction patterns appear in the extracted controls. |
| Hivemind `HostScopeDrawerCell`, `HostGroupControlsCell`, `HostDetailsCell` | Reuse SearchList, Checkbox, MasterDetail, and rows. Groups, remote operations, inventory tabs, docking rules, and persistence remain domain behavior. |
| Hivemind `InventoryJobsCell`, `AgentOperationComposerCell`, `ComplianceViewCell`, `SettingsViewCell` | Domain forms compose the extracted inputs, Stepper, ProgressSummary, and layout widgets. Services and application models were not copied. |
| Hivemind window chrome/workspace components | Window behavior maps to WindowChrome. Branding, workspace switching, and root composition remain host responsibilities. |
| Hivemind topology toolbox/services | Canvas interaction is extracted. Discovery, layout algorithms, projection, persistence, and domain inspector data remain in Hivemind. |
| Reaver overview/history/review/management/scan views | Search, selection, progress, dialogs, panes, badges, and actions are covered. Scan execution, persistence, review logic, and operational history remain in Reaver. |

## Contracts and limits

- Build value widgets inside the host cell's `Build`. Mount Slider, ColorPicker, and
  GraphCanvas with `Cell.Mount<Input, Widget>` and stable keys. Update host state in
  callbacks and call the host's `Rebuild()`.
- Goo siblings must be all keyed or all unkeyed. Give siblings keys when composing
  mounted cells. Replacement factories must preserve required keys, handlers, handles,
  semantics, and layout properties.
- Supplied blobs belong to the caller. Return fresh mutable content from factories
  when building multiple simultaneous instances.
- SearchList expects unique stable IDs and a logical viewport width/height. It filters
  supplied in-memory items. It does not perform remote search or own a store.
- ModalDialog overlays its parent. The host controls bounds, stacking, focus entry,
  restoration, and containment. It is not a native dialog or a focus-trapping manager.
- GraphCanvas renders supplied positions without calculating layout. Cards keep their
  screen size while positions zoom. Missing edge endpoints are omitted. Evaluate custom
  content and large-graph performance in the host.
- WindowChrome needs a Window or callbacks for window actions. Media/upload widgets emit
  callbacks. They do not open files, start processes, or access application services.
- No source fonts, logos, artwork, credentials, or backend assemblies were copied.
  The owner selected MIT for the extraction. Vendored tooling retains its original
  license and provenance under `deps/`.
