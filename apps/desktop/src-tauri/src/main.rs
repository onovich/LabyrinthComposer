use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
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

const LCPROJ_CANONICAL_PROJECT_FILE: &str = "project.json";
const LCPROJ_PACKAGE_EXTENSION: &str = "lcproj";

fn is_lcproj_package_path(path: &Path) -> bool {
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

    extension == LCPROJ_PACKAGE_EXTENSION && file_name.ends_with(".lcproj")
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

    if is_lcproj_package_path(path) || file_name.ends_with(".lcproj.json") || extension == "json" {
        Ok(())
    } else {
        Err(
            "Only .lcproj packages, .lcproj.json, and JSON project files are supported."
                .to_string(),
        )
    }
}

fn canonical_project_path(path: &Path) -> Result<PathBuf, String> {
    ensure_supported_project_path(path)?;

    if is_lcproj_package_path(path) {
        Ok(path.join(LCPROJ_CANONICAL_PROJECT_FILE))
    } else {
        Ok(path.to_path_buf())
    }
}

fn read_project_text(path: &Path) -> Result<String, String> {
    let canonical_path = canonical_project_path(path)?;

    fs::read_to_string(&canonical_path)
        .map_err(|error| format!("Failed to read project file: {error}"))
}

fn unique_sidecar_path(path: &Path, label: &str) -> Result<PathBuf, String> {
    let parent = path
        .parent()
        .ok_or_else(|| "Project path must have a parent directory.".to_string())?;
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "Project path contains invalid UTF-8.".to_string())?;
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("System clock error while saving project: {error}"))?
        .as_nanos();

    Ok(parent.join(format!(
        ".{file_name}.{label}-{}-{nonce}",
        std::process::id()
    )))
}

fn cleanup_sidecar(path: &Path) {
    let _ = fs::remove_file(path);
}

fn restore_backup(backup_path: &Path, target_path: &Path) {
    if backup_path.exists() {
        let _ = fs::rename(backup_path, target_path).or_else(|_| {
            fs::copy(backup_path, target_path)?;
            fs::remove_file(backup_path)
        });
    }
}

fn replace_file_with_staged_text(path: &Path, text: &str) -> Result<(), String> {
    let temp_path = unique_sidecar_path(path, "tmp")?;
    let backup_path = unique_sidecar_path(path, "backup")?;

    replace_file_with_staged_text_at(path, text, &temp_path, &backup_path)
}

fn replace_file_with_staged_text_at(
    path: &Path,
    text: &str,
    temp_path: &Path,
    backup_path: &Path,
) -> Result<(), String> {
    cleanup_sidecar(temp_path);
    cleanup_sidecar(backup_path);

    fs::write(temp_path, text).map_err(|error| format!("Failed to stage project save: {error}"))?;

    if !path.exists() {
        return fs::rename(temp_path, path)
            .map_err(|error| format!("Failed to finalize project save: {error}"));
    }

    fs::copy(path, backup_path)
        .map_err(|error| format!("Failed to prepare project save backup: {error}"))?;
    if let Err(error) = fs::remove_file(path) {
        cleanup_sidecar(temp_path);
        cleanup_sidecar(backup_path);
        return Err(format!("Failed to replace existing project file: {error}"));
    }

    match fs::rename(temp_path, path) {
        Ok(()) => {
            cleanup_sidecar(backup_path);
            Ok(())
        }
        Err(error) => {
            restore_backup(backup_path, path);
            cleanup_sidecar(temp_path);
            Err(format!("Failed to finalize project save: {error}"))
        }
    }
}

fn write_project_text(path: &Path, text: &str) -> Result<(), String> {
    let canonical_path = canonical_project_path(path)?;

    if is_lcproj_package_path(path) {
        fs::create_dir_all(path)
            .map_err(|error| format!("Failed to create project package: {error}"))?;
    }

    replace_file_with_staged_text(&canonical_path, text)
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
        .add_filter("Labyrinth Project", &["json", "lcproj"])
        .blocking_pick_file()
    else {
        return Ok(None);
    };
    let path = path
        .into_path()
        .map_err(|_| "Selected project path is not a local filesystem path.".to_string())?;

    ensure_supported_project_path(&path)?;

    let text = read_project_text(&path)?;

    Ok(Some(ProjectFileResult {
        text,
        path: normalize_path(&path)?,
    }))
}

#[tauri::command]
fn open_project_package(app: tauri::AppHandle) -> Result<Option<ProjectFileResult>, String> {
    let Some(path) = app.dialog().file().blocking_pick_folder() else {
        return Ok(None);
    };
    let path = path
        .into_path()
        .map_err(|_| "Selected project path is not a local filesystem path.".to_string())?;

    if !is_lcproj_package_path(&path) {
        return Err("Project packages must use the .lcproj package extension.".to_string());
    }

    let text = read_project_text(&path)?;

    Ok(Some(ProjectFileResult {
        text,
        path: normalize_path(&path)?,
    }))
}

