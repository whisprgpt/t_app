// src/lib/tauri-shortcuts-api.ts
// Tauri Shortcuts API - Replaces Electron shortcuts functionality

import { invoke } from "@tauri-apps/api/tauri";
import type { WhisperSettings } from "@/types/types";

// ============================================================================
// Register All Shortcuts
// ============================================================================
// Replaces: Electron's globalShortcut.register() in shortcutEvents.ts

export async function registerShortcuts(): Promise<boolean> {
  try {
    console.log("📋 Registering all global shortcuts...");
    const success = await invoke<boolean>("register_shortcuts_command");
    console.log("✅ Shortcuts registered:", success);
    return success;
  } catch (error) {
    console.error("❌ Failed to register shortcuts:", error);
    throw error;
  }
}

// ============================================================================
// Unregister All Shortcuts
// ============================================================================
// Replaces: Electron's globalShortcut.unregisterAll()

export async function unregisterShortcuts(): Promise<boolean> {
  try {
    console.log("🗑️ Unregistering all shortcuts...");
    const success = await invoke<boolean>("unregister_shortcuts_command");
    console.log("✅ Shortcuts unregistered");
    return success;
  } catch (error) {
    console.error("❌ Failed to unregister shortcuts:", error);
    throw error;
  }
}

// ============================================================================
// Update Single Shortcut
// ============================================================================
// Updates a custom shortcut and re-registers all shortcuts

export async function updateShortcut(
  commandKey: string,
  shortcut: string,
  platform: "mac" | "windows"
): Promise<boolean> {
  try {
    console.log(`🔄 Updating shortcut ${commandKey} to ${shortcut}...`);
    const success = await invoke<boolean>("update_shortcut_command", {
      commandKey,
      shortcut,
      platform,
    });
    console.log("✅ Shortcut updated and re-registered");
    return success;
  } catch (error) {
    console.error("❌ Failed to update shortcut:", error);
    throw error;
  }
}

// ============================================================================
// Reset Shortcut to Default
// ============================================================================
// Removes custom shortcut and re-registers with default

export async function resetShortcut(commandKey: string): Promise<boolean> {
  try {
    console.log(`🔄 Resetting shortcut ${commandKey} to default...`);
    const success = await invoke<boolean>("reset_shortcut_command", {
      commandKey,
    });
    console.log("✅ Shortcut reset to default");
    return success;
  } catch (error) {
    console.error("❌ Failed to reset shortcut:", error);
    throw error;
  }
}

// ============================================================================
// Refresh Shortcuts (used after settings save)
// ============================================================================
// Replaces: window.electron.refreshShortcuts()

export async function refreshShortcuts(): Promise<void> {
  try {
    console.log("🔄 Refreshing all shortcuts...");
    await unregisterShortcuts();
    await registerShortcuts();
    console.log("✅ Shortcuts refreshed");
  } catch (error) {
    console.error("❌ Failed to refresh shortcuts:", error);
    throw error;
  }
}

// ============================================================================
// Helper: Get Current Shortcut String
// ============================================================================
// Gets the effective shortcut for a command (custom or default)

export function getCurrentShortcut(
  settings: WhisperSettings,
  commandKey: string,
  platform: "mac" | "windows"
): string {
  const shortcutEntry = settings.shortcuts[commandKey];
  if (!shortcutEntry) return "";

  // Check for custom shortcut first
  if (shortcutEntry.customShortcut && shortcutEntry.customShortcut[platform]) {
    return shortcutEntry.customShortcut[platform] as string;
  }

  // Fall back to default
  return shortcutEntry.defaultShortcut[platform] || "";
}

// ============================================================================
// Helper: Check if Shortcut is Custom
// ============================================================================

export function isCustomShortcut(
  settings: WhisperSettings,
  commandKey: string,
  platform: "mac" | "windows"
): boolean {
  const shortcutEntry = settings.shortcuts[commandKey];
  if (!shortcutEntry || !shortcutEntry.customShortcut) return false;

  return !!shortcutEntry.customShortcut[platform];
}

// ============================================================================
// Helper: Validate Shortcut Format
// ============================================================================
// Basic validation - must have modifier and key

export function validateShortcut(shortcut: string): {
  valid: boolean;
  error?: string;
} {
  if (!shortcut || shortcut.trim().length === 0) {
    return { valid: false, error: "Shortcut cannot be empty" };
  }

  const parts = shortcut.split("+").map((s) => s.trim());

  if (parts.length < 2) {
    return {
      valid: false,
      error: "Shortcut must include at least one modifier key",
    };
  }

  const hasModifier = parts.some((p) =>
    ["⌘", "Cmd", "Ctrl", "Control", "Shift", "Alt", "⌥", "Option"].includes(p)
  );

  if (!hasModifier) {
    return {
      valid: false,
      error: "Shortcut must include a modifier key (Cmd/Ctrl, Shift, or Alt)",
    };
  }

  return { valid: true };
}

// ============================================================================
// Helper: Check for Duplicate Shortcuts
// ============================================================================

export function findDuplicateShortcut(
  settings: WhisperSettings,
  shortcut: string,
  currentCommandKey: string,
  platform: "mac" | "windows"
): string | null {
  for (const [key, entry] of Object.entries(settings.shortcuts)) {
    if (key === currentCommandKey) continue;

    const existingShortcut = getCurrentShortcut(settings, key, platform);
    if (existingShortcut === shortcut) {
      return entry.title || key;
    }
  }

  return null;
}

// ============================================================================
// Usage Example:
// ============================================================================
//
// import {
//   registerShortcuts,
//   updateShortcut,
//   resetShortcut,
//   getCurrentShortcut,
//   validateShortcut,
//   findDuplicateShortcut
// } from './lib/tauri-shortcuts-api'
//
// // Register all shortcuts on app start
// await registerShortcuts()
//
// // Update a shortcut
// await updateShortcut('screenshot', '⌘ + S', 'mac')
//
// // Reset to default
// await resetShortcut('screenshot')
//
// // Get current shortcut
// const shortcut = getCurrentShortcut(settings, 'screenshot', 'mac')
//
// // Validate before saving
// const { valid, error } = validateShortcut('⌘ + S')
//
// // Check for duplicates
// const duplicate = findDuplicateShortcut(settings, '⌘ + S', 'screenshot', 'mac')
