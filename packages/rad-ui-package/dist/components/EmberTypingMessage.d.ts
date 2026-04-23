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
export default function EmberTypingMessage({ text, show, typeSpeed, dotDelay, typeStartDelay, showCheck, onComplete, onClick, }: EmberTypingMessageProps): import("react/jsx-runtime").JSX.Element | null;
export { EmberTypingMessage };
