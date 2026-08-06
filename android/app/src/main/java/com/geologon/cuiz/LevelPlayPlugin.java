package com.geologon.cuiz;

import android.app.Activity;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.unity3d.mediation.LevelPlay;
import com.unity3d.mediation.LevelPlayAdError;
import com.unity3d.mediation.LevelPlayAdInfo;
import com.unity3d.mediation.LevelPlayAdSize;
import com.unity3d.mediation.LevelPlayInitError;
import com.unity3d.mediation.LevelPlayInitListener;
import com.unity3d.mediation.LevelPlayInitRequest;
import com.unity3d.mediation.LevelPlayConfiguration;
import com.unity3d.mediation.banner.LevelPlayBannerAdView;
import com.unity3d.mediation.banner.LevelPlayBannerAdViewListener;
import com.unity3d.mediation.interstitial.LevelPlayInterstitialAd;
import com.unity3d.mediation.interstitial.LevelPlayInterstitialAdListener;
import com.unity3d.mediation.rewarded.LevelPlayReward;
import com.unity3d.mediation.rewarded.LevelPlayRewardedAd;
import com.unity3d.mediation.rewarded.LevelPlayRewardedAdListener;

import java.util.Arrays;

/**
 * Thin Capacitor bridge over the Unity LevelPlay (ironSource) mediation SDK.
 *
 * Placements: Banner_Android / Interstitial_Android / Rewarded_Android.
 * All calls are safe to invoke before init completes — they queue behind it.
 */
@CapacitorPlugin(name = "LevelPlay")
public class LevelPlayPlugin extends Plugin {

    private boolean initialized = false;
    private FrameLayout bannerContainer;
    private LevelPlayBannerAdView bannerAd;
    private LevelPlayInterstitialAd interstitialAd;
    private LevelPlayRewardedAd rewardedAd;

    // Pending calls resolved from SDK callbacks.
    private PluginCall pendingInterstitialCall;
    private PluginCall pendingRewardedCall;
    private boolean rewardGranted = false;

