// src/lib/tauri-whispr-api.ts
// API wrapper for Whispr mode functionality

import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

export interface WhisprModePayload {
  url: string;
}

// ============================================================================
// Whispr Mode API
// ============================================================================
export const whisprApi = {
  /**
   * Launch Whispr mode with an AI provider URL
   * This replaces the dashboard with an embedded webview of the AI
   */
  async launch(url: string): Promise<void> {
    await invoke("launch_whispr_mode_command", { url });
  },

  /**
   * Navigate back to dashboard from Whispr mode
   * Triggered by Ctrl/Cmd+B or programmatically
   */
  async navigateToDashboard(): Promise<void> {
    await invoke("navigate_to_dashboard_command");
  },

  /**
   * Listen for Whispr mode launch events
   * Call this in your App.tsx to handle navigation
   */
  onLaunchWhisprMode(
    callback: (payload: WhisprModePayload) => void
  ): Promise<() => void> {
    return listen<WhisprModePayload>("launch-whispr-mode", (event) => {
      callback(event.payload);
    });
  },

  /**
   * Listen for dashboard navigation events
   * Triggered by Ctrl/Cmd+B hotkey
   */
  onNavigateToDashboard(callback: () => void): Promise<() => void> {
    return listen("navigate-to-dashboard", () => {
      callback();
    });
  },
};

// ============================================================================
// USAGE EXAMPLE:
// ============================================================================
// In your App.tsx:
//
// useEffect(() => {
//   // Listen for Whispr mode launch
//   const unsubLaunch = whisprApi.onLaunchWhisprMode(({ url }) => {
//     // Navigate to Whispr mode page with the URL
//     navigate('/whispr', { state: { url } });
//   });
//
//   // Listen for dashboard navigation
//   const unsubDashboard = whisprApi.onNavigateToDashboard(() => {
//     navigate('/');
//   });
//
//   return () => {
//     unsubLaunch.then(fn => fn());
//     unsubDashboard.then(fn => fn());
//   };
// }, []);
//
// In your Dashboard.tsx:
// await whisprApi.launch('https://chatgpt.com');
