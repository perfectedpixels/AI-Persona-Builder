# RAD Component Reference

Quick reference for every exported component with props and usage examples.

---

## RadLayout

The primary layout shell. Provides a collapsible sidebar, main content area, and chat bar.

```tsx
import { RadLayout } from 'rad-ui-package';

<RadLayout
  items={navItems}        // NavItem[] — sidebar navigation items
  activeKey={activeKey}   // string — currently active nav key
  onNavigate={setActive}  // (key: string) => void
  chatBar={<ToolBar />}   // ReactNode — optional chat bar content
>
  {children}              // ReactNode — main content
</RadLayout>
```

### NavItem shape
```ts
interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;  // Lucide icon, e.g. <Home size={16} />
  disabled?: boolean;
  badge?: string;
}
```

---

## FocusGrid

Animated card grid with expand/shrink focus behavior.

```tsx
import { FocusGrid } from 'rad-ui-package';
import type { FocusCard } from 'rad-ui-package';

<FocusGrid
  cards={cards}                    // FocusCard[]
  defaultFocused="card-id"         // string — initial focused card
  focused={controlledFocused}      // string | null — controlled mode
  onFocusChange={setFocused}       // (id: string | null) => void
/>
```

### FocusCard shape
```ts
interface FocusCard {
  id: string;
  title: string;
  icon: string;              // emoji, e.g. '🔥'
  summary: string;           // shown in thumbnail state
  content: React.ReactNode;  // full content when focused
  thumbnail?: React.ReactNode; // custom thumbnail (optional)
  onFocus?: () => void;      // called when card receives focus
}
```

---

## ToolBar

Dual-pill toolbar with chat input and action buttons. Supports the "fuse" spinning border animation.

```tsx
import { ToolBar } from 'rad-ui-package';

<ToolBar
  value={chatValue}           // string
  onChange={setChatValue}      // (value: string) => void
  onSend={handleSend}         // () => void
  placeholder="Chat"          // string
  fuse={true}                 // boolean — enable spinning border
  onFuseDismiss={dismiss}     // () => void — called when input focused
/>
```

---

## StepNav

Numbered step progress sidebar.

```tsx
import { StepNav } from 'rad-ui-package';

<StepNav
  title="My Workflow"
  steps={steps}                    // Step[]
  activeHref={activeStep}          // string
  completedHrefs={completedSteps}  // string[]
  onNavigate={setActiveStep}       // (href: string) => void
  collapsed={isCollapsed}          // boolean
  onToggle={toggleCollapse}        // () => void
/>
```

### Step shape
```ts
interface Step {
  label: string;
  href: string;
  disabled?: boolean;
}
```

---

## ScanInterstitial

Full-screen loading overlay with spinner, progress bar, and log entries.

```tsx
import { ScanInterstitial } from 'rad-ui-package';

<ScanInterstitial
  state={appState}          // AppState
  setState={setAppState}    // React.Dispatch<SetStateAction<AppState>>
  onComplete={handleDone}   // () => void — called when progress hits 100
/>
```

---

## Animation Components

### FadeIn
```tsx
<FadeIn delay={0} duration={0.3}>{children}</FadeIn>
```

### StaggerChildren
```tsx
<StaggerChildren stagger={0.06}>{children}</StaggerChildren>
```

### PopIn
```tsx
<PopIn duration={0.2}>{children}</PopIn>
```

### AnimatedPresence
```tsx
<AnimatedPresence id={uniqueKey}>{children}</AnimatedPresence>
```

### LayoutAnimate
```tsx
<LayoutAnimate className="optional">{children}</LayoutAnimate>
```

---

## Context Hooks

### useTheme
```tsx
const { mode, preference, setPreference, toggleTheme } = useTheme();
// mode: 'light' | 'dark'
// preference: 'light' | 'dark' | 'system'
// setPreference: (pref: ThemePreference) => void
// toggleTheme: () => void
```

### useLayoutConfig
```tsx
const {
  showHeader, setShowHeader,
  chatPlaceholder, setChatPlaceholder,
  supportPrompts, setSupportPrompts,
  onSupportPromptClick, setOnSupportPromptClick,
} = useLayoutConfig();
```

---

## Providers

### ThemeProvider
Wrap your app root. Manages light/dark/system theme with localStorage persistence.

```tsx
<ThemeProvider>{children}</ThemeProvider>
```

### LayoutConfigProvider
Wrap inside ThemeProvider. Manages dynamic layout configuration.

```tsx
<LayoutConfigProvider>{children}</LayoutConfigProvider>
```


---

## AI Interaction Components

### AIThinking

Animated dot grid for "AI is processing" loading states. Supports 4 animation variants.

```tsx
import { AIThinking } from 'rad-ui-package';

<AIThinking variant="default" />   // diagonal sweep bounce
<AIThinking variant="fade" />      // radial pulse from center
<AIThinking variant="orbit" />     // spiral sweep
<AIThinking variant="ripple" />    // concentric ring expansion
<AIThinking gridCount={5} size={10} gap={5} />  // custom grid
```

