import { default as React } from 'react';
export interface ScreensaverProps {
    onDismiss: () => void;
    backgroundImage: string;
    logoSrc: string;
    logoAlt?: string;
    pillText?: string;
}
export default function Screensaver({ onDismiss, backgroundImage, logoSrc, logoAlt, pillText, }: ScreensaverProps): React.ReactPortal | null;
export { Screensaver };
