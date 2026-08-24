/**
 * Layout spacer for the native banner. The banner itself is owned by
 * <BannerHost/> (mounted once in AppMobile) and overlaid by the SDK outside
 * the WebView — this component must never start or stop the ad, otherwise
 * every navigation tears the banner down and re-requests it (visible flicker).
 */
interface NativeBannerAdProps {
  noMargin?: boolean;
}

export function NativeBannerAd({ noMargin = false }: NativeBannerAdProps) {
  return <div aria-hidden className="h-[var(--banner-h)] shrink-0" />;
}

export default NativeBannerAd;
