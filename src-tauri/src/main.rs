// main.rs
// FIXED: Single logger initialization

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod state;
mod types;

use log::{debug, error, info};
use std::fs::OpenOptions;
use std::sync::Mutex;
use tauri::{GlobalShortcutManager, Manager};
use types::WhisperSettings;
use url::Url;

#[cfg(target_os = "windows")]
fn fix_protocol_registration() {
    use std::process::Command;

    // Get the current executable path
    let exe_path = match std::env::current_exe() {
        Ok(path) => path.to_string_lossy().to_string(),
        Err(e) => {
            error!("Failed to get current exe path: {}", e);
            return;
        }
    };

    info!("🔧 Checking protocol registration...");

    // Check if protocol is registered to Electron
    let check_cmd =
        format!(r#"reg query "HKCU\Software\Classes\whisprgpt\shell\open\command" /ve"#);

    let output = Command::new("cmd").args(&["/C", &check_cmd]).output();

    if let Ok(output) = output {
        let current_reg = String::from_utf8_lossy(&output.stdout);

        // Check if it contains "electron.exe" (old Electron app)
        if current_reg.contains("electron.exe") {
            info!("⚠️  Found old Electron registration, updating to Tauri...");

            // Update to Tauri app
            let update_cmd = format!(
                r#"reg add "HKCU\Software\Classes\whisprgpt\shell\open\command" /ve /d "\"{}\" \"%1\"" /f"#,
                exe_path
            );

            match Command::new("cmd").args(&["/C", &update_cmd]).output() {
                Ok(_) => info!("✅ Protocol registration updated to Tauri app"),
                Err(e) => error!("❌ Failed to update registry: {}", e),
            }
        } else if current_reg.contains(&exe_path) {
            info!("✅ Protocol already registered correctly");
        } else {
            info!("🔄 Registering protocol for first time...");

            // Register protocol
            let register_cmd = format!(
                r#"reg add "HKCU\Software\Classes\whisprgpt\shell\open\command" /ve /d "\"{}\" \"%1\"" /f"#,
                exe_path
            );

            match Command::new("cmd").args(&["/C", &register_cmd]).output() {
                Ok(_) => info!("✅ Protocol registered successfully"),
                Err(e) => error!("❌ Failed to register protocol: {}", e),
            }
        }
    } else {
        info!("🔄 Protocol not found, registering...");

        // Register everything from scratch
        let cmd1 =
            r#"reg add "HKCU\Software\Classes\whisprgpt" /ve /d "URL:WhisprGPT Protocol" /f"#;
        let cmd2 = r#"reg add "HKCU\Software\Classes\whisprgpt" /v "URL Protocol" /d "" /f"#;
        let cmd3 = format!(
            r#"reg add "HKCU\Software\Classes\whisprgpt\shell\open\command" /ve /d "\"{}\" \"%1\"" /f"#,
            exe_path
        );

        let _ = Command::new("cmd").args(&["/C", cmd1]).output();
        let _ = Command::new("cmd").args(&["/C", cmd2]).output();
        let _ = Command::new("cmd").args(&["/C", &cmd3]).output();

        info!("✅ Protocol registered successfully");
    }
}

fn main() {
    let log_path = "C:\\ProgramData\\WhisprGPT\\whisprgpt.log";

    if let Some(parent) = std::path::Path::new(log_path).parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    // Initialize logger ONCE - either to file or stdout
    if let Ok(log_file) = OpenOptions::new().create(true).append(true).open(log_path) {
        // Log to file if we can open it
        env_logger::Builder::from_default_env()
            .filter_level(log::LevelFilter::Info)
            .target(env_logger::Target::Pipe(Box::new(log_file)))
            .init();
    } else {
        // Fallback to stdout if file fails
        env_logger::Builder::from_default_env()
            .filter_level(log::LevelFilter::Info)
            .init();
    }

    tauri::Builder::default()
        .manage(Mutex::new(None::<WhisperSettings>))
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_settings_command,
            commands::settings::save_settings_command,
            commands::settings::reset_settings_command,
            commands::shortcuts::register_shortcuts_command,
            commands::shortcuts::unregister_shortcuts_command,
            commands::shortcuts::update_shortcut_command,
            commands::shortcuts::reset_shortcut_command,
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
            commands::auth::open_external_url,
            commands::auth::open_checkout_portal,
        ])
        .setup(|app| {
            info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            info!("🚀 WhisprGPT Starting...");
            info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // Fix protocol registration on Windows (migrates from Electron)
            #[cfg(target_os = "windows")]
            {
                fix_protocol_registration();
            }

            let app_handle = app.handle();

            // Windows: Handle command line arguments for deep links
            #[cfg(target_os = "windows")]
            {
                let args: Vec<String> = std::env::args().collect();
                debug!("📋 App started with args: {:?}", args);

                for arg in args.iter() {
                    if arg.starts_with("whisprgpt://") {
                        info!("🔗 Deep link detected in args: {}", arg);
                        handle_deep_link(&app_handle, arg.to_string());
                    }
                }
            }

            // macOS: Use the built-in URL event handler
            #[cfg(target_os = "macos")]
            {
                info!("🍎 Setting up macOS deep link listener...");
                app.listen_global("deep-link://new-url", move |event| {
                    if let Some(payload) = event.payload() {
                        let url = payload.trim_matches('"').to_string();
                        info!("🔗 macOS deep link detected: {}", url);
                        handle_deep_link(&app_handle, url);
                    }
                });
                info!("✅ macOS deep link listener registered");
            }

            // Register global hotkeys
            if let Some(window) = app.get_window("main") {
                let _ = window.set_always_on_top(true);
                info!("✅ Main window initialized (always-on-top)");

                let mut shortcut_manager = app.global_shortcut_manager();
                let window_up = window.clone();
                let window_down = window.clone();
                let window_left = window.clone();
                let window_right = window.clone();
                let window_hide = window.clone();

                // Register shortcuts with graceful error handling
                let mut registered = 0;
                let mut failed = 0;

                if shortcut_manager
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
                    .is_ok()
                {
                    registered += 1;
                } else {
                    failed += 1;
                }

                if shortcut_manager
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
                    .is_ok()
                {
                    registered += 1;
                } else {
                    failed += 1;
                }

                if shortcut_manager
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
                    .is_ok()
                {
                    registered += 1;
                } else {
                    failed += 1;
                }

                if shortcut_manager
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
                    .is_ok()
                {
                    registered += 1;
                } else {
                    failed += 1;
                }

                if shortcut_manager
                    .register("Ctrl+H", move || {
                        if let Ok(is_visible) = window_hide.is_visible() {
                            if is_visible {
                                let _ = window_hide.hide();
                            } else {
                                let _ = window_hide.show();
                            }
                        }
                    })
                    .is_ok()
                {
                    registered += 1;
                } else {
                    failed += 1;
                }

                info!(
                    "⌨️  Shortcuts: {} registered, {} failed",
                    registered, failed
                );
            }

            info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            info!("✅ WhisprGPT Ready!");
            info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn handle_deep_link(app_handle: &tauri::AppHandle, url_string: String) {
    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    info!("🔥 DEEP LINK RECEIVED");
    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    info!("URL: {}", url_string);

    match extract_auth_params_from_url(&url_string) {
        Some(params) => {
            info!("✅ Auth params extracted");
            info!("   Code length: {}", params.code.len());
            info!(
                "   Code starts: {}...",
                &params.code[..20.min(params.code.len())]
            );

            if let Some(window) = app_handle.get_window("main") {
                info!("✅ Main window found - bringing to front");
                let _ = window.show();
                let _ = window.set_focus();

                info!("🔄 Emitting 'auth-callback' event...");
                match commands::auth::handle_auth_callback(&window, params.code) {
                    Ok(_) => info!("✅ Event emitted successfully"),
                    Err(e) => error!("❌ Failed to emit event: {}", e),
                }
            } else {
                error!("❌ Main window not found!");
            }
        }
        None => {
            error!("❌ Could not extract code from URL");
        }
    }
    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

#[derive(Debug)]
struct AuthParams {
    code: String,
}

fn extract_auth_params_from_url(url_string: &str) -> Option<AuthParams> {
    match Url::parse(url_string) {
        Ok(url) => {
            // Check query parameters
            for (key, value) in url.query_pairs() {
                if key == "code" {
                    return Some(AuthParams {
                        code: value.to_string(),
                    });
                }
            }
            // Check fragment
            if let Some(fragment) = url.fragment() {
                for param in fragment.split('&') {
                    let parts: Vec<&str> = param.split('=').collect();
                    if parts.len() == 2 && (parts[0] == "code" || parts[0] == "access_token") {
                        return Some(AuthParams {
                            code: parts[1].to_string(),
                        });
                    }
                }
            }
            None
        }
        Err(_) => extract_auth_params_manually(url_string),
    }
}

fn extract_auth_params_manually(url: &str) -> Option<AuthParams> {
    if let Some(query_start) = url.find('?') {
        let query = &url[query_start + 1..];
        for param in query.split('&') {
            let kv: Vec<&str> = param.split('=').collect();
            if kv.len() == 2 && kv[0] == "code" {
                return Some(AuthParams {
                    code: kv[1].to_string(),
                });
            }
        }
    }
    if let Some(hash_start) = url.find('#') {
        let hash = &url[hash_start + 1..];
        for param in hash.split('&') {
            let kv: Vec<&str> = param.split('=').collect();
            if kv.len() == 2 && (kv[0] == "code" || kv[0] == "access_token") {
                return Some(AuthParams {
                    code: kv[1].to_string(),
                });
            }
        }
    }
    None
}
