# Design System Master File — ElectroPoint

> **LOGIC:** When building a page, first check `design-system/electropoint/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.

---

**Project:** ElectroPoint  
**Generated:** 2026-08-15  
**Category:** Premium electronics retail (not luxury fashion, not SaaS)

---

## Authority & overrides

UI/UX Pro Max recommended **Liquid Glass + gold + Cormorant** for “luxury e-commerce.” That recommendation is **rejected** because it conflicts with the product brief:

- No glassmorphism, morphing blobs, iridescence, or chromatic aberration
- No gold/fashion luxury palette
- No serif display type (fashion, not electronics)
- No generic AI blue/purple gradients
- No gaming/cyberpunk neon

**Adopted styles (from UI/UX Pro Max search):**

1. **Swiss Modernism 2.0** — primary visual language  
2. **Minimalism & Swiss Style** — spacing, type, contrast  
3. **3D Product Preview** — selective product hero / PDP only  
4. **Dark Mode (OLED)** — dark theme as a showroom, not a game HUD  

**Landing pattern:** Product Demo + Features, with editorial hero (product is the campaign).  
**Dashboard:** Sales Intelligence — real data only, clean charts.

---

## Brand

**Name:** ElectroPoint  
**Positioning:** Professional electronics retailer — precision, trust, performance.  
**Currency:** NPR (eSewa + Khalti).  
**Voice:** Direct, technical, confident. Short headlines. Specs over slogans.

The customer should feel: *This is a professional electronics store.*

---

## Color tokens

ONE accent. No competing accent colors.

### Light

| Token | Hex | Usage |
|-------|-----|--------|
| `--background` | `#F4F5F7` | Page canvas (cool off-white) |
| `--foreground` | `#0B0D10` | Primary text |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--surface-elevated` | `#FFFFFF` | Dropdowns, sheets |
| `--border` | `#E2E5EA` | Hairline borders |
| `--primary` | `#0B0D10` | Primary buttons, nav |
| `--primary-hover` | `#1C2128` | Primary hover |
| `--accent` | `#0A66FF` | Links, focus, selected, sale emphasis |
| `--accent-hover` | `#0854D4` | Accent hover |
| `--muted` | `#5C6570` | Secondary text (min contrast) |
| `--muted-bg` | `#EEF0F3` | Subtle fills |
| `--success` | `#0E7A4A` | In stock, paid |
| `--warning` | `#B45309` | Low stock |
| `--danger` | `#C2410C` | Errors, out of stock |
| `--price` | `#0B0D10` | Current price |
| `--price-was` | `#6B7280` | Original price |

### Dark (premium showroom, not gaming)

| Token | Hex |
|-------|-----|
| `--background` | `#0B0C0E` |
| `--foreground` | `#F2F4F7` |
| `--surface` | `#14161A` |
| `--surface-elevated` | `#1B1E24` |
| `--border` | `#2A2E36` |
| `--primary` | `#F2F4F7` |
| `--primary-hover` | `#FFFFFF` |
| `--accent` | `#3B82F6` |
| `--accent-hover` | `#60A5FA` |
| `--muted` | `#9AA3AE` |
| `--muted-bg` | `#1A1D22` |
| `--success` | `#34D399` |
| `--warning` | `#FBBF24` |
| `--danger` | `#FB7185` |

**Rules**
- Product photography sits on `#F4F5F7` (light) or `#12141A` (dark) — never busy gradients.
- Sale badges use `--danger` text on a 1px border, not loud filled pills everywhere.
- Stars: `#B45309` (light) — not rainbow.
- Do not use purple, gold, neon cyan, or multi-stop gradients as brand color.

---

## Typography

Premium modern sans. No decorative serifs.

| Role | Font | Size / weight |
|------|------|----------------|
| Display | Plus Jakarta Sans | 48–64px / 600, tracking -0.03em |
| H1 | Plus Jakarta Sans | 36–48px / 600 |
| H2 | Plus Jakarta Sans | 24–32px / 600 |
| H3 | Plus Jakarta Sans | 18–20px / 600 |
| Body | Inter | 16px / 400, line-height 1.6 |
| Small | Inter | 14px / 400 |
| Caption | Inter | 12px / 500, tracking 0.04em, uppercase for labels |
| Specs | IBM Plex Sans | 14px / 400, tabular |
| Price | Inter | 20–28px / 600, `font-variant-numeric: tabular-nums` |
| Label | Inter | 12–13px / 500 |

Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
```

---

## Spacing & grid

8px base. Swiss 12-column.

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--space-3xl` | 72px |
| `--space-4xl` | 96px |

