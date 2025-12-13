# 🔧 Check Build Status via CLI

## Quick Commands

### Check if build exists:
```powershell
cd "c:\Users\wherd\Python Projects\Provider_Comp_Tool"
Test-Path "out\index.html"
```
- Returns `True` = Build exists ✅
- Returns `False` = No build ❌

### Detailed check:
```powershell
cd "c:\Users\wherd\Python Projects\Provider_Comp_Tool"
if (Test-Path "out\index.html") {
    $count = (Get-ChildItem "out" -Recurse -File | Measure-Object).Count
    Write-Output "✅ Build OK - $count files"
} else {
    Write-Output "❌ No build found"
}
```

## Using the Check Script

I've created `check-build.ps1` for you. Use it like this:

### Just check status:
```powershell
.\check-build.ps1
```

### Check and build if needed:
```powershell
.\check-build.ps1 -Build
```

### Check, build, and deploy:
```powershell
.\check-build.ps1 -Build -Deploy
```

## Manual Build Commands

### Build only:
```powershell
npm run build:firebase
```

### Build and verify:
```powershell
npm run build:firebase
Test-Path "out\index.html"
```

### Build and deploy:
```powershell
npm run deploy
```

## What the Script Does

1. **Checks** if `out/index.html` exists
2. **Shows** file count and build time if found
3. **Builds** if `-Build` flag is used and no build exists
4. **Deploys** if `-Deploy` flag is used

## Expected Output

### ✅ Build Found:
```
✅ BUILD EXISTS
   Files: 150
   index.html: 12345 bytes
   Last Modified: 1/15/2025 2:30:45 PM
```

### ❌ No Build:
```
❌ BUILD NOT FOUND
💡 Run with -Build to build now:
   .\check-build.ps1 -Build
```

---

**Quick Check:**
```powershell
.\check-build.ps1
```








