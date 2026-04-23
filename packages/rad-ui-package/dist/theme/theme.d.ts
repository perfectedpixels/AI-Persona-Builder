import { CloudscapeTheme } from '../types/types';
export declare const radTheme: CloudscapeTheme;
/**
 * Apply the RAD Cloudscape theme. If no theme is provided, uses the
 * built-in `radTheme`. Pass a custom theme to override entirely.
 */
export declare function applyRadTheme(options?: {
    theme?: CloudscapeTheme;
}): void;
