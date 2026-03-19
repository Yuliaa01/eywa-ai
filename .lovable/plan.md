

## Rename "EYWA AI" to "inLive" across the entire app

### Summary
Replace all occurrences of "EYWA AI", "Eywa AI", "Eywa", and "EYWA" with "inLive" across 14+ files, plus fix 2 existing build errors.

### Changes by file

**1. `index.html`** — Update title, meta tags, author
- "Eywa AI - Your Personal Health AI Hub" → "inLive - Your Personal Health AI Hub"
- author: "Eywa AI" → "inLive"
- og:title update

**2. `src/components/Hero.tsx`** — Hero heading and alt text
- "EYWA AI" heading → "inLive"
- img alt "Eywa AI Health Technology" → "inLive Health Technology"

**3. `src/pages/Auth.tsx`** — Login page branding
- "EYWA AI" → "inLive"
- "Welcome to Eywa AI" → "Welcome to inLive"

**4. `src/pages/auth/ForgotPassword.tsx`** — Header branding
- "Eywa AI" → "inLive"

**5. `src/pages/auth/ResetPassword.tsx`** — Header branding
- "Eywa AI" → "inLive"

**6. `src/components/onboarding/WelcomeStep.tsx`** — Welcome text
- "Welcome to EYWA AI" → "Welcome to inLive"
- "At Eywa AI, we take your privacy..." → "At inLive, we take your privacy..."

**7. `src/components/onboarding/PreferencesStep.tsx`** — Subtitle
- "Customize your Eywa AI experience" → "Customize your inLive experience"

**8. `src/components/onboarding/ConsentsStep.tsx`** — Subtitle
- "Control what data Eywa AI can access" → "Control what data inLive can access"

**9. `src/components/ChatDrawer.tsx`** — Chat coach branding
- "Powered by Eywa AI" → "Powered by inLive"
- "I'm Eywa, your AI health coach" → "I'm inLive, your AI health coach"

**10. `src/components/priorities/AIChatCenter.tsx`** — AI chat branding
- "EYWA AI" headings/notifications → "inLive"
- `eywaAvatar` import name stays (internal variable), but alt text "EYWA AI" → "inLive"

**11. `src/pages/PrivacyPolicy.tsx`** — All legal text references
- "Eywa AI" → "inLive" throughout
- Email addresses: "privacy@eywa-ai.com" → "privacy@inlive.com", "dpo@eywa-ai.com" → "dpo@inlive.com"

**12. `src/contexts/ThemeContext.tsx`** — localStorage key
- "eywa-theme" → "inlive-theme"

**13. `supabase/functions/ai-coach/index.ts`** — System prompt
- "You are Eywa" → "You are inLive"

**14. `supabase/functions/generate-ai-suggestions/index.ts`** — System prompt
- "Eywa AI's Planner" → "inLive's Planner"

### Build error fixes (bundled in)

**15. `src/components/dashboard/WorkoutTimer.tsx`** — Fix `NodeJS.Timeout` → `ReturnType<typeof setInterval>`

**16. `src/components/dashboard/ActivitiesSection.tsx`** — Same fix

### Technical notes
- The asset file `src/assets/eywa-avatar.png` will keep its filename (renaming assets requires re-importing); the import variable name is internal only.
- localStorage key change means existing users' theme preference resets once — acceptable tradeoff.

