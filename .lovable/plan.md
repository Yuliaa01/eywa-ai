

## Fix Camera and Send button sizes on mobile

### Problem
On mobile (390px viewport), the Camera and Send buttons in the "Ask me anything" input row appear too small or improperly sized based on the screenshot.

### Changes

**File: `src/components/priorities/AIChatCenter.tsx`** (lines 636-660)

Increase the button sizes on mobile and icon sizes for better touch targets:

1. **Camera button** (line 638): Change `w-[44px] h-[44px]` to `w-10 h-10 md:w-[44px] md:h-[44px]` and icon from `w-4 h-4` to `w-5 h-5`
2. **Send button** (line 655): Change `w-[52px] h-[44px]` to `w-10 h-10 md:w-[52px] md:h-[44px]` and icon from `w-4 h-4` to `w-5 h-5`
3. **Mic button** (line 657-659): Same sizing adjustment as Send button
4. Reduce gap from `gap-3` to `gap-2` on the input row to reclaim horizontal space on mobile

This ensures all three action buttons are uniform squares on mobile (40×40px) with larger icons for better tap targets, while keeping the current desktop sizing.

