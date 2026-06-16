use std::{
    fs,
    path::{Path, PathBuf},
};

use serde::Serialize;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectFileResult {
    text: String,
    path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SaveProjectFileResult {
    path: String,
}

fn ensure_supported_project_path(path: &Path) -> Result<(), String> {
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    if file_name.ends_with(".lcproj.json") || extension == "json" {
        Ok(())
    } else {
        Err("Only .lcproj.json and JSON project files are supported.".to_string())
    }
}

fn ensure_supported_report_path(path: &Path, format: &str) -> Result<(), String> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    match format {
        "markdown" if extension == "md" || extension == "markdown" => Ok(()),
        "json" if extension == "json" => Ok(()),
        "markdown" => Err("Markdown reports must use .md or .markdown.".to_string()),
        "json" => Err("JSON reports must use .json.".to_string()),
        _ => Err("Report format must be markdown or json.".to_string()),
    }
}

fn ensure_supported_engine_export_path(path: &Path) -> Result<(), String> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    if extension == "json" {
        Ok(())
    } else {
        Err("Engine exports must use .json.".to_string())
    }
}

fn normalize_path(path: &Path) -> Result<String, String> {
    path.to_str()
        .map(ToOwned::to_owned)
        .ok_or_else(|| "Project path contains invalid UTF-8.".to_string())
}

#[tauri::command]
fn open_project_file(app: tauri::AppHandle) -> Result<Option<ProjectFileResult>, String> {
    let Some(path) = app
        .dialog()
        .file()
        .add_filter("Labyrinth Project JSON", &["json"])
        .blocking_pick_file()
    else {
        return Ok(None);
    };
    let path = path
        .into_path()
        .map_err(|_| "Selected project path is not a local filesystem path.".to_string())?;

    ensure_supported_project_path(&path)?;

    let text = fs::read_to_string(&path)
        .map_err(|error| format!("Failed to read project file: {error}"))?;

    Ok(Some(ProjectFileResult {
        text,
        path: normalize_path(&path)?,
    }))
}

#[tauri::command]
fn save_project_file(text: String, path: String) -> Result<SaveProjectFileResult, String> {
    let path = PathBuf::from(path);

    ensure_supported_project_path(&path)?;
    fs::write(&path, text).map_err(|error| format!("Failed to save project file: {error}"))?;

    Ok(SaveProjectFileResult {
        path: normalize_path(&path)?,
    })
}

#[tauri::command]
fn save_project_file_as(
    app: tauri::AppHandle,
    text: String,
) -> Result<Option<SaveProjectFileResult>, String> {
    let Some(path) = app
        .dialog()
        .file()
        .add_filter("Labyrinth Project JSON", &["json"])
        .set_file_name("labyrinth-composer.lcproj.json")
        .blocking_save_file()
    else {
        return Ok(None);
    };
    let path = path
        .into_path()
        .map_err(|_| "Selected project path is not a local filesystem path.".to_string())?;

    ensure_supported_project_path(&path)?;
    fs::write(&path, text).map_err(|error| format!("Failed to save project file: {error}"))?;

    Ok(Some(SaveProjectFileResult {
        path: normalize_path(&path)?,
    }))
}

#[tauri::command]
fn save_report_file_as(
    app: tauri::AppHandle,
    text: String,
    format: String,
) -> Result<Option<SaveProjectFileResult>, String> {
    let (filter_name, extensions, file_name) = match format.as_str() {
        "markdown" => (
            "Markdown Report",
            vec!["md", "markdown"],
            "labyrinth-report.md",
        ),
        "json" => ("JSON Report", vec!["json"], "labyrinth-report.json"),
        _ => return Err("Report format must be markdown or json.".to_string()),
    };
    let Some(path) = app
        .dialog()
        .file()
        .add_filter(filter_name, &extensions)
        .set_file_name(file_name)
        .blocking_save_file()
    else {
        return Ok(None);
    };
    let path = path
        .into_path()
        .map_err(|_| "Selected report path is not a local filesystem path.".to_string())?;

    ensure_supported_report_path(&path, &format)?;
    fs::write(&path, text).map_err(|error| format!("Failed to save report file: {error}"))?;

    Ok(Some(SaveProjectFileResult {
        path: normalize_path(&path)?,
    }))
}

#[tauri::command]
fn save_engine_export_file_as(
    app: tauri::AppHandle,
    text: String,
) -> Result<Option<SaveProjectFileResult>, String> {
    let Some(path) = app
        .dialog()
        .file()
        .add_filter("Engine Export JSON", &["json"])
        .set_file_name("engine-export.json")
        .blocking_save_file()
    else {
        return Ok(None);
    };
    let path = path
        .into_path()
        .map_err(|_| "Selected engine export path is not a local filesystem path.".to_string())?;

    ensure_supported_engine_export_path(&path)?;
    fs::write(&path, text)
        .map_err(|error| format!("Failed to save engine export file: {error}"))?;

    Ok(Some(SaveProjectFileResult {
        path: normalize_path(&path)?,
    }))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            open_project_file,
            save_project_file,
            save_project_file_as,
            save_report_file_as,
            save_engine_export_file_as
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Labyrinth Composer");
}
