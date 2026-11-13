package Goo.Widgets.Icons

import Goo
import Goo.Svg
import Goo.Widgets
import System
import System.Collections.Generic
import System.IO
import System.IO.Compression
import System.Reflection

/// Loads the Material Symbols SVG assets shipped by Goo Widgets.
public class MaterialIcons {
    shared {
        private const Prefix string = "Goo.Widgets.MaterialSymbols."
        private const Suffix string = ".svg"
        private const BundleResource string = Prefix + "bundle"
        private let assembly Assembly = typeof(MaterialIcons).Assembly
        private let source Assembly = SourceAssembly()
        private let gate object = Object()
        private let assets Dictionary[string, VectorAsset] = Dictionary[string, VectorAsset](StringComparer.Ordinal)

        /// Returns the names of the embedded Material Symbols assets.
        public func Names()[]string {
            if source == assembly {
                using let stream = assembly.GetManifestResourceStream(BundleResource)
                    ?? throw InvalidOperationException("Material icon bundle not found.")
                using let reader = BinaryReader(stream)
                stream.Position = 4
                let names = [int32(reader.ReadUInt16())]string
                let table = 7 + 6 * int32(reader.ReadByte())
                for i in 0 ... names.Length {
                    stream.Position = table + 4 * i
                    let record = reader.ReadInt32()
                    stream.Position = record + 5
                    names[i] = reader.ReadString()
                }
                return names
            }
            let names = List[string]()
            for resource in source.GetManifestResourceNames() {
                if resource.StartsWith(Prefix, StringComparison.Ordinal)
                && resource.EndsWith(Suffix, StringComparison.Ordinal) {
                    names.Add(resource.Substring(Prefix.Length, resource.Length - Prefix.Length - Suffix.Length))
                }
            }
            names.Sort(StringComparer.Ordinal)
            return names.ToArray()
        }

        /// Creates a tinted Material Symbols shape sized to the requested square.
        public func Create(name string, size float64 = 24.0, color Color? = nil) Shape ->
            Create(name, size, color, false)

        internal func Create(name string, size float64, color Color?, useCurrentColor bool) Shape {
            if String.IsNullOrWhiteSpace(name) {
                throw ArgumentException("Icon name is required.")
            }
            if !Double.IsFinite(size) || size <= 0.0 {
                throw ArgumentOutOfRangeException("size")
            }
            let asset = Asset(name)
            let scale = Math.Min(size / asset.ViewBoxWidth, size / asset.ViewBoxHeight)
            return Shape{
                Path: asset.PathForNode(1),
                Width: size,
                Height: size,
                Fit: ShapeFit.Contain,
                Transform: PanelTransform{
                    TranslateX: -asset.ViewBoxX * scale,
                    TranslateY: -asset.ViewBoxY * scale,
                },
                Fill: VectorPaint(color ?? Theme.Read().TextColor),
                UseCurrentColor: useCurrentColor,
                Accessibility: Accessibility{Hidden: true},
            }
        }

        private func Asset(name string) VectorAsset {
            lock gate {
                if assets.TryGetValue(name, out var existing) {
                    return existing
                }
                let resource = Prefix + name + Suffix
                using let stream = if source == assembly { ReadSvg(name) } else { source.GetManifestResourceStream(resource) }
                if stream == nil {
                    throw InvalidOperationException("Material icon resource not found: " + resource)
                }
                let asset = Svg.Load(stream)
                if asset.NodeCount != 2 || asset.CurveCount == 0 {
                    throw InvalidOperationException("Material icon must contain one SVG path: " + resource)
                }
                assets[name] = asset
                return asset
            }
        }

        private func ReadSvg(name string) Stream {
            using let stream = assembly.GetManifestResourceStream(BundleResource)
                ?? throw InvalidOperationException("Material icon bundle not found.")
            using let reader = BinaryReader(stream)
            stream.Position = 4
            var right = int32(reader.ReadUInt16())
            let groups = int32(reader.ReadByte())
            let table = 7 + 6 * groups
            var left = 0
            while left < right {
                let middle = left + (right - left) / 2
                stream.Position = table + 4 * middle
                let record = reader.ReadInt32()
                stream.Position = record + 5
                let length = reader.Read7BitEncodedInt()
                let limit = Math.Min(name.Length, length)
                var comparison = 0
                for i in 0 ... limit {
                    comparison = int32(name[i]) - int32(reader.ReadByte())
                    if comparison != 0 {
                        break
                    }
                }
                if comparison == 0 {
                    comparison = name.Length - length
                }
                if comparison == 0 {
                    stream.Position = record
                    let group = int32(reader.ReadByte())
                    let offset = int32(reader.ReadUInt16())
                    let size = int32(reader.ReadUInt16())
                    stream.Position = 7 + 6 * group
                    let start = reader.ReadInt32()
                    let rawSize = int32(reader.ReadUInt16())
                    let end = if group + 1 < groups { reader.ReadInt32() } else { int32(stream.Length) }
                    stream.Position = start
                    let compressed = [end - start]uint8
                    stream.ReadExactly(compressed, 0, compressed.Length)
                    let raw = [rawSize]uint8
                    if !BrotliDecoder.TryDecompress(compressed.AsSpan(), raw.AsSpan(), out var written) || written != raw.Length {
                        throw InvalidOperationException("Material icon block could not be decompressed.")
                    }
                    return MemoryStream(raw, offset, size, false)
                }
                if comparison < 0 {
                    right = middle
                } else {
                    left = middle + 1
                }
            }
            throw InvalidOperationException("Material icon resource not found: " + Prefix + name + Suffix)
        }

        private func SourceAssembly() Assembly {
            let entry = Assembly.GetEntryAssembly()
            if entry != nil {
                using let marker = entry.GetManifestResourceStream(Prefix + "Subset")
                if marker != nil {
                    return entry
                }
            }
            return assembly
        }
    }
}
