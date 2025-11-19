// state/settings.rs
// This file handles reading/writing settings to disk.
// It replaces electron-store from your Electron app.

use crate::types::WhisperSettings;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

// ============================================================================
// RUST CONCEPT: Result<T, E>
// ============================================================================
// Result is Rust's way of handling errors (no try/catch!)
// - Result<WhisperSettings, String> means:
//   - Success: Returns WhisperSettings
//   - Error: Returns a String error message
// This is like TypeScript's: Promise<WhisperSettings> that might throw

// ============================================================================
// Get the path to the settings file
// ============================================================================
fn get_settings_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    // RUST CONCEPT: &AppHandle is a "reference" (like passing by reference in C++)
    // The & means we're borrowing the AppHandle, not taking ownership
    
    // Get the app's data directory (like app.getPath('userData') in Electron)
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())?;
    
    // RUST CONCEPT: ? operator
    // The ? at the end is like "await" + automatic error handling
    // If there's an error, it returns early with that error
    
    // Create the directory if it doesn't exist
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;
    
    // Return the full path to settings.json
    Ok(app_dir.join("settings.json"))
}

// ============================================================================
// Load settings from disk
// ============================================================================
pub fn load_settings(app_handle: &AppHandle) -> Result<WhisperSettings, String> {
    let settings_path = get_settings_path(app_handle)?;
    
    // Check if the file exists
    if !settings_path.exists() {
        // If no file exists, return default settings
        // RUST CONCEPT: We don't save yet - we let the user trigger the first save
        return Ok(WhisperSettings::default());
    }
    
    // Read the file contents
    // RUST CONCEPT: fs::read_to_string() is like fs.readFileSync() in Node.js
    let contents = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings file: {}", e))?;
    
    // Parse JSON into WhisperSettings struct
    // RUST CONCEPT: serde_json::from_str() is like JSON.parse() in JavaScript
    let settings: WhisperSettings = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse settings JSON: {}", e))?;
    
    Ok(settings)
}

// ============================================================================
// Save settings to disk
// ============================================================================
pub fn save_settings(
    app_handle: &AppHandle,
    settings: &WhisperSettings,
) -> Result<(), String> {
    // RUST CONCEPT: Result<(), String> means:
    // - Success: Returns nothing (the empty tuple ())
    // - Error: Returns a String error message
    
    let settings_path = get_settings_path(app_handle)?;
    
    // Convert the settings struct to JSON
    // RUST CONCEPT: serde_json::to_string_pretty() is like JSON.stringify(obj, null, 2)
    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    // Write to file
    // RUST CONCEPT: fs::write() is like fs.writeFileSync() in Node.js
    fs::write(&settings_path, json)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;
    
    Ok(())
}

// ============================================================================
// Reset settings to default
// ============================================================================
pub fn reset_settings(app_handle: &AppHandle) -> Result<WhisperSettings, String> {
    let default_settings = WhisperSettings::default();
    
    // Save the default settings to disk
    save_settings(app_handle, &default_settings)?;
    
    Ok(default_settings)
}

// ============================================================================
// SUMMARY FOR JAVASCRIPT DEVELOPERS:
// ============================================================================
// This file provides three functions:
// 
// 1. load_settings(app_handle) -> Result<WhisperSettings, String>
//    - Like: async function loadSettings(): Promise<WhisperSettings>
//    - Reads settings.json from disk, returns default if file doesn't exist
//
// 2. save_settings(app_handle, settings) -> Result<(), String>
//    - Like: async function saveSettings(settings: WhisperSettings): Promise<void>
//    - Writes settings to settings.json
//
// 3. reset_settings(app_handle) -> Result<WhisperSettings, String>
//    - Like: async function resetSettings(): Promise<WhisperSettings>
//    - Resets to default and saves
//
// Key differences from JavaScript:
// - No try/catch - Rust uses Result<T, E> for error handling
// - No async/await (yet) - these are synchronous file operations
// - Explicit error handling with ? operator
// - Type safety enforced at compile time