# 🚀 Step 2 Quick Start: Window Management

## What You Get

12 new window management commands to replace Electron window operations!

---

## ⚡ 3-Minute Setup

### 1. Copy Files to Your Project

```bash
# Navigate to your project
cd C:\Users\david\Documents\icodehere\t_app

# Copy Rust files (overwrites existing)
# From downloaded folder → your project
copy tauri-migration-step2\src-tauri\src\commands\window.rs src-tauri\src\commands\window.rs
copy tauri-migration-step2\src-tauri\src\commands\mod.rs src-tauri\src\commands\mod.rs
copy tauri-migration-step2\src-tauri\src\main.rs src-tauri\src\main.rs

# Copy TypeScript files
copy tauri-migration-step2\src\lib\window-api.ts src\lib\window-api.ts
copy tauri-migration-step2\src\components\WindowTest.tsx src\components\WindowTest.tsx
```

### 2. Rebuild

```bash
cd src-tauri
cargo build
cd ..
```

### 3. Test It

Update `src/App.tsx`:

```tsx
import { WindowTest } from './components/WindowTest';

function App() {
  return <WindowTest />;
}

export default App;
```

### 4. Run

```bash
npm run tauri dev
```

---

## 🎮 What You'll See

A window with controls for:

**Opacity** - Slider to make window transparent  
**Movement** - ↑↓←→ buttons to move window  
**Visibility** - Hide/Show/Toggle buttons  
**Always On Top** - Enable/Disable  
**App Controls** - Delete cache, Restart, Close  

---

## ✅ Quick Test

1. Move opacity slider → Click "Apply Opacity" → Window becomes transparent ✓
2. Click ↑ button → Window moves up ✓
3. Click "Hide Window" → Window disappears ✓
4. Alt+Tab back to app → Window reappears ✓
5. Click "Enable Always On Top" → Window stays on top ✓

**If all work → Step 2 complete!** 🎉

---

## 📊 Progress

```
[████░░░░░░] 40% Complete

✅ Step 1: Settings (DONE)
✅ Step 2: Window Management (DONE) ← You are here
⬜ Step 3: Global Shortcuts
⬜ Step 4: Screenshot Capture
⬜ Step 5: LLM Upload System
```

---

## 💡 Using in Your Real Components

```typescript
// OLD (Electron)
await window.electron.closeApp();
await window.electron.setOpacity(0.8);

// NEW (Tauri)
import { windowApi } from '@/lib/window-api';

await windowApi.close();
await windowApi.setOpacity(0.8);
```

---

**Ready for Step 3 (Global Shortcuts)?** Let me know! 🚀