    @PluginMethod
    public void initialize(final PluginCall call) {
        if (initialized) {
            JSObject res = new JSObject();
            res.put("initialized", true);
            call.resolve(res);
            return;
        }
        final String appKey = call.getString("appKey", "");
        final Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            LevelPlayInitRequest request = new LevelPlayInitRequest.Builder(appKey)
                    .withLegacyAdFormats(Arrays.asList(
                            LevelPlay.AdFormat.BANNER,
                            LevelPlay.AdFormat.INTERSTITIAL,
                            LevelPlay.AdFormat.REWARDED))
                    .build();

            LevelPlay.init(activity, request, new LevelPlayInitListener() {
                @Override
                public void onInitSuccess(LevelPlayConfiguration configuration) {
                    initialized = true;
                    setupInterstitial();
                    setupRewarded();
                    JSObject res = new JSObject();
                    res.put("initialized", true);
                    call.resolve(res);
                }

                @Override
                public void onInitFailed(LevelPlayInitError error) {
                    JSObject res = new JSObject();
                    res.put("initialized", false);
                    res.put("error", error != null ? error.getErrorMessage() : "unknown");
                    call.resolve(res);
                }
            });
        });
    }

    // ---------------- Banner ----------------

    @PluginMethod
    public void showBanner(final PluginCall call) {
        final String placement = call.getString("placement", "Banner_Android");
        final Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            try {
                if (bannerContainer == null) {
                    bannerContainer = new FrameLayout(activity);
                    FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT);
                    params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
                    // Sit above the in-app bottom tab bar.
                    params.bottomMargin = (int) (56 * activity.getResources().getDisplayMetrics().density);
                    activity.addContentView(bannerContainer, params);
                }
                if (bannerAd == null) {
                    bannerAd = new LevelPlayBannerAdView(activity, placement);
                    bannerAd.setAdSize(LevelPlayAdSize.BANNER);
                    bannerAd.setBannerListener(new LevelPlayBannerAdViewListener() {
                        @Override
                        public void onAdLoaded(LevelPlayAdInfo adInfo) {
                            notifyListeners("adLoaded", infoOf("banner"));
                        }

                        @Override
                        public void onAdLoadFailed(LevelPlayAdError error) {
                            notifyListeners("adFailed", errorOf("banner", error));
                        }
                    });
                    bannerContainer.addView(bannerAd);
                }
                bannerContainer.setVisibility(android.view.View.VISIBLE);
                bannerAd.loadAd();
                call.resolve();
            } catch (Exception e) {
                call.reject("banner_failed", e);
            }
        });
    }

    @PluginMethod
    public void hideBanner(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (bannerContainer != null) {
                bannerContainer.setVisibility(android.view.View.GONE);
            }
            call.resolve();
        });
    }

    // ---------------- Interstitial ----------------

    private void setupInterstitial() {
        if (interstitialAd != null) return;
        interstitialAd = new LevelPlayInterstitialAd("Interstitial_Android");
        interstitialAd.setListener(new LevelPlayInterstitialAdListener() {
            @Override
            public void onAdLoaded(LevelPlayAdInfo adInfo) {
                notifyListeners("adLoaded", infoOf("interstitial"));
            }

            @Override
            public void onAdLoadFailed(LevelPlayAdError error) {
                notifyListeners("adFailed", errorOf("interstitial", error));
                resolveInterstitial(false);
            }

            @Override
            public void onAdDisplayFailed(LevelPlayAdError error, LevelPlayAdInfo adInfo) {
                resolveInterstitial(false);
            }

            @Override
            public void onAdDisplayed(LevelPlayAdInfo adInfo) {
                // no-op
            }

            @Override
            public void onAdClosed(LevelPlayAdInfo adInfo) {
                resolveInterstitial(true);
            }
        });
        interstitialAd.loadAd();
    }

    private synchronized void resolveInterstitial(boolean shown) {
        if (pendingInterstitialCall == null) return;
        JSObject res = new JSObject();
        res.put("shown", shown);
        pendingInterstitialCall.resolve(res);
        pendingInterstitialCall = null;
    }

    @PluginMethod
    public void loadInterstitial(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            setupInterstitial();
            if (interstitialAd != null && !interstitialAd.isAdReady()) {
                interstitialAd.loadAd();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void showInterstitial(final PluginCall call) {
        final Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            setupInterstitial();
            if (interstitialAd == null || !interstitialAd.isAdReady()) {
                if (interstitialAd != null) interstitialAd.loadAd();
                JSObject res = new JSObject();
                res.put("shown", false);
                call.resolve(res);
                return;
            }
            pendingInterstitialCall = call;
            call.setKeepAlive(true);
            interstitialAd.showAd(activity);
        });
    }

    // ---------------- Rewarded ----------------

    private void setupRewarded() {
        if (rewardedAd != null) return;
        rewardedAd = new LevelPlayRewardedAd("Rewarded_Android");
        rewardedAd.setListener(new LevelPlayRewardedAdListener() {
            @Override
            public void onAdLoaded(LevelPlayAdInfo adInfo) {
                notifyListeners("adLoaded", infoOf("rewarded"));
            }

            @Override
            public void onAdLoadFailed(LevelPlayAdError error) {
                notifyListeners("adFailed", errorOf("rewarded", error));
                resolveRewarded(false);
            }

            @Override
            public void onAdDisplayFailed(LevelPlayAdError error, LevelPlayAdInfo adInfo) {
                resolveRewarded(false);
            }

            @Override
            public void onAdDisplayed(LevelPlayAdInfo adInfo) {
                // no-op
            }

            @Override
            public void onAdRewarded(LevelPlayReward reward, LevelPlayAdInfo adInfo) {
                rewardGranted = true;
                notifyListeners("rewarded", infoOf("rewarded"));
            }

            @Override
            public void onAdClosed(LevelPlayAdInfo adInfo) {
                resolveRewarded(true);
            }
        });
        rewardedAd.loadAd();
    }

    private synchronized void resolveRewarded(boolean shown) {
        if (pendingRewardedCall == null) return;
        JSObject res = new JSObject();
        res.put("shown", shown);
        res.put("rewarded", rewardGranted);
        pendingRewardedCall.resolve(res);
        pendingRewardedCall = null;
        rewardGranted = false;
    }

    @PluginMethod
    public void loadRewarded(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            setupRewarded();
            if (rewardedAd != null && !rewardedAd.isAdReady()) {
                rewardedAd.loadAd();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void showRewarded(final PluginCall call) {
        final Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            setupRewarded();
            if (rewardedAd == null || !rewardedAd.isAdReady()) {
                if (rewardedAd != null) rewardedAd.loadAd();
                JSObject res = new JSObject();
                res.put("shown", false);
                res.put("rewarded", false);
                call.resolve(res);
                return;
            }
            rewardGranted = false;
            pendingRewardedCall = call;
            call.setKeepAlive(true);
            rewardedAd.showAd(activity);
        });
    }

    // ---------------- Consent ----------------

    @PluginMethod
    public void setConsent(final PluginCall call) {
        boolean consent = Boolean.TRUE.equals(call.getBoolean("consent", true));
        boolean doNotSell = Boolean.TRUE.equals(call.getBoolean("doNotSell", false));
        boolean childDirected = Boolean.TRUE.equals(call.getBoolean("childDirected", false));
        try {
            LevelPlay.setConsent(consent);
            LevelPlay.setMetaData("do_not_sell", doNotSell ? "true" : "false");
            LevelPlay.setMetaData("is_child_directed", childDirected ? "true" : "false");
        } catch (Exception ignored) {
        }
        call.resolve();
    }

    private JSObject infoOf(String format) {
        JSObject o = new JSObject();
        o.put("format", format);
        return o;
    }

    private JSObject errorOf(String format, LevelPlayAdError error) {
        JSObject o = infoOf(format);
        o.put("error", error != null ? error.getErrorMessage() : "unknown");
        return o;
    }
}