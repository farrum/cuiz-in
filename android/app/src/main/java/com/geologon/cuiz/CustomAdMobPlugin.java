package com.geologon.cuiz;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

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
    private boolean bannerWanted = false;

    private boolean isInterstitialLoaded = false;
    private boolean isInterstitialLoading = false;

    private boolean isRewardedLoaded = false;
    private boolean isRewardedLoading = false;

    private boolean isInitializing = false;
    private int currentMarginDp = 0;

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

            if (isInitializing) {
                Log.d(TAG, "Unity Ads initialization already in progress");
                call.resolve();
                return;
            }

            isInitializing = true;
            Log.i(TAG, "Initializing Unity Ads with Game ID: " + gameId + " (testMode=" + testMode + ")");

            Context appContext = getActivity() != null ? getActivity().getApplicationContext() : getContext();
            UnityAds.initialize(appContext, gameId, testMode, new IUnityAdsInitializationListener() {
                @Override
                public void onInitializationComplete() {
                    Log.i(TAG, "Unity Ads initialized successfully!");
                    isInitializing = false;

                    // Trigger any pending preloads
                    if (bannerWanted && bannerView == null) {
                        createAndLoadBannerInternal(lastBannerPlacementId);
                    }
                    if (lastInterstitialPlacementId != null && !isInterstitialLoaded && !isInterstitialLoading) {
                        loadInterstitialInternal(lastInterstitialPlacementId);
                    }
                    if (lastRewardedPlacementId != null && !isRewardedLoaded && !isRewardedLoading) {
                        loadRewardedInternal(lastRewardedPlacementId);
                    }

                    call.resolve();
                }

                @Override
                public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
                    Log.e(TAG, "Unity Ads initialization failed: [" + error + "] " + message);
                    isInitializing = false;
                    call.reject("Unity Ads init failed: " + message);
                }
            });
        });
    }

    // ---------------------------------------------------------
    // BANNER (Flicker-Free, Isolated Layout, Safe Positioning)
    // ---------------------------------------------------------
    private void updateBannerPosition() {
        if (bannerView == null || getActivity() == null) return;
        float density = getActivity().getResources().getDisplayMetrics().density;
        int widthPx = (int) (320 * density);
        int heightPx = (int) (50 * density);
        int marginPx = (int) (currentMarginDp * density);

        ViewGroup.LayoutParams lp = bannerView.getLayoutParams();
        if (lp instanceof FrameLayout.LayoutParams) {
            FrameLayout.LayoutParams flp = (FrameLayout.LayoutParams) lp;
            if (flp.bottomMargin == marginPx && flp.width == widthPx && flp.height == heightPx) {
                // Already in correct position and size; don't trigger layout pass
                return;
            }
            flp.width = widthPx;
            flp.height = heightPx;
            flp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
            flp.bottomMargin = marginPx;
            bannerView.setLayoutParams(flp);
        } else {
            FrameLayout.LayoutParams flp = new FrameLayout.LayoutParams(widthPx, heightPx);
            flp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
            flp.bottomMargin = marginPx;
            bannerView.setLayoutParams(flp);
        }
    }

    private void createAndLoadBannerInternal(String placementId) {
        if (getActivity() == null) return;
        lastBannerPlacementId = (placementId != null && !placementId.isEmpty()) ? placementId : DEFAULT_BANNER_ID;

        if (bannerView != null) {
            updateBannerPosition();
            if (bannerWanted && isBannerLoaded) {
                bannerView.setVisibility(View.VISIBLE);
            }
            if (!isBannerLoaded && !isBannerLoading && UnityAds.isInitialized()) {
                isBannerLoading = true;
                bannerView.load();
            }
            return;
        }

        float density = getActivity().getResources().getDisplayMetrics().density;
        int widthPx = (int) (320 * density);
        int heightPx = (int) (50 * density);
        int marginPx = (int) (currentMarginDp * density);

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(widthPx, heightPx);
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.bottomMargin = marginPx;

        bannerView = new BannerView(getActivity(), lastBannerPlacementId, new UnityBannerSize(320, 50));
        bannerView.setListener(new BannerView.IListener() {
            @Override
            public void onBannerLoaded(BannerView bv) {
                Log.i(TAG, "Unity Banner loaded successfully");
                isBannerLoaded = true;
                isBannerLoading = false;
                if (bannerWanted) {
                    bv.setVisibility(View.VISIBLE);
                    updateBannerPosition();
                }
            }

            @Override
            public void onBannerFailedToLoad(BannerView bv, BannerErrorInfo bannerErrorInfo) {
                Log.w(TAG, "Unity Banner failed to load: " + (bannerErrorInfo != null ? bannerErrorInfo.errorMessage : "unknown"));
                isBannerLoaded = false;
                isBannerLoading = false;
                bv.setVisibility(View.GONE);
            }

            @Override
            public void onBannerShown(BannerView bv) {
                Log.d(TAG, "Unity Banner displayed");
            }

            @Override
            public void onBannerClick(BannerView bv) {
                Log.d(TAG, "Unity Banner clicked");
            }

            @Override
            public void onBannerLeftApplication(BannerView bv) { }
        });

        // Always keep initially GONE to eliminate layout jumping/flickering
        bannerView.setVisibility(View.GONE);

        ViewGroup content = (ViewGroup) getActivity().findViewById(android.R.id.content);
        if (content != null) {
            content.addView(bannerView, params);
        }

        if (UnityAds.isInitialized()) {
            isBannerLoading = true;
            bannerView.load();
        }
    }

    @PluginMethod
    public void prepareBanner(PluginCall call) {
        String adId = call.getString("adId", DEFAULT_BANNER_ID);
        Integer marginDpObj = call.getInt("margin");
        final int marginDp = marginDpObj != null ? marginDpObj : 0;
        currentMarginDp = marginDp;

        getActivity().runOnUiThread(() -> {
            createAndLoadBannerInternal(adId);
            call.resolve();
        });
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        String adId = call.getString("adId", DEFAULT_BANNER_ID);
        Integer marginDpObj = call.getInt("margin");
        final int marginDp = marginDpObj != null ? marginDpObj : 0;
        currentMarginDp = marginDp;
        bannerWanted = true;

        getActivity().runOnUiThread(() -> {
            if (bannerView == null) {
                createAndLoadBannerInternal(adId);
            } else {
                updateBannerPosition();
                if (isBannerLoaded) {
                    bannerView.setVisibility(View.VISIBLE);
                } else if (!isBannerLoading && UnityAds.isInitialized()) {
                    isBannerLoading = true;
                    bannerView.load();
                }
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        bannerWanted = false;
        getActivity().runOnUiThread(() -> {
            if (bannerView != null) {
                bannerView.setVisibility(View.GONE);
            }
            call.resolve();
        });
    }

    // ---------------------------------------------------------
    // INTERSTITIAL (Buffered & Auto-Reload)
    // ---------------------------------------------------------
    private void loadInterstitialInternal(String placementId) {
        if (placementId == null || placementId.isEmpty()) placementId = DEFAULT_INTERSTITIAL_ID;
        if (!UnityAds.isInitialized()) {
            lastInterstitialPlacementId = placementId;
            return;
        }
        if (isInterstitialLoaded || isInterstitialLoading) return;

        lastInterstitialPlacementId = placementId;
        isInterstitialLoading = true;

        final String finalPlacementId = placementId;
        Log.d(TAG, "Loading Unity Interstitial for placement: " + finalPlacementId);
        UnityAds.load(finalPlacementId, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String pId) {
                Log.i(TAG, "Unity Interstitial loaded and ready: " + pId);
                isInterstitialLoaded = true;
                isInterstitialLoading = false;
            }

            @Override
            public void onUnityAdsFailedToLoad(String pId, UnityAds.UnityAdsLoadError error, String message) {
                Log.w(TAG, "Unity Interstitial failed to load [" + error + "]: " + message);
                isInterstitialLoaded = false;
                isInterstitialLoading = false;
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
    // REWARDED (Buffered & Auto-Reload)
    // ---------------------------------------------------------
    private void loadRewardedInternal(String placementId) {
        if (placementId == null || placementId.isEmpty()) placementId = DEFAULT_REWARDED_ID;
        if (!UnityAds.isInitialized()) {
            lastRewardedPlacementId = placementId;
            return;
        }
        if (isRewardedLoaded || isRewardedLoading) return;

        lastRewardedPlacementId = placementId;
        isRewardedLoading = true;

        final String finalPlacementId = placementId;
        Log.d(TAG, "Loading Unity Rewarded video for placement: " + finalPlacementId);
        UnityAds.load(finalPlacementId, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String pId) {
                Log.i(TAG, "Unity Rewarded video loaded and ready: " + pId);
                isRewardedLoaded = true;
                isRewardedLoading = false;
            }

            @Override
            public void onUnityAdsFailedToLoad(String pId, UnityAds.UnityAdsLoadError error, String message) {
                Log.w(TAG, "Unity Rewarded video failed to load [" + error + "]: " + message);
                isRewardedLoaded = false;
                isRewardedLoading = false;
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
