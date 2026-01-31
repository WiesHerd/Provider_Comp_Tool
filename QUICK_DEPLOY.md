# ⚡ Quick Deploy - Fix "Site Not Found"

## The Problem
You're seeing "Site Not Found" because the app hasn't been deployed to Firebase Hosting yet.

## The Solution - Run This Command:

```powershell
npm run deploy
```

This will:
1. ✅ Build your app for Firebase (creates `out/` directory)
2. ✅ Deploy to Firebase Hosting
3. ✅ Make your app live at https://complens-88a4f.web.app

## What You'll See

The command will show:
- Build progress
- File count being deployed
- Deployment URL
- Success message

## After Deployment

1. Wait 30-60 seconds for CDN propagation
2. Visit: https://complens-88a4f.web.app
3. You should see your app (not "Site Not Found")

## If It Fails

**Build fails?**
- Check `.env.local` has all Firebase variables
- Run: `npm install`

**Deploy fails?**
- Check: `firebase login`
- Verify: `firebase projects:list`

---

**Just run `npm run deploy` and your app will be live!** 🚀












