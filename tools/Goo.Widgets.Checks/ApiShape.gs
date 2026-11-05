package Goo.Widgets.Checks

import System
import System.Collections.Generic
import System.IO
import System.Linq
import System.Reflection
import System.Reflection.Metadata
import System.Reflection.Metadata.Ecma335
import System.Reflection.PortableExecutable
import System.Text.Json
import System.Text.RegularExpressions
import System.Xml.Linq

class ApiType {
    public var Name string = ""
    public var Value bool
    public var Optional bool
    public var Arguments List[ApiType] = List[ApiType]()

    public func Text(full bool = false) string {
        var name = Name
        if !full {
            name = Regex.Replace(name, "^.*\\.", "")
            name = switch name {
                case "String": "string"
                case "Boolean": "bool"
                case "Double": "float64"
                case "Single": "float32"
                case "Int32": "int32"
                case "Int64": "int64"
                case "Void": "void"
                default: name
            }
        }
        if Name == "[]" {
            return Arguments[0].Text(full) + "[]" + (if Optional && !full { "?" } else { "" })
        }
        if Arguments.Count > 0 {
            name = Regex.Replace(name, "`[0-9]+$", "") + (if full { "{" } else { "[" }) + String.Join(",", Arguments.Select(item -> item.Text(full))) + (if full { "}" } else { "]" })
        }
        if full && Value && Optional { return "System.Nullable{" + name + "}" }
        return name + (if Optional && !full { "?" } else { "" })
    }
}

class ApiMember {
    public var Id string = ""
    public var Name string = ""
    public var Kind string = ""
    public var Type ApiType = ApiType()
    public var Parameters List[ApiType] = List[ApiType]()
    public var Arity int32
    public var Signature string = ""
}

class ApiDeclaration {
    public var Id string = ""
    public var Name string = ""
    public var Base ApiType = ApiType()
    public var Data bool
    public var Open bool
    public var Program bool
    public var Members List[ApiMember] = List[ApiMember]()
}

class ApiFinding {
    public var Rule int32
    public var Symbol string = ""
    public var Current string = ""
    public var Expected string = ""
}

class ApiException {
    public var Rule int32
    public var Symbol string = ""
    public var Signature string = ""
    public var Used bool
}

class ApiMetadata {
    public var Reader MetadataReader
    public var Types List[ApiDeclaration] = List[ApiDeclaration]()
    public var Semantics Dictionary[int32, []string] = Dictionary[int32, []string]()

    public init(reader MetadataReader) {
        Reader = reader
    }

    public func Name(handle EntityHandle) string {
        if handle.IsNil { return "" }
        if handle.Kind == HandleKind.TypeDefinition {
            let type = Reader.GetTypeDefinition(MetadataTokens.TypeDefinitionHandle(MetadataTokens.GetRowNumber(handle)))
            let parent = type.GetDeclaringType()
            return (if parent.IsNil { Reader.GetString(type.Namespace) } else { Name(parent) }) + "." + Reader.GetString(type.Name)
        }
        if handle.Kind == HandleKind.TypeReference {
            let type = Reader.GetTypeReference(MetadataTokens.TypeReferenceHandle(MetadataTokens.GetRowNumber(handle)))
            return Reader.GetString(type.Namespace) + "." + Reader.GetString(type.Name)
        }
        if handle.Kind == HandleKind.TypeSpecification {
            var blob = Reader.GetBlobReader(Reader.GetTypeSpecification(MetadataTokens.TypeSpecificationHandle(MetadataTokens.GetRowNumber(handle))).Signature)
            return Decode(ref blob).Text(true)
        }
        throw InvalidDataException("Unsupported metadata type handle.")
    }

    public func AttributeName(attribute CustomAttribute) string {
        let constructor = attribute.Constructor
        if constructor.Kind == HandleKind.MemberReference {
            return Name(Reader.GetMemberReference(MetadataTokens.MemberReferenceHandle(MetadataTokens.GetRowNumber(constructor))).Parent)
        }
        return Name(Reader.GetMethodDefinition(MetadataTokens.MethodDefinitionHandle(MetadataTokens.GetRowNumber(constructor))).GetDeclaringType())
    }

