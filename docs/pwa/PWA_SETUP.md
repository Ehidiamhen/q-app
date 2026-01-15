# PWA Setup Guide for QApp

## ✅ Implementation Complete!

QApp is now a fully functional Progressive Web App (PWA) with offline support, install prompts, and automatic updates.

---

## 🚀 Getting Started

### 1. Install Dependencies

Run this command to install the PWA package:

```bash
pnpm install
```

This will install `@ducanh2912/next-pwa@^10.2.14` and all dependencies.

### 2. Build and Test

```bash
# Development (PWA disabled for better DX)
pnpm dev

# Production build (PWA enabled)
pnpm build
pnpm start
```

**Note:** PWA features are disabled in development mode to avoid caching issues. Test in production build.

### 3. Test Locally with HTTPS

For full PWA testing locally, you need HTTPS:

```bash
# Option 1: Using ngrok
npx ngrok http 3000

# Option 2: Using local-ssl-proxy
npx local-ssl-proxy --source 3001 --target 3000
```

Then visit `https://localhost:3001` or your ngrok URL.

---

## 📦 What Was Implemented

### 1. **Service Worker Configuration** (`next.config.ts`)

- ✅ Automatic service worker generation
- ✅ Smart caching strategies:
  - **Static assets**: Cache First (30 days)
  - **API routes**: Network First (5 min fallback)
  - **R2 images**: Cache First (30 days, 100 entries)
  - **Google Fonts**: Cache First (1 year)
- ✅ Offline fallback page
- ✅ Automatic cache cleanup

### 2. **Web App Manifest** (`app/site.webmanifest`)

Enhanced manifest with:
- ✅ Complete app metadata
- ✅ Multiple icon sizes (16x16 to 512x512)
- ✅ Maskable icons for Android
- ✅ App shortcuts (Search, Upload)
- ✅ Theme colors for light/dark mode
- ✅ Standalone display mode

### 3. **Install Prompt** (`components/pwa/install-prompt.tsx`)

Smart engagement-based prompting:
- ✅ **Desktop**: Top banner with gradient
- ✅ **Mobile**: Bottom sheet with benefits
- ✅ **Timing**: Shows after 2+ visits OR 3+ pages
- ✅ **Dismissal tracking**: Respects user choice
- ✅ **Re-prompting**: After 7 days if dismissed 2+ times

### 4. **Update Prompt** (`components/pwa/update-prompt.tsx`)

Automatic update detection:
- ✅ Detects new service worker
- ✅ Non-intrusive notification (bottom-right)
- ✅ User-controlled updates
- ✅ Dismissible with "Later" option

### 5. **PWA Utilities** (`lib/pwa-utils.ts`)

Helper functions for:
- ✅ Engagement tracking (page views, visits)
- ✅ Install prompt eligibility
- ✅ PWA detection
- ✅ localStorage management

### 6. **React Hooks**

**`use-pwa-install.ts`**:
- Captures `beforeinstallprompt` event
- Provides `install()` function
- Tracks installation state

**`use-pwa-update.ts`**:
- Detects service worker updates
- Provides `applyUpdate()` function
- Checks for updates every 60 seconds

### 7. **Offline Fallback Page** (`app/offline/page.tsx`)

Beautiful offline experience:
- ✅ Clear messaging
- ✅ Feature explanation
- ✅ Retry and navigation options

---

## 🎯 User Experience

### Install Flow

1. **User visits site** (engagement tracking starts)
2. **After 2+ visits OR 3+ pages**:
   - Desktop: Top banner appears
   - Mobile: Bottom sheet appears
3. **User clicks "Install"**:
   - Native browser prompt shows
   - App installs to device
   - Prompts disappear
4. **If dismissed**: Won't show again for 7 days (after 2 dismissals)

### Update Flow

1. **New version deployed**
2. **User's browser detects update**
3. **Bottom-right notification appears**:
   - "Update Available"
   - "Update Now" or "Later"
4. **User clicks "Update Now"**:
   - Page reloads with new version

### Offline Behavior

- **Cached pages**: Load instantly
- **Cached images**: Display normally
- **API calls**: Show cached data (5 min) or fail gracefully
- **Uncached pages**: Show `/offline` fallback page

---

## 📊 Testing Checklist

### Chrome DevTools

1. Open DevTools → **Application** tab
2. Check:
   - ✅ **Manifest**: All fields correct
   - ✅ **Service Worker**: Registered and activated
   - ✅ **Cache Storage**: Assets cached correctly
   - ✅ **Offline**: Toggle offline mode, test navigation

### Lighthouse Audit

1. Open DevTools → **Lighthouse** tab
2. Select **Progressive Web App**
3. Click **Analyze page load**
4. Target Score: **90+**

### Install Prompt Testing

