// src/lib/tauri-auth-api.ts
// Tauri Auth API - Replaces window.auth.* from Electron

import { invoke } from "@tauri-apps/api/tauri";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

// ============================================================================
// Types
// ============================================================================

export interface CheckoutResponse {
  success: boolean;
  error: string;
}

export interface AuthCallbackPayload {
  code: string;
}

// ============================================================================
// Open External URL (for OAuth)
// ============================================================================
// Replaces: window.auth.openExternal(url)

export async function openExternalUrl(url: string): Promise<void> {
  try {
    await invoke("open_external_url", { url });
  } catch (error) {
    console.error("Failed to open external URL:", error);
    throw error;
  }
}

// ============================================================================
// Open Stripe Checkout Portal
// ============================================================================
// Replaces: window.auth.openCheckoutPortal()

export async function openCheckoutPortal(
  userId: string
): Promise<CheckoutResponse> {
  try {
    const response = await invoke<CheckoutResponse>("open_checkout_portal", {
      userId,
    });
    return response;
  } catch (error) {
    console.error("Failed to open checkout portal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Listen for Auth Callback (OAuth redirect)
// ============================================================================
// Replaces: window.auth.authCallback(callback)

export async function listenForAuthCallback(
  callback: (code: string) => void
): Promise<UnlistenFn> {
  const unlisten = await listen<AuthCallbackPayload>(
    "auth-callback",
    (event) => {
      console.log("🔐 Received auth callback:", event.payload);
      callback(event.payload.code);
    }
  );

  console.log("👂 Listening for auth callbacks...");
  return unlisten;
}

// ============================================================================
// Usage Examples:
// ============================================================================
//
// 1. Open OAuth URL (Authentication.tsx):
//    await openExternalUrl(data.url);
//
// 2. Listen for OAuth callback (App.tsx):
//    const unlisten = await listenForAuthCallback((code) => {
//      console.log('Got auth code:', code);
//      // Exchange code for session
//    });
//    // Later: unlisten();
//
// 3. Open Stripe checkout (Subscription.tsx):
//    const result = await openCheckoutPortal(user.id);
//    if (!result.success) {
//      console.error(result.error);
//    }
