# FlowWays Design and Typography Specification

Figma source of truth:
`https://www.figma.com/design/6E0ngFYIPeqiv0SBzrthnE`

## 1) Visual Direction

FlowWays uses a warm, low-noise visual language intended for focused daily planning.
The UI emphasizes readable hierarchy, semantic color cues by task mode, and restrained decoration.

Principles:
- Calm productivity over visual intensity
- Strong hierarchy through contrast and spacing
- Semantic accents for context, not decoration
- Fast scanning in dense task views

## 2) Color Tokens

These tokens are defined in `styles.css` and mirrored in Figma paint styles (`Foundation/Color/*`).

| Token | Hex | Purpose |
|---|---|---|
| `--bg` | `#F6F3EA` | Global app background |
| `--surface` | `#FFFDF7` | Cards, panels, controls |
| `--ink` | `#24352F` | Primary text and key actions |
| `--muted` | `#6F776F` | Secondary text and supporting labels |
| `--line` | `#DED8C8` | Borders and separators |
| `--green` | `#2F8F83` | Checklist mode accent |
| `--blue` | `#5577B8` | Journal mode accent |
| `--amber` | `#D99A32` | Workflow mode accent |
| `--red` | `#D85F4F` | Timeline mode accent |
| `--focus` | `#1F66D1` | Keyboard focus indicator |

Usage rules:
- Keep `--bg` and `--surface` as the dominant base layers.
- Use mode accents (`--green`, `--blue`, `--amber`, `--red`) only for semantic indicators.
- Reserve `--focus` for accessibility-focused interactions.

## 3) Spacing, Radius, and Elevation

Spacing scale:
- `4, 8, 12, 16, 24, 32, 40`

Control sizing:
- Standard button height: `40px`
- Input/select height: `44px`

Radius scale:
- Core controls and cards: `8px`
- Documentation card containers: `12px`
- Pill chips: `999px`

Shadow:
- `0 14px 36px rgba(36, 53, 47, 0.12)` for dialogs and elevated map nodes

## 4) Typography System

Primary stack:
- `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Monospace:
- `Roboto Mono` (or fallback monospace)

Text styles (mirrored to Figma text styles `Type/*`):

| Style | Size / Line Height | Weight | Primary Use |
|---|---|---|---|
| `Display/XL` | `48 / 56` | Semi Bold | Hero headings |
| `Heading/H1` | `36 / 44` | Semi Bold | Main section titles |
| `Heading/H2` | `28 / 36` | Semi Bold | Subsections |
| `Heading/H3` | `22 / 30` | Medium | Component group headers |
| `Title/L` | `18 / 26` | Semi Bold | Card/modal titles |
| `Body/L` | `16 / 24` | Regular | Main reading text |
| `Body/M` | `14 / 22` | Regular | Secondary body copy |
| `Label/M` | `13 / 18` | Medium | Button and control labels |
| `Caption/S` | `12 / 16` | Regular | Metadata/helper text |
| `Mono/Code` | `13 / 20` | Regular | Tokens and snippets |

Typography rules:
- Minimum production text size is `12px` (caption-only usage).
- Default body should remain at `14px` or `16px` depending on density.
- Maintain line-height at `1.3+` for headings and `1.5+` for paragraph content.

## 5) Layout and Responsiveness

Desktop shell:
- Two-column structure with a `240px` left rail and fluid content region.

Responsive behavior:
- At `<= 1040px`: rail collapses into sticky horizontal/header behavior.
- At `<= 720px`: topbar/composer/control bands stack vertically.

Structural rhythm:
- Use `8-24px` gap values by density.
- Preserve clear panel boundaries with `--line` and `--surface`.

## 6) Component-Level Type Mapping

Current CSS mapping:
- `.section-heading h1/h2` -> `Heading/H1` and `Heading/H2`
- `.inline-title` -> `Title/L`
- `.item-meta`, `.muted-copy` -> `Body/M`
- `.metric-label` -> `Caption/S`
- `.status-pill` -> `Label/M`

## 7) Accessibility Guardrails

- Keep text contrast at WCAG AA minimum in all states.
- Do not use muted text for primary or critical actions.
- Preserve explicit focus ring visibility on interactive controls.
- Avoid relying on color alone for critical status communication.

## 8) Figma Deliverables

The Figma file includes two documentation pages:
- `Design Foundations`
- `Typography`

Each page contains:
- Token documentation
- Usage guidance
- Practical implementation notes mapped back to CSS

