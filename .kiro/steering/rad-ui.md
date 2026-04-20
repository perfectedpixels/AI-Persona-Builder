---
inclusion: auto
---

# RAD UI Design System — Kiro Steering

When generating or modifying UI code in this project, follow these RAD design system rules.

## Theme Setup
- Import `rad-ui-package/styles.css` and `rad-ui-package/fonts.css`, then call `applyRadTheme()` in the app entry point
- Wrap the app with `<ThemeProvider>` and `<LayoutConfigProvider>`
- Use `useTheme()` hook to access current theme mode (light/dark/system)
- Use `useLayoutConfig()` hook to dynamically control header visibility, chat placeholder, and support prompts
- Use `radTheme` object to extend or merge with custom Cloudscape token overrides

## Layout
- Use `<RadLayout>` as the page shell with sidebar nav, main content, and chat bar
- Main content max-width: 1430px centered. Chat bar max-width: 480px fixed at bottom
- Sidebar defaults to collapsed (icon-only, 56px). Use Lucide icons at size={16} for nav items
- Use `<ToolBar>` in the chat bar slot — dual-pill toolbar with chat input and optional action buttons
- `<ToolBar>` supports a `fuse` prop for the spinning conic-gradient border animation, and `accentColor` to customize it
- `<ToolBar>` supports a `disabled` prop that stops the fuse animation and dims the toolbar

## Cards vs Tabs
- Use `<FocusGrid>` cards for content with preview/thumbnail value (dashboards, visualizations, categories)
- Use tabs only for 5+ equal-weight sections with no meaningful preview
- Each FocusCard needs: id, icon (emoji), title, summary, content. Provide custom SVG thumbnails for charts

## Navigation
- Use `<StepNav>` sidebar for multi-step flows. Steps enable based on completion state
- Do NOT place "Next" or "Submit" buttons at the bottom of pages
- Completing actions in a step automatically enables the next step in the sidebar

## Selection Controls
- Use `<TogglePillBar>` for high-level categorical choices (goals, filters, modes) — renders a horizontal bar of Cloudscape Toggle pills with a label
- Use `<ScoreCell>` for matrix/heatmap selections with score-based coloring (green ≥70%, yellow 40-69%, red <40%) and ✓ overlay when selected
- Use `<SelectionCard>` for object selection — click-to-select cards with "✓ Selected" badge in the footer
- Checkboxes ONLY for file/folder trees and long scrollable lists

## Icons
- Emoji (📂 🔥 📡 📊 etc.) for card headers and content/domain labels
- Lucide React icons (Home, Settings, BarChart3 etc.) for sidebar nav, toolbar buttons, UI controls
- Never mix emoji and Lucide in the same visual context

