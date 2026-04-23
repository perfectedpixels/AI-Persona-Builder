# RAD UX Pattern Guide

This is the definitive guide for building UIs that look and behave like the RAD design system. It covers every major interaction pattern with clear Do/Don't rules so your team stays consistent.

Read this before you write any UI code.

---

## 1. Multi-Card Focus vs Tabs

RAD uses FocusGrid cards instead of tabs for most content switching. Cards give users a preview of what's inside before they commit to viewing it.

### When to use FocusGrid cards
- Content has a meaningful preview or thumbnail state
- You want the expand/shrink animation (70/30 split)
- Sections have different visual densities (charts, lists, forms)
- You have 2–4 content sections

### When to use tabs
- All sections are equal weight with no meaningful preview
- You have 5+ sections (cards get too small)
- Content is simple text or forms with no visual preview value

### Do / Don't

| Do | Don't |
|---|---|
| Use `<FocusGrid>` for dashboard panels, visualization views, content categories | Use tabs for 2–3 content sections that have visual previews |
| Provide a `thumbnail` prop with an SVG preview or let the component auto-scale content | Leave cards without summaries or thumbnails |
| Use the `summary` prop to describe what's inside each card | Put critical actions inside collapsed cards where users can't see them |

### Example: Visualization switcher

```tsx
<FocusGrid
  cards={[
    { id: 'heatmap', icon: '🔥', title: 'Heatmap', summary: '12 categories', content: <Heatmap /> },
    { id: 'radar', icon: '📡', title: 'Radar', summary: 'Score overlay', content: <Radar /> },
    { id: 'breakdown', icon: '📊', title: 'Breakdown', summary: 'Sorted by score', content: <Breakdown /> },
  ]}
  focused={vizView}
  onFocusChange={setVizView}
/>
```

### Card thumbnail patterns

When a card is not focused, it shows a thumbnail. You have two options:

1. Custom SVG thumbnail (recommended for charts/visualizations):
```tsx
{
  id: 'radar',
  thumbnail: (
    <svg viewBox="0 0 120 70" style={{ width: '100%', height: 60, opacity: 0.5 }}>
      <polygon points="60,10 95,30 85,60 35,60 25,30" fill="none" stroke="#3fb950" strokeWidth="1.5" />
    </svg>
  ),
}
```

2. Auto-scaled miniature (default): The component scales down the full content to 32% with reduced opacity and saturation, overlaid with a gradient and summary text.

---

## 2. Navigation and Submission Pattern

RAD does NOT use "Next" or "Submit" buttons at the bottom of pages. Instead, the StepNav sidebar serves as both navigation and progress indicator.

### The pattern
- Steps in the sidebar are numbered and show completed/active/disabled states
- Completing the required actions in one step automatically enables the next step
- Users click the next step in the sidebar to advance
- Users can click any completed step to go back

### Do / Don't

| Do | Don't |
|---|---|
| Use `<StepNav>` in the sidebar with steps that enable based on completion state | Put a "Next Step" or "Submit" button at the bottom of the page |
| Derive step enabled/disabled state from your app state | Force users through a linear flow with no way to go back |
| Show a checkmark (✓) on completed steps | Use a progress bar as the primary navigation mechanism |
| Let the sidebar be the single source of truth for "where am I" | Duplicate navigation controls in both the sidebar and the content area |

### Example: Step-based flow

```tsx
const inputComplete = selectedSources.size > 0 && scanReport !== null;
const assessComplete = selectedCategories.length > 0;

const navItems = [
  { key: '#/input', label: 'Input Sources', icon: <Home size={16} /> },
  { key: '#/assess', label: 'Assess', icon: <BarChart3 size={16} />, disabled: !inputComplete },
  { key: '#/learn', label: 'Learn', icon: <GraduationCap size={16} />, disabled: !assessComplete },
];

<RadLayout items={navItems} activeKey={activeStep} onNavigate={navigate}>
  {stepContent()}
</RadLayout>
```

