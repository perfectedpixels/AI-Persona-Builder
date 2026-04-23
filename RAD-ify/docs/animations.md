# RAD Animation Guide

RAD provides two animation systems: React components (framer-motion wrappers) and CSS utility classes. Use React components for dynamic, interactive animations. Use CSS classes for simple entrance effects.

## React Animation Components

### FadeIn
Fade + slide up on mount. Use for section entrances.

```tsx
import { FadeIn } from 'rad-ui-package';

<FadeIn delay={0.1} duration={0.3}>
  <MyContent />
</FadeIn>
```

Props: `delay` (default 0), `duration` (default 0.3)

### StaggerChildren
Each child appears one after another. Use for lists, card grids, form fields.

```tsx
import { StaggerChildren } from 'rad-ui-package';

<StaggerChildren stagger={0.06}>
  <Card>First</Card>
  <Card>Second</Card>
  <Card>Third</Card>
</StaggerChildren>
```

Props: `stagger` (default 0.06s between children)

### PopIn
Scale-up entrance. Use for modals, popovers, tooltips.

```tsx
import { PopIn } from 'rad-ui-package';

<PopIn duration={0.2}>
  <Modal>...</Modal>
</PopIn>
```

Props: `duration` (default 0.2)

### AnimatedPresence
Animate mount/unmount transitions. Use for conditional content.

```tsx
import { AnimatedPresence } from 'rad-ui-package';

<AnimatedPresence id={currentStep}>
  <StepContent />
</AnimatedPresence>
```

Props: `id` (key for transition tracking)

### LayoutAnimate
Smooth position/size transitions. Use for elements that move or resize.

```tsx
import { LayoutAnimate } from 'rad-ui-package';

<LayoutAnimate>
  <div style={{ width: isExpanded ? '100%' : '50%' }}>
    Content that smoothly resizes
  </div>
</LayoutAnimate>
```

## CSS Animation Classes

Apply these directly to HTML elements:

| Class | Effect | Duration |
|---|---|---|
| `.step-animate` | Fade + slide up | 0.35s |
| `.stagger-children` | Each child staggers in (up to 10 children) | 0.3s per child, 0.06s delay |
| `.pop-in` | Scale-up pop | 0.25s |
| `.focus-card-wrapper` | Smooth flex/width/opacity transitions | 0.4s |
| `.source-card-expand` | Card expand animation | 0.35s |
| `.source-card-shrink` | Card shrink animation | 0.35s |
| `.prioritized-pulse` | Blue glow pulse on selection | 0.6s |

## CSS Keyframes Available

These keyframes are defined globally when you import the RAD stylesheet:

- `cardExpand` — scale from 0.95 to 1 with opacity
- `cardShrink` — slide from right with opacity
- `fadeSlide` — slide down 6px with fade
- `stepEnter` — slide up 12px with fade
- `staggerIn` — slide up 8px with fade
- `popIn` / `popOut` — scale 0.95 ↔ 1 with opacity
- `focusPulse` — blue glow ring pulse
- `slideUp` — slide up 20px with fade (chat bar entrance)
- `spin` — 360° rotation (spinner)

## Cloudscape Component Enhancements

The RAD stylesheet adds subtle transitions to Cloudscape components automatically:

- Containers: `border-color`, `box-shadow`, `background-color` transitions (0.2s)
- Buttons: `background-color`, `border-color`, `color` transitions (0.15s) + scale(0.97) on `:active`
- Segmented controls: `background-color`, `color`, `border-color` transitions (0.2s)
- Modals: `popIn` animation on open
- Expandable sections: `max-height`, `opacity` transitions (0.3s)
- Badges and toggles: `background-color` transitions (0.15s–0.2s)

## Accessibility: prefers-reduced-motion

Always respect the user's motion preference. The animation components should check for this:

```tsx
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// In your component
<FadeIn disabled={reducedMotion}>
  <Content />
</FadeIn>
```

For CSS animations, add this to your stylesheet if not already present:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## When to Animate

| Scenario | Animation | Why |
|---|---|---|
| Page/step entrance | `FadeIn` or `.step-animate` | Orients the user to new content |
| List of items appearing | `StaggerChildren` or `.stagger-children` | Creates visual hierarchy |
| Modal/popover opening | `PopIn` or `.pop-in` | Draws attention to overlay |
| Card focus change | FocusGrid handles this | Smooth layout transition |
| New log entry | `.fadeSlide` keyframe | Shows progression |
| Selection confirmation | `.prioritized-pulse` | Confirms the action |
| Content switching | `AnimatedPresence` | Smooth swap between views |
| AI speaking | `EmberTypingMessage` | Word-by-word typing with orange dot |
| AI processing | `AIThinking` | Dot grid loading animation |
| AI reasoning | `ThinkingReasoning` | Step-by-step status cycling |
| App intro | `Screensaver` | Ken Burns image with logo reveal |
| Greeting | `WelcomeMessage` | Typing bubble above chat bar |

## When NOT to Animate

- Don't animate every state change (hover effects are enough for buttons)
- Don't animate data updates in tables or lists (just re-render)
- Don't use entrance animations on content that's already visible
- Don't stack multiple animations on the same element
- Keep total animation time under 0.4s for interactions, under 0.6s for page transitions


## AI Interaction Animations

These components handle AI-specific animation patterns. They're separate from the general animation primitives because they have domain-specific behavior (typing, reasoning steps, loading states).

### AIThinking dot grid
- 4 variants: `default` (diagonal bounce), `fade` (radial pulse), `orbit` (spiral), `ripple` (concentric rings)
- Dot color is always RAD orange (#FF6200)
- Respects `prefers-reduced-motion` — dots show static at 50% opacity

### EmberTypingMessage
- Uses Bookerly font for AI text
- Orange dot (3px rounded square) appears first, then typing starts word-by-word
- Blinking cursor during typing, removed when complete
- Optional green checkmark mode via `showCheck` prop

### ThinkingReasoning
- Pixel dot grid (5x5) with radial pulse animation
- Steps cycle with fade transitions (0.2s)
- Steps should be lowercase action phrases: "analyzing requirements", "building plan"
- Auto-unmounts when all steps complete

### Screensaver
- Ken Burns zoom animation on background image (20s, infinite alternate)
- Logo scales from 0.88 to 1 with 0.9s spring
- Attention pill slides up from bottom with 1.4s delay
- Dismisses with upward slide exit (0.6s)

### CSS keyframes added
- `aiThinkingBounce`, `aiThinkingFade`, `aiThinkingOrbit`, `aiThinkingRipple` — dot grid variants
- `ember-blink` — cursor blink (0.6s steps)
- `radialPulse` — pixel dot grid pulse
- `kenBurns` — screensaver background zoom
