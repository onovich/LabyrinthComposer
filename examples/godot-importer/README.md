# Godot Importer Example

This example consumes `../engine-export/sample-engine-export.json`.

Add `labyrinth_engine_importer.gd` to a Godot project, load the exported JSON text with `FileAccess`, then call:

```gdscript
var data = LabyrinthEngineImporter.load_from_text(json_text)
var space = LabyrinthEngineImporter.find_space(data, "entry")
var gate = LabyrinthEngineImporter.find_gate(data, "brass-key-gate")
var token = LabyrinthEngineImporter.find_token(data, "brass-key")
```

The importer reads the engine export artifact only. It does not modify `.lcproj.json` project files and does not define the project schema.
