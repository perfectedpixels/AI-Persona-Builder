export interface ScoreCellProps {
    label: string;
    score: number;
    selected?: boolean;
    onClick?: () => void;
    frictionCount?: number;
}
export default function ScoreCell({ label, score, selected, onClick, frictionCount, }: ScoreCellProps): import("react/jsx-runtime").JSX.Element;
export { ScoreCell };