## Colors
- Dark background: #191D23 (containers), #0B0A0A (page)
- Light background: #FAF9F7 (containers), #FBFAFB (page)
- Accent orange: #F26322 (active borders, fuse animation)
- Accent blue: #33bbef (active steps, selected items)
- Score colors: ≥70% green (#3fb950), 40-69% yellow (#d29922), <40% red (#f85149)

## Typography
- Headlines: Ember Modern Display (font-weight 700)
- Body: Ember Modern Text (font-weight 350)
- AI responses: Bookerly
- Uppercase labels: 11px, weight 600, letter-spacing 1.2

## Animations
- Use `<FadeIn>` for section entrances, `<StaggerChildren>` for lists, `<PopIn>` for modals
- Use `<AnimatedPresence>` for mount/unmount transitions (wraps framer-motion AnimatePresence with fade+slide)
- Use `<LayoutAnimate>` for smooth position and size transitions on elements that resize or move
- All animation primitives accept a `disabled` prop to render children without animation (use for prefers-reduced-motion)
- Use CSS classes: `.step-animate`, `.stagger-children`, `.pop-in` for simple effects
- Keep animations under 0.4s. Respect `prefers-reduced-motion`
- FocusGrid transitions: 0.4s with ease [0.4, 0, 0.2, 1]

## Loading & Progress
- Use `<ScanInterstitial>` for full-screen blocking loading overlays with spinner, progress bar (0-100), and scrollable log entries
- `<ScanInterstitial>` auto-scrolls log entries and fires `onComplete` when progress reaches 100
- Log entries animate in with the `fadeSlide` CSS keyframe

## Modals
- Action buttons go in the modal `footer` prop, right-aligned
- Use `variant="primary"` for the main action, `variant="link"` for dismiss
- Use descriptive labels ("I want to work on this") not generic ("OK", "Submit")

## CSS Variables
- All RAD variables use `--rad-` prefix
- Override them in your own CSS to customize without touching the package
- Dark mode overrides use `[data-theme="dark"]` selector

## Cloudscape Component Usage
RAD uses these Cloudscape components with specific conventions:
- `<Container>` with `<Header variant="h2">` for focused card content, `<Header variant="h3">` for thumbnail cards
- `<Box>` for text styling: `color="text-body-secondary"` for descriptions, `fontSize="body-s"` for small labels, `variant="awsui-value-large"` for metric numbers
- `<Button variant="primary">` for main actions, `<Button variant="link">` for dismiss/cancel, `<Button variant="icon">` for icon-only buttons
- `<SpaceBetween size="l">` for page-level spacing, `size="s"` for within-card spacing, `direction="horizontal"` for inline groups
- `<Toggle>` for selection pills in horizontal filter bars (not for on/off settings)
- `<SegmentedControl>` for mode switching (e.g., usage/competency/blended score modes)
- `<Modal>` with actions in `footer` prop, right-aligned via `<Box float="right">`
- `<Badge>` for status labels and tags (blue for info, red for errors, grey for neutral)
- `<StatusIndicator>` for inline status (loading, success, error, warning)
- `<ProgressBar>` for inline progress indicators
- `<ExpandableSection variant="container">` for collapsible detail sections
- `<ColumnLayout columns={N} variant="text-grid">` for metric grids (e.g., 5-column stats row)
- `<Input>` and `<Textarea>` for form fields within card detail views
- `<Link>` with `external` prop for outbound links, `fontSize="body-m"` for readable link text
- `<ContentLayout>` as the outer content wrapper when not using RadLayout

## Button States & Patterns
- Primary buttons: dark background (#191D23 light / #ffffff dark), used for main actions
- Normal buttons: outlined with dark border, used for secondary actions
- Active state: RAD orange (#F26322) border on normal buttons
- Hover: subtle background shift (light: #F3EFE5, dark: #2a2f38)
- Pressed: scale(0.97) transform on all buttons
- Disabled: 40% opacity, cursor: default, no click handler fires
- Icon buttons: no border, transparent background, hover shows subtle fill

## Error, Warning & Success States
- Error: text color #f85149, background #2d0a0a (dark), border #da3633
- Warning: text color #d29922, background #2a1f00 (dark), border #9e6a03
- Success: text color #3fb950 or #4C8963, background #0d2818 (dark), border #238636
- Use Cloudscape `<StatusIndicator type="error|warning|success|loading">` for inline status
- Use colored borders on containers/cards to indicate state (not just text color)
- Error messages use `<Box color="text-status-error" fontSize="body-s">`

## Sidebar / Left Nav (NavRail)
- Collapsed width: 56-74px (icon-only). Expanded width: 240px
- Nav items use Lucide icons at size={16-20} with `.sidebar-icon-btn` class
- Selected state: subtle background (#e8eaed light / #1B1A18 dark)
- Hover state: lighter background (#f1f3f4 light / #1B1A18 dark)
- Notification badge: red dot (8px, #d93025) positioned absolute top-right of icon
- User section at bottom: avatar circle (36px) + name/email when expanded
- Settings popover: appears to the right of the sidebar, contains theme switcher (Light/Dark/System)
- Divider between logo area and nav items: 1px solid (#e0e0e0 light / #1B1A18 dark)
- Mobile: sidebar hidden, replaced by hamburger menu with slide-in overlay (280px wide)

## Headings & Text Hierarchy
- Page titles: Ember Modern Display, 3.2em, weight 700
- Section headers: Cloudscape `<Header variant="h2">` (used in focused FocusGrid cards)
- Card headers: Cloudscape `<Header variant="h3">` (used in thumbnail FocusGrid cards)
- Uppercase section labels: 11px, weight 600, letter-spacing 1.2, text-transform uppercase, color #33bbef
- Body text: Ember Modern Text, weight 350, inherits from root
- Small labels: Cloudscape `<Box fontSize="body-s" color="text-body-secondary">`
- AI response text: Bookerly font, 20px, line-height 1.5
- Metric values: Cloudscape `<Box variant="awsui-value-large">`

## Wizard / Multi-Step Flow Pattern
- RAD does NOT use a traditional wizard component
- Instead: `<StepNav>` sidebar + `<RadLayout>` with conditional content rendering
- Steps are numbered circles: blue (#33bbef) = active, green (#238636) with ✓ = completed, gray (#2a2e33) = disabled
- Step transitions use the `stepEnter` CSS animation (0.35s fade + slide up)
- Content for each step is rendered conditionally based on `activeStep` state
- No "Back"/"Next" buttons — users click steps in the sidebar to navigate

## Responsive Breakpoints
- 1024px: reduce main content padding to 32px
- 768px: hide sidebar, show mobile hamburger menu, fix chat bar to bottom, adjust padding
- 480px: further reduce padding to 16px, hide ⌘K shortcut badge in toolbar


## AI Interaction Components
- Use `<EmberTypingMessage>` for word-by-word typing animation with orange dot indicator (AI speaking)
- Use `<AIThinking>` dot grid for "AI is processing" loading states (variants: default, orbit, fade, ripple)
- Use `<ThinkingReasoning>` for step-by-step reasoning display with cycling status text
- Use `<WelcomeMessage>` for greeting bubbles above the chat bar (uses EmberTypingMessage internally)
- Use `<Screensaver>` for full-screen intro overlays with Ken Burns image animation and attention pill

## AI Component Rules
- EmberTypingMessage uses Bookerly font for AI text
- AIThinking dot color is always RAD orange (#FF6200)
- ThinkingReasoning steps should be lowercase action phrases ("analyzing requirements", "building plan")
- Screensaver dismisses on click, track with sessionStorage to show only once per session
