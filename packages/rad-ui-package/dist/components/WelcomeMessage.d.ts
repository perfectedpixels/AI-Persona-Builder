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
export default function WelcomeMessage({ text, show, onClick, onMouseEnter, onMouseLeave, typeSpeed, dotDelay, typeStartDelay, }: WelcomeMessageProps): import("react/jsx-runtime").JSX.Element | null;
export { WelcomeMessage };
