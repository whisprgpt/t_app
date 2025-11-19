// commands/window.rs
// Window management commands - replaces your Electron window/app IPC handlers
// TAURI V1 COMPATIBLE

use tauri::{AppHandle, Window};

// ============================================================================
// IMPORTANT NOTE ABOUT TAURI V1 LIMITATIONS
// ============================================================================
// Tauri v1 has fewer window management APIs than Electron or Tauri v2.
// Some features (like set_opacity, set_focusable) are not available.
// We'll implement what's available and note limitations.

// ============================================================================
// Close App Command
// ============================================================================
#[tauri::command]
pub fn close_app_command(window: Window) -> Result<(), String> {
    window
        .close()
        .map_err(|e| format!("Failed to close window: {}", e))?;
    Ok(())
}

// ============================================================================
// Restart App Command
// ============================================================================
#[tauri::command]
pub fn restart_app_command(app_handle: AppHandle) -> Result<(), String> {
    app_handle.restart();
    Ok(())
}

// ============================================================================
// Set Opacity Command - LIMITED SUPPORT IN V1
// ============================================================================
// NOTE: Tauri v1 doesn't have set_opacity() on all platforms.
// We'll return an informative error for now.
#[tauri::command]
pub fn set_opacity_command(_window: Window, opacity: f64) -> Result<(), String> {
    if opacity < 0.0 || opacity > 1.0 {
        return Err("Opacity must be between 0.0 and 1.0".to_string());
    }

    // Tauri v1 limitation: opacity control not available
    // Options:
    // 1. Upgrade to Tauri v2
    // 2. Use CSS opacity on the web content instead
    // 3. Use platform-specific workarounds

    Err("Opacity control is not available in Tauri v1. Use CSS opacity on your React components instead, or upgrade to Tauri v2.".to_string())
}

// ============================================================================
// Move Window Command
// ============================================================================
#[tauri::command]
pub fn move_window_command(window: Window, delta_x: i32, delta_y: i32) -> Result<(), String> {
    let position = window
        .outer_position()
        .map_err(|e| format!("Failed to get window position: {}", e))?;

    let new_x = position.x + delta_x;
    let new_y = position.y + delta_y;

    window
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: new_x,
            y: new_y,
        }))
        .map_err(|e| format!("Failed to set window position: {}", e))?;

    Ok(())
}

// ============================================================================
// Hide Window Command
// ============================================================================
#[tauri::command]
pub fn hide_window_command(window: Window) -> Result<(), String> {
    window
        .hide()
        .map_err(|e| format!("Failed to hide window: {}", e))?;
    Ok(())
}

// ============================================================================
// Show Window Command
// ============================================================================
#[tauri::command]
pub fn show_window_command(window: Window, _opacity: f64) -> Result<(), String> {
    // Note: opacity parameter is ignored in v1 (not supported)
    window
        .show()
        .map_err(|e| format!("Failed to show window: {}", e))?;
    Ok(())
}

// ============================================================================
// Toggle Window Visibility
// ============================================================================
#[tauri::command]
pub fn toggle_window_visibility_command(window: Window, opacity: f64) -> Result<(), String> {
    let is_visible = window
        .is_visible()
        .map_err(|e| format!("Failed to check visibility: {}", e))?;

    if is_visible {
        hide_window_command(window)?;
    } else {
        show_window_command(window, opacity)?;
    }

    Ok(())
}

// ============================================================================
// Set Always On Top
// ============================================================================
#[tauri::command]
pub fn set_always_on_top_command(window: Window, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| format!("Failed to set always on top: {}", e))?;
    Ok(())
}

// ============================================================================
// Get App Version
// ============================================================================
#[tauri::command]
pub fn get_app_version_command(app_handle: AppHandle) -> Result<String, String> {
    let version = app_handle.package_info().version.to_string();
    Ok(version)
}

// ============================================================================
// Delete Cache Command
// ============================================================================
#[tauri::command]
pub fn delete_cache_command(window: Window) -> Result<String, String> {
    let clear_script = r#"
        (function() {
            try {
                localStorage.clear();
                sessionStorage.clear();
                
                if (window.indexedDB && window.indexedDB.databases) {
                    indexedDB.databases().then(dbs => {
                        dbs.forEach(db => {
                            if (db.name) indexedDB.deleteDatabase(db.name);
                        });
                    });
                }
                
                return 'success';
            } catch (e) {
                return 'error: ' + e.message;
            }
        })()
    "#;

    window
        .eval(clear_script)
        .map_err(|e| format!("Failed to clear cache: {}", e))?;

    Ok("Cache cleared successfully".to_string())
}

// ============================================================================
// Set Window Size
// ============================================================================
#[tauri::command]
pub fn set_window_size_command(window: Window, width: u32, height: u32) -> Result<(), String> {
    window
        .set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }))
        .map_err(|e| format!("Failed to set window size: {}", e))?;

    Ok(())
}

// ============================================================================
// Set Window Focusable - NOT AVAILABLE IN V1
// ============================================================================
#[tauri::command]
pub fn set_window_focusable_command(_window: Window, _focusable: bool) -> Result<(), String> {
    // Tauri v1 doesn't have set_focusable()
    // This would require Tauri v2 or platform-specific code
    Err("set_focusable is not available in Tauri v1. This feature requires Tauri v2.".to_string())
}

// ============================================================================
// TAURI V1 vs V2 NOTES:
// ============================================================================
// Missing in v1 (available in v2):
// - set_opacity() - Window transparency
// - set_focusable() - Whether window can be focused
// - set_ignore_cursor_events() - Pass-through clicks
//
// Workarounds:
// 1. Use CSS opacity instead of window opacity
// 2. Upgrade to Tauri v2 for full API support
// 3. Use platform-specific native code (complex)
//
// What works in v1:
// ✅ show/hide
// ✅ set_always_on_top
// ✅ set_position
// ✅ set_size
// ✅ close
// ✅ restart (app level)
