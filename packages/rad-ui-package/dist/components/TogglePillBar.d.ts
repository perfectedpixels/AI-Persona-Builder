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
export default function TogglePillBar({ label, labelIcon, options, selected, onChange, }: TogglePillBarProps): import("react/jsx-runtime").JSX.Element;
export { TogglePillBar };