Props: `variant` (default "default"), `gridCount` (default 3), `size` (default 8), `gap` (default 4)

---

### EmberTypingMessage

Word-by-word typing animation with orange dot indicator. The RAD "AI is speaking" pattern.

```tsx
import { EmberTypingMessage } from 'rad-ui-package';

<EmberTypingMessage
  text="Here's what I found..."
  show={true}
  typeSpeed={60}          // ms per word
  dotDelay={600}          // ms before orange dot appears
  typeStartDelay={500}    // ms after dot before typing starts
  showCheck={false}       // show green checkmark instead of orange dot
  onComplete={handleDone}
  onClick={handleClick}
/>
```

---

### ThinkingReasoning

Step-by-step reasoning animation with pixel dot grid and cycling status text.

```tsx
import { ThinkingReasoning } from 'rad-ui-package';

<ThinkingReasoning
  steps={['analyzing data', 'building model', 'generating results']}
  stepDuration={1000}       // ms per step
  centered={false}          // true = full-screen centered overlay
  onComplete={handleDone}   // fires when all steps complete, then unmounts
/>
```

---

### WelcomeMessage

Greeting bubble that appears above the chat bar. Uses EmberTypingMessage internally.

```tsx
import { WelcomeMessage } from 'rad-ui-package';

<WelcomeMessage
  text="Welcome back. You have 3 items that need attention."
  show={showGreeting}
  onClick={() => setShowGreeting(false)}
/>
```

---

### Screensaver

Full-screen intro overlay with Ken Burns image animation, logo reveal, and attention pill. Dismisses on click.

```tsx
import { Screensaver } from 'rad-ui-package';

<Screensaver
  onDismiss={() => setShowScreensaver(false)}
  backgroundImage="/screensaver-bg.png"
  logoSrc="/logo-wordmark.svg"
  logoAlt="Product Logo"
  pillText="3 items need your attention"
/>
```

Track with sessionStorage to show only once per session:
```tsx
const shouldShow = !sessionStorage.getItem('screensaver-shown');
// After dismiss:
sessionStorage.setItem('screensaver-shown', 'true');
```


---

## Selection Pattern Components

### SelectionCard

Click-to-select card with "✓ Selected" footer badge. Use for picking from a set of rich objects.

```tsx
import { SelectionCard } from 'rad-ui-package';

<SelectionCard
  title="Project Folder"
  icon="📂"
  description="Scan steering docs, specs, IaC, configs"
  selected={isSelected}
  onClick={() => toggle('folder')}
/>
```

Props: `title` (required), `icon`, `description`, `selected` (default false), `disabled` (default false), `onClick`, `children` (overrides description)

---

### TogglePillBar

Horizontal bar of toggle pills for high-level categorical choices.

```tsx
import { TogglePillBar } from 'rad-ui-package';

<TogglePillBar
  label="Focus"
  labelIcon="🎯"
  options={[
    { id: 'chatbot', label: '💬 Customer chatbot' },
    { id: 'productivity', label: '⚡ Internal productivity' },
    { id: 'codegen', label: '🧑‍💻 Code generation' },
  ]}
  selected={selectedGoals}
  onChange={setSelectedGoals}
/>
```

Props: `options` (required), `selected` (required), `onChange` (required), `label`, `labelIcon` (default "🎯")

---

### ScoreCell

Color-coded score cell for heatmap/matrix selections. Colors automatically based on score value.

```tsx
import { ScoreCell } from 'rad-ui-package';

<ScoreCell
  label="AI/ML"
  score={0.85}
  selected={selectedCategories.includes('AI/ML')}
  onClick={() => toggleCategory('AI/ML')}
  frictionCount={3}
/>
```

Score colors: ≥70% green (#3fb950/#0d2818), 40-69% yellow (#d29922/#2a1f00), <40% red (#f85149/#2d0a0a). Selected state adds scale(1.08), ✓ overlay, and glow.

Props: `label` (required), `score` (required, 0-1), `selected` (default false), `onClick`, `frictionCount`

---

## Theme Exports

### radTheme

The raw Cloudscape theme object with all RAD token overrides. Use to extend or merge with your own tokens.

```tsx
import { radTheme } from 'rad-ui-package';

const myTheme = {
  ...radTheme,
  tokens: {
    ...radTheme.tokens,
    colorBackgroundButtonPrimaryDefault: { light: '#0073bb', dark: '#539fe5' },
  },
};
```

### applyRadTheme

Applies the RAD theme to Cloudscape. Call once in your entry point. Optionally pass a custom theme.

```tsx
import { applyRadTheme } from 'rad-ui-package';

applyRadTheme(); // uses radTheme defaults
applyRadTheme({ theme: myCustomTheme }); // uses your overrides
```
