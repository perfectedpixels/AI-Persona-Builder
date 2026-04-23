# RAD UI Package — Installation & Tooling Reference

Everything a developer (or Kiro) needs to know about what's installed, why, and how to set it up.

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ (ships with Node 18+)

---

## For Package Consumers (using rad-ui-package in your app)

### 1. Install the package

```bash
npm install rad-ui-package
```

### 2. Install peer dependencies

These are required in your project but not bundled by the package — you control the versions:

```bash
npm install react react-dom framer-motion lucide-react \
  @cloudscape-design/components \
  @cloudscape-design/design-tokens \
  @cloudscape-design/global-styles
```

| Dependency | Version | Purpose |
|---|---|---|
| `react` | ^18.0.0 | React core |
| `react-dom` | ^18.0.0 | React DOM renderer |
| `framer-motion` | ^12.0.0 | Animation engine for FocusGrid, Animate primitives, LayoutAnimate |
| `lucide-react` | ^1.7.0 | Icon library for sidebar nav and UI controls |
| `@cloudscape-design/components` | ^3.0.0 | AWS Cloudscape component library (Container, Header, Box, etc.) |
| `@cloudscape-design/design-tokens` | ^3.0.0 | Cloudscape design token definitions |
| `@cloudscape-design/global-styles` | ^1.0.0 | Cloudscape global CSS (dark mode utils, base styles) |

### 3. Wire it up in your entry point

```tsx
// main.tsx
import '@cloudscape-design/global-styles/dark-mode-utils.css';
import '@cloudscape-design/global-styles/index.css';
import { applyRadTheme } from 'rad-ui-package';
import 'rad-ui-package/styles.css';
import 'rad-ui-package/fonts.css'; // optional — loads Ember Modern Display, Text, Bookerly

applyRadTheme();
```

### 4. Copy the Kiro steering file (optional but recommended)

```bash
mkdir -p .kiro/steering
cp node_modules/rad-ui-package/.kiro/steering/rad-ui.md .kiro/steering/rad-ui.md
```

This gives Kiro automatic awareness of RAD design patterns in every conversation.

---

## For Package Developers (working on rad-ui-package itself)

### 1. Clone and install

```bash
git clone <repo-url>
cd rad-ui-package
npm install
```

### 2. Build tooling

All build tooling is in `devDependencies` and installed automatically by `npm install`.

#### Build system: Vite (library mode)

| Package | Version | Purpose |
|---|---|---|
| `vite` | ^5.4.0 | Build tool — compiles TypeScript, bundles CSS, produces ESM + CJS output |
| `@vitejs/plugin-react` | ^4.3.0 | Vite plugin for React JSX transform and Fast Refresh |
| `vite-plugin-dts` | ^4.0.0 | Generates `.d.ts` TypeScript declaration files alongside JS output |
| `vite-plugin-static-copy` | ^2.0.0 | Copies font files (`src/fonts/*.woff2`) to `dist/fonts/` during build |

Config: `vite.config.ts`

```bash
npm run build    # produces dist/index.mjs, dist/index.cjs, dist/styles.css, dist/fonts/
```

#### TypeScript

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.5.0 | TypeScript compiler (used by Vite and vite-plugin-dts) |
| `@types/react` | ^18.3.0 | React type definitions |
| `@types/react-dom` | ^18.3.0 | React DOM type definitions |

Config: `tsconfig.json` — strict mode, JSX react-jsx, ES2020 target, bundler module resolution

#### Test framework: Vitest

| Package | Version | Purpose |
|---|---|---|
| `vitest` | ^2.0.0 | Test runner (Vite-native, fast, compatible with Jest API) |
| `@testing-library/react` | ^16.0.0 | React component testing utilities |
| `@testing-library/jest-dom` | ^6.0.0 | Custom DOM matchers (toBeInTheDocument, toHaveClass, etc.) |
| `jsdom` | ^25.0.0 | Browser environment simulation for tests |
| `fast-check` | ^3.0.0 | Property-based testing library for correctness properties |

Config: `vitest.config.ts` — jsdom environment, setup file at `tests/setup.ts`

```bash
npm test         # runs all tests once (vitest --run)
```

### 3. Build output structure

After `npm run build`, the `dist/` directory contains:

```
dist/
├── index.mjs          # ESM bundle (for import)
├── index.cjs          # CJS bundle (for require)
├── index.d.ts         # Root type declarations
├── styles.css         # All CSS bundled (variables, animations, layout, toolbar, AI components)
├── fonts.css          # @font-face declarations (separate to avoid base64 inlining)
├── components/        # Per-component .d.ts files
├── contexts/          # Per-context .d.ts files
├── theme/             # Theme .d.ts
├── types/             # Types .d.ts
└── fonts/             # 32 .woff2 font files (Ember Modern Display, Text, Bookerly)
```

### 4. Key config files

| File | Purpose |
|---|---|
| `package.json` | Package metadata, scripts, peer/dev dependencies, exports map |
| `tsconfig.json` | TypeScript compiler options |
| `vite.config.ts` | Vite library mode build config with plugins |
| `vitest.config.ts` | Test runner config (jsdom, setup file, test file patterns) |

### 5. Scripts

| Script | Command | What it does |
|---|---|---|
| `npm run build` | `vite build` | Compiles TS, bundles CSS, generates .d.ts, copies fonts |
| `npm test` | `vitest --run` | Runs all unit and property tests once |
| `npm run dev` | `vite` | Starts Vite dev server (for local development/preview) |

---

## Kiro Extensions & Steering

No Kiro extensions or MCP servers are required. The RAD UI Package works with Kiro through a single steering file:

| File | Location | Purpose |
|---|---|---|
| `rad-ui.md` | `.kiro/steering/rad-ui.md` | Auto-included steering rules for RAD design patterns |

The steering file uses `inclusion: auto` front-matter, which means Kiro reads it automatically in every conversation without the user needing to reference it. It covers:

- Theme setup instructions
- Layout rules (RadLayout, sidebar, content area, chat bar)
- Cards vs tabs decision rules
- Navigation patterns (StepNav, no submit buttons)
- Selection control hierarchy (pills → cells → cards → checkboxes)
- Iconography rules (emoji vs Lucide)
- Color palette and typography
- Animation guidelines
- Modal action placement

---

## Troubleshooting

### "Cannot find module 'rad-ui-package'"
Make sure you ran `npm install rad-ui-package` and your bundler resolves the `exports` map in package.json.

### Cloudscape components look unstyled
You need both the Cloudscape global styles AND the RAD stylesheet:
```tsx
import '@cloudscape-design/global-styles/dark-mode-utils.css';
import '@cloudscape-design/global-styles/index.css';
import 'rad-ui-package/styles.css';
```

### Fonts not loading
The fonts are bundled in `dist/fonts/`. If your bundler doesn't resolve them from the package, copy them to your public directory and update the `--rad-font-*` CSS variables to point to the correct paths.

### framer-motion version mismatch
The package requires framer-motion ^12.0.0. If you're on an older version, animations may not work. Check with:
```bash
npm ls framer-motion
```

### Build fails with "Cannot find module 'vite-plugin-dts'"
This is a devDependency — run `npm install` in the rad-ui-package project directory. Consumers don't need this.
