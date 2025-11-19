# 📋 Quick Reference - Rust for JavaScript Developers

## Common Patterns Cheat Sheet

### 1. Variables

```javascript
// JavaScript
let name = "WhisprGPT";
const version = "2.1.1";
```

```rust
// Rust
let name = "WhisprGPT";        // Immutable by default
let mut version = "2.1.1";     // Mutable (can change)
```

### 2. Functions

```javascript
// JavaScript
async function getSettings() {
  return settings;
}
```

```rust
// Rust
fn get_settings() -> WhisperSettings {
  settings
}

// With error handling
fn get_settings() -> Result<WhisperSettings, String> {
  Ok(settings)
}
```

### 3. Error Handling

```javascript
// JavaScript
try {
  const data = readFile("settings.json");
  return data;
} catch (error) {
  console.error(error);
  return null;
}
```

```rust
// Rust
fn read_settings() -> Result<Settings, String> {
  let data = read_file("settings.json")?;  // ? = early return on error
  Ok(data)
}
```

### 4. Null/Undefined

```javascript
// JavaScript
let settings = null;
if (settings !== null) {
  console.log(settings);
}
```

```rust
// Rust
let settings: Option<Settings> = None;
if let Some(s) = settings {
  println!("{:?}", s);
}
```

### 5. JSON Parsing

```javascript
// JavaScript
const json = JSON.stringify(settings);
const settings = JSON.parse(json);
```

```rust
// Rust
let json = serde_json::to_string(&settings)?;
let settings: Settings = serde_json::from_str(&json)?;
```

### 6. File I/O

```javascript
// JavaScript
const fs = require('fs');
const data = fs.readFileSync('file.txt', 'utf8');
fs.writeFileSync('file.txt', data);
```

```rust
// Rust
use std::fs;
let data = fs::read_to_string("file.txt")?;
fs::write("file.txt", data)?;
```

### 7. Hash Maps / Objects

```javascript
// JavaScript
const shortcuts = {
  "screenshot": { key: "screenshot", ... },
  "record": { key: "record", ... }
};
```

```rust
// Rust
use std::collections::HashMap;
let mut shortcuts = HashMap::new();
shortcuts.insert("screenshot".to_string(), ShortcutEntry { ... });
shortcuts.insert("record".to_string(), ShortcutEntry { ... });
```

### 8. Arrays / Vectors

```javascript
// JavaScript
const items = [1, 2, 3];
items.push(4);
```

```rust
// Rust
let mut items = vec![1, 2, 3];
items.push(4);
```

### 9. String Types

```javascript
// JavaScript
const name = "WhisprGPT";  // Only one string type
```

```rust
// Rust
let name: &str = "WhisprGPT";      // String slice (immutable)
let name: String = "WhisprGPT".to_string();  // Owned string (mutable)
```

### 10. Imports/Exports

```javascript
// JavaScript
export function getSettings() { ... }
import { getSettings } from './settings';
```

```rust
// Rust
pub fn get_settings() { ... }  // pub = public
use crate::settings::get_settings;
```

---

## Tauri-Specific Patterns

### 1. Defining a Command

```rust
#[tauri::command]
fn my_command(param: String) -> Result<String, String> {
  Ok(format!("Hello, {}!", param))
}
```

### 2. Registering Commands

```rust
// In main.rs
fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      my_command,
      another_command,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

### 3. Calling from JavaScript

```typescript
import { invoke } from '@tauri-apps/api/tauri';

const result = await invoke('my_command', { param: 'World' });
console.log(result); // "Hello, World!"
```

### 4. Using State

```rust
// In main.rs
.manage(Mutex::new(None::<Settings>))

// In command
#[tauri::command]
fn my_command(state: State<Mutex<Option<Settings>>>) {
  let settings = state.lock().unwrap();
  // Use settings...
}
```

---

## Common Rust Syntax

| Syntax | Meaning | Example |
|--------|---------|---------|
| `&` | Borrow (reference) | `&settings` |
| `&mut` | Mutable borrow | `&mut settings` |
| `?` | Early return on error | `read_file()?` |
| `!` | Macro | `println!()` |
| `::` | Path separator | `std::fs::read` |
| `->` | Return type | `fn get() -> String` |
| `<T>` | Generic type | `Option<Settings>` |
| `#[...]` | Attribute/macro | `#[derive(Debug)]` |

---

## Debugging Tips

### 1. Print Debugging

```rust
println!("Debug: {:?}", variable);  // {:?} = Debug format
println!("Pretty: {:#?}", variable); // {:#?} = Pretty print
```

### 2. Compiler Messages

Rust compiler errors are **very helpful**. Read them carefully!

```
error[E0308]: mismatched types
  --> src/main.rs:10:5
   |
10 |     "hello"
   |     ^^^^^^^ expected `String`, found `&str`
   |
help: try using a conversion method
   |
10 |     "hello".to_string()
   |            +++++++++++
```

### 3. Type Annotations

When confused, add type annotations:

```rust
let settings: WhisperSettings = load_settings()?;
```

---

## Resources

- **Rust Book**: https://doc.rust-lang.org/book/
- **Tauri Docs**: https://tauri.app/v1/guides/
- **Rust by Example**: https://doc.rust-lang.org/rust-by-example/

---

## Remember

✅ **Rust is compiled** - Errors show up at compile time, not runtime
✅ **Ownership system** - Prevents memory bugs at compile time
✅ **No null/undefined** - Use `Option<T>` instead
✅ **Explicit errors** - Use `Result<T, E>` instead of exceptions
✅ **Immutable by default** - Use `mut` when you need to modify

---

Keep this handy while coding! 🚀