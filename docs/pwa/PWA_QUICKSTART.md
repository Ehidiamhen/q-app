# PWA Quick Start

## ⚡ 3 Steps to Launch Your PWA

### Step 1: Install Dependencies

```bash
cd /Users/ehis/Documents/CODE/PERSONAL/q-app
pnpm install
```

This installs `@ducanh2912/next-pwa` and all dependencies.

### Step 2: Build and Test

```bash
cd apps/frontend
pnpm build
pnpm start
```

Visit `http://localhost:3000` and:
- Open DevTools → Application tab
- Check Service Workers (should see registered)
- Navigate to 2-3 pages
- Wait 2 seconds → Install prompt appears! 🎉

### Step 3: Deploy to Production

```bash
# Deploy to your hosting (Vercel, Netlify, etc.)
git add .
git commit -m "feat: add PWA support"
git push

# Or deploy directly
vercel --prod
```

**That's it!** Your PWA is live.

---

## 🎯 What You Get

✅ **Install prompts** (smart, engagement-based)  
✅ **Offline support** (automatic caching)  
✅ **Auto-updates** (with user notification)  
✅ **Home screen icon** (looks like native app)  
✅ **Standalone mode** (no browser UI)  
✅ **Fast loading** (50-70% faster repeats)

---

## 📱 Test on Your Phone

1. **Deploy to production** (HTTPS required)
2. **Visit on mobile** (Chrome/Safari)
3. **Browse 2-3 pages**
4. **See install prompt** (bottom sheet)
5. **Tap "Install Now"**
6. **Check home screen** → QApp icon! 🎉

---

## 📊 Check Your Score

Run Lighthouse audit:
1. Open DevTools → Lighthouse
2. Select "Progressive Web App"
3. Click "Analyze page load"
4. **Target: 90+ score** ✅

---

## 📚 Documentation

- **Detailed Guide:** `PWA_SETUP.md`
- **Implementation Summary:** `PWA_IMPLEMENTATION_SUMMARY.md`
- **This Quickstart:** `PWA_QUICKSTART.md`

---

**Ready? Run `pnpm install` and let's go! 🚀**
