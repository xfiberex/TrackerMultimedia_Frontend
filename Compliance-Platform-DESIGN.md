---
version: "alpha"
name: "Compliance Platform"
description: "Compliance Platform Dashboard Section is designed for demonstrating application workflows and interface hierarchy. Key features include clear information density, modular panels, and interface rhythm. It is suitable for product showcases, admin panels, and analytics experiences."
colors:
  primary: "#CBD5E1"
  secondary: "#0F172A"
  tertiary: "#E0E7FF"
  neutral: "#F8FAFC"
  background: "#F8FAFC"
  surface: "#CBD5E1"
  text-primary: "#64748B"
  text-secondary: "#94A3B8"
  border: "#F8FAFC"
  accent: "#CBD5E1"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "60px"
    fontWeight: 400
    lineHeight: "60px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  label-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
rounded:
  md: "0px"
spacing:
  base: "4px"
  sm: "1px"
  md: "2px"
  lg: "4px"
  xl: "5px"
  gap: "4px"
  card-padding: "18px"
  section-padding: "64px"
components:
  button-link:
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "0px"
  card:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "16px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Bounded
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses light mode with #CBD5E1 as the main accent and #F8FAFC as the neutral foundation.

- **Primary (#CBD5E1):** Main accent and emphasis color.
- **Secondary (#0F172A):** Supporting accent for secondary emphasis.
- **Tertiary (#E0E7FF):** Reserved accent for supporting contrast moments.
- **Neutral (#F8FAFC):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #F8FAFC; Surface: #CBD5E1; Text Primary: #64748B; Text Secondary: #94A3B8; Border: #F8FAFC; Accent: #CBD5E1

- **Gradients:** bg-gradient-to-b from-slate-300/60 to-slate-100, bg-gradient-to-br from-white/95 to-slate-300/30 via-white/50

## Typography

Typography relies on Inter across display, body, and utility text.

- **Display (`display-lg`):** Inter, 60px, weight 400, line-height 60px, letter-spacing -0.025em.
- **Body (`body-md`):** Inter, 16px, weight 400, line-height 24px.
- **Labels (`label-md`):** Inter, 14px, weight 400, line-height 20px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, bounded structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / bounded composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Bounded
- **Base unit:** 4px
- **Scale:** 1px, 2px, 4px, 5px, 8px, 10px, 12px, 16px
- **Section padding:** 64px
- **Card padding:** 18px, 64px
- **Gaps:** 4px, 6px, 8px, 16px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 1px #F8FAFC; 1px #F1F5F9
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.02) 0px 1px 2px 0px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.04) 0px 0px 0px 1px inset; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 1px -0.5px, rgba(0, 0, 0, 0.06) 0px 3px 3px -1.5px, rgba(0, 0, 0, 0.06) 0px 6px 6px -3px, rgba(0, 0, 0, 0.06) 0px 12px 12px -6px, rgba(0, 0, 0, 0.06) 0px 24px 24px -12px
- **Blur:** 12px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 1px padding and a 16px radius. Drive the shell with linear-gradient(to right bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.5), rgba(203, 213, 225, 0.3)) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 2px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 2px, 3px, 4px, 16px, 24px, 32px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Links:** text #0F172A, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** background #FFFFFF, border 0px solid rgb(229, 231, 235), radius 0px, padding 16px, shadow none.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 2px, 3px, 4px, 16px, 24px, 32px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 160ms and 200ms. Easing favors ease and cubic-bezier(0.23. Hover behavior focuses on text changes. Scroll choreography uses GSAP ScrollTrigger for section reveals and pacing.

**Motion Level:** moderate

**Durations:** 160ms, 200ms

**Easings:** ease, cubic-bezier(0.23, 1, 0.32, 1)

**Hover Patterns:** text

**Scroll Patterns:** gsap-scrolltrigger

## WebGL

Reconstruct the graphics as a ambient background using custom shaders. The effect should read as technical, meditative, and atmospheric: soft bloom haze with white and sparse spacing. Build it from shader field so the effect reads clearly. Animate it as ambient drift. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Ambient background
  - **Effect:**
    - **Value:** Soft bloom haze
  - **Primitives:**
    - **Value:** Shader field
  - **Motion:**
    - **Value:** Ambient drift
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** custom shaders

**Techniques:** Pointer parallax, Shader gradients, DOM fallback
