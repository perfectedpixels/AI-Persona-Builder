import { ReactNode } from 'react';
export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';
export interface ThemeContextValue {
    mode: ThemeMode;
    preference: ThemePreference;
    setPreference: (pref: ThemePreference) => void;
    toggleTheme: () => void;
}
export interface LayoutConfig {
    showHeader: boolean;
    chatPlaceholder: string;
    supportPrompts: string[];
    onSupportPromptClick: ((prompt: string) => void) | null;
}
export interface LayoutConfigContextValue extends LayoutConfig {
    setShowHeader: (v: boolean) => void;
    setChatPlaceholder: (v: string) => void;
    setSupportPrompts: (v: string[]) => void;
    setOnSupportPromptClick: (fn: ((prompt: string) => void) | null) => void;
}
export interface NavItem {
    key: string;
    label: string;
    icon: ReactNode;
    disabled?: boolean;
    badge?: string;
}
export interface Step {
    label: string;
    href: string;
    description?: string;
    disabled?: boolean;
}
export interface RadLayoutProps {
    items: NavItem[];
    activeKey: string;
    onNavigate: (key: string) => void;
    chatBar?: ReactNode;
    children: ReactNode;
}
export interface FocusCard {
    id: string;
    title: string;
    icon: string;
    summary: string;
    content: ReactNode;
    thumbnail?: ReactNode;
    onFocus?: () => void;
}
export interface FocusGridProps {
    cards: FocusCard[];
    defaultFocused?: string;
    focused?: string | null;
    onFocusChange?: (id: string | null) => void;
    columns?: number;
}
export interface ToolBarProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    placeholder?: string;
    fuse?: boolean;
    accentColor?: string;
    disabled?: boolean;
    actions?: ReactNode;
}
export interface StepNavProps {
    title?: string;
    steps: Step[];
    activeHref: string;
    completedHrefs?: string[];
    onNavigate: (href: string) => void;
    collapsed?: boolean;
    onToggle?: () => void;
}
export interface ScanInterstitialProps {
    progress: number;
    logEntries?: string[];
    onComplete?: () => void;
}
export interface FadeInProps {
    delay?: number;
    duration?: number;
    disabled?: boolean;
    children: ReactNode;
}
export interface StaggerChildrenProps {
    stagger?: number;
    disabled?: boolean;
    children: ReactNode;
}
export interface PopInProps {
    duration?: number;
    disabled?: boolean;
    children: ReactNode;
}
export interface AnimatedPresenceProps {
    id: string;
    disabled?: boolean;
    children: ReactNode;
}
export interface LayoutAnimateProps {
    className?: string;
    disabled?: boolean;
    children: ReactNode;
}
export interface CloudscapeTokenValue {
    light: string;
    dark: string;
}
export interface CloudscapeTheme {
    tokens: Record<string, CloudscapeTokenValue>;
}
export type AIThinkingVariant = 'default' | 'orbit' | 'fade' | 'ripple';
export interface AIThinkingProps {
    variant?: AIThinkingVariant;
    gridCount?: number;
    size?: number;
    gap?: number;
}
export interface EmberTypingMessageProps {
    text: string;
    show: boolean;
    typeSpeed?: number;
    dotDelay?: number;
    typeStartDelay?: number;
    showCheck?: boolean;
    onComplete?: () => void;
    onClick?: () => void;
}
export interface ThinkingReasoningProps {
    steps?: string[];
    prefix?: string;
    stepDuration?: number;
    initiallyComplete?: boolean;
    centered?: boolean;
    onComplete?: () => void;
}
export interface WelcomeMessageProps {
    text: string;
    show: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    typeSpeed?: number;
    dotDelay?: number;
    typeStartDelay?: number;
}
export interface ScreensaverProps {
    onDismiss: () => void;
    backgroundImage: string;
    logoSrc: string;
    logoAlt?: string;
    pillText?: string;
}
export interface SelectionCardProps {
    title: string;
    icon?: string;
    description?: string;
    selected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children?: ReactNode;
}
export interface TogglePillOption {
    id: string;
    label: string;
}
export interface TogglePillBarProps {
    label?: string;
    labelIcon?: string;
    options: TogglePillOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
}
export interface ScoreCellProps {
    label: string;
    score: number;
    selected?: boolean;
    onClick?: () => void;
    frictionCount?: number;
}
