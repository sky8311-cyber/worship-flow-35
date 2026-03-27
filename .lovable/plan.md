

## K-Worship Institute About One-Pager

### Overview
Create a premium, Apple-style scroll-animated about page at `/institute/about` with 8 sections using `framer-motion` (already installed). Update bottom nav and routing.

### Changes

**1. `src/components/institute/InstituteBottomNav.tsx`**
- Change "소개" tab path from `/kworship-info` to `/institute/about`
- Update match accordingly

**2. `src/App.tsx`**
- Add lazy import: `const InstituteAbout = lazyWithRetry(() => import("./pages/InstituteAbout"));`
- Add route before the catch-all `/:courseId` route: `<Route path="/institute/about" element={<ProtectedRoute><InstituteAbout /></ProtectedRoute>} />`

**3. Create `src/pages/InstituteAbout.tsx`**

Full page with `overflow-x-hidden` wrapper, wrapped in `InstituteLayout`. Uses `framer-motion` `motion` components with `whileInView` for scroll reveals. 8 sections as specified:

1. **Hero** — Fullscreen with parallax background (scrollY * 0.4), fade-up title/subtitle, scroll indicator with bounce animation
2. **Why** — Three staggered text reveals, large centered typography
3. **Who** — 4 audience cards (찬양인도자, 보컬·악기, 음향·미디어, 교역자) with grid layout
4. **What** — Photo + 4 feature items with scale-in photo and staggered list
5. **Badges** — 3 badge cards (Essential/Core/Practitioner) with active/inactive states
6. **Dream** — Animated counter (200+) with vision statement lines
7. **Testimonials** — 3 testimonial cards with avatar, name, role, quote
8. **CTA** — Two buttons: "훈련 과정 보기" → `/institute/courses`, "AI 코치에게 질문하기" → `/institute/ai-coach`

### Technical Details
- **Animation**: `framer-motion` `motion.div` with `initial`, `whileInView`, `viewport={{ once: true }}` — no custom hook needed
- **Parallax**: `useState` + `window.scrollY` listener with `{ passive: true }`
- **Counter**: Custom `useCounter` hook with `setInterval` triggered by intersection observer
- **Images**: Unsplash for hero/feature photo, pravatar.cc for testimonials
- **Bottom padding**: `pb-24` + safe-area-inset for nav overlap
- **No color/design token changes**
- **No new packages** — framer-motion already present

