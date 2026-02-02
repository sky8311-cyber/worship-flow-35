

# Fix: News Card Cover Images - Show Full Logo

## Problem

The cover images on news cards are cropped because they use `object-cover`, which fills the entire container and cuts off parts of the logos (as seen in the screenshot with 크리스천, 투데이 logos being cut off).

## Solution

Change the CSS `object-fit` property from `cover` to `contain` so the full image is visible within the image box.

---

## Change Details

**File**: `src/components/news/NewsCard.tsx`

**Line 53**: Change `object-cover` to `object-contain`

```tsx
// BEFORE
<img 
  src={post.cover_image_url} 
  alt={title}
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
/>

// AFTER
<img 
  src={post.cover_image_url} 
  alt={title}
  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
/>
```

---

## Visual Comparison

| Before (`object-cover`) | After (`object-contain`) |
|------------------------|-------------------------|
| Image fills container, crops edges | Full image visible, may have letterboxing |
| Logos get cut off | Full logos displayed |
| No empty space | May show background on sides/top-bottom |

---

## Result

All article cover images will:
- Display the complete logo/image without cropping
- Fit proportionally within the aspect-video container
- Maintain hover zoom effect
- Show the muted background color on any empty space (already set with `bg-muted`)