### What "completing a step" means
- The user has performed the required actions (selected sources, prioritized categories, etc.)
- Your app state reflects this completion
- The next step's `disabled` prop flips to `false`
- The sidebar visually updates to show the step is now available

---

## 3. Iconography Rules

RAD uses two icon systems for different purposes. Don't mix them.

### Emoji icons → Content and domain labels
Used for card headers, section titles, and domain-specific labels. They add personality and visual weight to content areas.

Examples: 📂 📄 ☁️ 🔥 📡 📊 📋 📚 💬 ⚡ 🧑‍💻 🎨 🎯

### Lucide React icons → UI chrome and controls
Used for sidebar navigation, toolbar buttons, settings controls, and interactive UI elements. They're clean, consistent, and feel like part of the interface.

Examples: `Home`, `BarChart3`, `GraduationCap`, `Settings`, `Sun`, `Moon`, `Monitor`, `User`, `ChevronLeft`, `ChevronRight`, `ScanSearch`, `AudioLines`, `MousePointerClick`, `MoreHorizontal`

### Do / Don't

| Do | Don't |
|---|---|
| Use emoji for FocusGrid card icons: `icon: '🔥'` | Use Lucide icons for card headers |
| Use Lucide for sidebar nav: `<Home size={16} />` | Use emoji in the sidebar or toolbar |
| Use Lucide for toolbar action buttons | Mix emoji and Lucide in the same visual context |
| Keep emoji at the start of titles/labels | Use emoji as interactive button icons |

### Size conventions
- Sidebar nav icons: `size={16}`
- Toolbar action icons: default Lucide size (24)
- Card header emoji: rendered inline with the title text (no explicit sizing)
- Settings/control icons: `size={14}` to `size={18}`

---

## 4. Selection Pattern Hierarchy

RAD uses different selection controls depending on the type of choice. This is one of the most important patterns to get right.

### The hierarchy (from high-level to granular)

#### Toggle pills / selection bubbles → High-level categorical choices
Used when users pick from a small set of predefined options (goals, modes, filters). Use the `<TogglePillBar>` component.

```tsx
import { TogglePillBar } from 'rad-ui-package';

<TogglePillBar
  label="Focus"
  labelIcon="🎯"
  options={[
    { id: 'chatbot', label: '💬 Customer chatbot' },
    { id: 'productivity', label: '⚡ Internal productivity' },
  ]}
  selected={selectedGoals}
  onChange={setSelectedGoals}
/>
```

#### Clickable colored cells → Matrix or heatmap selections
Used when users select from a visual grid of scored/colored items. Use the `<ScoreCell>` component.

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

#### Card click-to-select → Object selection
Used when users pick from a set of rich objects (data sources, configurations). Use the `<SelectionCard>` component.

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

#### Checkboxes → List or tree data ONLY
Reserved exclusively for file browsers, folder trees, and long scrollable lists.

```tsx
// Only in tree/list contexts like a folder browser
<input type="checkbox" checked={checked} onChange={toggleSelect}
  style={{ accentColor: '#33bbef', width: 15, height: 15 }} />
```

### Do / Don't

| Do | Don't |
|---|---|
| Use toggle pills for goal/filter selection | Use checkboxes for selecting from 4–5 high-level options |
| Use colored cells for scored/rated items | Use radio buttons for category selection |
| Use card click-to-select for rich objects | Use a dropdown for selecting data sources |
| Use checkboxes only in file/folder trees | Use toggle pills inside a scrollable list |

---

## 5. Card Expand/Focus Behavior

When a FocusGrid card is clicked, it expands to 70% width while the others stack at 30%. This is the signature RAD interaction.

### The states

1. No focus: All cards render in equal-width columns
2. Focused: Selected card gets 68% width, others stack vertically in the remaining space
3. Transition: framer-motion LayoutGroup animates position and size over 0.4s with ease `[0.4, 0, 0.2, 1]`

