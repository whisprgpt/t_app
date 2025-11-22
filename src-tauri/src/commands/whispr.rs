// commands/whispr.rs
// UPDATED: Navigate main window URL (like Electron) instead of creating new window

use log::info;
use tauri::Manager;

// ============================================================================
// Launch Whispr Mode - Navigate main window to AI provider URL
// ============================================================================
#[tauri::command]
pub fn launch_whispr_mode_command(
    app_handle: tauri::AppHandle,
    url: String,
) -> Result<(), String> {
    info!("🚀 Launching Whispr mode with URL: {}", url);

    if let Some(main_window) = app_handle.get_window("main") {
        // Navigate the main window to the AI provider URL
        main_window
            .eval(&format!("window.location.href = '{}'", url))
            .map_err(|e| format!("Failed to navigate window: {}", e))?;
        
        info!("✅ Main window navigated to: {}", url);
    } else {
        return Err("Main window not found".to_string());
    }

    Ok(())
}

// ============================================================================
// Navigate to Dashboard - Reload main window to show React app
// ============================================================================
#[tauri::command]
pub fn navigate_to_dashboard_command(app_handle: tauri::AppHandle) -> Result<(), String> {
    info!("🏠 Navigating back to dashboard");

    if let Some(main_window) = app_handle.get_window("main") {
        // Navigate back to the React app (reload the app URL)
        #[cfg(debug_assertions)]
        let app_url = "http://localhost:1420";
        
        #[cfg(not(debug_assertions))]
        let app_url = "tauri://localhost";
        
        main_window
            .eval(&format!("window.location.href = '{}'", app_url))
            .map_err(|e| format!("Failed to navigate to dashboard: {}", e))?;
        
        info!("✅ Main window navigated back to dashboard");
    } else {
        return Err("Main window not found".to_string());
    }

    Ok(())
}

// ============================================================================
// Get Current Route - Not really applicable with this approach
// ============================================================================
#[tauri::command]
pub fn get_current_route_command(_app_handle: tauri::AppHandle) -> Result<String, String> {
    // Since we're navigating away from the React app entirely,
    // this becomes less meaningful. Return a placeholder.
    Ok("/".to_string())
}