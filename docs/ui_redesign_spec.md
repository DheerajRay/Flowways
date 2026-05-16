# FlowWays Theming Engine Spec (v3: The Multi-Theme Pivot)

## Purpose
FlowWays will transition to a **Multi-Theme Engine**, allowing users to radically alter the application's appearance, structure, and interaction model via the Settings menu. This is not a simple color swap; it is a fundamental shift in CSS geometry, layout architecture, and motion logic.

---

## The Motion & Interaction Philosophy
Animations will be used **sparingly but creatively**. The goal is functional feedback, not distraction.
*   **The "Snappy" Rule:** All standard transitions (color shifts, opacity) will strictly adhere to the `200ms - 300ms` window to maintain a fast, responsive feel.
*   **Spring Physics:** For structural interactions (expanding cards, modal popups, drag-and-drop), we will avoid linear easing. Instead, we will simulate natural momentum using CSS spring parameters (e.g., via Framer Motion or custom `cubic-bezier` curves simulating tension/friction) to make interactions feel tactile.
*   **Creative Micro-Interactions:**
    *   *Buttons:* Scale up slightly (`scale: 1.02`) on hover, scale down (`scale: 0.95`) on press, providing physical confirmation.
    *   *Toggles:* Use physical "sliding" or 3D rotation effects rather than instant color snaps.
    *   *Data Loading:* Use staggered reveals (e.g., list items sliding up with a 50ms delay between each) instead of generic spinners.

---

## The 4 Core Themes: Intricate Specifications

### 1. "Classic Minimal" (The Baseline)
The fast, familiar, utilitarian default. Focus on density and speed.
*   **Colors:**
    *   Background: `#FFFFFF`
    *   Surface/Cards: `#F4F5F7` (Very subtle distinction)
    *   Accent: `#2563EB` (Standard functional blue)
    *   Text: `#111827` (Primary), `#6B7280` (Secondary)
*   **Typography:** System UI or `Inter`. Standard sizing (Base: `14px`, Headers: `20px-24px`). Font-weight: `400` to `600`.
*   **Structure & Layout:** Fixed, full-width Top Bar. Standard inline input row. Rigid grid layout for feeds.
*   **Geometry:** Standard rounded rectangles. `--border-radius-card: 8px`, `--border-radius-btn: 6px`. Hard, 1px solid borders (`#E5E7EB`). No drop shadows.
*   **Component Details (Task Card):** Flat surface, 1px border. Hover state merely changes background color slightly. Checkbox is a standard square.
*   **Animations:** `0ms` to `100ms` instant state changes. Pure utility.

### 2. "Neo-Soft" (Vibrant Neumorphic)
Soft, bubbly, friendly, and tactile. Information "floats" on the screen.
*   **Colors:**
    *   Background: `#F8F9FA` (Warm off-white)
    *   Surface/Cards: `#FFFFFF`
    *   Accent: Electric Cyan (`#06B6D4`) paired with Soft Pink (`#F472B6`) tags.
    *   Shadows: `--shadow-soft: 0 10px 30px rgba(0,0,0,0.05)`
*   **Typography:** `Nunito` or `Rounded Mplus`. Slightly oversized (Base: `16px`). Font-weight: `500` to `700` (bubbly).
*   **Structure & Layout:** 
    *   *Mobile:* Floating bottom-navigation pill.
    *   *Desktop:* Floating, detached "Top Pill" centered at the top of the screen instead of a full-width bar.
*   **Geometry:** Fully rounded. `--border-radius-card: 24px`, `--border-radius-btn: 9999px` (Pill shape). Zero hard borders.
*   **Component Details (Task Card):** No borders. Distinguishes itself entirely through the soft drop shadow. Hover state increases shadow depth (`0 20px 40px rgba(0,0,0,0.08)`) and scales card to `1.01` via spring physics.
*   **Animations:** Bouncy, fluid. Button clicks have a highly elastic spring effect. Checkboxes use an SVG "draw" animation for the checkmark over `300ms`.

