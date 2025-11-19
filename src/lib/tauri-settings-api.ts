// src/lib/tauri-settings-api.ts
// Tauri Settings API - Replaces window.electron.* for settings management

import { invoke } from "@tauri-apps/api/tauri";
import { platform } from "@tauri-apps/api/os";
import { WhisperSettings } from "@/types/types";
// ============================================================================
// Types
// ============================================================================

// These should match your existing WhisperSettings type
// (Already defined in your types.d.ts)

// ============================================================================
// Get Settings
// ============================================================================
// Replaces: window.electron.getSettings()

export async function getSettings(): Promise<WhisperSettings> {
  try {
    const settings = await invoke<WhisperSettings>("get_settings_command");
    return settings;
  } catch (error) {
    console.error("Failed to get settings:", error);
    throw error;
  }
}

// ============================================================================
// Save Settings
// ============================================================================
// Replaces: window.electron.saveSettings(settings)

export async function saveSettings(
  settings: WhisperSettings
): Promise<boolean> {
  try {
    const success = await invoke<boolean>("save_settings_command", {
      settings,
    });
    return success;
  } catch (error) {
    console.error("Failed to save settings:", error);
    throw error;
  }
}

// ============================================================================
// Reset Settings
// ============================================================================
// Replaces: window.electron.resetSettings()

export async function resetSettings(): Promise<WhisperSettings> {
  try {
    const settings = await invoke<WhisperSettings>("reset_settings_command");
    return settings;
  } catch (error) {
    console.error("Failed to reset settings:", error);
    throw error;
  }
}

// ============================================================================
// Restart App
// ============================================================================
// Replaces: window.electron.restartApp()

export async function restartApp(): Promise<void> {
  try {
    await invoke("restart_app_command");
  } catch (error) {
    console.error("Failed to restart app:", error);
    throw error;
  }
}

// ============================================================================
// Close App
// ============================================================================
// Replaces: window.electron.closeApp()

export async function closeApp(): Promise<void> {
  try {
    await invoke("close_app_command");
  } catch (error) {
    console.error("Failed to close app:", error);
    throw error;
  }
}

// ============================================================================
// Set Opacity
// ============================================================================
// Replaces: window.electron.setOpacity(x)
// NOTE: This may not work in Tauri v1 on Windows. Use CSS opacity instead.

export async function setOpacity(opacity: number): Promise<void> {
  try {
    await invoke("set_opacity_command", { opacity });
  } catch (error) {
    console.warn(
      "Opacity control not available in Tauri v1. Use CSS opacity instead."
    );
    // Don't throw - this is expected in Tauri v1
  }
}

// ============================================================================
// Delete Cache
// ============================================================================
// Replaces: window.electron.deleteCache()

export async function deleteCache(): Promise<{
  status: string;
  message: string;
}> {
  try {
    const result = await invoke<string>("delete_cache_command");
    return { status: "success", message: result };
  } catch (error) {
    console.error("Failed to delete cache:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Get App Version
// ============================================================================
// Replaces: window.electron.getAppVersion()

export async function getAppVersion(): Promise<string> {
  try {
    const version = await invoke<string>("get_app_version_command");
    return version;
  } catch (error) {
    console.error("Failed to get app version:", error);
    return "Unknown";
  }
}

// ============================================================================
// Check if Mac
// ============================================================================
// Replaces: window.electron.isMac()
// Returns: "darwin" for Mac, "win32" for Windows, "linux" for Linux

export async function getPlatform(): Promise<string> {
  try {
    const platformName = await platform();
    // Map Tauri platform names to Electron-style names
    const platformMap: Record<string, string> = {
      darwin: "darwin",
      win32: "win32",
      linux: "linux",
      macos: "darwin", // Tauri might return 'macos'
      windows: "win32", // Tauri might return 'windows'
    };
    return platformMap[platformName] || platformName;
  } catch (error) {
    console.error("Failed to get platform:", error);
    // Fallback to browser detection
    if (navigator.platform.toUpperCase().indexOf("MAC") >= 0) return "darwin";
    if (navigator.platform.toUpperCase().indexOf("WIN") >= 0) return "win32";
    return "linux";
  }
}

// ============================================================================
// Synchronous platform check (using cached value)
// ============================================================================

let cachedPlatform: string | null = null;

export function isMac(): string {
  if (cachedPlatform) return cachedPlatform;

  // Use synchronous browser detection as fallback
  if (navigator.platform.toUpperCase().indexOf("MAC") >= 0) {
    cachedPlatform = "darwin";
    return "darwin";
  }
  if (navigator.platform.toUpperCase().indexOf("WIN") >= 0) {
    cachedPlatform = "win32";
    return "win32";
  }
  cachedPlatform = "linux";
  return "linux";
}

// Initialize cached platform
getPlatform().then((p) => (cachedPlatform = p));

// ============================================================================
// Usage Examples:
// ============================================================================
//
// import { getSettings, saveSettings, resetSettings, isMac, restartApp } from './lib/tauri-settings-api'
//
// // Get settings
// const settings = await getSettings()
//
// // Save settings
// const success = await saveSettings(newSettings)
//
// // Reset to defaults
// const defaultSettings = await resetSettings()
//
// // Check platform
// const platform = isMac() // Returns 'darwin' or 'win32' or 'linux'
//
// // Restart app
// await restartApp()
