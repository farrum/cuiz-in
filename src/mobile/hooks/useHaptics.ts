import { useCallback } from 'react';

type Style = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

async function trigger(style: Style) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) {
      // Web fallback: vibration API
      if (navigator.vibrate) {
        const map: Record<Style, number | number[]> = {
          light: 10, medium: 20, heavy: 35,
          success: [10, 40, 10], warning: [20, 60, 20], error: [40, 80, 40],
        };
        navigator.vibrate(map[style]);
      }
      return;
    }
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    if (style === 'success' || style === 'warning' || style === 'error') {
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      } as const;
      await Haptics.notification({ type: typeMap[style] });
    } else {
      const impactMap = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy } as const;
      await Haptics.impact({ style: impactMap[style] });
    }
  } catch { /* noop */ }
}

export function useHaptics() {
  return useCallback((style: Style = 'light') => { void trigger(style); }, []);
}