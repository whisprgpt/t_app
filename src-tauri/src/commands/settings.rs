// commands/settings.rs
// These are Tauri commands - functions callable from your React frontend.
// They replace your ipcMain.handle() calls from Electron.

use crate::state::settings::{load_settings, reset_settings as reset_settings_state, save_settings};
use crate::types::WhisperSettings;
use tauri::{AppHandle, State};
use std::sync::Mutex;

// ============================================================================
// RUST CONCEPT: State Management
// ============================================================================
// In Tauri, we use State<T> to share data between commands.
// Think of it like a global variable that's thread-safe.
// 
// State<Mutex<Option<WhisperSettings>>> means:
// - State: Tauri's state container
// - Mutex: Thread-safe lock (prevents race conditions)
// - Option<WhisperSettings>: Either Some(settings) or None

// ============================================================================
// Get Settings Command
// ============================================================================
// This replaces: ipcMain.handle("get-settings", async () => { ... })
#[tauri::command]
pub fn get_settings_command(
    app_handle: AppHandle,
    state: State<Mutex<Option<WhisperSettings>>>,
) -> Result<WhisperSettings, String> {
    // RUST CONCEPT: #[tauri::command] is a macro that makes this function
    // callable from JavaScript via invoke('get_settings_command')
    
    // Try to get settings from in-memory state first
    let mut settings_lock = state.lock().unwrap();
    // RUST CONCEPT: .lock() gets exclusive access to the Mutex
    // .unwrap() says "panic if there's an error" (we know it won't error here)
    
    if let Some(settings) = settings_lock.as_ref() {
        // If we have settings in memory, return a clone
        // RUST CONCEPT: .clone() creates a copy (we need this because of ownership)
        return Ok(settings.clone());
    }
    
    // If no settings in memory, load from disk
    let settings = load_settings(&app_handle)?;
    
    // Store in memory for next time
    *settings_lock = Some(settings.clone());
    
    Ok(settings)
}

// ============================================================================
// Save Settings Command
// ============================================================================
// This replaces: ipcMain.handle("save-settings", async (_, settings) => { ... })
#[tauri::command]
pub fn save_settings_command(
    app_handle: AppHandle,
    state: State<Mutex<Option<WhisperSettings>>>,
    settings: WhisperSettings,
) -> Result<bool, String> {
    // RUST CONCEPT: "settings: WhisperSettings" means the settings are passed by value
    // Tauri automatically deserializes the JSON from JavaScript into the struct
    
    // Save to disk
    save_settings(&app_handle, &settings)?;
    
    // Update in-memory state
    let mut settings_lock = state.lock().unwrap();
    *settings_lock = Some(settings);
    
    // Return success
    Ok(true)
}

// ============================================================================
// Reset Settings Command
// ============================================================================
// This replaces: ipcMain.handle("reset-settings", async () => { ... })
#[tauri::command]
pub fn reset_settings_command(
    app_handle: AppHandle,
    state: State<Mutex<Option<WhisperSettings>>>,
) -> Result<WhisperSettings, String> {
    // Reset to default settings
    let default_settings = reset_settings_state(&app_handle)?;
    
    // Update in-memory state
    let mut settings_lock = state.lock().unwrap();
    *settings_lock = Some(default_settings.clone());
    
    Ok(default_settings)
}

// ============================================================================
// SUMMARY FOR JAVASCRIPT DEVELOPERS:
// ============================================================================
// These three commands replace your Electron IPC handlers:
//
// Electron (before):
// ipcMain.handle("get-settings", async () => getSettings())
// ipcMain.handle("save-settings", async (_, settings) => setSettings(settings))
// ipcMain.handle("reset-settings", async () => resetSettings())
//
// Tauri (now):
// #[tauri::command]
// pub fn get_settings_command(...) -> Result<WhisperSettings, String>
//
// #[tauri::command]
// pub fn save_settings_command(..., settings: WhisperSettings) -> Result<bool, String>
//
// #[tauri::command]
// pub fn reset_settings_command(...) -> Result<WhisperSettings, String>
//
// From React, you'll call these like:
// await invoke('get_settings_command')
// await invoke('save_settings_command', { settings })
// await invoke('reset_settings_command')