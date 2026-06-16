# Unity Importer Example

This example consumes `../engine-export/sample-engine-export.json`.

Copy `LabyrinthEngineImporter.cs` into a Unity project, load the exported JSON text from a `TextAsset` or file, then call:

```csharp
var data = LabyrinthEngineImporter.FromJson(jsonText);
var space = LabyrinthEngineImporter.FindSpace(data, "entry");
var gate = LabyrinthEngineImporter.FindGate(data, "brass-key-gate");
var token = LabyrinthEngineImporter.FindToken(data, "brass-key");
```

The importer reads the engine export artifact only. It does not modify `.lcproj.json` project files and does not define the project schema.