    public func Context(attributes CustomAttributeHandleCollection, fallback byte) byte {
        for handle in attributes {
            let attribute = Reader.GetCustomAttribute(handle)
            if AttributeName(attribute) == "System.Runtime.CompilerServices.NullableContextAttribute" {
                var blob = Reader.GetBlobReader(attribute.Value)
                Require(blob.ReadUInt16() == 1, "Invalid nullable context attribute.")
                return blob.ReadByte()
            }
        }
        return fallback
    }

    public func Nullable(type ApiType, attributes CustomAttributeHandleCollection, context byte) {
        var flags = []byte{}
        for handle in attributes {
            let attribute = Reader.GetCustomAttribute(handle)
            if AttributeName(attribute) == "System.Runtime.CompilerServices.NullableAttribute" {
                var blob = Reader.GetBlobReader(attribute.Value)
                Require(blob.ReadUInt16() == 1, "Invalid nullable attribute.")
                if blob.RemainingBytes == 3 { flags = []byte{blob.ReadByte()} } else {
                    let count = blob.ReadInt32()
                    Require(count >= 0 && count <= blob.RemainingBytes - 2, "Invalid nullable flags.")
                    flags = blob.ReadBytes(count)
                }
            }
        }
        var index = 0
        ApplyNullable(type, flags, ref index, context)
    }

    func ApplyNullable(type ApiType, flags[]byte, ref index int32, context byte) {
        if !type.Value || type.Arguments.Count > 0 {
            let flag = if index < flags.Length { flags[index] } else { context }
            index++
            if !type.Value { type.Optional = flag == 2 }
        }
        for argument in type.Arguments { ApplyNullable(argument, flags, ref index, context) }
    }

    public func Decode(ref blob BlobReader) ApiType {
        let code = blob.ReadByte()
        if code == 0x1f || code == 0x20 {
            blob.ReadTypeHandle()
            return Decode(ref blob)
        }
        if code == 0x10 {
            let type = Decode(ref blob)
            type.Name += "@"
            return type
        }
        if code == 0x1d {
            let type = ApiType { Name: "[]" }
            type.Arguments.Add(Decode(ref blob))
            return type
        }
        if code == 0x13 || code == 0x1e {
            return ApiType { Name: (if code == 0x13 { "`" } else { "``" }) + blob.ReadCompressedInteger().ToString() }
        }
        if code == 0x15 {
            let kind = blob.ReadByte()
            let type = ApiType { Name: Name(blob.ReadTypeHandle()), Value: kind == 0x11 }
            let count = blob.ReadCompressedInteger()
            for i in 0 ... count { type.Arguments.Add(Decode(ref blob)) }
            if type.Name == "System.Nullable`1" {
                type.Arguments[0].Optional = true
                return type.Arguments[0]
            }
            return type
        }
        if code == 0x11 || code == 0x12 {
            return ApiType { Name: Name(blob.ReadTypeHandle()), Value: code == 0x11 }
        }
        let name = switch code {
            case 0x01: "Void"
            case 0x02: "Boolean"
            case 0x03: "Char"
            case 0x04: "SByte"
            case 0x05: "Byte"
            case 0x06: "Int16"
            case 0x07: "UInt16"
            case 0x08: "Int32"
            case 0x09: "UInt32"
            case 0x0a: "Int64"
            case 0x0b: "UInt64"
            case 0x0c: "Single"
            case 0x0d: "Double"
            case 0x0e: "String"
            case 0x1c: "Object"
            case 0x18: "IntPtr"
            case 0x19: "UIntPtr"
            default: ""
        }
        Require(name != "", "Unsupported API signature element " + code.ToString())
        return ApiType { Name: "System." + name, Value: code != 0x0e && code != 0x1c }
    }

