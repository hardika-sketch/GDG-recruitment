# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Campus students looking to explore and apply to student-led societies.

## Product Purpose
Centralized campus portal to discover student groups, take a fit-finding quiz, and apply for recruitment.

## Positioning
A unified, clean, and distraction-free workspace for campus group matching, removing disjointed paper forms or confusing social media posts.

## Operating Context
Used on desktop and mobile web (responsive), typically in the weeks leading up to recruitment season, during campus orientations.

## Capabilities and Constraints
- Filter societies by category (Technical, Cultural, Literary, Sports).
- Live search by name, tag, or description.
- Interactive matching quiz with category-based scoring.
- Side-drawer details panel with active roles and dynamic submission form.
- Form validation on the client-side (length, character checks) and standard API integration for submission.

## Brand Commitments
- Name: SocietiesExplorer
- Brand Mark: SE
- Aesthetic: Minimalist high-contrast monochrome with precise accents and smooth micro-animations. No bloated "AI slop" styling or generic gradients.

## Evidence on Hand
- Offline fallback data with 6 standard campus societies ([data.js](file:///c:/Users/HARDIKA/Desktop/ME/GDG/frontend/src/data.js)).
- Active backend with API endpoints for retrieving societies (`GET /api/societies`) and submitting applications (`POST /api/applications`).

## Product Principles
- **Clarity Over Clutter**: Remove all visual noise, placeholders, and unnecessary filler.
- **Immediate Utility**: The user should search, filter, and understand a society's focus instantly.
- **Fluid Transitions**: Every action (theme toggling, drawer opening, quiz steps) must feel tactile and snappy with CSS transitions.

## Accessibility & Inclusion
- High contrast readable text.
- Full keyboard/escape close actions for interactive elements.
