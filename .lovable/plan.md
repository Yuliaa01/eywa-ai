

## Fix: Keep Send/Mic buttons inside the card frame on mobile

### Problem
The text input (`flex-1`) stretches too wide, pushing the Send and Mic buttons outside the visible card boundary on mobile.

### Changes

**File: `src/components/priorities/AIChatCenter.tsx`** (line 636 and 649)

1. **Input row container** (line 636): Add `overflow-hidden` to prevent children from escaping the card frame.
2. **Text input** (line 649): Add `min-w-0` class so it shrinks properly within flex layout instead of forcing its intrinsic width.

These two small CSS fixes ensure the flex row respects the card boundaries and the input field yields space to the buttons.

