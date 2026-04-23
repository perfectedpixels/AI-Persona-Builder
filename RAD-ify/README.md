# RAD UI Package

A standalone npm package that extracts the complete RAD (Rapid Application Development) design system — components, layouts, animations, theming, typography, and interaction patterns — into a reusable library. Install it once, and your project gets the full RAD look and feel out of the box.

Built on React 18, Cloudscape Design System, and Framer Motion.

## What's Inside

### Components
- **RadLayout** — Collapsible sidebar + main content + chat bar layout shell with integrated theme switching
- **FocusGrid** — Animated card grid with 70/30 expand/shrink focus behavior (the signature RAD interaction)
- **ToolBar** — Dual-pill toolbar (chat input + action buttons) with the "fuse" spinning border animation
- **StepNav** — Numbered step progress sidebar with completed/active/disabled states
- **ScanInterstitial** — Full-screen loading overlay with spinner, progress bar, and scrolling log entries
- **FadeIn, StaggerChildren, PopIn, AnimatedPresence, LayoutAnimate** — Framer Motion animation primitives
- **AIThinking** — Animated dot grid for AI processing states (4 variants: default, orbit, fade, ripple)
- **EmberTypingMessage** — Word-by-word typing animation with orange dot indicator (AI speaking)
- **ThinkingReasoning** — Step-by-step reasoning animation with pixel dot grid
- **WelcomeMessage** — Greeting bubble above the chat bar with typing effect
- **Screensaver** — Full-screen Ken Burns intro overlay with logo reveal and attention pill

### Contexts & Hooks
- **ThemeProvider / useTheme** — Light/dark/system theme with localStorage persistence and OS preference detection
- **LayoutConfigProvider / useLayoutConfig** — Dynamic layout configuration (header visibility, chat placeholder, support prompts)

