export interface ThinkingReasoningProps {
    steps?: string[];
    prefix?: string;
    stepDuration?: number;
    initiallyComplete?: boolean;
    centered?: boolean;
    onComplete?: () => void;
}
export default function ThinkingReasoning({ steps, prefix: _prefix, stepDuration, initiallyComplete, centered, onComplete, }: ThinkingReasoningProps): import("react/jsx-runtime").JSX.Element | null;
export { ThinkingReasoning };
