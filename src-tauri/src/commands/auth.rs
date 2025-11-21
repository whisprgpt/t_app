// src-tauri/src/commands/auth.rs
// Auth commands for Google OAuth and Stripe integration
// UPDATED: Using log crate for proper logging

use log::info;
use tauri::Window;

// ============================================================================
// Open External URL (for OAuth and Stripe)
// ============================================================================
#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    info!("🔗 Opening external URL: {}", url);

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
#[tauri::command]
pub async fn open_checkout_portal(user_id: String) -> Result<CheckoutResponse, String> {
    info!("💳 Opening checkout portal for user: {}", user_id);

    let checkout_url = format!(
        "https://orwfosrcglmuykemljin.supabase.co/functions/v1/create-checkout-session?user_id={}",
        user_id
    );

    match open_external_url(checkout_url) {
        Ok(_) => {
            info!("✅ Checkout portal opened successfully");
            Ok(CheckoutResponse {
                success: true,
                error: String::new(),
            })
        }
        Err(e) => {
            info!("❌ Failed to open checkout portal: {}", e);
            Ok(CheckoutResponse {
                success: false,
                error: e,
            })
        }
    }
}

// ============================================================================
// Handle Deep Link (OAuth Callback)
// ============================================================================
pub fn handle_auth_callback(window: &Window, code: String) -> Result<(), String> {
    info!("🔄 Handling auth callback with code length: {}", code.len());

    window
        .emit("auth-callback", AuthCallbackPayload { code })
        .map_err(|e| format!("Failed to emit auth callback: {}", e))?;

    info!("✅ Auth callback handled, code sent to frontend");
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
