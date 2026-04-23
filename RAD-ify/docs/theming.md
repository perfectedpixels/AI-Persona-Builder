# RAD Theming Guide

This guide explains how the RAD theme system works and how to customize it for your project.

## How the Theme System Works

RAD theming has three layers:

1. Cloudscape design token overrides (via `applyTheme`)
2. CSS custom properties (via `--rad-*` variables)
3. React ThemeProvider context (light/dark/system mode switching)

All three work together. The Cloudscape tokens handle component-level styling, the CSS variables handle custom components, and the ThemeProvider coordinates which mode is active.

## Applying the Base Theme

```tsx
// main.tsx
import { applyRadTheme } from 'rad-ui-package';
import 'rad-ui-package/styles.css';
import 'rad-ui-package/fonts.css'; // optional — loads custom font families

applyRadTheme(); // applies all Cloudscape token overrides
```

## Extending the Theme

To override specific tokens while keeping the rest of the RAD defaults:

```tsx
import { radTheme, applyRadTheme } from 'rad-ui-package';

const myTheme = {
  ...radTheme,
  tokens: {
    ...radTheme.tokens,
    // Override just what you need
    colorBackgroundButtonPrimaryDefault: {
      light: '#0073bb',
      dark: '#539fe5',
    },
  },
};

applyRadTheme({ theme: myTheme });
```

## CSS Custom Properties

All RAD CSS variables use the `--rad-` prefix. Override them in your own stylesheet:

```css
:root {
  /* Glassmorphism */
  --rad-glass-blur: 8;
  --rad-glass-saturate: 2.8;
  --rad-glass-brightness: 1.25;
  --rad-glass-contrast: 1;
  --rad-glass-border-width: 2;

  /* Borders */
  --rad-border-subtle: rgba(255, 255, 255, 0.1);
  --rad-border-medium: rgba(255, 255, 255, 0.15);
  --rad-border-prominent: rgba(255, 255, 255, 0.2);
  --rad-border-focus: rgba(255, 255, 255, 0.3);

  /* Text */
  --rad-text-primary: #232f3e;
  --rad-text-secondary: #5f6368;

  /* Surfaces */
  --rad-surface-secondary: #f5f5f5;

  /* Fonts */
  --rad-font-headline: 'Ember Modern Display', system-ui, sans-serif;
  --rad-font-body: 'Ember Modern Text', system-ui, sans-serif;
  --rad-font-ai: 'Bookerly', Georgia, serif;
}

/* Dark mode overrides are automatic via [data-theme="dark"] */
[data-theme="dark"] {
  --rad-text-primary: #ffffff;
  --rad-text-secondary: #9ca3af;
  --rad-surface-secondary: #1B1A18;
}
```

To override a variable for your project:

```css
:root {
  --rad-text-primary: #1a1a2e; /* your brand's dark text */
}
```

## Using the ThemeProvider

The ThemeProvider manages which mode is active and persists the user's choice:

```tsx
import { ThemeProvider, useTheme } from 'rad-ui-package';

function App() {
  return (
    <ThemeProvider>
      <MyApp />
    </ThemeProvider>
  );
}

function ThemeSwitcher() {
  const { mode, preference, setPreference } = useTheme();

  return (
    <div>
      <p>Active: {mode}</p> {/* "light" or "dark" */}
      <p>Preference: {preference}</p> {/* "light", "dark", or "system" */}
      <button onClick={() => setPreference('light')}>Light</button>
      <button onClick={() => setPreference('dark')}>Dark</button>
      <button onClick={() => setPreference('system')}>System</button>
    </div>
  );
}
```

### What the ThemeProvider does automatically
- Sets `data-theme="light"` or `data-theme="dark"` on `<html>`
- Adds `awsui-light-mode` or `awsui-dark-mode` class to `<body>`
- Persists the preference to `localStorage`
- Listens for OS color scheme changes when in "system" mode

## Key Token Reference

These are the most commonly customized tokens:

| Token | Light Default | Dark Default | What it affects |
|---|---|---|---|
| `colorBackgroundLayoutMain` | `#ffffff` | `#191D23` | Page background |
| `colorBackgroundContainerContent` | `#FAF9F7` | `#191D23` | Card/container fill |
| `colorBorderDividerDefault` | `#EBE9E5` | `#262A30` | All divider lines |
| `colorBackgroundButtonPrimaryDefault` | `#191D23` | `#ffffff` | Primary buttons |
| `colorTextButtonPrimaryDefault` | `#ffffff` | `#191D23` | Primary button text |
| `colorBorderButtonNormalActive` | `#F26322` | `#F26322` | Active button border (RAD orange) |
| `fontFamilyBase` | `'Inter', 'Amazon Ember', ...` | same | All text |
| `borderRadiusContainer` | `8px` | same | Container corners |
| `borderRadiusButton` | `10px` | same | Button corners |
