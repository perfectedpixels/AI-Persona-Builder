export type AIThinkingVariant = 'default' | 'orbit' | 'fade' | 'ripple';
export interface AIThinkingProps {
    variant?: AIThinkingVariant;
    gridCount?: number;
    size?: number;
    gap?: number;
}
export default function AIThinking({ variant, gridCount, size, gap }: AIThinkingProps): import("react/jsx-runtime").JSX.Element;
export { AIThinking };
