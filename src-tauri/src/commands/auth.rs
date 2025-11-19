// src-tauri/src/commands/auth.rs
// Auth commands for Google OAuth and Stripe integration

use tauri::Window;

// ============================================================================
// Open External URL (for OAuth and Stripe)
// ============================================================================
// This replaces window.auth.openExternal() from Electron
#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    // Tauri's shell::open requires the shell feature enabled in tauri.conf.json
    // Which you already have: "shell": { "open": true }

    // Use Tauri's shell::open to open URL in default browser
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("cmd")
            .args(&["/C", "start", &url])
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    Ok(())
}

// ============================================================================
// Open Stripe Checkout Portal
// ============================================================================
// This replaces window.auth.openCheckoutPortal() from Electron
#[tauri::command]
pub async fn open_checkout_portal(user_id: String) -> Result<CheckoutResponse, String> {
    // Note: In production, you should call your Supabase Edge Function
    // to create a Stripe checkout session securely on the backend.

    // For now, we'll construct the URL (you'll need to update this)
    let checkout_url = format!(
        "https://orwfosrcglmuykemljin.supabase.co/functions/v1/create-checkout-session?user_id={}",
        user_id
    );

    // Open the checkout URL
    match open_external_url(checkout_url) {
        Ok(_) => Ok(CheckoutResponse {
            success: true,
            error: String::new(),
        }),
        Err(e) => Ok(CheckoutResponse {
            success: false,
            error: e,
        }),
    }
}

// ============================================================================
// Handle Deep Link (OAuth Callback)
// ============================================================================
// This will be called by the deep link handler in main.rs
// It emits an event that the frontend can listen to
pub fn handle_auth_callback(window: &Window, code: String) -> Result<(), String> {
    // Emit an event to the frontend with the auth code
    window
        .emit("auth-callback", AuthCallbackPayload { code })
        .map_err(|e| format!("Failed to emit auth callback: {}", e))?;

    println!("✅ Auth callback handled, code sent to frontend");
    Ok(())
}

// ============================================================================
// Data Structures
// ============================================================================

#[derive(Debug, Clone, serde::Serialize)]
pub struct CheckoutResponse {
    pub success: bool,
    pub error: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AuthCallbackPayload {
    pub code: String,
}

// ============================================================================
// USAGE IN FRONTEND:
// ============================================================================
// import { invoke } from '@tauri-apps/api/tauri';
//
// // Open OAuth URL:
// await invoke('open_external_url', { url: 'https://accounts.google.com/...' });
//
// // Open Stripe checkout:
// const result = await invoke('open_checkout_portal', { userId: user.id });
//
// // Listen for auth callback:
// import { listen } from '@tauri-apps/api/event';
// await listen('auth-callback', (event) => {
//   console.log('Received auth code:', event.payload.code);
// });
