package com.geologon.cuiz;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;
import com.unity3d.ads.UnityAds;
import com.unity3d.ads.UnityAdsShowOptions;
import com.unity3d.services.banners.BannerErrorInfo;
import com.unity3d.services.banners.BannerView;
import com.unity3d.services.banners.UnityBannerSize;

@CapacitorPlugin(name = "CustomAdMob")
public class CustomAdMobPlugin extends Plugin {
    private static final String TAG = "UnityAdsPlugin";

    public static final String DEFAULT_GAME_ID = "800078728";
    public static final String DEFAULT_BANNER_ID = "Banner_Android";
    public static final String DEFAULT_INTERSTITIAL_ID = "Interstitial_Android";
    public static final String DEFAULT_REWARDED_ID = "Rewarded_Android";
    public static final boolean DEFAULT_TEST_MODE = false;

    private BannerView bannerView;
    private String lastBannerPlacementId = DEFAULT_BANNER_ID;
    private String lastInterstitialPlacementId = DEFAULT_INTERSTITIAL_ID;
    private String lastRewardedPlacementId = DEFAULT_REWARDED_ID;

    private boolean isBannerLoaded = false;
    private boolean isBannerLoading = false;
    private boolean isInterstitialLoaded = false;
    private boolean isInterstitialLoading = false;
    private boolean isRewardedLoaded = false;
    private boolean isRewardedLoading = false;

