# 📋 Days 4-5 Implementation Plan - Executive Summary

**Full Plan:** `docs/implementation-plans/DAY_4_5_IMPLEMENTATION_PLAN.md`

---

## 🎯 What We're Building

### Day 4 (6-7 hours)
1. **User Profile Page** - Display user info, uploads, edit display name
2. **Search Page** - Filters for course code, level, year, semester

### Day 5 (8-10 hours)
3. **Upload Form** - Multi-image upload with compression and R2
4. **Question Detail Page** - Image gallery with zoom

---

## 🔑 Key Design Decisions

### 1. SSR vs CSR

| Page | Choice | Why |
|------|--------|-----|
| User Profile | **SSR + CSR hybrid** | SEO for profiles, CSR for uploads pagination |
| Search | **CSR only** | Dynamic filters, client-side pagination |
| Upload | **CSR only** | Authenticated, complex client logic |
| Question Detail | **SSR** | **Critical for SEO and social sharing** |

**Tradeoff:** SSR is slightly more complex but essential for:
- ✅ Google indexing question papers
- ✅ Social media preview cards (Twitter/WhatsApp)
- ✅ Faster first paint

---

### 2. Image Upload Flow

**Direct to R2** (already implemented in backend):

```
User selects images → Compress client-side → Get presigned URLs
→ Upload directly to R2 → Submit form with R2 URLs → Create question
```

**Why this approach:**
- ✅ No server bandwidth usage
- ✅ Faster uploads (direct to R2)
- ✅ Scalable (no server bottleneck)
- ✅ Lower costs

**Library:** `browser-image-compression` (50KB, 3M+ weekly downloads)
- Compresses to <1MB per image
- Uses Web Workers (non-blocking)
- Reduces upload time by ~70%

---

### 3. Search Implementation

**URL-Based Filters:**

```
/search?q=CS101&level=100&year=2024&semester=First
```

**Why:**
- ✅ Shareable search results
- ✅ Browser back/forward works
- ✅ Better UX (bookmark searches)
- ✅ SEO benefits

**Debounced search:** 300ms delay to avoid excessive API calls

---

### 4. Image Gallery

**Native CSS Scroll Snap** (no dependencies):
- Uses native browser scroll-snap
- Touch-friendly swipe
- Zero bundle size
- Works everywhere

**Zoom:** `react-medium-image-zoom` (10KB)
- Lightweight, smooth animations
- Works with Next.js Image

**Alternative considered:** Embla Carousel (20KB) - can upgrade later if needed

---

### 5. Form Management

**react-hook-form + Zod:**
- Industry standard
- Integrates with existing Zod schemas from `@qapp/shared`
- Better performance (uncontrolled inputs)
- Clear validation errors

---

## 📦 New Dependencies

```json
{
  "dependencies": {
    "browser-image-compression": "^2.0.2",
    "react-hook-form": "^7.54.2",
    "react-medium-image-zoom": "^5.2.15",
    "@hookform/resolvers": "^3.9.1",
    "sonner": "^1.7.3"
  }
}
```

**Total bundle impact:** ~100KB (acceptable for functionality gained)

---

## 🎨 New UI Components

### Day 4:
- **Dialog** - Edit display name modal
- **Input** - Text fields
- **Label** - Form labels
- **Select** - Dropdowns (level, year, semester)
- **Form** - Form wrapper with validation

### Day 5:
- **Progress** - Upload progress bar
- **Textarea** - Multi-line inputs

**Note:** Will attempt shadcn CLI or create manually (proven to work)

---

## ⚖️ Tradeoffs & Decisions

### Tradeoff 1: SSR Complexity vs SEO Benefits

**Choice:** Use SSR for User Profile and Question Detail

**Pros:**
- ✅ SEO (critical for discovery)
- ✅ Social sharing (preview cards)
- ✅ Faster first paint

**Cons:**
- ⚠️ Slightly more complex code
- ⚠️ Need to handle server/client split

**Verdict:** **SEO is critical for a discovery platform** - worth the complexity

---

### Tradeoff 2: Native Image Picker vs react-dropzone

**Choice:** Native HTML5 file input with custom UI

**Pros:**
- ✅ No dependencies (0KB)
- ✅ Native mobile camera support
- ✅ Full UI control
- ✅ Mobile-first

**Cons:**
- ⚠️ No drag & drop (less important on mobile)

**Verdict:** **Mobile-first approach** - native is better

---

### Tradeoff 3: Native Scroll Snap vs Carousel Library

**Choice:** Start with native CSS scroll snap

**Pros:**
- ✅ No dependencies (0KB)
- ✅ Native performance
- ✅ Works everywhere

**Cons:**
- ⚠️ Fewer features than Embla/Swiper