### Thumbnail content rules
- Thumbnails are 90px tall with `overflow: hidden`
- A gradient overlay fades from transparent to the container background color
- Summary text sits at the bottom of the gradient
- Content is either a custom `thumbnail` prop or auto-scaled at 32% with 40% opacity and 35% saturation

### Do / Don't

| Do | Don't |
|---|---|
| Provide custom SVG thumbnails for chart/visualization cards | Leave all cards using auto-scaled thumbnails (they look blurry) |
| Keep summary text short (one line) | Put interactive elements in the thumbnail area |
| Use `onFocus` callback to lazy-load heavy content | Pre-render all card content regardless of focus state |
| Click the focused card again to unfocus (toggle behavior) | Require a separate "close" button to unfocus |

---

## 6. Progress and Status Indicators

### Step navigation circles
- Blue (#33bbef) background = active step
- Green (#238636) background with ✓ = completed step
- Gray (#2a2e33) background = disabled/future step
- Number inside the circle = step index
- Font: 14px, weight 700

### Inline status
- Colored borders on containers indicate state (green=success, yellow=warning, red=error)
- Status badges use Cloudscape `<StatusIndicator>` or `<Badge>` components
- "✓ Selected" text in `text-status-success` color for selection confirmation

### Async operations
- Use `<ScanInterstitial>` for full-screen blocking operations
- Use Cloudscape `<ProgressBar>` for inline progress
- Log entries animate in with the `fadeSlide` keyframe

### Do / Don't

| Do | Don't |
|---|---|
| Use numbered circles in StepNav for step progress | Use a horizontal progress bar as the primary step indicator |
| Use colored borders/backgrounds for score-based status | Use only text labels for status (add color) |
| Use ScanInterstitial for operations that block the whole UI | Show a spinner in the corner for a full-page scan |
| Auto-scroll log entries as they appear | Make users scroll manually to see new log entries |

---

## 7. Content Layout Dimensions

### Main content area
- Max width: `1430px`
- Centered horizontally with `margin: 0 auto`
- Padding: `24px 48px 0` (desktop), `0 32px` (tablet), `0 24px` (mobile), `0 16px` (small mobile)
- Bottom fade mask: `linear-gradient(180deg, black 0%, black 85%, transparent 100%)`
- Remove the fade mask when an expandable panel is active (`.panel-active`)

### Chat bar
- Fixed at bottom of the layout
- Max width: `480px` centered
- Padding: `20px 24px`
- On mobile: fixed position, full width, with safe-area-inset bottom padding
- Use `<ToolBar>` component — dual-pill layout with chat input and optional action buttons
- Enable the `fuse` prop for the spinning conic-gradient border animation (RAD orange)
- Customize the fuse color with `accentColor` prop
- Set `disabled` to stop the fuse and dim the toolbar

### Sidebar
- Collapsed: `56px` wide (icon-only)
- Expanded: shows labels alongside icons
- Default state: collapsed
- Toggle: chevron button at the top

### Do / Don't

| Do | Don't |
|---|---|
| Keep main content within 1430px max-width | Let content stretch to full viewport width |
| Use the bottom fade mask for scrollable content | Cut off content abruptly at the bottom |
| Keep the chat bar at 480px max-width | Make the chat bar full-width on desktop |
| Default the sidebar to collapsed | Default the sidebar to expanded (takes too much space) |

---

## 8. Modal Action Pattern

When showing detail modals (e.g., clicking a heatmap cell to see category details), action buttons go in the modal footer, not inline with the content.

### The pattern
```tsx
<Modal
  header="Category Name — 85%"
  footer={
    <Box float="right">
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={close}>Close</Button>
        <Button variant="primary" onClick={action}>
          I want to work on this
        </Button>
      </SpaceBetween>
    </Box>
  }
>
  {/* Content: narrative, badges, service tags — no action buttons here */}
</Modal>
```

### Do / Don't

| Do | Don't |
|---|---|
| Place primary and secondary actions in the modal `footer` prop | Put action buttons inline with the modal content |
| Use `variant="primary"` for the main action, `variant="link"` for dismiss | Use two primary buttons in the same footer |
| Right-align footer actions with `<Box float="right">` | Left-align or center footer actions |
| Use descriptive action labels ("I want to work on this") | Use generic labels ("OK", "Submit") |

---

## 9. Color Reference

### Core palette

| Token | Light | Dark | Usage |
|---|---|---|---|
| Background (main) | `#FBFAFB` | `#0B0A0A` | Page background |
| Background (container) | `#FAF9F7` | `#191D23` | Card/container surfaces |
| Background (sidebar) | `#FAF9F7` | `#1B1A18` | Sidebar, settings popover |
| Border (divider) | `#EBE9E5` | `#262A30` | Container borders, dividers |
| Text (primary) | `#232f3e` | `#ffffff` | Headings, body text |
| Text (secondary) | `#5f6368` | `#9ca3af` | Descriptions, labels |
| Accent (orange) | `#F26322` | `#F26322` | Active borders, fuse animation |
| Accent (blue) | `#33bbef` | `#33bbef` | Active steps, selected items, links |
| Status (success) | `#4C8963` | `#4C8963` | Completed states, success messages |
| Status (error) | `#f85149` | `#f85149` | Error states, low scores |
| Status (warning) | `#d29922` | `#d29922` | Warning states, medium scores |

### Score-based colors

| Score Range | Text/Border | Background |
|---|---|---|
| ≥ 70% | `#3fb950` | `#0d2818` |
| 40–69% | `#d29922` | `#2a1f00` |
| < 40% | `#f85149` | `#2d0a0a` |

---

## 10. AI Interaction Patterns

RAD has specific components for AI-assisted workflows. Use the right one for each state.

### When the AI is processing (loading)
Use `<AIThinking>` — the animated dot grid. Pick the variant that matches the context:
- `default` (diagonal bounce) — general processing
- `fade` (radial pulse) — data analysis
- `orbit` (spiral) — creative/generative tasks
- `ripple` (concentric rings) — search/scanning

### When the AI is speaking (typing response)
Use `<EmberTypingMessage>` — word-by-word typing with the orange dot indicator. This is the signature RAD AI voice.

### When the AI is reasoning (multi-step)
Use `<ThinkingReasoning>` — shows what the AI is working on with cycling status text and a pixel dot grid.

### When greeting the user
Use `<WelcomeMessage>` — appears above the chat bar with a typing animation. Dismiss on click.

### App intro / screensaver
Use `<Screensaver>` — full-screen Ken Burns image with logo reveal and attention pill. Show once per session via sessionStorage.

### Do / Don't

| Do | Don't |
|---|---|
| Use `<AIThinking>` for loading states in AI workflows | Use a generic spinner for AI processing |
| Use `<EmberTypingMessage>` with Bookerly font for AI text | Render AI responses as instant static text |
| Use `<ThinkingReasoning>` with lowercase action phrases | Use uppercase or sentence-case for reasoning steps |
| Track screensaver with sessionStorage (once per session) | Show the screensaver on every page load |
| Dismiss `<WelcomeMessage>` on click or after user interacts with chat | Leave the welcome message visible permanently |

---

## 11. Typography

### Font stack

| Role | Font Family | Weights | Usage |
|---|---|---|---|
| Headlines | Ember Modern Display | 300–800 | h1, page titles, hero text |
| Body | Ember Modern Text | 300–700 | Body copy, labels, descriptions |
| AI Responses | Bookerly | 300–700 | Chat responses, AI-generated content |
| Fallback | Inter, system-ui, sans-serif | — | When custom fonts aren't loaded |

### Size conventions
- Page title (h1): `3.2em`, weight 700, Ember Modern Display
- Section header: Cloudscape `<Header variant="h2">`
- Card header: Cloudscape `<Header variant="h3">`
- Body text: default (inherits from Ember Modern Text)
- Small labels: Cloudscape `<Box fontSize="body-s">`
- Uppercase labels: `fontSize: 11px`, `fontWeight: 600`, `letterSpacing: 1.2`, `textTransform: uppercase`
