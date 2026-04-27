---
name: Modern Pan-African Scholar
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#434656'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#747688'
  outline-variant: '#c4c5d9'
  surface-tint: '#124af0'
  primary: '#0040e0'
  on-primary: '#ffffff'
  primary-container: '#2e5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#b8c3ff'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fd8b00'
  on-secondary-container: '#603100'
  tertiary: '#4e5562'
  on-tertiary: '#ffffff'
  tertiary-container: '#666d7b'
  on-tertiary-container: '#eaf0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#0035be'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#dce2f3'
  tertiary-fixed-dim: '#c0c7d6'
  on-tertiary-fixed: '#151c27'
  on-tertiary-fixed-variant: '#404754'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: 32px
---

## Brand & Style
This design system embodies the "Modern Pan-African Scholar"—a persona that is intellectually rigorous, technologically fluent, and culturally vibrant. The aesthetic combines the cleanliness of a high-end academic journal with the energy of a Silicon Valley tech hub. 

The style is primarily **Minimalist with Glassmorphic accents**. It leverages vast amounts of whitespace to ensure focus on complex information, while using translucent "glass" layers to indicate depth and modern flair. The atmosphere is premium and forward-thinking, designed to evoke a sense of clarity, prestige, and digital-native intelligence.

## Colors
The palette is anchored by a clinical **#FFFFFF** background to ensure maximum readability and a "fresh start" feel. The primary driver is **Electric Blue (#2E5BFF)**, used for critical actions and navigational cues, representing technological precision. **Sunset Orange (#FF8C00)** serves as a high-energy accent for notifications, highlights, and secondary interactions, providing a warm, Pan-African-inspired contrast.

For academic readability, text contrast is prioritized using a deep Charcoal (#111827) for body copy. Success, warning, and error states should utilize tonal shifts of the primary palette to maintain a cohesive, high-end appearance without breaking the clean aesthetic.

## Typography
This design system utilizes **Plus Jakarta Sans** as its typographic backbone (providing the geometric clarity and modern warmth requested). The type hierarchy is intentionally bold, with large, heavy headlines that assert authority and structure. 

To maintain academic readability, body text is set with generous line-height (1.6) to prevent eye fatigue during long reading sessions. Labels and small metadata utilize a semi-bold weight and slight letter spacing to ensure they remain legible and distinct from the narrative text.

## Layout & Spacing
The layout follows a **Fixed 12-column grid** for desktop environments, transitioning to a fluid model for mobile. It uses an 8px base unit to ensure rhythmic consistency across all components.

Spacing is used aggressively to create "islands" of information, preventing the UI from feeling cluttered. Content containers are padded with "md" (24px) or "lg" (48px) units to provide a premium, airy feel. Gutters are kept wide to maintain a clear distinction between different content modules, such as research papers, data visualizations, and navigation sidebars.

## Elevation & Depth
Depth is conveyed through **Light-based Glassmorphism**. Surfaces do not use heavy shadows; instead, they use background blurs (backdrop-filter: blur(12px)) and high-transparency white fills (rgba(255, 255, 255, 0.7)).

To distinguish between layers, this design system uses:
1.  **Level 0 (Base):** Solid #FFFFFF or #F9FAFB.
2.  **Level 1 (Cards):** Translucent white with a 1px solid stroke in a very light gray (#E5E7EB) to define boundaries without heavy shadows.
3.  **Level 2 (Modals/Popovers):** Higher blur radius and a very soft, diffused ambient shadow (10% opacity blue-tinted gray) to lift the element off the page.

Interaction states are indicated by subtle shifts in the background opacity of the glass layers rather than changing the physical elevation.

## Shapes
The shape language is defined by the **16px border radius (Rounded level 2)**. This radius is applied consistently to all primary containers, buttons, and input fields to create a approachable, tech-modern silhouette. 

Smaller elements like tags or chips may use a fully rounded (pill) shape to provide visual variety, but the primary structural elements must strictly adhere to the 16px standard to maintain the system's architectural integrity.

## Components
### Buttons
Primary buttons use the **Electric Blue** background with white text and 16px rounding. Secondary buttons utilize the **glassmorphism** effect: a translucent white background with a blue border and blue text.

### Cards
Cards are the primary content vehicle. They must feature a 1px subtle border (#E5E7EB) and a light background blur. For academic content, cards should have clear, bold headers and metadata labels in **Sunset Orange**.

### Input Fields
Fields are represented by a light gray background (#F3F4F6) with 16px corners. Upon focus, the border transitions to a 2px **Electric Blue** stroke with a soft glow.

### Chips & Tags
Used for academic categories or keywords. These are pill-shaped with a light tint of the **Sunset Orange** or **Electric Blue** and high-contrast text.

### Academic Progress Indicators
Custom horizontal bars or rings using the Electric Blue to Sunset Orange gradient to show research completion or course progress.