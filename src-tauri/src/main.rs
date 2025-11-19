// main.rs
// UPDATED: Added deep linking support and auth commands

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod state;
mod types;

use std::sync::Mutex;
use tauri::{GlobalShortcutManager, Manager};
use types::WhisperSettings;

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(None::<WhisperSettings>))
        .invoke_handler(tauri::generate_handler![
            // Settings commands
            commands::settings::get_settings_command,
            commands::settings::save_settings_command,
            commands::settings::reset_settings_command,
            // Shortcut commands
            commands::shortcuts::register_shortcuts_command,
            commands::shortcuts::unregister_shortcuts_command,
            commands::shortcuts::update_shortcut_command,
            commands::shortcuts::reset_shortcut_command,
            // Window management commands
            commands::window::close_app_command,
            commands::window::restart_app_command,
            commands::window::set_opacity_command,
            commands::window::move_window_command,
            commands::window::hide_window_command,
            commands::window::show_window_command,
            commands::window::toggle_window_visibility_command,
            commands::window::set_always_on_top_command,
            commands::window::get_app_version_command,
            commands::window::delete_cache_command,
            commands::window::set_window_size_command,
            commands::window::set_window_focusable_command,
            // ✨ NEW: Auth commands
            commands::auth::open_external_url,
            commands::auth::open_checkout_portal,
        ])
        .setup(|app| {
            println!("WhisprGPT is starting...");

            // ============================================================
            // SETUP DEEP LINKING FOR OAUTH CALLBACK
            // ============================================================
            // Register custom protocol handler for whisprgpt://
            // This handles OAuth callbacks from Google

            let app_handle = app.handle();

            // Listen for deep link events
            #[cfg(target_os = "windows")]
            {
                // On Windows, we need to handle command line arguments
                // because deep links come through as arguments to the app
                let args: Vec<String> = std::env::args().collect();
                println!("App started with args: {:?}", args);

                // Check if any arg starts with "whisprgpt://"
                for arg in args.iter() {
                    if arg.starts_with("whisprgpt://callback") {
                        println!("🔗 Deep link detected: {}", arg);
                        handle_deep_link(&app_handle, arg.to_string());
                    }
                }
            }

            #[cfg(target_os = "macos")]
            {
                // On macOS, we use the standard URL event handler
                use tauri::Manager;
                app.listen_global("deep-link", move |event| {
                    if let Some(payload) = event.payload() {
                        println!("🔗 Deep link detected: {}", payload);
                        handle_deep_link(&app_handle, payload.to_string());
                    }
                });
            }

            // ============================================================
            // REGISTER GLOBAL HOTKEYS (existing code)
            // ============================================================
            if let Some(window) = app.get_window("main") {
                // Set always on top by default
                let _ = window.set_always_on_top(true);
                println!("Main window initialized with always-on-top");

                let mut shortcut_manager = app.global_shortcut_manager();

                // Clone window for each closure
                let window_up = window.clone();
                let window_down = window.clone();
                let window_left = window.clone();
                let window_right = window.clone();
                let window_hide = window.clone();

                // Ctrl + Up Arrow - Move window up
                shortcut_manager
                    .register("Ctrl+Up", move || {
                        if let Ok(pos) = window_up.outer_position() {
                            let _ = window_up.set_position(tauri::Position::Physical(
                                tauri::PhysicalPosition {
                                    x: pos.x,
                                    y: pos.y - 20,
                                },
                            ));
                        }
                    })
                    .expect("Failed to register Ctrl+Up hotkey");

                // Ctrl + Down Arrow - Move window down
                shortcut_manager
                    .register("Ctrl+Down", move || {
                        if let Ok(pos) = window_down.outer_position() {
                            let _ = window_down.set_position(tauri::Position::Physical(
                                tauri::PhysicalPosition {
                                    x: pos.x,
                                    y: pos.y + 20,
                                },
                            ));
                        }
                    })
                    .expect("Failed to register Ctrl+Down hotkey");

                // Ctrl + Left Arrow - Move window left
                shortcut_manager
                    .register("Ctrl+Left", move || {
                        if let Ok(pos) = window_left.outer_position() {
                            let _ = window_left.set_position(tauri::Position::Physical(
                                tauri::PhysicalPosition {
                                    x: pos.x - 20,
                                    y: pos.y,
                                },
                            ));
                        }
                    })
                    .expect("Failed to register Ctrl+Left hotkey");

                // Ctrl + Right Arrow - Move window right
                shortcut_manager
                    .register("Ctrl+Right", move || {
                        if let Ok(pos) = window_right.outer_position() {
                            let _ = window_right.set_position(tauri::Position::Physical(
                                tauri::PhysicalPosition {
                                    x: pos.x + 20,
                                    y: pos.y,
                                },
                            ));
                        }
                    })
                    .expect("Failed to register Ctrl+Right hotkey");

                // Ctrl + H - Toggle hide/show window
                shortcut_manager
                    .register("Ctrl+H", move || {
                        if let Ok(is_visible) = window_hide.is_visible() {
                            if is_visible {
                                let _ = window_hide.hide();
                            } else {
                                let _ = window_hide.show();
                            }
                        }
                    })
                    .expect("Failed to register Ctrl+H hotkey");

                println!("✅ Global hotkeys registered:");
                println!("   Ctrl+Arrow Keys - Move window");
                println!("   Ctrl+H - Toggle hide/show");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ============================================================================
// DEEP LINK HANDLER
// ============================================================================
fn handle_deep_link(app_handle: &tauri::AppHandle, url: String) {
    println!("📥 Processing deep link: {}", url);

    // Parse the URL to extract the auth code
    // Format: whisprgpt://callback?code=XXXXX
    if let Some(code) = extract_code_from_url(&url) {
        println!("✅ Extracted auth code: {}", code);

        // Get the main window
        if let Some(window) = app_handle.get_window("main") {
            // Call the auth handler to emit event to frontend
            if let Err(e) = commands::auth::handle_auth_callback(&window, code) {
                eprintln!("❌ Failed to handle auth callback: {}", e);
            }
        } else {
            eprintln!("❌ Main window not found");
        }
    } else {
        eprintln!("❌ Failed to extract code from URL: {}", url);
    }
}

// ============================================================================
// EXTRACT CODE FROM URL
// ============================================================================
fn extract_code_from_url(url: &str) -> Option<String> {
    // Parse URL: whisprgpt://callback?code=XXXXX
    let parts: Vec<&str> = url.split('?').collect();
    if parts.len() < 2 {
        return None;
    }

    // Parse query parameters
    let query = parts[1];
    for param in query.split('&') {
        let kv: Vec<&str> = param.split('=').collect();
        if kv.len() == 2 && kv[0] == "code" {
            return Some(kv[1].to_string());
        }
    }

    None
}

// ============================================================================
// NOTES FOR DEPLOYMENT:
// ============================================================================
//
// For Windows:
// 1. Deep linking requires installer (doesn't work in dev mode)
// 2. URL scheme is registered during installation
// 3. Test with: `npm run tauri build` → install .exe → test OAuth
//
// For macOS:
// 1. Add to Info.plist (Tauri handles this automatically)
// 2. URL scheme: whisprgpt://
// 3. Works in both dev and production
//
// For Linux:
// 1. Create .desktop file with MimeType=x-scheme-handler/whisprgpt
// 2. Register with xdg-mime
