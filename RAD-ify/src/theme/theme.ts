import { applyTheme } from '@cloudscape-design/components/theming';
import type { CloudscapeTheme } from '../types/types';

export const radTheme: CloudscapeTheme = {
  tokens: {
    colorBackgroundLayoutMain: {
      light: '#ffffff',
      dark: '#191D23',
    },
    colorBackgroundItemSelected: {
      light: '#ffffff',
      dark: '#2a2f38',
    },
    colorBorderItemSelected: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorTextAccent: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBackgroundSegmentActive: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBackgroundControlChecked: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBorderItemFocused: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBorderInputFocused: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBackgroundButtonPrimaryDefault: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorTextLinkDefault: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBackgroundButtonPrimaryHover: {
      light: '#222d3c',
      dark: '#e0e0e0',
    },
    colorBackgroundButtonPrimaryActive: {
      light: 'black',
      dark: '#fafafa',
    },
    colorBorderButtonNormalDefault: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBackgroundButtonNormalDefault: {
      light: '#ffffff',
      dark: '#191D23',
    },
    colorBackgroundButtonNormalHover: {
      light: '#F3EFE5',
      dark: '#2a2f38',
    },
    colorBackgroundButtonNormalActive: {
      light: '#EBE9E5',
      dark: '#333840',
    },
    colorTextButtonNormalHover: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorTextButtonNormalActive: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBorderButtonNormalHover: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBorderButtonNormalActive: {
      light: '#F26322',
      dark: '#F26322',
    },
    colorTextButtonPrimaryDefault: {
      light: '#ffffff',
      dark: '#191D23',
    },
    colorTextButtonPrimaryActive: {
      light: '#ffffff',
      dark: '#191D23',
    },
    colorTextButtonPrimaryHover: {
      light: '#ffffff',
      dark: '#191D23',
    },
    colorTextButtonNormalDefault: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBackgroundNotificationGreen: {
      light: '#4C8963',
      dark: '#4C8963',
    },
    colorBorderStatusSuccess: {
      light: '#4C8963',
      dark: '#4C8963',
    },
    colorBackgroundStatusSuccess: {
      light: '#4C8963',
      dark: '#4C8963',
    },
    colorBackgroundNotificationSeverityNeutral: {
      light: '#F3EFE5',
      dark: '#2a2f38',
    },
    colorTextNotificationSeverityNeutral: {
      light: 'black',
      dark: 'white',
    },
    colorBackgroundContainerContent: {
      light: '#FAF9F7',
      dark: '#191D23',
    },
    colorBackgroundContainerHeader: {
      light: '#FAF9F7',
      dark: '#191D23',
    },
    colorBorderDividerDefault: {
      light: '#EBE9E5',
      dark: '#262A30',
    },
    colorBackgroundToggleButtonNormalPressed: {
      light: '#F3EFE5',
      dark: '#2a2f38',
    },
    colorTextToggleButtonNormalPressed: {
      light: '#191D23',
      dark: '#ffffff',
    },
    colorBorderToggleButtonNormalPressed: {
      light: '#F26322',
      dark: '#F26322',
    },
    colorBackgroundChatBubbleIncoming: {
      light: '#FFFFFF',
      dark: '#000000',
    },
  },
};

/**
 * Apply the RAD Cloudscape theme. If no theme is provided, uses the
 * built-in `radTheme`. Pass a custom theme to override entirely.
 */
export function applyRadTheme(options?: { theme?: CloudscapeTheme }): void {
  const themeToApply = options?.theme ?? radTheme;
  applyTheme({ theme: themeToApply as any });
}
