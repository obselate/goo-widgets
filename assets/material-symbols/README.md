# Material Symbols

Google Material Symbols Outlined, optical size 24, weight 400, grade 0, unfilled.
The complete set for this variant contains 4,128 SVGs, totaling 2,009,680 bytes
(1.92 MiB). Concatenated SVG data compresses to 466,427 bytes with gzip.
The verified NuGet package is about 668 KiB, up from 133 KiB before this addition.
The Goo.Svg 0.5.1 dependency is a separate 58 KiB package.

Source: [google/material-design-icons](https://github.com/google/material-design-icons)
at commit [`0cbb08816df07faaae3dca060d4ebb10b66c214f`](https://github.com/google/material-design-icons/tree/0cbb08816df07faaae3dca060d4ebb10b66c214f).
Each `outlined/<name>.svg` is an unchanged copy of
`symbols/web/<name>/materialsymbolsoutlined/<name>_24px.svg` from that commit.
The upstream [LICENSE](LICENSE) is Apache-2.0. Goo Widgets source remains MIT.

Only this standard variant is included. Other weights, sizes, filled variants,
Rounded and Sharp styles, fonts, and platform exports are not bundled.

The library embeds the SVGs in its assembly and loads them through Goo.Svg.
Use `Goo.Widgets.Icons.MaterialIcons.Create("add")` to create a fresh shape,
or `MaterialIcons.Names()` to list the included icon names. Parsed geometry is
cached on first use. No installed icon font or runtime asset directory is needed.

To update, select the same upstream paths at a new commit, copy the SVG bytes
without modifying their content, retain the license, and update this provenance
and the packaged-consumer icon count. Run `bash scripts/verify.sh` to verify that
all embedded icons load through the packaged library, then refresh the IconButton
gallery screenshot.