    private int currentMarginDp = 0;
    private boolean windowInsetsListenerAttached = false;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void initialize(PluginCall call) {
        String gameId = call.getString("gameId", DEFAULT_GAME_ID);
        Boolean testModeObj = call.getBoolean("testMode");
        final boolean testMode = testModeObj != null ? testModeObj : DEFAULT_TEST_MODE;

        getActivity().runOnUiThread(() -> {
            if (UnityAds.isInitialized()) {
                Log.d(TAG, "Unity Ads already initialized");
                call.resolve();
                return;
            }

            Log.d(TAG, "Initializing Unity Ads with Game ID: " + gameId + " (testMode=" + testMode + ")");
            UnityAds.initialize(getContext(), gameId, testMode, new IUnityAdsInitializationListener() {
                @Override
                public void onInitializationComplete() {
                    Log.d(TAG, "Unity Ads initialized successfully!");
                    call.resolve();
                }

                @Override
                public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
                    Log.e(TAG, "Unity Ads initialization failed: [" + error + "] " + message);
                    call.reject("Unity Ads init failed: " + message);
                }
            });
        });
    }

    private int getSystemBottomInset() {
        if (getActivity() == null) return 0;
        androidx.core.view.WindowInsetsCompat insets = 
            androidx.core.view.ViewCompat.getRootWindowInsets(getActivity().getWindow().getDecorView());
        if (insets != null) {
            return insets.getInsets(
                androidx.core.view.WindowInsetsCompat.Type.systemBars() |
                androidx.core.view.WindowInsetsCompat.Type.displayCutout()
            ).bottom;
        }
        return 0;
    }

    private void updateBannerPosition() {
        if (bannerView == null || getActivity() == null) return;
        float density = getActivity().getResources().getDisplayMetrics().density;
        int marginPx = (int) (currentMarginDp * density);
        int bottomInset = getSystemBottomInset();

        ViewGroup.LayoutParams lp = bannerView.getLayoutParams();
        FrameLayout.LayoutParams flp;
        if (lp instanceof FrameLayout.LayoutParams) {
            flp = (FrameLayout.LayoutParams) lp;
        } else {
            flp = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
        }
        flp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        flp.bottomMargin = marginPx + bottomInset;
        bannerView.setLayoutParams(flp);
        bannerView.bringToFront();
    }

    // ---------------------------------------------------------
    // BANNER (Preloading + Visibility + Auto-Positioning)
    // ---------------------------------------------------------
    private void createAndLoadBannerInternal(String placementId, boolean makeVisible, int marginDp) {
        if (getActivity() == null) return;
        currentMarginDp = marginDp;
        lastBannerPlacementId = (placementId != null && !placementId.isEmpty()) ? placementId : DEFAULT_BANNER_ID;

        float density = getActivity().getResources().getDisplayMetrics().density;

        if (bannerView != null) {
            if (makeVisible) {
                bannerView.setVisibility(View.VISIBLE);
                updateBannerPosition();
            }
            if (!isBannerLoaded && !isBannerLoading) {
                isBannerLoading = true;
                bannerView.load();
            }
            return;
        }

        bannerView = new BannerView(getActivity(), lastBannerPlacementId, new UnityBannerSize(320, 50));
        bannerView.setListener(new BannerView.IListener() {
            @Override
            public void onBannerLoaded(BannerView bannerView) {
                Log.d(TAG, "Unity Banner loaded successfully");
                isBannerLoaded = true;
                isBannerLoading = false;
                if (bannerView != null && bannerView.getVisibility() == View.VISIBLE) {
                    updateBannerPosition();
                }
            }

            @Override
            public void onBannerFailedToLoad(BannerView bannerView, BannerErrorInfo bannerErrorInfo) {
                Log.w(TAG, "Unity Banner failed to load: " + (bannerErrorInfo != null ? bannerErrorInfo.errorMessage : "unknown"));
                isBannerLoaded = false;
                isBannerLoading = false;
                // Auto-retry in 8 seconds so a banner is always available
                mainHandler.postDelayed(() -> {
                    if (!isBannerLoaded && !isBannerLoading && bannerView != null) {
                        isBannerLoading = true;
                        bannerView.load();
                    }
                }, 8000);
            }

            @Override
            public void onBannerShown(BannerView bannerView) {
                Log.d(TAG, "Unity Banner shown");
            }

            @Override
            public void onBannerClick(BannerView bannerView) {
                Log.d(TAG, "Unity Banner clicked");
            }

            @Override
            public void onBannerLeftApplication(BannerView bannerView) { }
        });

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.bottomMargin = (int) (currentMarginDp * density) + getSystemBottomInset();

        bannerView.setVisibility(makeVisible ? View.VISIBLE : View.GONE);

        ViewGroup content = (ViewGroup) getActivity().findViewById(android.R.id.content);
        content.addView(bannerView, params);

        if (!windowInsetsListenerAttached) {
            windowInsetsListenerAttached = true;
            androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(
                getActivity().getWindow().getDecorView(),
                (v, windowInsets) -> {
                    androidx.core.view.WindowInsetsCompat ret = androidx.core.view.ViewCompat.onApplyWindowInsets(v, windowInsets);
                    if (bannerView != null) {
                        updateBannerPosition();
                    }
                    return ret;
                }
            );
        }

        isBannerLoading = true;
        bannerView.load();
    }

    @PluginMethod
    public void prepareBanner(PluginCall call) {
        String adId = call.getString("adId", DEFAULT_BANNER_ID);
        Integer marginDpObj = call.getInt("margin");
        final int marginDp = marginDpObj != null ? marginDpObj : 0;

        getActivity().runOnUiThread(() -> {
            createAndLoadBannerInternal(adId, false, marginDp);
            call.resolve();
        });
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        String adId = call.getString("adId", DEFAULT_BANNER_ID);
        Integer marginDpObj = call.getInt("margin");
        final int marginDp = marginDpObj != null ? marginDpObj : 0;

        getActivity().runOnUiThread(() -> {
            createAndLoadBannerInternal(adId, true, marginDp);
            call.resolve();
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (bannerView != null) {
                bannerView.setVisibility(View.GONE);
            }
            call.resolve();
        });
    }

    // ---------------------------------------------------------
    // INTERSTITIAL (Continuous Buffer & Auto-Reload)
    // ---------------------------------------------------------
    private void loadInterstitialInternal(String placementId) {
        if (placementId == null || placementId.isEmpty()) placementId = DEFAULT_INTERSTITIAL_ID;
        if (isInterstitialLoaded || isInterstitialLoading) return;

        lastInterstitialPlacementId = placementId;
        isInterstitialLoading = true;

        final String finalPlacementId = placementId;
        UnityAds.load(finalPlacementId, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String pId) {
                Log.d(TAG, "Unity Interstitial loaded and ready in memory: " + pId);
                isInterstitialLoaded = true;
                isInterstitialLoading = false;
            }

            @Override
            public void onUnityAdsFailedToLoad(String pId, UnityAds.UnityAdsLoadError error, String message) {
                Log.w(TAG, "Unity Interstitial failed to load [" + error + "]: " + message);
                isInterstitialLoaded = false;
                isInterstitialLoading = false;
                // Auto-retry in 8 seconds
                mainHandler.postDelayed(() -> {
                    if (!isInterstitialLoaded && !isInterstitialLoading && lastInterstitialPlacementId != null) {
                        loadInterstitialInternal(lastInterstitialPlacementId);
                    }
                }, 8000);
            }
        });
    }

    @PluginMethod
    public void prepareInterstitial(PluginCall call) {
        String adId = call.getString("adId", DEFAULT_INTERSTITIAL_ID);
        getActivity().runOnUiThread(() -> {
            loadInterstitialInternal(adId);
            call.resolve();
        });
    }

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (isInterstitialLoaded) {
                isInterstitialLoaded = false;
                UnityAds.show(getActivity(), lastInterstitialPlacementId, new UnityAdsShowOptions(), new IUnityAdsShowListener() {
                    @Override
                    public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                        Log.w(TAG, "Unity Interstitial show failed: " + message);
                        loadInterstitialInternal(placementId);
                        call.reject(message);
                    }

                    @Override
                    public void onUnityAdsShowStart(String placementId) {
                        Log.d(TAG, "Unity Interstitial show start: " + placementId);
                    }

                    @Override
                    public void onUnityAdsShowClick(String placementId) { }

                    @Override
                    public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                        Log.d(TAG, "Unity Interstitial show complete: " + placementId + " state: " + state);
                        loadInterstitialInternal(placementId);
                        call.resolve();
                    }
                });
            } else {
                if (lastInterstitialPlacementId != null) {
                    loadInterstitialInternal(lastInterstitialPlacementId);
                }
                call.reject("Interstitial ad wasn't ready yet.");
            }
        });
    }

    // ---------------------------------------------------------
    // REWARDED (Continuous Buffer & Auto-Reload)
    // ---------------------------------------------------------
    private void loadRewardedInternal(String placementId) {
        if (placementId == null || placementId.isEmpty()) placementId = DEFAULT_REWARDED_ID;
        if (isRewardedLoaded || isRewardedLoading) return;

        lastRewardedPlacementId = placementId;
        isRewardedLoading = true;

        final String finalPlacementId = placementId;
        UnityAds.load(finalPlacementId, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String pId) {
                Log.d(TAG, "Unity Rewarded video loaded and ready in memory: " + pId);
                isRewardedLoaded = true;
                isRewardedLoading = false;
            }

            @Override
            public void onUnityAdsFailedToLoad(String pId, UnityAds.UnityAdsLoadError error, String message) {
                Log.w(TAG, "Unity Rewarded video failed to load [" + error + "]: " + message);
                isRewardedLoaded = false;
                isRewardedLoading = false;
                mainHandler.postDelayed(() -> {
                    if (!isRewardedLoaded && !isRewardedLoading && lastRewardedPlacementId != null) {
                        loadRewardedInternal(lastRewardedPlacementId);
                    }
                }, 8000);
            }
        });
    }

    @PluginMethod
    public void prepareRewardVideoAd(PluginCall call) {
        String adId = call.getString("adId", DEFAULT_REWARDED_ID);
        getActivity().runOnUiThread(() -> {
            loadRewardedInternal(adId);
            call.resolve();
        });
    }

    @PluginMethod
    public void showRewardVideoAd(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (isRewardedLoaded) {
                isRewardedLoaded = false;
                UnityAds.show(getActivity(), lastRewardedPlacementId, new UnityAdsShowOptions(), new IUnityAdsShowListener() {
                    @Override
                    public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                        Log.w(TAG, "Unity Rewarded video show failed: " + message);
                        loadRewardedInternal(placementId);
                        call.reject(message);
                    }

                    @Override
                    public void onUnityAdsShowStart(String placementId) {
                        Log.d(TAG, "Unity Rewarded video show start: " + placementId);
                    }

                    @Override
                    public void onUnityAdsShowClick(String placementId) { }

                    @Override
                    public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                        Log.d(TAG, "Unity Rewarded video show complete: " + placementId + " state: " + state);
                        loadRewardedInternal(placementId);

                        JSObject ret = new JSObject();
                        if (state == UnityAds.UnityAdsShowCompletionState.COMPLETED) {
                            ret.put("type", "gems");
                            ret.put("amount", 1);
                        } else {
                            ret.put("type", "skipped");
                            ret.put("amount", 0);
                        }
                        call.resolve(ret);
                    }
                });
            } else {
                if (lastRewardedPlacementId != null) {
                    loadRewardedInternal(lastRewardedPlacementId);
                }
                call.reject("Rewarded ad wasn't ready yet.");
            }
        });
    }
}
