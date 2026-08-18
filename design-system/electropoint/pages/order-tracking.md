# Order tracking overrides

Follow **MASTER.md** (Swiss Modernism 2.0). Do not use the UI/UX Pro Max “tracking blue + delivery orange” dashboard palette, Fira Code, or dual CTAs.

## Layout

- Customer: status headline → horizontal stepper (vertical under 768px) → shipment card → timeline → items
- Admin: same tracker, then a single “Update shipment” form (status, note, carrier, tracking number, URL, ETA)
- Public `/track`: two-field lookup (order number + email), then the same tracker

## Visual

- One accent (`--accent`) for current step; completed steps use `--foreground` fill; upcoming use hairline `--border`
- Status meaning also in text + icon, never color alone
- Lucide icons only; no emoji, glass, parallax, or 3D tilt
- Pulse on current node only when `prefers-reduced-motion: no-preference`
- Tracking number is IBM Plex / `.spec-text`, copy control with visible focus

## Copy

- Direct: “Out for delivery”, not “Your package is on an adventure”
- Failed/cancelled: danger tone banner, hide the happy-path stepper progress as complete
