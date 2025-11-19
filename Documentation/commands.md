# Start
```powershell
npm install
```

Using windows subsystem for linux run the command
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Desktop Development
```powershell
npm run tauri dev
```

# Create a visual structure
```bash
cd /mnt/user-data/outputs/tauri-migration && tree -L 4 -I 'target|node_modules' > FILE_STRUCTURE.txt 2>/dev/null || find . -type f -not -path '*/target/*' -not -path '*/node_modules/*' | sort > FILE_STRUCTURE.txt
```