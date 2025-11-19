// types.rs
// This file defines the data structures used throughout the app.
// Think of this as your TypeScript types.d.ts file.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// RUST CONCEPT: Derive Macros
// ============================================================================
// #[derive(...)] is like TypeScript decorators - they automatically generate code.
// - Serialize: Converts Rust struct → JSON (for saving to file)
// - Deserialize: Converts JSON → Rust struct (for reading from file)
// - Debug: Allows printing the struct for debugging
// - Clone: Allows copying the struct

// ============================================================================
// ShortcutEntry - Represents a single keyboard shortcut
// ============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutEntry {
    pub key: String,
    pub title: String,
    pub description: String,
    pub category: String, // "core", "navigation", "media", "system", "movement"
    pub default_shortcut: PlatformShortcut,
    
    // RUST CONCEPT: Option<T> is like TypeScript's T | null
    // If customShortcut is None, it means no custom shortcut is set
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_shortcut: Option<CustomShortcut>,
}

// ============================================================================
// PlatformShortcut - Default shortcuts for each platform
// ============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformShortcut {
    pub mac: String,
    pub windows: String,
}

// ============================================================================
// CustomShortcut - User-defined shortcuts (optional)
// ============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomShortcut {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub windows: Option<String>,
}

// ============================================================================
// WhisperSettings - Main app settings
// This mirrors your TypeScript WhisperSettings interface exactly
// ============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhisperSettings {
    pub llm: String, // "chatgpt", "grok", "deepseek", "gemini", "perplexity"
    pub system_prompt: String, // Note: Rust uses snake_case instead of camelCase
    pub retry_prompt: String,
    pub screen_width: i32,
    pub screen_height: i32,
    pub focusable: bool,
    pub show_banner: bool,
    pub opacity: f64,
    
    // RUST CONCEPT: HashMap is like JavaScript's Map or TypeScript's Record
    // HashMap<String, ShortcutEntry> = Record<string, ShortcutEntry> in TS
    pub shortcuts: HashMap<String, ShortcutEntry>,
}

// ============================================================================
// Default Settings Implementation
// ============================================================================
impl WhisperSettings {
    // This creates the default settings (like your defaultSettings constant)
    pub fn default() -> Self {
        // Helper function to create default shortcuts
        let mut shortcuts = HashMap::new();
        
        // Screenshot shortcut
        shortcuts.insert(
            "screenshot".to_string(),
            ShortcutEntry {
                key: "screenshot".to_string(),
                title: "Screenshot".to_string(),
                description: "Capture screenshot to load it in your preferred AI".to_string(),
                category: "core".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + S".to_string(),
                    windows: "Ctrl + S".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Generate shortcut
        shortcuts.insert(
            "generate".to_string(),
            ShortcutEntry {
                key: "generate".to_string(),
                title: "Generate Response".to_string(),
                description: "Generate AI response from your input".to_string(),
                category: "core".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + ↵".to_string(),
                    windows: "Ctrl + ↵".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Record shortcut
        shortcuts.insert(
            "record".to_string(),
            ShortcutEntry {
                key: "record".to_string(),
                title: "Record Audio".to_string(),
                description: "Enable recording of microphone and system audio".to_string(),
                category: "media".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + R".to_string(),
                    windows: "Ctrl + R".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Retry prompt shortcut
        shortcuts.insert(
            "retry-prompt".to_string(),
            ShortcutEntry {
                key: "retry-prompt".to_string(),
                title: "Retry Prompt".to_string(),
                description: "Use the shortcut to try again with your Retry Prompt".to_string(),
                category: "core".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + T".to_string(),
                    windows: "Ctrl + T".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Scroll up shortcut
        shortcuts.insert(
            "scroll-up".to_string(),
            ShortcutEntry {
                key: "scroll-up".to_string(),
                title: "Scroll Chat Up".to_string(),
                description: "Scroll up in the AI chat window".to_string(),
                category: "movement".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + Shift + ↑".to_string(),
                    windows: "Ctrl + Shift + ↑".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Scroll down shortcut
        shortcuts.insert(
            "scroll-down".to_string(),
            ShortcutEntry {
                key: "scroll-down".to_string(),
                title: "Scroll Chat Down".to_string(),
                description: "Scroll down in the AI chat window".to_string(),
                category: "movement".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + Shift + ↓".to_string(),
                    windows: "Ctrl + Shift + ↓".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Move up shortcut
        shortcuts.insert(
            "move-up".to_string(),
            ShortcutEntry {
                key: "move-up".to_string(),
                title: "Move Window Up".to_string(),
                description: "Move the WhisprGPT window upward".to_string(),
                category: "movement".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + ↑".to_string(),
                    windows: "Ctrl + ↑".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Move down shortcut
        shortcuts.insert(
            "move-down".to_string(),
            ShortcutEntry {
                key: "move-down".to_string(),
                title: "Move Window Down".to_string(),
                description: "Move the WhisprGPT window downward".to_string(),
                category: "movement".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + ↓".to_string(),
                    windows: "Ctrl + ↓".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Move left shortcut
        shortcuts.insert(
            "move-left".to_string(),
            ShortcutEntry {
                key: "move-left".to_string(),
                title: "Move Window Left".to_string(),
                description: "Move the WhisprGPT window to the left".to_string(),
                category: "movement".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + ←".to_string(),
                    windows: "Ctrl + ←".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Move right shortcut
        shortcuts.insert(
            "move-right".to_string(),
            ShortcutEntry {
                key: "move-right".to_string(),
                title: "Move Window Right".to_string(),
                description: "Move the WhisprGPT window to the right".to_string(),
                category: "movement".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + →".to_string(),
                    windows: "Ctrl + →".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Home shortcut
        shortcuts.insert(
            "home".to_string(),
            ShortcutEntry {
                key: "home".to_string(),
                title: "Go Home".to_string(),
                description: "Return to the main dashboard page".to_string(),
                category: "navigation".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + B".to_string(),
                    windows: "Ctrl + B".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Hide/Show shortcut
        shortcuts.insert(
            "hide-show".to_string(),
            ShortcutEntry {
                key: "hide-show".to_string(),
                title: "Hide/Show Window".to_string(),
                description: "Toggle visibility of the WhisprGPT window".to_string(),
                category: "system".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + H".to_string(),
                    windows: "Ctrl + H".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Quit shortcut
        shortcuts.insert(
            "quit".to_string(),
            ShortcutEntry {
                key: "quit".to_string(),
                title: "Emergency Exit".to_string(),
                description: "Instantly close WhisprGPT (kill switch)".to_string(),
                category: "system".to_string(),
                default_shortcut: PlatformShortcut {
                    mac: "⌘ + Q".to_string(),
                    windows: "Ctrl + W".to_string(),
                },
                custom_shortcut: None,
            },
        );
        
        // Return the default settings
        // RUST CONCEPT: "Self" means WhisperSettings
        // This is like "return { ... }" in JavaScript
        Self {
            llm: "chatgpt".to_string(),
            system_prompt: "ENTER CUSTOM PROMPT OR USE TEMPLATES".to_string(),
            retry_prompt: "ENTER RETRY/BACKUP PROMPT".to_string(),
            screen_width: 500,
            screen_height: 400,
            focusable: true,
            show_banner: true,
            opacity: 1.0,
            shortcuts,
        }
    }
}