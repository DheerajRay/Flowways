# FlowWays UI Redesign Spec (Final Decision)

## Purpose
This document replaces earlier exploratory UI feedback with a final direction we can implement confidently without destabilizing usability.

## Final Position
We should **not** move to full glassmorphism + heavy animation + dark-mode overhaul right now.  
FlowWays is a task-capture tool; speed, clarity, and low-friction input are more important than visual spectacle.

We will adopt a **Premium Functional** style:
- Keep current light-first visual identity.
- Add polish through spacing, hierarchy, motion restraint, and consistent controls.
- Avoid high-cost visual effects that reduce readability or introduce layout/performance risk.

## Debate Outcome by Proposal

### Keep / Adopt
1. Better spacing rhythm, typography hierarchy, and consistent control sizing.
2. Stronger button hover/press depth (already started).
3. Better settings modal ergonomics and cleaner alignment.
4. Card hover depth and subtle entry transitions.
5. Improved mobile behavior with input/control visibility prioritized.
6. Continue semantic color tagging with user-customizable palette.

### Reject for v1
1. Full glassmorphism shell and blur-heavy surfaces.
2. Animated mesh background.
3. Neo-brutal + glass hybrid styling system.
4. Underlined floating-label auth inputs.
5. High-motion micro-animations for every interaction.
6. Complex workflow “subway map” and glowing animated timeline rails.

### Defer (possible v2)
1. Optional dark mode (feature-flagged).
2. Enhanced pet animations (SVG/sprite).
3. Richer visual effects for settings and timeline urgency states.

## Final UI Direction (What We Build)

### 1) Design Language
- Keep warm neutral background and clean panel contrast.
- Favor legibility over decoration.
- Maintain rounded geometry and icon-button system.
- Use shadows sparingly for depth cues only.

### 2) App Shell
- Input and primary controls remain always visible.
- Feed remains scroll-contained.
- Avoid full-screen overlay dim for lightweight popovers (e.g., settings).

### 3) Capture Row
- Maintain current icon-first segmented control style.
- Keep uniform control height and border weight.
- Preserve Enter-to-submit + Add button parity.

### 4) Task Cards
- Keep strong card boundaries for scanability.
- Color tag affects border and related action accents consistently.
- Preserve distinct states:
  - Hidden = dashed/neutral state.
  - Overdue = warning/error state (not same tone as invalid input).

### 5) Pet/Notice System
- Keep text-based pet (fast + lightweight).
- Quips should be short, contextual, and auto-dismiss.
- Warning tone for overdue, error tone for invalid input.
- If pet disabled, fallback system notices remain visible.

### 6) Settings UX
- Compact popover anchored near settings button.
- No oversized toggles or stretched rows.
- Label + controls visually cohesive with tight vertical rhythm.
- Controls follow existing icon-button language.

### 7) Motion Rules
- Max 120–180ms for hover/press state transitions.
- Avoid continuous ambient animations except where meaningful.
- Respect reduced-motion preference.

## Implementation Scope (Next Pass)
1. Final spacing pass across settings rows and header controls.
2. Final visual parity pass for icon buttons (size, border, shadows).
3. Overdue vs invalid message tone polish.
4. Mobile compactness pass (top region + settings).
5. Smoke-test updates for UI regressions and interaction states.

## Acceptance Criteria
1. Input bar and action controls always visible while browsing tasks.
2. Settings popover is compact, anchored, and non-intrusive.
3. No readability regressions on desktop/mobile.
4. Hidden/overdue/color-tag states are visually distinct.
5. All interaction flows remain functional (add/edit/hide/filter/settings).

## Notes
- Keep using `globals.css` (no Tailwind migration now).
- Keep current pet paradigm (text/face) for speed; revisit richer visuals later.

---

## Detailed Execution Plan (Technical Specifications)

Based on the finalized scope and codebase review of `page.tsx` and `globals.css`, the following precise technical updates are required to fulfill the "Implementation Scope":

### 1. Settings Spacing & Header Controls
- **Target Files:** `app/globals.css`
- **Updates:**
  - **`.settingsRow`**: Ensure consistent inner spacing (`gap: 12px;`) and apply `align-items: center;` without stretching the labels.
  - **`.topbar`**: Reduce the vertical padding to align the title perfectly with the `.topbarActions`.
  - **`.settingsOverlay` & `.settingsModal`**: Remove the full-screen overlay dim behavior (remove `background: rgba(20, 24, 31, 0.32);` from `.settingsOverlay`). Position the modal as a lightweight popover anchored to the top-right, with a subtle refined shadow (`box-shadow: 0 12px 32px rgba(35, 52, 75, 0.16)`).

### 2. Icon Button Parity (Size, Border, Shadows)
- **Target Files:** `app/globals.css`, `app/page.tsx`
- **Updates:**
  - **`.iconAction`**: Currently, standard icons have `border: 3px solid #111;` while `.compact` has `border-width: 2px;`. Unify all icon buttons to use a consistent `2px` border to reduce visual noise.
  - **Hover States**: Normalize the hover state across all primary and icon buttons: `transform: translateY(-1px)` and `box-shadow: 0 3px 0 rgba(17, 17, 17, 0.24), 0 10px 18px rgba(35, 52, 75, 0.12)`.
  - **Capture Bar Alignment**: Ensure `.captureBar input`, `.modeActions`, and `.iconAction` heights are perfectly aligned (e.g., set to a uniform `44px`).

### 3. Overdue vs Invalid Message Tone Polish
- **Target Files:** `app/page.tsx`, `app/globals.css`
- **Updates:**
  - **Overdue (Warning):** When `overduePetCount > 0`, the UI correctly sets `resolvedPetTone = "warning"`. Ensure `.pixelPal.isWarning` uses a distinct amber palette (`background: #fff8e8; border-color: #a26b14; color: #6e4a0f;`). Keep the pet expression at `!_!`.
  - **Invalid Input (Error):** Address defect **DEF-002**. When submitting an invalid timeline (`POST /api/items` returns 400), *explicitly abort task creation*. Render the notice using `resolvedPetTone = "error"`. Ensure `.pixelPal.isError` uses a distinct red palette (`background: #fff0f0; border-color: #9f2f2f;`). Use the pet expression `x_x`.

### 4. Mobile Compactness (Top Region + Settings)
- **Target Files:** `app/globals.css`
- **Updates:**
  - In the `@media (max-width: 700px)` query, tighten `.topbar` padding from `padding: 4px 2px 0;` to `padding: 0;` to eliminate wasted vertical space.
  - Reduce `.topbar h1` font size slightly to prevent wrapping on narrow screens (e.g., `font-size: 36px;`).
  - Decrease padding in `.capture` and `.feedShell` to `8px` on mobile screens to maximize the feed visibility.
  - Ensure `.settingsModal` padding is reduced (e.g., `12px` instead of `16px`) to stay compact on smaller screens.

### 5. Settings Schema Alignment (Fixing DEF-001)
- **Target Files:** `app/page.tsx`, `src/shared/types/settings.ts`
- **Updates:**
  - The UI currently fails to save new fonts due to the `user_settings_font_family_check` DB constraint.
  - Verify that the `font_family` payload sent in `PATCH /api/settings` exactly matches the backend allowed enums: `"avenir" | "inter" | "plex" | "mono" | "rounded"`. Ensure `settingsDraft.font_family` binds strictly to these keys in `page.tsx` and that the default values in `DEFAULT_USER_SETTINGS` are valid.
