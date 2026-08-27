---
name: Societies Explorer
description: Minimalist High-Contrast Monochrome Design System
colors:
  primary: "#ffffff"
  neutral-bg: "#0a0a0a"
  neutral-card: "#121212"
  border-color: "#27272a"
  accent-text: "#000000"
typography:
  display:
    fontFamily: "Space Mono, monospace"
    fontSize: "44px"
    fontWeight: 700
  body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "14px"
    fontWeight: 400
rounded:
  sm: "0px"
  md: "0px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
---

# Design System: Societies Explorer

## Overview

**Creative North Star: "The Modern Grid Lab"**

Societies Explorer utilizes a minimalist high-contrast monochrome design system focused on geometric layouts, thin line borders, and structured information delivery. It rejects common modern design tropes such as colorful linear gradients, drop-shadow glow effects, and heavily rounded corners, opting instead for pure, raw layouts reminiscent of high-end technical document design.

### Key Characteristics:
- **Absolute Monochrome**: Rely exclusively on black, white, and precise gray tones.
- **Outlined Containers**: Define sections and controls using thin, 1px solid borders.
- **Industrial Typography**: Pair a structural sans-serif font for readability with a monospaced typeface for UI action elements, tags, and headlines.
- **Snappy Transitions**: Fast, compositor-based UI animations that feel crisp and highly interactive.

---

## Colors

The palette is strictly restrained to grayscale values, using high-contrast inversions to highlight interactive states.

### Primary
- **Stark White** (#ffffff): Accent highlights, primary active buttons, and text headings in dark mode.

### Neutral
- **Pure Black** (#000000): Primary background color in light mode, primary text in light mode.
- **Deep Gray** (#0a0a0a): Dark mode base background.
- **Card Fill** (#121212): Subtle container background in dark mode.
- **Thin Border** (#27272a): Standard container line outlines in dark mode.
- **Light Gray** (#f4f4f5): Standard container line outlines in light mode.

**The Stark State Rule.** Background and text colors invert strictly for active or hovered components, turning black-on-white text into white-on-black or vice-versa to indicate focus, rather than introducing color overlays.

---

## Typography

**Display Font:** Space Mono (with monospace fallbacks)
**Body Font:** Archivo (with sans-serif fallbacks)

### Hierarchy
- **Display** (Bold, 44px, line-height 1.1): Used for main hero headers.
- **Headline** (Bold, 20px, line-height 1.2): Used for society card names and section headers.
- **Body** (Regular, 14px, line-height 1.5): Used for paragraph details, SOP explanations, and card taglines.
- **Label** (Regular/Bold, 11px, letter-spacing 0.1em, uppercase): Used for tags, form inputs, status texts, buttons, and quiz options.

**The Action Mono Rule.** All buttons, clickable pills, and interactive inputs are written in the uppercase, monospaced font family to separate tasks from the reading content.

---

## Layout

The page layout is structured as a vertical grid system. Breaking points adapt from desktop grid columns to single-column lists on mobile screens. Padding and margins follow a strict rhythm of 8px steps (8px, 16px, 24px, 32px, 48px, 56px).

---

## Elevation & Depth

This system avoids ambient shadows, box shadows, and vertical layers. Depth is conveyed strictly through flat panel offsets (`#121212` container on `#0a0a0a` canvas) and sharp solid outlines.

**The Flat-By-Rest Rule.** All elements sit on the same level at rest. Active overlays or details drawers slide in on top with solid borders, rather than utilizing ambient soft drop shadows.

---

## Shapes

Shapes are strictly geometric, emphasizing sharp edges.

- **Border Radius**: Set to `0px` for all elements (cards, drawer details, success modals, inputs, and primary buttons).
- **Outlines**: Elements are defined by a thin, 1px solid stroke to maintain structure without relying on fill separation.

---

## Components

### Buttons
- **Shape**: Sharp corners (0px radius).
- **Primary**: Solid white background with black text in dark mode; solid black background with white text in light mode.
- **Secondary**: Outlined border with no background; transitions to a filled background on hover.

### Chips / Badges
- **Style**: Thin outline box, space mono font, uppercase.
- **Category Tag**: Outlined borders with 10px uppercase monospaced text.

### Cards
- **Corner Style**: Sharp corners.
- **Background**: Deep Gray (#121212) at rest, transitioning to Pure Black (#0a0a0a) on hover with custom highlight borders.

### Inputs / Fields
- **Style**: Solid dark gray input background, defined by a 1px solid outline border.
- **Focus**: Border inverts to solid text highlight; zero glow radius.

---

## Do's and Don'ts

### Do:
- **Do** align all active UI elements to the grid and enforce 1px outline spacing.
- **Do** write buttons and metrics in Space Mono for a technical, editorial feel.
- **Do** use CSS transitions for opacity and transforms to guarantee 60fps animations.

### Don't:
- **Don't** use box-shadow rules or blur overlays.
- **Don't** use border-radius values higher than 0px except for filter pills which use capsule shapes.
- **Don't** introduce colorful highlights or gradients to denote categories; utilize strict typography weight differences instead.
