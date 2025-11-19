// src/lib/tauri-permissions-api.ts
// Tauri Permissions API - Replaces window.permissions.*

import { invoke } from "@tauri-apps/api/tauri";

// ============================================================================
// Check Microphone Permission
// ============================================================================
// Replaces: window.permissions.checkMicPermissions()

export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const hasPermission = await invoke<boolean>(
      "check_microphone_permission_command"
    );
    return hasPermission;
  } catch (error) {
    console.error("Failed to check microphone permission:", error);
    return false;
  }
}

// ============================================================================
// Check Screen Capture Permission
// ============================================================================
// Replaces: window.permissions.checkScreenCapturePermissions()

export async function checkScreenCapturePermission(): Promise<boolean> {
  try {
    const hasPermission = await invoke<boolean>(
      "check_screen_capture_permission_command"
    );
    return hasPermission;
  } catch (error) {
    console.error("Failed to check screen capture permission:", error);
    return false;
  }
}

// ============================================================================
// Request Microphone Permission
// ============================================================================
// Replaces: window.permissions.enableMicrophone()

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const granted = await invoke<boolean>(
      "request_microphone_permission_command"
    );
    return granted;
  } catch (error) {
    console.error("Failed to request microphone permission:", error);
    return false;
  }
}

// ============================================================================
// Open Microphone Settings
// ============================================================================
// Opens system settings for microphone permissions

export async function openMicrophoneSettings(): Promise<void> {
  try {
    await invoke("open_microphone_settings_command");
  } catch (error) {
    console.error("Failed to open microphone settings:", error);
  }
}

// ============================================================================
// Open Screen Capture Settings
// ============================================================================
// Opens system settings for screen capture permissions

export async function openScreenCaptureSettings(): Promise<void> {
  try {
    await invoke("open_screen_capture_settings_command");
  } catch (error) {
    console.error("Failed to open screen capture settings:", error);
  }
}

// ============================================================================
// Reset Permissions (macOS only)
// ============================================================================
// Replaces: window.permissions.resetPermissions()

export async function resetPermissions(): Promise<boolean> {
  try {
    const success = await invoke<boolean>("reset_permissions_command");
    return success;
  } catch (error) {
    console.error("Failed to reset permissions:", error);
    return false;
  }
}

// ============================================================================
// Combined Permission Check
// ============================================================================
// Check both microphone and screen capture at once

export async function checkAllPermissions(): Promise<{
  microphone: boolean;
  screenCapture: boolean;
}> {
  const [microphone, screenCapture] = await Promise.all([
    checkMicrophonePermission(),
    checkScreenCapturePermission(),
  ]);

  return { microphone, screenCapture };
}

// ============================================================================
// Usage Example:
// ============================================================================
//
// import {
//   checkMicrophonePermission,
//   checkScreenCapturePermission,
//   openMicrophoneSettings,
//   openScreenCaptureSettings,
//   resetPermissions,
//   checkAllPermissions
// } from './lib/tauri-permissions-api'
//
// // Check individual permissions
// const hasMic = await checkMicrophonePermission()
// const hasScreen = await checkScreenCapturePermission()
//
// // Check all at once
// const { microphone, screenCapture } = await checkAllPermissions()
//
// // Open settings
// await openMicrophoneSettings()
// await openScreenCaptureSettings()
//
// // Reset permissions (macOS only)
// await resetPermissions()
