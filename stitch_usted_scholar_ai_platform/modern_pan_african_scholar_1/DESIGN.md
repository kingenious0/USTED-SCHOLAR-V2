---
name: Modern Pan-African Scholar
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#20201f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c5d9'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e90a2'
  outline-variant: '#434656'
  surface-tint: '#b8c3ff'
  primary: '#b8c3ff'
  on-primary: '#002388'
  primary-container: '#2e5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#124af0'
  secondary: '#ffb68d'
  on-secondary: '#532200'
  secondary-container: '#ae4f00'
  on-secondary-container: '#ffe7dc'
  tertiary: '#c9c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#6e6d6d'
  on-tertiary-container: '#f3f0ef'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#0035be'
  secondary-fixed: '#ffdbc9'
  secondary-fixed-dim: '#ffb68d'
  on-secondary-fixed: '#331200'
  on-secondary-fixed-variant: '#763300'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c9c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 64px
  container-max: 1440px
  sidebar-width: 280px
  sidebar-collapsed: 80px
---

## Brand & Style

The design system is defined by a "Pan-African Tech-Modern" aesthetic, blending the high-tech precision of AI with the vibrant, warm energy of African sunsets and digital progress. It targets ambitious university students who seek a premium, focused learning environment that feels both sophisticated and culturally resonant.

The UI style leverages **Glassmorphism** and **Tactile Minimalism**. It uses deep, light-absorbing backgrounds to create a sense of focused "night mode" study, contrasted against vibrant accents that represent sparks of intelligence and discovery. Interfaces should feel layered and physical, with surfaces that appear as polished obsidian or frosted glass, providing a tactile experience that distinguishes this design system from generic educational tools.

## Colors

The palette is anchored in a deep, absolute dark-mode foundation to minimize eye strain during long study sessions.

- **Primary (Electric Blue):** Used for primary actions, progress indicators, and AI-driven insights. It represents the "tech" in the African Tech-Modern theme.
- **Secondary (Sunset Orange):** Used for highlights, motivational cues, and urgent notifications. This color provides the "warmth" and cultural connection to the African landscape.
- **Backgrounds:** The primary background uses an absolute dark (#0A0A0A), while secondary surfaces use a slightly lighter neutral (#1A1A1A) to create depth.
- **Glass Accents:** Semi-transparent layers use the neutral color with a high-degree background blur (20px-40px) to simulate premium frosted surfaces.

## Typography

This design system utilizes **Outfit** for its geometric yet friendly proportions, which bridge the gap between technical efficiency and human-centric design.

- **Headlines:** Use Bold or Semi-Bold weights with tight letter-spacing to create a strong, "premium editorial" impact.
- **Body:** Standardized at 16px for optimal readability of complex academic content. 
- **Labels:** Uppercase labels with increased letter-spacing are used for categorization (e.g., "MODULE", "AI SUMMARY") to maintain a structured, scholarly hierarchy.

## Layout & Spacing

The design system employs a **Fluid-Responsive Grid** with a strict 8px rhythmic spacing scale. 

- **Desktop:** Features a collapsible left sidebar. When expanded, it provides full navigation labels; when collapsed, it minimizes to iconic representations to maximize the workspace for learning modules.
- **Mobile:** Shifts to a fixed bottom navigation bar for ergonomic "thumb-zone" access.
- **Margins:** 24px (md) for mobile gutters and 32px (lg) for desktop containers to ensure the content "breathes."
- **Content Width:** Main learning content is centered with a max-width of 1440px to prevent excessive line lengths in academic reading.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Stacking** and **Glassmorphism** rather than traditional heavy shadows.

- **Level 0 (Base):** #0A0A0A. The canvas.
- **Level 1 (Cards):** #1A1A1A with a 1px subtle border (rgba(255,255,255,0.05)).
- **Level 2 (Floating/Modals):** Glassmorphic surfaces with `backdrop-filter: blur(20px)` and a slightly higher border opacity to simulate a raised glass pane.
- **Tactile Shadows:** High-elevation elements (like primary buttons) use a soft glow shadow tinted with the primary Electric Blue to simulate an emissive light source.

## Shapes

The shape language is defined by "The Scholar's Curve"—a consistent 16px radius (Scale 2) that makes the interface feel approachable and modern.

- **Primary Containers:** 16px (1rem) for all main cards and sidebar containers.
- **Interactive Elements:** Buttons and input fields use a slightly tighter 12px radius to feel more precise.
- **Nested Elements:** Icons or tags within cards use an 8px radius to maintain visual nesting harmony.

## Components

### Buttons & Inputs
- **Primary Button:** Solid Electric Blue with white text, 12px radius. On hover, a subtle Sunset Orange outer glow.
- **Input Fields:** Dark #1A1A1A background, 1px border, 12px radius. Focus state uses a 1px Electric Blue border with a soft inner glow.

### Tactile Cards
- All cards feature a 1px stroke (inner) to define edges against the black background. 
- Learning module cards should include a subtle gradient overlay in the corner using the secondary Sunset Orange at 5% opacity.

### Navigation
- **Desktop Sidebar:** Glassmorphic background blur, vertically stacked icons. The "Active" state is indicated by a vertical Electric Blue pill on the left edge.
- **Mobile Bottom Nav:** Fixed position with a backdrop-filter blur. Icons use Electric Blue for the active state and a muted grey for inactive.

### Premium AI Elements
- **AI Suggestion Chips:** Use a gradient border (Electric Blue to Sunset Orange) to signify AI-generated content.
- **Progress Bars:** Thin, high-contrast Electric Blue lines with a "glow" head to indicate current learning progress.