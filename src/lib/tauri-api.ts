// src/lib/tauri-api.ts
// This file wraps Tauri commands in a nice TypeScript API
// It replaces window.electron.* calls from Electron

import { invoke } from "@tauri-apps/api/tauri";

// ============================================================================
// Types (copied from your types.d.ts)
// ============================================================================
export interface PlatformShortcut {
  mac: string;
  windows: string;
}

export interface CustomShortcut {
  mac?: string;
  windows?: string;
}

export interface ShortcutEntry {
  key: string;
  title: string;
  description: string;
  category: "core" | "navigation" | "media" | "system" | "movement";
  defaultShortcut: PlatformShortcut;
  customShortcut?: CustomShortcut;
}

export interface WhisperSettings {
  llm: "chatgpt" | "grok" | "deepseek" | "gemini" | "perplexity";
  systemPrompt: string;
  retryPrompt: string;
  screenWidth: number;
  screenHeight: number;
  focusable: boolean;
  showBanner: boolean;
  opacity: number;
  shortcuts: Record<string, ShortcutEntry>;
}

// ============================================================================
// Settings API
// ============================================================================
export const settingsApi = {
  /**
   * Get current settings
   * Replaces: window.electron.getSettings()
   */
  async get(): Promise<WhisperSettings> {
    // Tauri's invoke() is like Electron's ipcRenderer.invoke()
    // But we need to convert between camelCase (JS) and snake_case (Rust)
    const rustSettings = await invoke<any>("get_settings_command");

    // Convert Rust's snake_case to JavaScript's camelCase
    return {
      llm: rustSettings.llm,
      systemPrompt: rustSettings.system_prompt,
      retryPrompt: rustSettings.retry_prompt,
      screenWidth: rustSettings.screen_width,
      screenHeight: rustSettings.screen_height,
      focusable: rustSettings.focusable,
      showBanner: rustSettings.show_banner,
      opacity: rustSettings.opacity,
      shortcuts: convertShortcutsFromRust(rustSettings.shortcuts),
    };
  },

  /**
   * Save settings
   * Replaces: window.electron.saveSettings(settings)
   */
  async save(settings: WhisperSettings): Promise<boolean> {
    // Convert JavaScript's camelCase to Rust's snake_case
    const rustSettings = {
      llm: settings.llm,
      system_prompt: settings.systemPrompt,
      retry_prompt: settings.retryPrompt,
      screen_width: settings.screenWidth,
      screen_height: settings.screenHeight,
      focusable: settings.focusable,
      show_banner: settings.showBanner,
      opacity: settings.opacity,
      shortcuts: convertShortcutsToRust(settings.shortcuts),
    };

    return await invoke("save_settings_command", { settings: rustSettings });
  },

  /**
   * Reset settings to default
   * Replaces: window.electron.resetSettings()
   */
  async reset(): Promise<WhisperSettings> {
    const rustSettings = await invoke<any>("reset_settings_command");

    return {
      llm: rustSettings.llm,
      systemPrompt: rustSettings.system_prompt,
      retryPrompt: rustSettings.retry_prompt,
      screenWidth: rustSettings.screen_width,
      screenHeight: rustSettings.screen_height,
      focusable: rustSettings.focusable,
      showBanner: rustSettings.show_banner,
      opacity: rustSettings.opacity,
      shortcuts: convertShortcutsFromRust(rustSettings.shortcuts),
    };
  },
};

// ============================================================================
// Helper Functions for Case Conversion
// ============================================================================
function convertShortcutsFromRust(
  rustShortcuts: any
): Record<string, ShortcutEntry> {
  const shortcuts: Record<string, ShortcutEntry> = {};

  for (const [key, value] of Object.entries(rustShortcuts)) {
    shortcuts[key] = {
      key: value.key,
      title: value.title,
      description: value.description,
      category: value.category,
      defaultShortcut: {
        mac: value.default_shortcut.mac,
        windows: value.default_shortcut.windows,
      },
      customShortcut: value.custom_shortcut
        ? {
            mac: value.custom_shortcut.mac,
            windows: value.custom_shortcut.windows,
          }
        : undefined,
    };
  }

  return shortcuts;
}

function convertShortcutsToRust(shortcuts: Record<string, ShortcutEntry>): any {
  const rustShortcuts: any = {};

  for (const [key, value] of Object.entries(shortcuts)) {
    rustShortcuts[key] = {
      key: value.key,
      title: value.title,
      description: value.description,
      category: value.category,
      default_shortcut: {
        mac: value.defaultShortcut.mac,
        windows: value.defaultShortcut.windows,
      },
      custom_shortcut: value.customShortcut
        ? {
            mac: value.customShortcut.mac,
            windows: value.customShortcut.windows,
          }
        : undefined,
    };
  }

  return rustShortcuts;
}

// ============================================================================
// USAGE EXAMPLE:
// ============================================================================
// Before (Electron):
// const settings = await window.electron.getSettings();
// await window.electron.saveSettings(newSettings);
// const defaults = await window.electron.resetSettings();
//
// After (Tauri):
// import { settingsApi } from '@/lib/tauri-api';
// const settings = await settingsApi.get();
// await settingsApi.save(newSettings);
// const defaults = await settingsApi.reset();
