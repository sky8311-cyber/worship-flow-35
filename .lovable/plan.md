

## Fix: AI 세트 생성 Button Cut Off

The "AI 세트 생성" button overflows because it sits inside a `ScrollArea` with `-mx-6 px-6` class in `AISetBuilderPanel.tsx`. The negative margin expands the scroll container beyond the panel width, and the `w-full` button follows that expanded width.

### Fix

**File: `src/components/ai-set-builder/AISetBuilderForm.tsx`**
- Change the generate button from `className="w-full" size="lg"` to `className="w-full max-w-full" size="default"` to constrain it within its parent.

**File: `src/components/AISetBuilderPanel.tsx`**
- Add `overflow-hidden` to the ScrollArea wrapper or change `-mx-6 px-6` to avoid the negative margin causing content to bleed outside the panel bounds. Simplest fix: add `overflow-x-hidden` to the ScrollArea container.