Content max: `1280px` storefront, `1440px` admin.  
Section vertical rhythm: alternate `72px` / `96px` — **do not make every section identical**.

---

## Radius, borders, shadows

Precision, not bubble UI.

| Token | Value |
|-------|--------|
| `--radius-sm` | 4px |
| `--radius-md` | 6px |
| `--radius-lg` | 8px |
| `--shadow-sm` | `0 1px 2px rgba(11,13,16,0.06)` |
| `--shadow-md` | `0 8px 24px rgba(11,13,16,0.08)` |

- Product images: radius `4px` or none.
- Cards: `1px` border, almost no shadow. Hover = border darken, not lift/scale.
- Buttons: `6px`. Primary is solid charcoal (light) / near-white (dark). Accent used for text links and focus rings.
- No `backdrop-filter` on content cards. Nav may use a solid surface, not frosted glass.

---

## Motion

150–250ms ease. Product 3D uses damping, never 1:1 mouse mapping.

- Hover: color / opacity / border — **no layout-shifting scale**
- Cart add: brief check on button
- Page: no full-page transition theatre
- Checkout: **no decorative animation**
- Respect `prefers-reduced-motion: reduce` — disable 3D auto-rotate and scroll-driven camera

---

## Component hierarchy

1. **Product photography / 3D** — visual hero  
2. **Price + availability + CTA**  
3. **Specs** — scannable groups  
4. **Trust** — warranty, authentic, payment  
5. **Chrome** — nav, filters, footer  

### Product card

- Main image (4:5 or 1:1, object-contain on muted surface)
- Hover swaps to second image (opacity crossfade, 200ms)
- Brand (caption)
- Title (2 lines max)
- Rating + count
- Price / was / discount %
- Stock line (text, not only color)
- Wishlist (icon, aria-label)
- Quick view + add to cart on hover (desktop); always available on mobile
- Optional single badge: New / Sale / 3D / Low stock — never stack 5 badges

### Navigation

- Logo left, category mega-menu, search, compare, wishlist, account, cart
- Skip link to `#main`
- Sticky nav with `padding-top` compensation
- Active item: accent underline, not a filled pill
- Mobile: bottom-sheet menu + sticky add-to-cart on PDP

### Checkout

Focused, 6 steps, no mega-nav. Progress indicator. Order summary sticky on desktop. No 3D. No marketing carousels.

---

## E-commerce anti-patterns (forbidden)

- Fake reviews, fake stock, fake analytics
- Trusting frontend prices or payment status
- Endless card grids with identical rhythm
- Auto-playing noisy video
- Forced account before browse
- Tiny tap targets on mobile
- Color-only error/success
- Emoji icons
- Missing focus rings
- Horizontal page scroll (except comparison table on mobile)

---

## Accessibility

- Contrast ≥ 4.5:1 body, ≥ 3:1 large
- Labels on every input (`htmlFor`)
- `role="alert"` on form errors
- Icon buttons have `aria-label`
- Keyboard-operable mega menu, dialogs, 3D fallback
- 3D canvas has text alternative (product name + key specs)

---

## 3D rules

- Only products flagged by admin (`visualMode`: images | spin360 | model3d)
- Lazy + dynamic import of Three.js
- Orbit with damping; auto-rotate slow; reset camera
- Mobile: simplified lights, no post-processing; fallback image if WebGL fails
- Dispose geometries on unmount
- Hero scroll-driven camera is subtle and never traps scroll

---

## Pre-delivery checklist

- [ ] No emojis as icons (Lucide only)
- [ ] `cursor-pointer` on clickable elements
- [ ] Hover 150–300ms, no layout shift
- [ ] Light text contrast 4.5:1
- [ ] Visible focus
- [ ] `prefers-reduced-motion`
- [ ] 375 / 768 / 1024 / 1440
- [ ] No content under sticky nav
- [ ] Product is the visual hero
