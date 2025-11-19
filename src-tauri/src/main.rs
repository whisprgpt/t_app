// main.rs
// This is the entry point of your Tauri application.
// Think of it like your main.ts file in Electron.

// Prevent console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// ============================================================================
// Module Declarations
// ============================================================================
// This tells Rust about our other files
mod types;
mod state;
mod commands;

use std::sync::Mutex;
use types::WhisperSettings;

// ============================================================================
// MAIN FUNCTION
// ============================================================================
// This is where your app starts (like app.whenReady() in Electron)
fn main() {
    // RUST CONCEPT: tauri::Builder is like creating your Electron app
    tauri::Builder::default()
        // ====================================================================
        // Manage State
        // ====================================================================
        // This creates a global state container for settings
        // It's like having a global variable that all commands can access
        .manage(Mutex::new(None::<WhisperSettings>))
        
        // ====================================================================
        // Register Commands
        // ====================================================================
        // This is like calling ipcMain.handle() for each command
        // The commands in this array are callable from your React frontend
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_settings_command,
            commands::settings::save_settings_command,
            commands::settings::reset_settings_command,
        ])
        
        // ====================================================================
        // Setup Hook (runs before window is created)
        // ====================================================================
        .setup(|app| {
            // This runs once when the app starts
            // You can add initialization logic here later
            println!("WhisprGPT is starting...");
            
            // RUST CONCEPT: Ok(()) means "success, return nothing"
            Ok(())
        })
        
        // ====================================================================
        // Run the App
        // ====================================================================
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ============================================================================
// SUMMARY FOR JAVASCRIPT DEVELOPERS:
// ============================================================================
// This file is equivalent to:
//
// Electron (before):
// const { app, BrowserWindow, ipcMain } = require('electron');
// 
// app.whenReady().then(() => {
//   ipcMain.handle('get-settings', async () => { ... });
//   ipcMain.handle('save-settings', async (_, settings) => { ... });
//   ipcMain.handle('reset-settings', async () => { ... });
//   createWindow();
// });
//
// Tauri (now):
// fn main() {
//   tauri::Builder::default()
//     .invoke_handler(tauri::generate_handler![
//       get_settings_command,
//       save_settings_command,
//       reset_settings_command,
//     ])
//     .setup(|app| { ... })
//     .run(...)
// }
//
// Key differences:
// - No explicit window creation (Tauri handles this via tauri.conf.json)
// - Commands are registered in one place with invoke_handler
// - Setup hook replaces app.whenReady()
// - Type-safe: Rust checks everything at compile time