// src-tauri/src/commands/shortcuts.rs
// UPDATED: Using log crate for proper logging

use crate::types::WhisperSettings;
use log::{debug, error, info};
use std::sync::Mutex;
use tauri::{AppHandle, GlobalShortcutManager, State};

// Shortcut Parser
pub fn parse_shortcut(verbose: &str, is_mac: bool) -> Option<String> {
    if verbose.is_empty() {
        return None;
    }

    let parts: Vec<String> = verbose
        .split('+')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|part| match part.to_lowercase().as_str() {
            "⌘" | "cmd" | "command" => {
                if is_mac {
                    "Cmd".to_string()
                } else {
                    "Ctrl".to_string()
                }
            }
            "ctrl" | "control" => "Ctrl".to_string(),
            "shift" => "Shift".to_string(),
            "alt" | "⌥" | "option" => "Alt".to_string(),
            "↑" | "up" => "Up".to_string(),
            "↓" | "down" => "Down".to_string(),
            "←" | "left" => "Left".to_string(),
            "→" | "right" => "Right".to_string(),
            "↵" | "enter" | "return" => "Enter".to_string(),
            "esc" | "escape" => "Escape".to_string(),
            "space" => "Space".to_string(),
            "tab" => "Tab".to_string(),
            _ => {
                if part.len() == 1 {
                    part.to_uppercase()
                } else {
                    let mut chars = part.chars();
                    match chars.next() {
                        None => String::new(),
                        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                    }
                }
            }
        })
        .collect();

    if parts.is_empty() {
        None
    } else {
        Some(parts.join("+"))
    }
}

#[tauri::command]
pub fn register_shortcuts_command(
    app: AppHandle,
    settings: State<Mutex<WhisperSettings>>,
) -> Result<bool, String> {
    info!("⌨️  Registering shortcuts...");

    let settings = settings.lock().map_err(|e| e.to_string())?;
    let is_mac = cfg!(target_os = "macos");

    let mut shortcut_manager = app.global_shortcut_manager();

    shortcut_manager
        .unregister_all()
        .map_err(|e| format!("Failed to unregister shortcuts: {}", e))?;

    let mut registered = 0;
    let mut failed = 0;

    for (key, shortcut_entry) in &settings.shortcuts {
        let platform = if is_mac { "mac" } else { "windows" };

        // Get shortcut string - check custom first, then default
        let shortcut_str = if let Some(custom) = &shortcut_entry.custom_shortcut {
            if platform == "mac" {
                custom
                    .mac
                    .as_deref()
                    .unwrap_or(&shortcut_entry.default_shortcut.mac)
            } else {
                custom
                    .windows
                    .as_deref()
                    .unwrap_or(&shortcut_entry.default_shortcut.windows)
            }
        } else {
            if platform == "mac" {
                &shortcut_entry.default_shortcut.mac
            } else {
                &shortcut_entry.default_shortcut.windows
            }
        };

        if shortcut_str.is_empty() {
            continue;
        }

        if let Some(parsed) = parse_shortcut(shortcut_str, is_mac) {
            let key_clone = key.clone();

            match shortcut_manager.register(&parsed, move || {
                debug!("Shortcut triggered: {}", key_clone);
            }) {
                Ok(_) => {
                    debug!("Registered shortcut: {} -> {}", key, parsed);
                    registered += 1;
                }
                Err(e) => {
                    error!("Failed to register shortcut {}: {}", key, e);
                    failed += 1;
                }
            }
        }
    }

    info!(
        "✅ Shortcuts registered: {} succeeded, {} failed",
        registered, failed
    );
    Ok(true)
}

#[tauri::command]
pub fn unregister_shortcuts_command(app: AppHandle) -> Result<bool, String> {
    info!("🔕 Unregistering all shortcuts...");

    app.global_shortcut_manager()
        .unregister_all()
        .map_err(|e| format!("Failed to unregister shortcuts: {}", e))?;

    info!("✅ All shortcuts unregistered");
    Ok(true)
}

#[tauri::command]
pub fn update_shortcut_command(
    command_key: String,
    shortcut: String,
    platform: String,
    settings: State<Mutex<WhisperSettings>>,
) -> Result<bool, String> {
    info!(
        "🔧 Updating shortcut '{}' to '{}' on {}",
        command_key, shortcut, platform
    );

    let mut settings = settings.lock().map_err(|e| e.to_string())?;

    if let Some(shortcut_entry) = settings.shortcuts.get_mut(&command_key) {
        let mut custom = shortcut_entry.custom_shortcut.clone().unwrap_or_else(|| {
            crate::types::CustomShortcut {
                mac: None,
                windows: None,
            }
        });

        if platform == "mac" {
            custom.mac = Some(shortcut.clone());
        } else {
            custom.windows = Some(shortcut.clone());
        }

        shortcut_entry.custom_shortcut = Some(custom);
        info!("✅ Shortcut '{}' updated successfully", command_key);
        Ok(true)
    } else {
        error!("❌ Shortcut command '{}' not found", command_key);
        Err(format!("Shortcut command '{}' not found", command_key))
    }
}

#[tauri::command]
pub fn reset_shortcut_command(
    command_key: String,
    settings: State<Mutex<WhisperSettings>>,
) -> Result<bool, String> {
    info!("🔄 Resetting shortcut '{}'", command_key);

    let mut settings = settings.lock().map_err(|e| e.to_string())?;

    if let Some(shortcut_entry) = settings.shortcuts.get_mut(&command_key) {
        shortcut_entry.custom_shortcut = None;
        info!("✅ Shortcut '{}' reset to default", command_key);
        Ok(true)
    } else {
        error!("❌ Shortcut command '{}' not found", command_key);
        Err(format!("Shortcut command '{}' not found", command_key))
    }
}
