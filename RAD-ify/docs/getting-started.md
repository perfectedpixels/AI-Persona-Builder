# Getting Started with the RAD UI Package

This guide walks you through installing the RAD UI Package and wiring it into your React + Cloudscape project so you get the full RAD look, feel, and interaction patterns out of the box.

## Quick Setup for Kiro Users

If you're using Kiro and just want it to follow RAD patterns automatically:

1. Copy the `.kiro/steering/rad-ui.md` file from this project into your project's `.kiro/steering/` directory
2. That's it. Kiro will automatically read the steering file and follow RAD design rules in every conversation

The steering file has `inclusion: auto` in its front-matter, so Kiro picks it up without you needing to reference it manually. When you ask Kiro to build UI, it will use FocusGrid instead of tabs, follow the icon rules, use the right selection patterns, etc.

For the full docs (useful for reading yourself or pointing teammates to), copy the entire `docs/` folder into your project.

## Installation

```bash
npm install rad-ui-package
```

Peer dependencies you need in your project:

```bash
npm install react react-dom framer-motion lucide-react \
  @cloudscape-design/components @cloudscape-design/design-tokens @cloudscape-design/global-styles
```

## 1. Apply the RAD Theme

In your app entry point (e.g., `main.tsx`), apply the Cloudscape theme override and import the RAD stylesheet:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@cloudscape-design/global-styles/dark-mode-utils.css';
import '@cloudscape-design/global-styles/index.css';

// RAD imports — the styles.css import loads all animations, layout, fonts, and CSS variables
import { applyRadTheme } from 'rad-ui-package';
import 'rad-ui-package/styles.css';
import 'rad-ui-package/fonts.css'; // optional — loads Ember Modern Display, Text, Bookerly

applyRadTheme(); // applies Cloudscape token overrides

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

If you need to extend the theme with your own tokens:

```tsx
import { radTheme, applyRadTheme } from 'rad-ui-package';

applyRadTheme({
  theme: {
    ...radTheme,
    tokens: {
      ...radTheme.tokens,
      colorBackgroundLayoutMain: { light: '#ffffff', dark: '#111111' },
    },
  },
});
```

## 2. Wrap Your App with Providers

```tsx
import { ThemeProvider, LayoutConfigProvider } from 'rad-ui-package';

function App() {
  return (
    <ThemeProvider>
      <LayoutConfigProvider>
        <YourAppContent />
      </LayoutConfigProvider>
    </ThemeProvider>
  );
}
```

## 3. Use the RadLayout Shell

RadLayout gives you the standard sidebar + main content + chat bar structure:

```tsx
import { RadLayout, ToolBar } from 'rad-ui-package';
import { Home, BarChart3, Settings } from 'lucide-react';

function YourAppContent() {
  const [activeKey, setActiveKey] = useState('#/home');

  const navItems = [
    { key: '#/home', label: 'Home', icon: <Home size={16} /> },
    { key: '#/dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
  ];

  return (
    <RadLayout
      items={navItems}
      activeKey={activeKey}
      onNavigate={setActiveKey}
      chatBar={<ToolBar value="" onChange={() => {}} onSend={() => {}} placeholder="Ask anything..." />}
    >
      {/* Your page content goes here */}
      <YourPageContent activeKey={activeKey} />
    </RadLayout>
  );
}
```

## 4. Build Pages with FocusGrid

Instead of tabs, use FocusGrid cards for content that benefits from a preview state:

```tsx
import { FocusGrid } from 'rad-ui-package';
import type { FocusCard } from 'rad-ui-package';

const cards: FocusCard[] = [
  {
    id: 'overview',
    icon: '📊',
    title: 'Overview',
    summary: 'Key metrics at a glance',
    content: <OverviewPanel />,
  },
  {
    id: 'details',
    icon: '🔍',
    title: 'Details',
    summary: 'Drill into the data',
    content: <DetailsPanel />,
  },
];

function MyPage() {
  return <FocusGrid cards={cards} defaultFocused="overview" />;
}
```

## 5. Add Animations

Wrap content with animation primitives for consistent motion:

```tsx
import { FadeIn, StaggerChildren, PopIn } from 'rad-ui-package';

function MySection() {
  return (
    <FadeIn>
      <h2>Section Title</h2>
      <StaggerChildren>
        <Card>Item 1</Card>
        <Card>Item 2</Card>
        <Card>Item 3</Card>
      </StaggerChildren>
    </FadeIn>
  );
}
```

Or use CSS utility classes directly:

```html
<div class="step-animate">Fades in on mount</div>

<div class="stagger-children">
  <div>Appears first</div>
  <div>Appears second</div>
  <div>Appears third</div>
</div>
```

## 6. Use the Theme Hook

Access the current theme anywhere in your component tree:

```tsx
import { useTheme } from 'rad-ui-package';

function MyComponent() {
  const { mode, preference, setPreference, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {mode}</p>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}
```

## What to Read Next

- [UX Pattern Guide](./ux-patterns.md) — the most important doc for building RAD-consistent UIs
- [Theming Guide](./theming.md) — colors, tokens, CSS variables, dark mode
- [Animation Guide](./animations.md) — when and how to use each animation
- [Component Reference](./components.md) — props and examples for every component
