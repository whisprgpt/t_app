// main.rs
// UPDATED: Global hotkeys for window movement and hide/show

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
        ])
        .setup(|app| {
            println!("WhisprGPT is starting...");

            if let Some(window) = app.get_window("main") {
                // Set always on top by default
                let _ = window.set_always_on_top(true);
                println!("Main window initialized with always-on-top");

                // ============================================================
                // REGISTER GLOBAL HOTKEYS
                // ============================================================
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
// HOTKEY SUMMARY:
// ============================================================================
// Ctrl + Up Arrow    - Move window up by 20px
// Ctrl + Down Arrow  - Move window down by 20px
// Ctrl + Left Arrow  - Move window left by 20px
// Ctrl + Right Arrow - Move window right by 20px
// Ctrl + H           - Toggle hide/show window
//
// These hotkeys work system-wide (even when window is not focused)!
