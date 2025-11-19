# WhisprGPT - Tauri Migration: Step 1 - Settings System

## 🎯 What We Built

In this first step, we've migrated your **settings system** from Electron to Tauri:

✅ **Rust Backend:**
- `types.rs` - Type definitions (like TypeScript interfaces)
- `state/settings.rs` - File I/O for loading/saving settings
- `commands/settings.rs` - IPC handlers (callable from React)

✅ **TypeScript Frontend:**
- `lib/tauri-api.ts` - API wrapper for Tauri commands
- `components/SettingsTest.tsx` - Test component

---

## 📁 File Structure

```
whisprgpt-tauri/
├── src/                          # Your React frontend (unchanged)
│   ├── components/
│   │   └── SettingsTest.tsx     # NEW: Test component
│   └── lib/
│       └── tauri-api.ts          # NEW: Tauri API wrapper
│
└── src-tauri/                    # Rust backend
    ├── src/
    │   ├── main.rs               # Entry point
    │   ├── types.rs              # Type definitions
    │   ├── state/
    │   │   ├── mod.rs
    │   │   └── settings.rs       # Settings storage
    │   └── commands/
    │       ├── mod.rs
    │       └── settings.rs       # Settings commands
    └── Cargo.toml                # Dependencies (like package.json)
```

---

## 🚀 How to Build and Test

### Step 1: Install Rust Dependencies

```bash
cd src-tauri
cargo build
```

**What this does:**
- Downloads and compiles all Rust dependencies
- Similar to `npm install`
- First time will take ~5 minutes (compiles from source)

### Step 2: Install Tauri CLI (if not already installed)

```bash
# From your project root
npm install -D @tauri-apps/cli
npm install @tauri-apps/api
```

### Step 3: Add the Test Component to Your App

In your `src/App.tsx` or main component, add:

```tsx
import { SettingsTest } from './components/SettingsTest';

function App() {
  return (
    <div>
      <SettingsTest />
    </div>
  );
}
```

### Step 4: Run the App

```bash
# From project root
npm run tauri dev
```

**What you should see:**
1. A window opens with your test component
2. Settings are loaded from disk (or defaults if first run)
3. You can edit settings and save them
4. Settings persist between app restarts

### Step 5: Test the Settings System

Try these actions in the test UI:

1. **Load Settings** - Should show default settings on first run
2. **Change LLM** - Select a different AI model
3. **Edit System Prompt** - Type a custom prompt
4. **Save Settings** - Click "Save Settings" button
5. **Close and Reopen App** - Your changes should persist
6. **Reset to Defaults** - Click "Reset" to restore defaults

---

## 🔍 Where Are Settings Stored?

Settings are saved to a JSON file in the app data directory:

**macOS:**
```
~/Library/Application Support/com.electron.whisprgpt/settings.json
```

**Windows:**
```
C:\Users\<username>\AppData\Roaming\com.electron.whisprgpt\settings.json
```

You can view/edit this file directly for debugging.

---

## 🐛 Troubleshooting

### Error: "Command not found"

**Problem:** Tauri commands aren't registered

**Solution:**
1. Check that `main.rs` has all commands in `invoke_handler![]`
2. Rebuild: `cd src-tauri && cargo build`

### Error: "Failed to parse settings JSON"

**Problem:** Corrupted settings file

**Solution:**
1. Delete the settings.json file (see paths above)
2. Restart the app (will create new defaults)

### Error: "Cannot find module '@tauri-apps/api'"

**Problem:** Tauri API not installed

**Solution:**
```bash
npm install @tauri-apps/api
```

---

## 📚 Understanding the Code

### Rust Concepts for JavaScript Developers

#### 1. **Result<T, E> - Error Handling**

**JavaScript:**
```javascript
try {
  const data = await loadSettings();
  return data;
} catch (error) {
  return null;
}
```

**Rust:**
```rust
fn load_settings() -> Result<Settings, String> {
  let data = read_file()?;  // ? automatically returns error
  Ok(data)
}
```

#### 2. **Option<T> - Null Safety**

**JavaScript:**
```javascript
let settings: Settings | null = null;
```

**Rust:**
```rust
let settings: Option<Settings> = None;
```

#### 3. **Ownership & Borrowing**

**JavaScript:** Everything is passed by reference
```javascript
function save(settings) {  // Can modify original
  settings.llm = "grok";
}
```

**Rust:** Must explicitly borrow
```rust
fn save(settings: &Settings) {  // & = borrow (read-only)
  // Can't modify unless it's &mut Settings
}
```

#### 4. **Struct vs Interface**

**TypeScript:**
```typescript
interface Settings {
  llm: string;
  opacity: number;
}
```

**Rust:**
```rust
#[derive(Serialize, Deserialize)]
struct Settings {
  llm: String,
  opacity: f64,
}
```

---

## ✅ Next Steps

Once you verify the settings system works, we'll move to:

**Step 2: Window Management**
- Always-on-top
- Opacity control
- Window positioning
- Hide/show functionality

**Step 3: Global Shortcuts**
- System-wide keyboard shortcuts
- Platform-specific handling

**Step 4: Screenshot Capture**
- Platform-specific screenshot logic
- Integration with LLM upload

---

## 📝 Notes

- **No async/await in Rust commands yet** - We're using synchronous file I/O for simplicity
- **Settings auto-load on first command** - No need to manually initialize
- **Thread-safe by default** - Mutex ensures no race conditions
- **Type-safe** - Rust compiler checks everything at compile time

---

## 🆘 Need Help?

If something doesn't work:
1. Check the terminal for Rust error messages
2. Look at the browser console for JavaScript errors
3. Verify the settings.json file exists and is valid JSON
4. Try rebuilding: `cd src-tauri && cargo clean && cargo build`

---

**Ready to test? Run `npm run tauri dev` and let me know what you see!** 🚀