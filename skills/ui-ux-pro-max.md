---
name: UI UX Pro Max
description: Design intelligence for building professional UI/UX. Provides style selection, color palettes, typography, layout rules, and accessibility guidelines. Use when building any frontend, UI, landing page, or web application.
triggers: ui, ux, design, frontend, landing page, dashboard, website, web app, styling, css, colors, layout
---
# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Apply these rules when building ANY user-facing interface via create_antigravity_task.

## When to Apply
- Building new UI components or pages
- Choosing color palettes and typography
- Creating landing pages or dashboards
- Any task that produces visual output

## Workflow: Include Design Specs in Every UI Task

When creating a `create_antigravity_task` prompt for ANY frontend work, ALWAYS include:

1. **Analyze** the user's request for: product type, style keywords, industry, target audience
2. **Select a design system** using the rules below
3. **Include the Pre-Delivery Checklist** at the end of the prompt
4. **Specify what to AVOID** (anti-patterns section)

## UX Rules by Priority

### 1. Accessibility (CRITICAL)
- Color contrast minimum 4.5:1 ratio for normal text
- Visible focus rings on interactive elements
- Descriptive alt text for meaningful images
- aria-label for icon-only buttons
- Tab order matches visual order
- Form inputs use `<label>` with `for` attribute

### 2. Touch & Interaction (CRITICAL)
- Minimum 44x44px touch targets
- Use click/tap for primary interactions
- Disable button during async operations
- Clear error messages near the problem
- Add `cursor-pointer` to ALL clickable elements

### 3. Performance (HIGH)
- Use WebP images, srcset, lazy loading
- Check `prefers-reduced-motion`
- Reserve space for async content (no layout shift)

### 4. Layout & Responsive (HIGH)
- `viewport meta` with width=device-width, initial-scale=1
- Minimum 16px body text on mobile
- No horizontal scroll — content fits viewport width
- Define z-index scale (10, 20, 30, 50)
- Test at: 375px, 768px, 1024px, 1440px

### 5. Typography & Color (MEDIUM)
- Line-height 1.5-1.75 for body text
- Limit to 65-75 characters per line
- Match heading/body font personalities
- Use Google Fonts: Inter, Outfit, DM Sans (modern), Cormorant Garamond (elegant)

### 6. Animation (MEDIUM)
- 150-300ms for micro-interactions
- Use transform/opacity, NOT width/height
- Skeleton screens or spinners for loading states

### 7. Style Selection (MEDIUM)
- Match style to product type (see guide below)
- Consistent style across ALL pages
- NO emoji icons — use SVG icons (Heroicons, Lucide)

## Style Guide by Product Type

| Product Type | Recommended Style | Colors | Font Pairing |
|---|---|---|---|
| SaaS / Dashboard | Minimalism or Bento Grid | Blue-Gray palette | Inter / DM Sans |
| E-commerce | Clean Modern | Warm neutrals + accent | Outfit / DM Sans |
| Portfolio / Creative | Brutalism or Glassmorphism | Bold + contrast | Space Grotesk / JetBrains Mono |
| Healthcare / Wellness | Soft UI Evolution | Sage green + warm white | Cormorant Garamond / Montserrat |
| Fintech / Crypto | Dark Mode + Glassmorphism | Deep blue + neon accent | Inter / Space Mono |
| Gaming / Esports | Dark Neon or Cyberpunk | Black + neon colors | Rajdhani / Orbitron |
| Landing Page | Hero-Centric + Social Proof | Brand colors + CTA accent | System: product-dependent |
| Chess / Board Games | Classic Warm | Brown (#B58863) + Beige (#F0D9B5) | Playfair Display / Inter |

## Common Anti-Patterns (AVOID)

### Icons & Visual
| Do | Don't |
|----|-------|
| Use SVG icons (Heroicons, Lucide) | Use emojis like 🎨 🚀 ⚙️ as UI icons |
| Use color/opacity transitions on hover | Use scale transforms that shift layout |
| Research official brand SVGs | Guess or use incorrect logo paths |
| Fixed viewBox (24x24) with consistent sizing | Mix different icon sizes |

### Interaction & Cursor
| Do | Don't |
|----|-------|
| `cursor-pointer` on all clickable elements | Leave default cursor on interactive elements |
| Visual feedback on hover (color, shadow) | No indication element is interactive |
| `transition-colors duration-200` | Instant changes or too slow (>500ms) |

### Light/Dark Mode
| Do | Don't |
|----|-------|
| Light: `bg-white/80` or higher opacity | `bg-white/10` (too transparent in light) |
| Text: `#0F172A` (slate-900) | Body text lighter than slate-600 |
| `border-gray-200` in light mode | `border-white/10` (invisible in light) |

### Layout
| Do | Don't |
|----|-------|
| Floating navbar: `top-4 left-4 right-4` | Stick navbar to `top-0 left-0 right-0` |
| Account for fixed navbar height in content | Let content hide behind fixed elements |
| Consistent `max-w-6xl` or `max-w-7xl` | Mix different container widths |

## Pre-Delivery Checklist (Include in EVERY UI task prompt)

```
PRE-DELIVERY CHECKLIST — verify before considering UI complete:
Visual:
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] All icons from consistent icon set
- [ ] Hover states don't cause layout shift
Interaction:
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Focus states visible for keyboard navigation
Contrast:
- [ ] Light mode text contrast 4.5:1 minimum
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both light and dark
Layout:
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] No content hidden behind fixed navbars
Accessibility:
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] prefers-reduced-motion respected
```
