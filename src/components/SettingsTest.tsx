// src/components/SettingsTest.tsx
// This is a simple test component to verify your settings system works
// You can add this to your existing React app to test

import { useEffect, useState } from 'react';
import { settingsApi, WhisperSettings } from '../lib/tauri-api';

export function SettingsTest() {
  const [settings, setSettings] = useState<WhisperSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.get();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setError(null);
      await settingsApi.save(settings);
      alert('Settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  const handleReset = async () => {
    try {
      setError(null);
      const defaults = await settingsApi.reset();
      setSettings(defaults);
      alert('Settings reset to defaults!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        <h3>Error:</h3>
        <p>{error}</p>
        <button onClick={loadSettings}>Retry</button>
      </div>
    );
  }

  if (!settings) {
    return <div>No settings loaded</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Settings Test</h1>
      
      {/* Display current settings */}
      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <h2>Current Settings:</h2>
        <pre>{JSON.stringify(settings, null, 2)}</pre>
      </div>

      {/* Simple form to edit settings */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Edit Settings:</h2>
        
        <label style={{ display: 'block', marginBottom: '10px' }}>
          LLM:
          <select
            value={settings.llm}
            onChange={(e) => setSettings({ ...settings, llm: e.target.value as any })}
            style={{ marginLeft: '10px' }}
          >
            <option value="chatgpt">ChatGPT</option>
            <option value="grok">Grok</option>
            <option value="deepseek">DeepSeek</option>
            <option value="gemini">Gemini</option>
            <option value="perplexity">Perplexity</option>
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: '10px' }}>
          System Prompt:
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
            style={{ marginLeft: '10px', width: '400px', height: '60px' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '10px' }}>
          Screen Width:
          <input
            type="number"
            value={settings.screenWidth}
            onChange={(e) => setSettings({ ...settings, screenWidth: parseInt(e.target.value) })}
            style={{ marginLeft: '10px', width: '80px' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '10px' }}>
          Screen Height:
          <input
            type="number"
            value={settings.screenHeight}
            onChange={(e) => setSettings({ ...settings, screenHeight: parseInt(e.target.value) })}
            style={{ marginLeft: '10px', width: '80px' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '10px' }}>
          Opacity:
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={settings.opacity}
            onChange={(e) => setSettings({ ...settings, opacity: parseFloat(e.target.value) })}
            style={{ marginLeft: '10px', width: '80px' }}
          />
        </label>
      </div>

      {/* Action buttons */}
      <div>
        <button onClick={handleSave} style={{ marginRight: '10px', padding: '10px 20px' }}>
          Save Settings
        </button>
        <button onClick={handleReset} style={{ marginRight: '10px', padding: '10px 20px' }}>
          Reset to Defaults
        </button>
        <button onClick={loadSettings} style={{ padding: '10px 20px' }}>
          Reload from Disk
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// USAGE:
// ============================================================================
// Add this to your main App component to test:
//
// import { SettingsTest } from './components/SettingsTest';
//
// function App() {
//   return (
//     <div>
//       <SettingsTest />
//     </div>
//   );
// }