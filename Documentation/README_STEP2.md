# Step 2: Window Management Migration ✅

## 🎯 What We Built

Window management commands to replace your Electron window operations:

✅ **App Controls:**
- Close app
- Restart app
- Get app version
- Delete cache

✅ **Window Properties:**
- Set opacity
- Set always on top
- Set focusable
- Set window size

✅ **Window Positioning:**
- Move window (up/down/left/right)
- Custom delta movement

✅ **Visibility:**
- Hide window
- Show window
- Toggle visibility

---

## 📁 Files Created

```
src-tauri/src/
├── commands/
│   ├── mod.rs              # UPDATED: Added window module
│   └── window.rs           # NEW: Window management commands
└── main.rs                 # UPDATED: Registered window commands

src/
├── lib/
│   └── window-api.ts       # NEW: TypeScript API wrapper
└── components/
    └── WindowTest.tsx      # NEW: Test component
```

---

## 🚀 How to Install

### Step 1: Copy Rust Files

Copy these files to your project:

```bash
# From the step2 folder to your project
src-tauri/src/commands/window.rs    → YOUR_PROJECT/src-tauri/src/commands/window.rs
src-tauri/src/commands/mod.rs       → YOUR_PROJECT/src-tauri/src/commands/mod.rs
src-tauri/src/main.rs                → YOUR_PROJECT/src-tauri/src/main.rs
```

### Step 2: Copy TypeScript Files

```bash
src/lib/window-api.ts                → YOUR_PROJECT/src/lib/window-api.ts
src/components/WindowTest.tsx        → YOUR_PROJECT/src/components/WindowTest.tsx
```

### Step 3: Rebuild Rust

```bash
cd src-tauri
cargo build
cd ..
```

### Step 4: Test Window Management

Update your `App.tsx`:

```tsx
import { WindowTest } from './components/WindowTest';

function App() {
  return (
    <div>
      <WindowTest />
    </div>
  );
}
```

### Step 5: Run and Test

```bash
npm run tauri dev
```

---

## 🧪 Testing Checklist

### Opacity Control
- [ ] Move opacity slider
- [ ] Click "Apply Opacity"
- [ ] Window becomes transparent/opaque

### Window Movement
- [ ] Click ↑ Up button - window moves up
- [ ] Click ↓ Down button - window moves down
- [ ] Click ← Left button - window moves left
- [ ] Click → Right button - window moves right

### Visibility
- [ ] Click "Hide Window" - window disappears
- [ ] Press Alt+Tab and select app - window reappears
- [ ] Click "Toggle Visibility" - toggles hide/show

### Always On Top
- [ ] Click "Enable Always On Top"
- [ ] Open another app - your window stays on top
- [ ] Click "Disable Always On Top"
- [ ] Open another app - your window can be covered

### App Controls
- [ ] Check app version displays correctly
- [ ] Click "Delete Cache" - success message appears
- [ ] Click "Restart App" - app restarts
- [ ] Click "Close App" - app closes

---

## 📊 Migration Status

```
[████░░░░░░] 40% Complete

✅ Step 1: Settings System (DONE)
✅ Step 2: Window Management (DONE) ← You are here
⬜ Step 3: Global Shortcuts
⬜ Step 4: Screenshot Capture
⬜ Step 5: LLM Upload System
⬜ Step 6: Deep Linking
⬜ Step 7: Permissions
⬜ Step 8: Auto-Updates
```

---

## 🔄 Electron vs Tauri Comparison

### Before (Electron):

```javascript
// ipcEvents.ts
ipcMain.handle("close-app", async () => {
  mainWindow.close();
});

ipcMain.handle("set-opacity", async (_, opacity) => {
  mainWindow.setOpacity(opacity);
});

// Platform-specific
const osConfig = getOsConfig();
osConfig.hideWindow(mainWindow);
```

```typescript
// React
await window.electron.closeApp();
await window.electron.setOpacity(0.8);
```

### After (Tauri):

```rust
// commands/window.rs
#[tauri::command]
pub fn close_app_command(window: Window) -> Result<(), String> {
  window.close()
}

#[tauri::command]
pub fn set_opacity_command(window: Window, opacity: f64) -> Result<(), String> {
  window.set_opacity(opacity)
}

// Platform-specific automatically handled
#[cfg(target_os = "windows")]
{
  window.set_opacity(0.0)
}

#[cfg(target_os = "macos")]
{
  window.hide()
}
```

```typescript
// React
import { windowApi } from '@/lib/window-api';

await windowApi.close();
await windowApi.setOpacity(0.8);
```

---

## 💡 Key Differences

### 1. Platform-Specific Code

**Electron:**
- Separate files (mac.ts, win.ts)
- Runtime OS detection
- Conditional exports

**Tauri:**
- Compile-time selection
- `#[cfg(target_os = "...")]`
- Code not included if not needed

### 2. Window Management

**Electron:**
```javascript
mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
mainWindow.setOpacity(0.8);
```

**Tauri:**
```rust
window.set_always_on_top(true)?;
window.set_opacity(0.8)?;
```

### 3. Error Handling

**Electron:**
```javascript
try {
  mainWindow.close();
} catch (error) {
  logError(error);
}
```

**Tauri:**
```rust
window.close()
  .map_err(|e| format!("Failed to close: {}", e))?;
```

---

## 🎓 What You Learned

### Rust Concepts:
- ✅ Platform-specific compilation (`#[cfg(...)]`)
- ✅ Window API in Tauri
- ✅ AppHandle vs Window
- ✅ Error propagation with `?`

### Tauri Concepts:
- ✅ Window commands
- ✅ App lifecycle management
- ✅ Cross-platform window management
- ✅ TypeScript → Rust parameter passing

---

## 🔧 Troubleshooting

### Error: "Failed to resolve: use of undeclared crate or module `commands`"

**Fix:** Make sure you copied all three Rust files:
- `commands/window.rs`
- `commands/mod.rs`
- `main.rs`

### Error: "Cannot find module '@/lib/window-api'"

**Fix:** Make sure you copied `window-api.ts` to `src/lib/`

### Window doesn't move

**Fix:** Check that the window isn't maximized. Maximized windows can't be moved programmatically.

### Opacity doesn't change

**Fix:** 
- Windows: Make sure window has `transparent: true` in tauri.conf.json
- macOS: Opacity works by default

---

## 📝 Updating Your Real Components

To use window management in your existing components:

```typescript
// Before (Electron)
await window.electron.closeApp();
await window.electron.setOpacity(0.9);

// After (Tauri)
import { windowApi } from '@/lib/window-api';

await windowApi.close();
await windowApi.setOpacity(0.9);
```

---

## ✨ Next Steps

Once you verify everything works:

1. **Remove the test component** (WindowTest.tsx)
2. **Update your real components** to use `windowApi`
3. **Move to Step 3: Global Shortcuts** (system-wide hotkeys)

**Ready for Step 3?** Let me know! 🚀