    public func Visible(handle TypeDefinitionHandle) bool {
        let type = Reader.GetTypeDefinition(handle)
        let visibility = type.Attributes & TypeAttributes.VisibilityMask
        return visibility == TypeAttributes.Public || (visibility == TypeAttributes.NestedPublic && Visible(type.GetDeclaringType()))
    }

    public func Read() {
        for handle in Reader.GetAssemblyDefinition().GetCustomAttributes() {
            let attribute = Reader.GetCustomAttribute(handle)
            if AttributeName(attribute) == "System.Reflection.AssemblyMetadataAttribute" {
                var blob = Reader.GetBlobReader(attribute.Value)
                blob.ReadUInt16()
                let key = blob.ReadSerializedString()
                let value = blob.ReadSerializedString() ?? ""
                if key == "GSharp.TypeSemantics" {
                    let parts = value.Split('|')
                    Require(parts.Length >= 4, "Invalid G# type semantics marker.")
                    Semantics[int32.Parse(parts[0])] = parts
                }
            }
        }
        for handle in Reader.TypeDefinitions {
            let definition = Reader.GetTypeDefinition(handle)
            let name = Name(handle)
            let program = Reader.GetString(definition.Name) == "<Program>"
            if !Visible(handle) && !program { continue }
            if name.Contains("<") && !program { continue }
            let type = ApiDeclaration { Id: "T:" + name, Name: name, Open: (definition.Attributes & TypeAttributes.Sealed) == 0, Program: program }
            if !definition.BaseType.IsNil {
                type.Base = if definition.BaseType.Kind == HandleKind.TypeSpecification {
                    var blob = Reader.GetBlobReader(Reader.GetTypeSpecification(MetadataTokens.TypeSpecificationHandle(MetadataTokens.GetRowNumber(definition.BaseType))).Signature)
                    Decode(ref blob)
                } else { ApiType { Name: Name(definition.BaseType) } }
            }
            let token = MetadataTokens.GetToken(handle)
            if Semantics.ContainsKey(token) {
                let marker = Semantics[token]
                type.Data = marker[1] == "struct" && marker[2] == "1"
                if marker.Length > 4 { type.Open = marker[4] == "open" }
            }
            let context = Context(definition.GetCustomAttributes(), 0)
            for fieldHandle in definition.GetFields() {
                let field = Reader.GetFieldDefinition(fieldHandle)
                if (field.Attributes & FieldAttributes.FieldAccessMask) != FieldAttributes.Public { continue }
                let fieldName = Reader.GetString(field.Name)
                if fieldName == "value__" { continue }
                var blob = Reader.GetBlobReader(field.Signature)
                Require(blob.ReadByte() == 6, "Invalid field signature.")
                let value = Decode(ref blob)
                Nullable(value, field.GetCustomAttributes(), context)
                type.Members.Add(ApiMember { Id: "F:" + name + "." + fieldName, Name: fieldName, Kind: "var", Type: value, Signature: "var " + fieldName + " " + value.Text() })
            }
            for propertyHandle in definition.GetProperties() {
                let property = Reader.GetPropertyDefinition(propertyHandle)
                let accessors = property.GetAccessors()
                let getter = if !accessors.Getter.IsNil { Reader.GetMethodDefinition(accessors.Getter) } else { Reader.GetMethodDefinition(accessors.Setter) }
                if (getter.Attributes & MethodAttributes.MemberAccessMask) != MethodAttributes.Public { continue }
                var blob = Reader.GetBlobReader(property.Signature)
                blob.ReadSignatureHeader()
                let count = blob.ReadCompressedInteger()
                let value = Decode(ref blob)
                Nullable(value, property.GetCustomAttributes(), context)
                let propertyName = Reader.GetString(property.Name)
                let member = ApiMember { Id: "P:" + name + "." + propertyName, Name: propertyName, Kind: "property", Type: value, Signature: "property " + propertyName + " " + value.Text() }
                for i in 0 ... count { member.Parameters.Add(Decode(ref blob)) }
                if count > 0 { member.Id += "(" + String.Join(",", member.Parameters.Select(item -> item.Text(true))) + ")" }
                type.Members.Add(member)
            }
            for methodHandle in definition.GetMethods() {
                let method = Reader.GetMethodDefinition(methodHandle)
                let methodName = Reader.GetString(method.Name)
                if (method.Attributes & MethodAttributes.MemberAccessMask) != MethodAttributes.Public { continue }
                if (method.Attributes & MethodAttributes.SpecialName) != 0 && !methodName.StartsWith("op_") && methodName != ".ctor" { continue }
                var blob = Reader.GetBlobReader(method.Signature)
                let header = blob.ReadSignatureHeader()
                let arity = if header.IsGeneric { blob.ReadCompressedInteger() } else { 0 }
                let count = blob.ReadCompressedInteger()
                let result = Decode(ref blob)
                let member = ApiMember { Name: methodName, Kind: "func", Type: result, Arity: arity }
                for i in 0 ... count { member.Parameters.Add(Decode(ref blob)) }
                let methodContext = Context(method.GetCustomAttributes(), context)
                for parameterHandle in method.GetParameters() {
                    let parameter = Reader.GetParameter(parameterHandle)
                    if parameter.SequenceNumber == 0 { Nullable(result, parameter.GetCustomAttributes(), methodContext) } else {
                        Nullable(member.Parameters[parameter.SequenceNumber - 1], parameter.GetCustomAttributes(), methodContext)
                    }
                }
                member.Id = "M:" + name.Replace(".<Program>", "") + "." + methodName.Replace(".ctor", "#ctor") + (if arity > 0 { "``" + arity.ToString() } else { "" })
                if count > 0 { member.Id += "(" + String.Join(",", member.Parameters.Select(item -> item.Text(true))) + ")" }
                if methodName == "op_Implicit" || methodName == "op_Explicit" { member.Id += "~" + result.Text(true) }
                member.Signature = "func " + methodName + (if arity > 0 { "``" + arity.ToString() } else { "" }) + "(" + String.Join(",", member.Parameters.Select(item -> item.Text())) + ") " + result.Text()
                if methodName == ".ctor" && !HasSequencePoints(methodHandle) { continue }
                if type.Data && Generated(member) && !HasSequencePoints(methodHandle) { continue }
                type.Members.Add(member)
            }
            for eventHandle in definition.GetEvents() {
                let event = Reader.GetEventDefinition(eventHandle)
                let add = Reader.GetMethodDefinition(event.GetAccessors().Adder)
                if (add.Attributes & MethodAttributes.MemberAccessMask) != MethodAttributes.Public { continue }
                let eventName = Reader.GetString(event.Name)
                type.Members.Add(ApiMember { Id: "E:" + name + "." + eventName, Name: eventName, Kind: "event", Signature: "event " + eventName + " " + Name(event.Type) })
            }
            Types.Add(type)
        }
    }

    public var DebugReader MetadataReader?

    func HasSequencePoints(handle MethodDefinitionHandle) bool {
        if DebugReader == nil { return false }
        return DebugReader!!.GetMethodDebugInformation(MetadataTokens.MethodDebugInformationHandle(MetadataTokens.GetRowNumber(handle))).GetSequencePoints().Any(point -> !point.IsHidden)
    }

    func Generated(member ApiMember) bool {
        let count = member.Parameters.Count
        return (member.Name == "Equals" && count == 1 && member.Type.Name == "System.Boolean") ||
            (member.Name == "GetHashCode" && count == 0 && member.Type.Name == "System.Int32") ||
            (member.Name == "ToString" && count == 0 && member.Type.Name == "System.String") ||
            ([]string{"op_Equality", "op_Inequality"}.Contains(member.Name) && count == 2 && member.Type.Name == "System.Boolean") ||
            (member.Name == "Deconstruct" && member.Type.Name == "System.Void" && member.Parameters.All(item -> item.Name.EndsWith("@"))) ||
            (member.Name == "<Clone>$" && count == 0)
    }
}