1. Visit homepage (first time)
2. Navigate to 2-3 pages OR reload site twice
3. Wait 2 seconds
4. Install prompt should appear
5. Dismiss and verify it doesn't show again immediately

### Mobile Testing

1. Use Chrome on Android or Safari on iOS
2. Visit site over HTTPS
3. Check install prompt appears
4. Install and verify home screen icon
5. Launch and verify standalone mode

---

## 🔧 Configuration Options

### Caching Strategy

Edit `next.config.ts` → `workboxOptions.runtimeCaching`:

```typescript
{
  urlPattern: /your-api-pattern/,
  handler: 'NetworkFirst', // or 'CacheFirst', 'StaleWhileRevalidate'
  options: {
    cacheName: 'your-cache-name',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24, // 1 day
    },
  },
}
```

### Install Prompt Timing

Edit `lib/pwa-utils.ts` → `shouldShowInstallPrompt()`:

```typescript
// Change thresholds
return visitCount >= 2 || pageViews >= 3;
//     ^^^^^^^^^^^^           ^^^^^^^^^^^^
//     visits threshold        pages threshold
```

### Re-prompt Delay

Edit `lib/pwa-utils.ts` → `shouldShowInstallPrompt()`:

```typescript
if (promptData.dismissCount >= 2 && daysSinceDismiss < 7) {
//                              ^                      ^
//                              min dismissals         days
```

---

## 📱 Platform-Specific Notes

### Android (Chrome)

- ✅ Full PWA support
- ✅ Install prompt works natively
- ✅ Maskable icons supported
- ✅ Splash screen uses manifest theme

### iOS (Safari)

- ⚠️ Limited PWA support
- ❌ No `beforeinstallprompt` (manual Add to Home Screen)
- ❌ No push notifications
- ✅ Works as standalone app
- ✅ Apple touch icon supported

**For iOS users**: Show manual install instructions:
1. Tap Share button
2. Select "Add to Home Screen"
3. Confirm

### Desktop (Chrome/Edge)

- ✅ Full PWA support
- ✅ Install creates app window
- ✅ Appears in app list
- ✅ Can be default handler for links

---

## 🚨 Troubleshooting

### Install Prompt Not Showing

**Possible causes:**
1. Not served over HTTPS
2. Service worker not registered
3. Manifest invalid
4. Already dismissed recently
5. App already installed
6. Not enough engagement (< 2 visits / < 3 pages)

**Solution:**
- Check DevTools → Console for errors
- Verify manifest at `/site.webmanifest`
- Clear site data and reload
- Check localStorage for `pwa-*` keys

### Service Worker Not Updating

**Possible causes:**
1. Old service worker still active
2. Cache not cleared
3. Update prompt dismissed

**Solution:**
- Clear cache: DevTools → Application → Clear storage
- Unregister SW: DevTools → Application → Service Workers → Unregister
- Rebuild: `pnpm build`

### Offline Page Not Showing

**Possible causes:**
1. Fallback URL incorrect
2. Offline page not pre-cached
3. Service worker not active

**Solution:**
- Check `next.config.ts` → `fallbacks.document: '/offline'`
- Verify `/offline` page exists
- Test: DevTools → Network → Offline, navigate to uncached page

---

## 📈 Analytics & Monitoring

Track PWA metrics:

```typescript
// In install-prompt.tsx (example)
const handleInstall = async () => {
  const success = await install();
  if (success) {
    // Track install event
    analytics.track('pwa_installed', {
      source: 'install_prompt',
      platform: navigator.platform,
    });
  }
};
```

**Key metrics to track:**
- Install prompt impressions
- Install success rate
- Dismissal rate
- Update acceptance rate
- Offline page views
- Cache hit rate (Service Worker)

---

## 🎉 Success Criteria

Your PWA is working correctly if:

- ✅ Lighthouse PWA score is 90+
- ✅ Install prompt appears after engagement
- ✅ App installs on mobile/desktop
- ✅ Offline page shows when offline
- ✅ Updates are detected and applied
- ✅ Static assets load from cache
- ✅ Standalone mode works (no browser UI)

---

## 🔄 Next Steps (Optional Enhancements)

1. **Push Notifications**
   - Notify users of new questions in saved courses
   - Requires backend integration

2. **Background Sync**
   - Upload questions offline, sync when online
   - Requires service worker messaging

3. **Share Target**
   - Accept shares from other apps
   - Add to manifest

4. **Periodic Background Sync**
   - Check for new content periodically
   - Requires permission

5. **Install Analytics**
   - Track install funnel
   - A/B test prompt messaging

---

## 📚 Resources

- [Next PWA Docs](https://github.com/ImBIOS/next-pwa)
- [PWA Best Practices](https://web.dev/pwa/)
- [Workbox Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

**Questions?** Check the troubleshooting section or open an issue.

**Happy PWA building! 🎉**
