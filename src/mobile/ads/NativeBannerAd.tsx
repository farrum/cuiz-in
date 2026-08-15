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
  // Height only — no bottom margin, the banner must sit flush on the chrome.
  void noMargin;
  return <div aria-hidden className="h-[50px] shrink-0" />;
}

export default NativeBannerAd;