### 3. "Midnight Neon" (Sleek Dark Mode)
Futuristic, high-contrast, designed for extended focused sessions.
*   **Colors:**
    *   Background: `#0A0A0A` (Deepest Charcoal/Black)
    *   Surface/Cards: `#171717` to `#262626`
    *   Accent: Neon Gradients. Primary buttons use a gradient from Bright Blue (`#00F2FE`) to Electric Green (`#4FACFE`).
    *   Borders: Subtle glowing borders on active elements (`box-shadow: 0 0 10px rgba(0, 242, 254, 0.3)`).
*   **Typography:** `JetBrains Mono` or `Roboto Mono` for numbers/stats. `Inter` for readability. Crisp, thin weights (`300` to `500`).
*   **Structure & Layout:** Glassmorphism heavily utilized. The Top Bar and Settings Modal have `background: rgba(23, 23, 23, 0.6); backdrop-filter: blur(16px);`.
*   **Component Details (Task Card):** Dark surface with a very subtle, thin border (`1px solid #333`).
*   **Data Viz:** Instead of linear progress bars, uses segmented, circular SVG progress rings that "glow" as they fill up. Timeline Gantt bars use the neon gradient.
*   **Animations:** Sweeping, smooth transitions. When a card is marked complete, the neon accent color sweeps across the card before fading out.

### 4. "Bold Dashboard" (Chunky & Expressive)
Playful, data-heavy, brutalist-lite. Inspired by high-end modern SaaS dashboards.
*   **Colors:**
    *   Background: `#F3F4F6` (Cool grey)
    *   Surface/Cards: `#FFFFFF`
    *   Accent: Lime Green (`#CCFF00`) and Deep Purple (`#7C3AED`).
    *   Shadows: Hard, offset brutalist shadows (`--shadow-hard: 4px 4px 0px #111827`).
*   **Typography:** `Outfit` or `Space Grotesk`. Massive, aggressive header hierarchy (H1 up to `48px`, tight tracking).
*   **Structure & Layout:** Introduces a **Detached Sidebar Layout** for desktop. The sidebar is a floating rounded panel on the left; the feed is a separate panel on the right. 
*   **Geometry:** Chunky rectangles. `--border-radius-card: 16px`, `--border-radius-btn: 12px`. Thick, `2px solid #111827` borders on everything.
*   **Component Details (Task Card):** Thick border, hard offset shadow. 
*   **Interactions:** Inputs are replaced by chunky, physical-feeling toggles and stylized oversized sliders.
*   **Animations:** Snappy and mechanical. Toggles click into place instantly. Cards "pop" into the DOM with a fast, non-bouncy scale effect.

---

## Technical Implementation Roadmap

### Phase 1: CSS Architecture Refactor (The Token System)
We must migrate all hardcoded values in `globals.css` to CSS custom properties scoped to the `[data-theme="X"]` attribute on the `<html>` tag.
**Required Token Categories:**
1.  `--color-bg`, `--color-surface`, `--color-text`, `--color-accent-primary`
2.  `--radius-card`, `--radius-btn`, `--radius-input`
3.  `--border-width`, `--border-color`
4.  `--shadow-default`, `--shadow-hover`
5.  `--font-family-primary`, `--font-family-header`, `--font-scale-h1`

### Phase 2: Structural CSS Modifiers
Move structural logic from base classes to theme modifiers.
```css
/* Example: Layout Shift */
.appShell { display: flex; flex-direction: column; } /* Classic/Neo/Midnight */

[data-theme="bold"] .appShell { 
  flex-direction: row; /* Shifts to Sidebar layout */
  padding: 24px;
  gap: 24px;
}
```

### Phase 3: Component Polymorphism (React Level)
Some themes require fundamentally different HTML/SVG structures (e.g., Midnight Neon's circular progress rings vs. Classic's linear bars).
We will pass the current theme down via React Context (`useTheme()`) and conditionally render specific sub-components where CSS alone cannot bridge the gap.

### Phase 4: Animation Injection
Integrate a lightweight physics-based animation library (like `framer-motion`) specifically for complex structural animations (like the staggered list reveals in Midnight Neon or the bouncy layout shifts in Neo-Soft), while keeping hover states in raw CSS transitions.
