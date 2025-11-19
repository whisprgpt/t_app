// src/lib/window-api.ts
// TypeScript API wrapper for window management commands
// This replaces window.electron.* calls for window operations

import { invoke } from "@tauri-apps/api/tauri";

// ============================================================================
// Window Management API
// ============================================================================
export const windowApi = {
  /**
   * Close the application
   * Replaces: window.electron.closeApp()
   */
  async close(): Promise<void> {
    await invoke("close_app_command");
  },

  /**
   * Restart the application
   * Replaces: window.electron.restartApp()
   */
  async restart(): Promise<void> {
    await invoke("restart_app_command");
  },

  /**
   * Set window opacity
   * Replaces: window.electron.setOpacity(opacity)
   * @param opacity - Value between 0.0 (transparent) and 1.0 (opaque)
   */
  async setOpacity(opacity: number): Promise<void> {
    if (opacity < 0 || opacity > 1) {
      throw new Error("Opacity must be between 0.0 and 1.0");
    }
    await invoke("set_opacity_command", { opacity });
  },

  /**
   * Move window by delta
   * @param deltaX - Horizontal movement in pixels
   * @param deltaY - Vertical movement in pixels
   */
  async move(deltaX: number, deltaY: number): Promise<void> {
    await invoke("move_window_command", { deltaX, deltaY });
  },

  /**
   * Move window up
   * @param amount - Pixels to move (default: 20)
   */
  async moveUp(amount: number = 20): Promise<void> {
    await invoke("move_window_command", { deltaX: 0, deltaY: -amount });
  },

  /**
   * Move window down
   * @param amount - Pixels to move (default: 20)
   */
  async moveDown(amount: number = 20): Promise<void> {
    await invoke("move_window_command", { deltaX: 0, deltaY: amount });
  },

  /**
   * Move window left
   * @param amount - Pixels to move (default: 20)
   */
  async moveLeft(amount: number = 20): Promise<void> {
    await invoke("move_window_command", { deltaX: -amount, deltaY: 0 });
  },

  /**
   * Move window right
   * @param amount - Pixels to move (default: 20)
   */
  async moveRight(amount: number = 20): Promise<void> {
    await invoke("move_window_command", { deltaX: amount, deltaY: 0 });
  },

  /**
   * Hide the window
   */
  async hide(): Promise<void> {
    await invoke("hide_window_command");
  },

  /**
   * Show the window
   * @param opacity - Opacity to restore (default: 1.0)
   */
  async show(opacity: number = 1.0): Promise<void> {
    await invoke("show_window_command", { opacity });
  },

  /**
   * Toggle window visibility
   * @param opacity - Opacity when showing (default: 1.0)
   */
  async toggleVisibility(opacity: number = 1.0): Promise<void> {
    await invoke("toggle_window_visibility_command", { opacity });
  },

  /**
   * Set always on top
   * @param alwaysOnTop - Whether window should stay on top
   */
  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    await invoke("set_always_on_top_command", { alwaysOnTop });
  },

  /**
   * Get app version
   * Replaces: window.electron.getAppVersion()
   */
  async getVersion(): Promise<string> {
    return await invoke("get_app_version_command");
  },

  /**
   * Delete cache (localStorage, sessionStorage, IndexedDB)
   * Replaces: window.electron.deleteCache()
   */
  async deleteCache(): Promise<string> {
    return await invoke("delete_cache_command");
  },

  /**
   * Set window size
   * @param width - Window width in pixels
   * @param height - Window height in pixels
   */
  async setSize(width: number, height: number): Promise<void> {
    await invoke("set_window_size_command", { width, height });
  },

  /**
   * Set whether window can be focused
   * @param focusable - Whether window can receive focus
   */
  async setFocusable(focusable: boolean): Promise<void> {
    await invoke("set_window_focusable_command", { focusable });
  },
};

// ============================================================================
// USAGE EXAMPLES:
// ============================================================================
// Before (Electron):
// await window.electron.closeApp();
// await window.electron.restartApp();
// await window.electron.setOpacity(0.8);
// const version = await window.electron.getAppVersion();
//
// After (Tauri):
// import { windowApi } from '@/lib/window-api';
//
// await windowApi.close();
// await windowApi.restart();
// await windowApi.setOpacity(0.8);
// const version = await windowApi.getVersion();
//
// Movement helpers:
// await windowApi.moveUp();
// await windowApi.moveDown(50);  // Move 50 pixels
// await windowApi.moveLeft();
// await windowApi.moveRight();
//
// Visibility:
// await windowApi.hide();
// await windowApi.show(0.9);  // Show with 90% opacity
// await windowApi.toggleVisibility();
