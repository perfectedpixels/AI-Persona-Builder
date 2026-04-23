import { default as React } from 'react';
export interface SelectionCardProps {
    title: string;
    icon?: string;
    description?: string;
    selected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
}
export default function SelectionCard({ title, icon, description, selected, disabled, onClick, children, }: SelectionCardProps): import("react/jsx-runtime").JSX.Element;
export { SelectionCard };
