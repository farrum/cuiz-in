import { useCallback } from 'react';
async function trigger(style) {
    try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) {
            // Web fallback: vibration API
            if (navigator.vibrate) {
                const map = {
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
            };
            await Haptics.notification({ type: typeMap[style] });
        }
        else {
            const impactMap = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
            await Haptics.impact({ style: impactMap[style] });
        }
    }
    catch { /* noop */ }
}
export function useHaptics() {
    return useCallback((style = 'light') => { void trigger(style); }, []);
}
