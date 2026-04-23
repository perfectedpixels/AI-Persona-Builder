// Components
export { default as RadLayout } from './components/RadLayout';
export { default as FocusGrid } from './components/FocusGrid';
export { FadeIn, StaggerChildren, PopIn, AnimatedPresence, LayoutAnimate } from './components/Animate';
export { default as ToolBar } from './components/ToolBar';
export { default as StepNav } from './components/StepNav';
export { default as ScanInterstitial } from './components/ScanInterstitial';

// AI Interaction Components
export { default as AIThinking } from './components/AIThinking';
export { default as EmberTypingMessage } from './components/EmberTypingMessage';
export { default as ThinkingReasoning } from './components/ThinkingReasoning';
export { default as WelcomeMessage } from './components/WelcomeMessage';
export { default as Screensaver } from './components/Screensaver';

// Selection Pattern Components
export { default as SelectionCard } from './components/SelectionCard';
export { default as TogglePillBar } from './components/TogglePillBar';
export { default as ScoreCell } from './components/ScoreCell';

// Contexts & Hooks
export { ThemeProvider, useTheme } from './contexts/ThemeContext';
export { LayoutConfigProvider, useLayoutConfig } from './contexts/LayoutConfigContext';

// Theme
export { radTheme, applyRadTheme } from './theme/theme';

// Styles (side-effect import so CSS is included in the bundle)
import './styles/index.css';

// Types
export type {
  ThemeMode,
  ThemePreference,
  ThemeContextValue,
  LayoutConfig,
  LayoutConfigContextValue,
  NavItem,
  Step,
  FocusCard,
  RadLayoutProps,
  FocusGridProps,
  ToolBarProps,
  StepNavProps,
  ScanInterstitialProps,
  FadeInProps,
  StaggerChildrenProps,
  PopInProps,
  AnimatedPresenceProps,
  LayoutAnimateProps,
  CloudscapeTokenValue,
  CloudscapeTheme,
  AIThinkingVariant,
  AIThinkingProps,
  EmberTypingMessageProps,
  ThinkingReasoningProps,
  WelcomeMessageProps,
  ScreensaverProps,
  SelectionCardProps,
  TogglePillOption,
  TogglePillBarProps,
  ScoreCellProps,
} from './types/types';