#[tauri::command]
fn save_project_file(text: String, path: String) -> Result<SaveProjectFileResult, String> {
    let path = PathBuf::from(path);

    write_project_text(&path, &text)?;

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
        .add_filter("Labyrinth Project", &["lcproj", "json"])
        .set_file_name("labyrinth-composer.lcproj")
        .blocking_save_file()
    else {
        return Ok(None);
    };
    let path = path
        .into_path()
        .map_err(|_| "Selected project path is not a local filesystem path.".to_string())?;

    write_project_text(&path, &text)?;

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
            open_project_package,
            save_project_file,
            save_project_file_as,
            save_report_file_as,
            save_engine_export_file_as
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Labyrinth Composer");
}

#[cfg(test)]
mod tests {
    use super::*;

    const PROJECT_TEXT: &str = "{\"schemaVersion\":\"0.1.0\"}\n";

    fn temp_package_path(name: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock is before unix epoch")
            .as_nanos();

        std::env::temp_dir().join(format!(
            "labyrinth-composer-{name}-{}-{nonce}.lcproj",
            std::process::id()
        ))
    }

    fn temp_project_file_path(name: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock is before unix epoch")
            .as_nanos();

        std::env::temp_dir().join(format!(
            "labyrinth-composer-{name}-{}-{nonce}.lcproj.json",
            std::process::id()
        ))
    }

    #[test]
    fn package_read_uses_only_project_json() {
        let package_path = temp_package_path("read");
        let report_path = package_path.join("reports").join("latest-report.json");

        fs::create_dir_all(report_path.parent().expect("report path has parent"))
            .expect("create report directory");
        fs::write(
            package_path.join(LCPROJ_CANONICAL_PROJECT_FILE),
            PROJECT_TEXT,
        )
        .expect("write project");
        fs::write(&report_path, "{\"schemaVersion\":\"artifact\"}").expect("write report artifact");

        let text = read_project_text(&package_path).expect("read package project");

        assert_eq!(text, PROJECT_TEXT);

        let _ = fs::remove_dir_all(package_path);
    }

    #[test]
    fn package_write_only_updates_project_json() {
        let package_path = temp_package_path("write");
        let cache_path = package_path.join("cache").join("layout-cache.json");

        fs::create_dir_all(cache_path.parent().expect("cache path has parent"))
            .expect("create cache directory");
        fs::write(&cache_path, "{\"cached\":true}").expect("write cache artifact");

        write_project_text(&package_path, PROJECT_TEXT).expect("write package project");

        assert_eq!(
            fs::read_to_string(package_path.join(LCPROJ_CANONICAL_PROJECT_FILE))
                .expect("read project"),
            PROJECT_TEXT
        );
        assert_eq!(
            fs::read_to_string(cache_path).expect("read cache artifact"),
            "{\"cached\":true}"
        );

        let _ = fs::remove_dir_all(package_path);
    }

    #[test]
    fn file_write_replaces_existing_project_text() {
        let file_path = temp_project_file_path("replace");

        fs::write(&file_path, "old").expect("write old project");

        write_project_text(&file_path, PROJECT_TEXT).expect("replace project file");

        assert_eq!(
            fs::read_to_string(&file_path).expect("read saved project"),
            PROJECT_TEXT
        );

        let _ = fs::remove_file(file_path);
    }

    #[test]
    fn file_write_failure_preserves_existing_project_text() {
        let file_path = temp_project_file_path("backup-failure");
        let temp_path = temp_project_file_path("backup-failure-temp");
        let backup_path = temp_package_path("backup-failure-sidecar");

        fs::write(&file_path, "old").expect("write old project");
        fs::create_dir_all(&backup_path).expect("reserve backup sidecar as directory");

        let result =
            replace_file_with_staged_text_at(&file_path, PROJECT_TEXT, &temp_path, &backup_path);

        assert!(result.is_err());
        assert_eq!(
            fs::read_to_string(&file_path).expect("read preserved project"),
            "old"
        );

        let _ = fs::remove_file(file_path);
        let _ = fs::remove_file(temp_path);
        let _ = fs::remove_dir_all(backup_path);
    }

    #[test]
    fn non_lcproj_directories_are_rejected() {
        let path = PathBuf::from("ProjectFolder");

        assert!(ensure_supported_project_path(&path).is_err());
    }

    #[test]
    fn lcproj_json_file_path_remains_supported() {
        let path = PathBuf::from("Project.lcproj.json");

        assert_eq!(canonical_project_path(&path).expect("canonical path"), path);
    }
}