### Theme & Styling
- **radTheme / applyRadTheme** — Cloudscape design token overrides (dark #191D23, light #FAF9F7, accent #F26322)
- **CSS Variables** — `--rad-` namespaced custom properties for glassmorphism, borders, text, surfaces, fonts
- **CSS Animations** — Keyframes and utility classes (`.step-animate`, `.stagger-children`, `.pop-in`, etc.)
- **Custom Fonts** — Ember Modern Display (headlines), Ember Modern Text (body), Bookerly (AI responses)
- **Responsive Breakpoints** — 480px, 768px, 1024px with safe-area-inset support

### Documentation & Steering
- UX pattern guide with Do/Don't rules for every interaction pattern
- Component reference with props and examples
- Theming guide, animation guide, installation guide
- Kiro steering file for automatic design consistency

## Quick Start

```bash
# Install the package
npm install rad-ui-package

# Install peer dependencies
npm install react react-dom framer-motion lucide-react \
  @cloudscape-design/components @cloudscape-design/design-tokens @cloudscape-design/global-styles
```

```tsx
// main.tsx
import '@cloudscape-design/global-styles/dark-mode-utils.css';
import '@cloudscape-design/global-styles/index.css';
import { applyRadTheme } from 'rad-ui-package';
import 'rad-ui-package/styles.css';
import 'rad-ui-package/fonts.css'; // optional — loads custom fonts

applyRadTheme();
```

```tsx
// App.tsx
import { ThemeProvider, LayoutConfigProvider, RadLayout, FocusGrid, ToolBar } from 'rad-ui-package';
import { Home, BarChart3 } from 'lucide-react';

function App() {
  const [activeKey, setActiveKey] = useState('#/home');

  return (
    <ThemeProvider>
      <LayoutConfigProvider>
        <RadLayout
          items={[
            { key: '#/home', label: 'Home', icon: <Home size={16} /> },
            { key: '#/dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
          ]}
          activeKey={activeKey}
          onNavigate={setActiveKey}
          chatBar={<ToolBar value="" onChange={() => {}} onSend={() => {}} />}
        >
          <YourContent />
        </RadLayout>
      </LayoutConfigProvider>
    </ThemeProvider>
  );
}
```

## For Kiro Users

Copy the steering file into your project and Kiro will automatically follow RAD design patterns:

```bash
mkdir -p .kiro/steering
cp node_modules/rad-ui-package/.kiro/steering/rad-ui.md .kiro/steering/rad-ui.md
```

No scanning, no manual references. Kiro reads it automatically on every conversation.

## Project Structure

```
rad-ui-package/
├── src/
│   ├── index.ts                    # Barrel export (all components, contexts, hooks, types, theme)
│   ├── components/
│   │   ├── RadLayout.tsx           # Layout shell with sidebar, main content, chat bar
│   │   ├── FocusGrid.tsx           # Animated card grid with expand/shrink focus
│   │   ├── Animate.tsx             # FadeIn, StaggerChildren, PopIn, AnimatedPresence, LayoutAnimate
│   │   ├── ToolBar.tsx             # Dual-pill toolbar with fuse animation
│   │   ├── StepNav.tsx             # Numbered step progress sidebar
│   │   ├── ScanInterstitial.tsx    # Full-screen loading overlay
│   │   ├── AIThinking.tsx          # Dot grid loading animation (4 variants)
│   │   ├── EmberTypingMessage.tsx  # Word-by-word typing with orange dot
│   │   ├── ThinkingReasoning.tsx   # Step-by-step reasoning animation
│   │   ├── WelcomeMessage.tsx      # Greeting bubble above chat bar
│   │   └── Screensaver.tsx         # Full-screen Ken Burns intro overlay
│   ├── contexts/
│   │   ├── ThemeContext.tsx         # ThemeProvider + useTheme
│   │   └── LayoutConfigContext.tsx  # LayoutConfigProvider + useLayoutConfig
│   ├── theme/
│   │   └── theme.ts                # Cloudscape token overrides + applyRadTheme()
│   ├── types/
│   │   └── types.ts                # All TypeScript interfaces and types
│   ├── styles/
│   │   ├── index.css               # CSS entry point (imports all below in order)
│   │   ├── variables.css           # --rad- CSS custom properties + dark mode overrides
│   │   ├── fonts.css               # @font-face declarations
│   │   ├── animations.css          # @keyframes + utility classes
│   │   ├── Layout.css              # Sidebar, main content, chat bar, mobile responsive
│   │   └── ToolBar.css             # Toolbar pills, fuse animation, disabled state
│   └── fonts/                      # 32 .woff2 font files
├── dist/                           # Build output (ESM, CJS, .d.ts, styles.css, fonts.css, fonts/)
├── docs/                           # Human-readable documentation
│   ├── getting-started.md
│   ├── ux-patterns.md
│   ├── theming.md
│   ├── animations.md
│   ├── components.md
│   ├── installations.md
│   └── steering/
│       └── rad-ui.md               # Distributable copy of the Kiro steering file
├── .kiro/
│   ├── steering/
│   │   ├── rad-ui.md               # Auto-included: RAD design patterns for Kiro
│   │   └── rad-ui-installations.md # Manual: installation & tooling reference for Kiro
│   └── specs/
│       └── rad-ui-package/         # Spec files (requirements, design, tasks)
├── tests/
│   └── setup.ts                    # Vitest setup
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## Build & Test

```bash
npm run build    # Compiles TS → ESM + CJS, bundles CSS, generates .d.ts, copies fonts
npm test         # Runs all tests (vitest --run)
```

## Documentation

| Doc | What it covers |
|---|---|
| [Getting Started](docs/getting-started.md) | Install, wire up theme, use RadLayout, build pages with FocusGrid |
| [UX Patterns](docs/ux-patterns.md) | Cards vs tabs, navigation, icons, selection controls, layout dimensions, modals — with Do/Don't tables |
| [Theming](docs/theming.md) | Three-layer theme system, extending tokens, CSS variables, ThemeProvider usage |
| [Animations](docs/animations.md) | React animation components, CSS utility classes, keyframes, accessibility |
| [Components](docs/components.md) | Props and examples for every exported component and hook |
| [Installations](docs/installations.md) | Full dependency list, build tooling, scripts, troubleshooting |

---

## Appendix: Steering Files

Steering files are Markdown documents that Kiro reads to guide its behavior when generating or modifying code. They live in `.kiro/steering/` and are the mechanism that makes this package "Kiro-aware."

### `.kiro/steering/rad-ui.md`

**Inclusion:** `auto` (Kiro reads it on every conversation without being asked)

**Purpose:** This is the primary design system rulebook. It tells Kiro how to write UI code that follows RAD patterns. Covers:

- Theme setup (import paths, provider wrapping, `applyRadTheme()`)
- Layout rules (RadLayout as the shell, 1430px max-width, 480px chat bar, collapsed sidebar default)
- Cards vs tabs decision logic (FocusGrid for preview-able content, tabs only for 5+ equal-weight sections)
- Navigation pattern (StepNav sidebar, no "Next"/"Submit" buttons at page bottom)
- Selection control hierarchy (toggle pills → colored cells → card select → checkboxes for trees only)
- Iconography rules (emoji for content labels, Lucide for UI chrome — never mix)
- Color palette (dark/light backgrounds, accent orange #F26322, accent blue #33bbef, score-based colors)
- Typography (Ember Modern Display for headlines, Ember Modern Text for body, Bookerly for AI)
- Animation guidelines (which primitive to use when, 0.4s max, respect prefers-reduced-motion)
- Modal pattern (actions in footer, right-aligned, descriptive labels)
- CSS variable namespace (`--rad-` prefix, dark mode via `[data-theme="dark"]`)
- AI interaction components (EmberTypingMessage for AI speaking, AIThinking for processing, ThinkingReasoning for reasoning, WelcomeMessage for greetings, Screensaver for intros)

**When a team copies this file into their project**, Kiro will automatically generate RAD-consistent code without the developer needing to remember or reference any of these rules manually.

### `.kiro/steering/rad-ui-installations.md`

**Inclusion:** `manual` (developer references it explicitly with `#rad-ui-installations` in Kiro chat)

**Purpose:** Installation and tooling reference for when a developer is setting up a new project or troubleshooting dependency issues. Covers:

- Consumer setup (npm install command, peer dependencies, entry point wiring, steering file copy)
- Developer setup (all devDependencies with versions and purposes)
- Build and test commands
- Confirmation that no Kiro extensions or MCP servers are required

**This file is manual-inclusion** because installation is a one-time activity. You don't want it cluttering every conversation — just reference it when you need it.

### `docs/steering/rad-ui.md`

**Purpose:** This is a distributable copy of `.kiro/steering/rad-ui.md` that ships inside the npm package. When a consumer runs `npm install rad-ui-package`, this file is available at `node_modules/rad-ui-package/docs/steering/rad-ui.md` so they can copy it into their own `.kiro/steering/` directory. It's identical to the active steering file — just placed in `docs/` for easy discovery and distribution.
