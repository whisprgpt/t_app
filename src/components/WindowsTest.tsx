// src/components/WindowTest.tsx
// Test component for window management functionality
// UPDATED: Real-time opacity, white background, always-on-top by default

import React, { useState, useEffect } from 'react';
import { windowApi } from '../lib/windows-api.ts';

export function WindowTest() {
  const [version, setVersion] = useState<string>('');
  const [opacity, setOpacity] = useState<number>(1.0);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadVersion();
    // Set always on top immediately on mount
    windowApi.setAlwaysOnTop(true).catch(err => {
      console.error('Failed to set always on top:', err);
    });
  }, []);

  const loadVersion = async () => {
    try {
      const ver = await windowApi.getVersion();
      setVersion(ver);
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  // Real-time opacity change as you drag the slider
  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    // Apply opacity immediately (not available in Tauri v1, but we can try)
    windowApi.setOpacity(newOpacity).catch(() => {
      // If window opacity fails, at least update the state
      // The CSS opacity will work
    });
  };

  const handleMove = async (direction: 'up' | 'down' | 'left' | 'right') => {
    try {
      switch (direction) {
        case 'up':
          await windowApi.moveUp();
          break;
        case 'down':
          await windowApi.moveDown();
          break;
        case 'left':
          await windowApi.moveLeft();
          break;
        case 'right':
          await windowApi.moveRight();
          break;
      }
      setMessage(`Window moved ${direction}`);
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const handleDeleteCache = async () => {
    try {
      const result = await windowApi.deleteCache();
      setMessage(result);
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await windowApi.toggleVisibility(opacity);
      setMessage('Toggled visibility');
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  return (
    // WHITE BACKGROUND + CSS OPACITY for content
    <div style={{ 
      padding: '20px', 
      fontFamily: 'sans-serif',
      backgroundColor: '#ffffff',  // ← WHITE BACKGROUND
      minHeight: '100vh',
      opacity: opacity  // ← CSS opacity (works when window opacity doesn't)
    }}>
      <h1>Window Management Test</h1>
      <p>App Version: <strong>{version}</strong></p>
      <p style={{ color: '#666', fontSize: '14px' }}>
        ✅ Always on top is enabled by default<br/>
        ⌨️ Use Ctrl+Arrow keys to move window<br/>
        ⌨️ Use Ctrl+H to hide/show window
      </p>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {/* Opacity Control */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', backgroundColor: '#fafafa' }}>
        <h2>Opacity Control</h2>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Note: Window opacity not supported in Tauri v1. Using CSS opacity instead.
        </p>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Opacity: {opacity.toFixed(1)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </label>
      </div>

      {/* Window Movement */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', backgroundColor: '#fafafa' }}>
        <h2>Window Movement</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          Use buttons below or Ctrl+Arrow keys
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '10px', justifyContent: 'center' }}>
          <div></div>
          <button onClick={() => handleMove('up')} style={{ padding: '10px', cursor: 'pointer' }}>
            ↑ Up
          </button>
          <div></div>
          
          <button onClick={() => handleMove('left')} style={{ padding: '10px', cursor: 'pointer' }}>
            ← Left
          </button>
          <div></div>
          <button onClick={() => handleMove('right')} style={{ padding: '10px', cursor: 'pointer' }}>
            → Right
          </button>
          
          <div></div>
          <button onClick={() => handleMove('down')} style={{ padding: '10px', cursor: 'pointer' }}>
            ↓ Down
          </button>
          <div></div>
        </div>
      </div>

      {/* Visibility Controls */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', backgroundColor: '#fafafa' }}>
        <h2>Visibility Controls</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          Press Ctrl+H to toggle hide/show
        </p>
        <button onClick={() => windowApi.hide()} style={{ padding: '8px 16px', marginRight: '10px', cursor: 'pointer' }}>
          Hide Window
        </button>
        <button onClick={() => windowApi.show(opacity)} style={{ padding: '8px 16px', marginRight: '10px', cursor: 'pointer' }}>
          Show Window
        </button>
        <button onClick={handleToggleVisibility} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Toggle Visibility (Ctrl+H)
        </button>
      </div>

      {/* App Controls */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', backgroundColor: '#fafafa' }}>
        <h2>App Controls</h2>
        <button onClick={handleDeleteCache} style={{ padding: '8px 16px', marginRight: '10px', cursor: 'pointer' }}>
          Delete Cache
        </button>
        <button onClick={() => windowApi.restart()} style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#ff9800', color: 'white', border: 'none', cursor: 'pointer' }}>
          Restart App
        </button>
        <button onClick={() => windowApi.close()} style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}>
          Close App
        </button>
      </div>
    </div>
  );
}