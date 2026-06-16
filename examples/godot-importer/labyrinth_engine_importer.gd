class_name LabyrinthEngineImporter
extends RefCounted

static func load_from_text(text: String) -> Dictionary:
	var parsed = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return {}
	return parsed

static func find_space(export_data: Dictionary, id: String) -> Dictionary:
	return _find_by_id(export_data.get("spaces", []), id)

static func find_gate(export_data: Dictionary, id: String) -> Dictionary:
	return _find_by_id(export_data.get("gates", []), id)

static func find_token(export_data: Dictionary, id: String) -> Dictionary:
	return _find_by_id(export_data.get("tokens", []), id)

static func _find_by_id(items: Array, id: String) -> Dictionary:
	for item in items:
		if typeof(item) == TYPE_DICTIONARY and item.get("id", "") == id:
			return item
	return {}