**Verdict:** **Start simple, upgrade if needed** - native is sufficient for MVP

---

### Tradeoff 4: URL-Based vs Local State Filters

**Choice:** URL-based filters

**Pros:**
- ✅ Shareable searches
- ✅ Browser navigation
- ✅ Better UX

**Cons:**
- ⚠️ More complex state management

**Verdict:** **UX benefit is significant** - worth the complexity

---

## 🎬 Implementation Flow

### Day 4 Sequence:

1. **Create UI components** (1h)
   - Input, Label, Dialog, Select, Form

2. **User Profile Page** (2-3h)
   - Profile header (avatar, name, stats)
   - Edit display name dialog
   - User uploads list (pagination)

3. **Search Page** (2-3h)
   - Search bar (debounced)
   - Filter dropdowns
   - Results display (reuse QuestionCard)

4. **Testing & Polish** (1h)

### Day 5 Sequence:

1. **Create UI components** (1h)
   - Progress, Textarea

2. **Image Picker Component** (1h)
   - File input + preview grid

3. **Upload Form** (3-4h)
   - Form validation
   - Image compression
   - R2 presigned URLs
   - Upload progress
   - Success handling

4. **Question Detail Page** (2-3h)
   - Image gallery
   - Zoom functionality
   - Metadata display
   - Author card

5. **Testing & Polish** (1h)

---

## ❓ Questions for You

### 1. Toast Library Choice

Which notification library do you prefer?

- **Option A: Sonner** ✅ RECOMMENDED
  - 15KB, beautiful animations
  - Great mobile experience
  - Modern design

- **Option B: react-hot-toast**
  - 10KB, simpler
  - Minimalist design

- **Option C: Custom**
  - DIY toast component
  - More work

### 2. Upload Success Behavior

After successful upload, where should we redirect?

- **Option A: Question Detail Page** ✅ RECOMMENDED
  - Shows the newly created question
  - User can share immediately
  - Natural flow

- **Option B: User Profile**
  - Shows in "My Uploads"
  - Sense of accomplishment

- **Option C: Upload Form**
  - With success message
  - "Upload Another" button
  - For power users

### 3. Edit/Delete Feature

Should we implement edit/delete for own uploads now?

- **Option A: Include in Days 4-5** (+0.5 day)
  - Complete feature set
  - User requested frequently

- **Option B: Defer to V2** ✅ RECOMMENDED
  - Stay within timeline
  - Can add later quickly
  - MVP focused

---

## 📊 Risk Assessment

### Low Risk ✅

- SSR data fetching (proven pattern)
- Image gallery performance (Next.js Image optimization)
- Form validation (Zod from shared package)

### Medium Risk ⚠️

- Browser compatibility for image compression (mitigation: fallback)
- Large file upload failures (mitigation: retry logic, clear errors)
- shadcn CLI issues (mitigation: manual creation, proven to work)

### High Risk 🚨

- None identified

---

## ✅ Success Criteria

**Must Work:**
- [ ] User can view any profile and their uploads
- [ ] User can edit their own display name
- [ ] Search by text returns correct results
- [ ] Filters work and update URL
- [ ] Upload form validates and shows clear errors
- [ ] Images compress before upload
- [ ] Upload progress shows current step
- [ ] Question detail shows all images
- [ ] Image zoom works on all devices
- [ ] Share button works (native or clipboard)

**Performance:**
- [ ] Search debounced (no excessive API calls)
- [ ] Images compressed >50%
- [ ] Upload completes in <30s for 10MB
- [ ] First Contentful Paint <1.5s

---

## 🚀 Ready to Proceed?

I'm ready to implement as soon as you approve the approach and answer the 3 questions above:

1. Toast library? (Sonner recommended)
2. Upload success behavior? (Redirect to question detail recommended)
3. Edit/Delete feature? (Defer to V2 recommended)

**Estimated completion:** 2 full work days (14-18 hours)

**No blockers** - all backend APIs are ready and tested!

---

## 📚 Key Takeaways

### Philosophy:

1. **Mobile-First** - Native controls over heavy libraries
2. **SEO-Critical** - SSR for discoverable content
3. **Progressive Enhancement** - Start simple, add features
4. **Type Safety** - Zod validation everywhere
5. **Performance** - Client-side compression, direct uploads

### Architecture:

```
Server Components (SSR)
  └─> Fetch critical data
  └─> Pass to Client Components
      └─> Handle interactivity
      └─> TanStack Query for pagination
```

### Bundle Size:

- **Total new dependencies:** ~100KB
- **Worth it:** Major features (upload, search, profiles)
- **Optimized:** Web workers, lazy loading, code splitting

---

**Let me know when you're ready and I'll start implementing!** 🎯
