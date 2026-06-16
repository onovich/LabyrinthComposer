use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
};

use serde::Serialize;
use tauri::Manager;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreferencesFileResult {
    text: Option<String>,
    path: String,
    log_directory: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreferencesWriteResult {
    path: String,
}

const PREFERENCES_FILE: &str = "preferences.json";
const LOG_DIRECTORY: &str = "logs";
const LOG_FILE: &str = "labyrinth-composer.log";

fn preferences_path_at(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(PREFERENCES_FILE)
}

fn logs_dir_at(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(LOG_DIRECTORY)
}

fn log_file_path_at(app_data_dir: &Path) -> PathBuf {
    logs_dir_at(app_data_dir).join(LOG_FILE)
}

fn normalize_path(path: &Path) -> Result<String, String> {
    path.to_str()
        .map(ToOwned::to_owned)
        .ok_or_else(|| "Preferences path contains invalid UTF-8.".to_string())
}

fn load_preferences_text_at(app_data_dir: &Path) -> Result<Option<String>, String> {
    let path = preferences_path_at(app_data_dir);

    match fs::read_to_string(&path) {
        Ok(text) => Ok(Some(text)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("Failed to read preferences: {error}")),
    }
}

fn write_preferences_text_at(app_data_dir: &Path, text: &str) -> Result<PathBuf, String> {
    fs::create_dir_all(app_data_dir)
        .map_err(|error| format!("Failed to create app data directory: {error}"))?;

    let path = preferences_path_at(app_data_dir);

    fs::write(&path, text).map_err(|error| format!("Failed to write preferences: {error}"))?;

    Ok(path)
}

fn append_app_log_at(app_data_dir: &Path, entry: &str) -> Result<PathBuf, String> {
    let log_dir = logs_dir_at(app_data_dir);

    fs::create_dir_all(&log_dir)
        .map_err(|error| format!("Failed to create app log directory: {error}"))?;

    let path = log_file_path_at(app_data_dir);
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|error| format!("Failed to open app log: {error}"))?;

    writeln!(file, "{entry}").map_err(|error| format!("Failed to append app log: {error}"))?;

    Ok(path)
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {error}"))
}

#[tauri::command]
pub fn load_preferences(app: tauri::AppHandle) -> Result<PreferencesFileResult, String> {
    let app_data_dir = app_data_dir(&app)?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|error| format!("Failed to create app data directory: {error}"))?;

    let path = preferences_path_at(&app_data_dir);
    let log_directory = logs_dir_at(&app_data_dir);

    Ok(PreferencesFileResult {
        text: load_preferences_text_at(&app_data_dir)?,
        path: normalize_path(&path)?,
        log_directory: normalize_path(&log_directory)?,
    })
}

#[tauri::command]
pub fn save_preferences(
    app: tauri::AppHandle,
    text: String,
) -> Result<PreferencesWriteResult, String> {
    let app_data_dir = app_data_dir(&app)?;
    let path = write_preferences_text_at(&app_data_dir, &text)?;

    Ok(PreferencesWriteResult {
        path: normalize_path(&path)?,
    })
}

#[tauri::command]
pub fn reset_preferences(
    app: tauri::AppHandle,
    text: String,
) -> Result<PreferencesWriteResult, String> {
    save_preferences(app, text)
}

#[tauri::command]
pub fn append_app_log(
    app: tauri::AppHandle,
    entry: String,
) -> Result<PreferencesWriteResult, String> {
    let app_data_dir = app_data_dir(&app)?;
    let path = append_app_log_at(&app_data_dir, &entry)?;

    Ok(PreferencesWriteResult {
        path: normalize_path(&path)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_app_data_dir(name: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock is before unix epoch")
            .as_nanos();

        std::env::temp_dir().join(format!(
            "labyrinth-composer-preferences-{name}-{}-{nonce}",
            std::process::id()
        ))
    }

    #[test]
    fn missing_preferences_load_as_none() {
        let app_data_dir = temp_app_data_dir("missing");

        assert_eq!(
            load_preferences_text_at(&app_data_dir).expect("load preferences"),
            None
        );

        let _ = fs::remove_dir_all(app_data_dir);
    }

    #[test]
    fn preferences_write_stays_in_app_data_dir() {
        let app_data_dir = temp_app_data_dir("write");
        let path = write_preferences_text_at(&app_data_dir, "{\"version\":1}\n")
            .expect("write preferences");

        assert_eq!(path, app_data_dir.join(PREFERENCES_FILE));
        assert_eq!(
            fs::read_to_string(path).expect("read preferences"),
            "{\"version\":1}\n"
        );

        let _ = fs::remove_dir_all(app_data_dir);
    }

    #[test]
    fn app_log_writes_under_logs_directory() {
        let app_data_dir = temp_app_data_dir("logs");
        let path =
            append_app_log_at(&app_data_dir, "{\"entry\":\"Opened project\"}").expect("append log");

        assert_eq!(path, app_data_dir.join(LOG_DIRECTORY).join(LOG_FILE));
        assert!(fs::read_to_string(path)
            .expect("read log")
            .contains("Opened project"));

        let _ = fs::remove_dir_all(app_data_dir);
    }
}
