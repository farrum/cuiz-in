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

// IronSource / LevelPlay Mediation SDK
import com.ironsource.mediationsdk.IronSource;
import com.ironsource.mediationsdk.ISBannerSize;
import com.ironsource.mediationsdk.IronSourceBannerLayout;
import com.ironsource.mediationsdk.logger.IronSourceError;
import com.ironsource.mediationsdk.model.Placement;
import com.ironsource.mediationsdk.adunit.adapter.utility.AdInfo;
import com.ironsource.mediationsdk.sdk.LevelPlayBannerListener;
import com.ironsource.mediationsdk.sdk.LevelPlayInterstitialListener;
import com.ironsource.mediationsdk.sdk.LevelPlayRewardedVideoListener;

// Standalone Unity Ads SDK (Secondary / Direct Fallback)
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
    private static final String TAG = "CuizAdMediation";

    // Primary: LevelPlay Configuration
    public static final String DEFAULT_LEVELPLAY_APP_KEY = "268f29025";
    public static final String DEFAULT_LP_BANNER_ID = "nfbd7er5vhgheohp";
    public static final String DEFAULT_LP_INTERSTITIAL_ID = "5kn5xibxgrngcju9g";
    public static final String DEFAULT_LP_REWARDED_ID = "l396uc79p1ajnsmt";

    // Secondary: Unity Ads Direct Configuration
    public static final String DEFAULT_UNITY_GAME_ID = "800078728";
    public static final String DEFAULT_UNITY_BANNER_ID = "Banner_Android";
    public static final String DEFAULT_UNITY_INTERSTITIAL_ID = "Interstitial_Android";
    public static final String DEFAULT_UNITY_REWARDED_ID = "Rewarded_Android";

    // Banner container & views
    private FrameLayout bannerContainer;
    private IronSourceBannerLayout levelPlayBanner;
    private BannerView unityBannerView;

    private boolean isLpBannerLoaded = false;
    private boolean isUnityBannerLoaded = false;
    private boolean isBannerLoading = false;
    private boolean bannerWanted = false;

    // Interstitial state
    private boolean isLpInterstitialReady = false;
    private boolean isUnityInterstitialLoaded = false;
    private boolean isInterstitialLoading = false;
    private PluginCall pendingInterstitialCall = null;

    // Rewarded state
    private boolean isLpRewardedAvailable = false;
    private boolean isUnityRewardedLoaded = false;
    private boolean isRewardedLoading = false;
    private PluginCall pendingRewardedCall = null;

    // Initialization state
    private boolean isLevelPlayInit = false;
    private boolean isUnityInit = false;
    private int currentMarginDp = 0;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void initialize(PluginCall call) {
        String lpKey = call.getString("levelPlayAppKey", DEFAULT_LEVELPLAY_APP_KEY);
        String gameId = call.getString("gameId", DEFAULT_UNITY_GAME_ID);
        Boolean testModeObj = call.getBoolean("testMode");
        final boolean testMode = testModeObj != null ? testModeObj : false;

        getActivity().runOnUiThread(() -> {
            // 1. Initialize LevelPlay (Primary)
            if (!isLevelPlayInit) {
                try {
                    Log.i(TAG, "Initializing LevelPlay with App Key: " + lpKey);
                    setupLevelPlayListeners();
                    IronSource.init(getActivity(), lpKey, 
                        IronSource.AD_UNIT.REWARDED_VIDEO, 
                        IronSource.AD_UNIT.INTERSTITIAL, 
                        IronSource.AD_UNIT.BANNER
                    );
                    isLevelPlayInit = true;
                    Log.i(TAG, "LevelPlay init invoked successfully");
                } catch (Exception e) {
                    Log.e(TAG, "LevelPlay init exception:", e);
                }
            }

            // 2. Initialize Unity Ads Standalone (Secondary / Direct Fallback)
            if (!UnityAds.isInitialized()) {
                Context appContext = getActivity() != null ? getActivity().getApplicationContext() : getContext();
                UnityAds.initialize(appContext, gameId, testMode, new IUnityAdsInitializationListener() {
                    @Override
                    public void onInitializationComplete() {
                        Log.i(TAG, "Unity Ads standalone initialized successfully");
                        isUnityInit = true;
                        if (!isUnityInterstitialLoaded) {
                            loadUnityInterstitialInternal();
                        }
                        if (!isUnityRewardedLoaded) {
                            loadUnityRewardedInternal();
                        }
                    }

                    @Override
                    public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
                        Log.w(TAG, "Unity Ads standalone init failed: " + message);
                    }
                });
            } else {
                isUnityInit = true;
            }

            // Pre-load initial ads
            loadLevelPlayInterstitialInternal();
            call.resolve();
        });
    }

    // ---------------------------------------------------------
    // LEVELPLAY EVENT LISTENERS
    // ---------------------------------------------------------
    private void setupLevelPlayListeners() {
        // Interstitial Listener
        IronSource.setLevelPlayInterstitialListener(new LevelPlayInterstitialListener() {
            @Override
            public void onAdReady(AdInfo adInfo) {
                Log.i(TAG, "LevelPlay Interstitial ready: " + (adInfo != null ? adInfo.getAdNetwork() : ""));
                isLpInterstitialReady = true;
                isInterstitialLoading = false;
            }

            @Override
            public void onAdLoadFailed(IronSourceError error) {
                Log.w(TAG, "LevelPlay Interstitial load failed: " + error);
                isLpInterstitialReady = false;
                isInterstitialLoading = false;
                // Preload Unity Ads fallback
                loadUnityInterstitialInternal();
            }

            @Override
            public void onAdOpened(AdInfo adInfo) {
                Log.d(TAG, "LevelPlay Interstitial opened");
            }

            @Override
            public void onAdClosed(AdInfo adInfo) {
                Log.d(TAG, "LevelPlay Interstitial closed");
                isLpInterstitialReady = false;
                if (pendingInterstitialCall != null) {
                    pendingInterstitialCall.resolve();
                    pendingInterstitialCall = null;
                }
                // Preload next interstitial
                loadLevelPlayInterstitialInternal();
            }

            @Override
            public void onAdShowFailed(IronSourceError error, AdInfo adInfo) {
                Log.w(TAG, "LevelPlay Interstitial show failed: " + error);
                if (pendingInterstitialCall != null) {
                    // Fallback to Unity Ads if available
                    showUnityInterstitialFallback(pendingInterstitialCall);
                    pendingInterstitialCall = null;
                }
                loadLevelPlayInterstitialInternal();
            }

            @Override
            public void onAdClicked(AdInfo adInfo) { }

            @Override
            public void onAdShowSucceeded(AdInfo adInfo) { }
        });

        // Rewarded Video Listener
        IronSource.setLevelPlayRewardedVideoListener(new LevelPlayRewardedVideoListener() {
            @Override
            public void onAdAvailable(AdInfo adInfo) {
                Log.i(TAG, "LevelPlay Rewarded available: " + (adInfo != null ? adInfo.getAdNetwork() : ""));
                isLpRewardedAvailable = true;
                isRewardedLoading = false;
            }

            @Override
            public void onAdUnavailable() {
                isLpRewardedAvailable = false;
                isRewardedLoading = false;
                loadUnityRewardedInternal();
            }

            @Override
            public void onAdOpened(AdInfo adInfo) {
                Log.d(TAG, "LevelPlay Rewarded opened");
            }

            @Override
            public void onAdClosed(AdInfo adInfo) {
                Log.d(TAG, "LevelPlay Rewarded closed");
                isLpRewardedAvailable = false;
                if (pendingRewardedCall != null) {
                    JSObject ret = new JSObject();
                    ret.put("type", "closed");
                    ret.put("amount", 0);
                    pendingRewardedCall.resolve(ret);
                    pendingRewardedCall = null;
                }
            }

            @Override
            public void onAdRewarded(Placement placement, AdInfo adInfo) {
                Log.i(TAG, "LevelPlay Rewarded completed reward: " + (placement != null ? placement.getRewardName() : ""));
                if (pendingRewardedCall != null) {
                    JSObject ret = new JSObject();
                    ret.put("type", "gems");
                    ret.put("amount", 1);
                    pendingRewardedCall.resolve(ret);
                    pendingRewardedCall = null;
                }
            }

            @Override
            public void onAdShowFailed(IronSourceError error, AdInfo adInfo) {
                Log.w(TAG, "LevelPlay Rewarded show failed: " + error);
                if (pendingRewardedCall != null) {
                    showUnityRewardedFallback(pendingRewardedCall);
                    pendingRewardedCall = null;
                }
            }

            @Override
            public void onAdClicked(Placement placement, AdInfo adInfo) { }
        });
    }

    // ---------------------------------------------------------
    // BANNER (LevelPlay Primary + Unity Ads Secondary)
    // ---------------------------------------------------------
    private void ensureBannerContainer() {
        if (bannerContainer != null || getActivity() == null) return;

        float density = getActivity().getResources().getDisplayMetrics().density;
        int widthPx = (int) (320 * density);
        int heightPx = (int) (50 * density);
        int marginPx = (int) (currentMarginDp * density);

        bannerContainer = new FrameLayout(getActivity());
        bannerContainer.setVisibility(View.GONE);

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(widthPx, heightPx);
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.bottomMargin = marginPx;

        ViewGroup content = (ViewGroup) getActivity().findViewById(android.R.id.content);
        if (content != null) {
            content.addView(bannerContainer, params);
        }
    }

    private void updateBannerPosition() {
        if (bannerContainer == null || getActivity() == null) return;
        float density = getActivity().getResources().getDisplayMetrics().density;
        int widthPx = (int) (320 * density);
        int heightPx = (int) (50 * density);
        int marginPx = (int) (currentMarginDp * density);

        ViewGroup.LayoutParams lp = bannerContainer.getLayoutParams();
        if (lp instanceof FrameLayout.LayoutParams) {
            FrameLayout.LayoutParams flp = (FrameLayout.LayoutParams) lp;
            if (flp.bottomMargin == marginPx && flp.width == widthPx && flp.height == heightPx) {
                return; // Already up to date; avoid layout trigger
            }
            flp.width = widthPx;
            flp.height = heightPx;
            flp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
            flp.bottomMargin = marginPx;
            bannerContainer.setLayoutParams(flp);
        }
    }

    private void createAndLoadBannerInternal() {
        if (getActivity() == null) return;
        ensureBannerContainer();
        updateBannerPosition();

        if (isLpBannerLoaded && levelPlayBanner != null) {
            if (bannerWanted) bannerContainer.setVisibility(View.VISIBLE);
            return;
        }

        if (isBannerLoading) return;
        isBannerLoading = true;

        Log.d(TAG, "Requesting LevelPlay Banner...");
        try {
            if (levelPlayBanner != null) {
                IronSource.destroyBanner(levelPlayBanner);
                bannerContainer.removeView(levelPlayBanner);
                levelPlayBanner = null;
            }

            levelPlayBanner = IronSource.createBanner(getActivity(), ISBannerSize.BANNER);
            if (levelPlayBanner == null) {
                Log.w(TAG, "IronSource.createBanner returned null, falling back to Unity Banner");
                loadUnityBannerFallback();
                return;
            }

            levelPlayBanner.setLevelPlayBannerListener(new LevelPlayBannerListener() {
                @Override
                public void onAdLoaded(AdInfo adInfo) {
                    Log.i(TAG, "LevelPlay Banner loaded successfully!");
                    isLpBannerLoaded = true;
                    isBannerLoading = false;

                    mainHandler.post(() -> {
                        if (bannerContainer != null && levelPlayBanner != null) {
                            if (unityBannerView != null) {
                                bannerContainer.removeView(unityBannerView);
                            }
                            if (levelPlayBanner.getParent() == null) {
                                bannerContainer.addView(levelPlayBanner);
                            }
                            if (bannerWanted) {
                                bannerContainer.setVisibility(View.VISIBLE);
                                updateBannerPosition();
                            }
                        }
                    });
                }

                @Override
                public void onAdLoadFailed(IronSourceError error) {
                    Log.w(TAG, "LevelPlay Banner load failed: " + error + " -> trying Unity Ads fallback");
                    isLpBannerLoaded = false;
                    isBannerLoading = false;
                    mainHandler.post(() -> loadUnityBannerFallback());
                }

                @Override
                public void onAdClicked(AdInfo adInfo) { }

                @Override
                public void onAdScreenPresented(AdInfo adInfo) { }

                @Override
                public void onAdScreenDismissed(AdInfo adInfo) { }

                @Override
                public void onAdLeftApplication(AdInfo adInfo) { }
            });

            IronSource.loadBanner(levelPlayBanner);
        } catch (Exception e) {
            Log.e(TAG, "Exception creating LevelPlay banner:", e);
            loadUnityBannerFallback();
        }
    }

    private void loadUnityBannerFallback() {
        if (getActivity() == null || bannerContainer == null) return;

        if (unityBannerView != null) {
            if (isUnityBannerLoaded && bannerWanted) {
                bannerContainer.setVisibility(View.VISIBLE);
            } else if (UnityAds.isInitialized()) {
                unityBannerView.load();
            }
            return;
        }

        Log.d(TAG, "Loading secondary Unity Ads Banner...");
        unityBannerView = new BannerView(getActivity(), DEFAULT_UNITY_BANNER_ID, new UnityBannerSize(320, 50));
        unityBannerView.setListener(new BannerView.IListener() {
            @Override
            public void onBannerLoaded(BannerView bv) {
                Log.i(TAG, "Secondary Unity Banner loaded!");
                isUnityBannerLoaded = true;
                mainHandler.post(() -> {
                    if (bannerContainer != null && !isLpBannerLoaded) {
                        if (bv.getParent() == null) {
                            bannerContainer.addView(bv);
                        }
                        if (bannerWanted) {
                            bannerContainer.setVisibility(View.VISIBLE);
                            updateBannerPosition();
                        }
                    }
                });
            }

            @Override
            public void onBannerFailedToLoad(BannerView bv, BannerErrorInfo errorInfo) {
                Log.w(TAG, "Secondary Unity Banner load failed: " + (errorInfo != null ? errorInfo.errorMessage : ""));
                isUnityBannerLoaded = false;
            }

            @Override
            public void onBannerShown(BannerView bv) { }

            @Override
            public void onBannerClick(BannerView bv) { }

            @Override
            public void onBannerLeftApplication(BannerView bv) { }
        });

        if (UnityAds.isInitialized()) {
            unityBannerView.load();
        }
    }

    @PluginMethod
    public void prepareBanner(PluginCall call) {
        Integer marginDpObj = call.getInt("margin");
        currentMarginDp = marginDpObj != null ? marginDpObj : 0;
        getActivity().runOnUiThread(() -> {
            createAndLoadBannerInternal();
            call.resolve();
        });
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        Integer marginDpObj = call.getInt("margin");
        currentMarginDp = marginDpObj != null ? marginDpObj : 0;
        bannerWanted = true;

        getActivity().runOnUiThread(() -> {
            if (bannerContainer == null) {
                createAndLoadBannerInternal();
            } else {
                updateBannerPosition();
                if (isLpBannerLoaded || isUnityBannerLoaded) {
                    bannerContainer.setVisibility(View.VISIBLE);
                } else {
                    createAndLoadBannerInternal();
                }
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        bannerWanted = false;
        getActivity().runOnUiThread(() -> {
            if (bannerContainer != null) {
                bannerContainer.setVisibility(View.GONE);
            }
            call.resolve();
        });
    }

    // ---------------------------------------------------------
    // INTERSTITIAL (LevelPlay Primary + Unity Ads Secondary)
    // ---------------------------------------------------------
    private void loadLevelPlayInterstitialInternal() {
        if (!isLevelPlayInit || isLpInterstitialReady || isInterstitialLoading) return;
        isInterstitialLoading = true;
        Log.d(TAG, "Loading LevelPlay Interstitial...");
        IronSource.loadInterstitial();
    }

    private void loadUnityInterstitialInternal() {
        if (!UnityAds.isInitialized() || isUnityInterstitialLoaded) return;
        Log.d(TAG, "Preloading secondary Unity Interstitial...");
        UnityAds.load(DEFAULT_UNITY_INTERSTITIAL_ID, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String placementId) {
                Log.i(TAG, "Secondary Unity Interstitial loaded: " + placementId);
                isUnityInterstitialLoaded = true;
            }

            @Override
            public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                Log.w(TAG, "Secondary Unity Interstitial load failed: " + message);
                isUnityInterstitialLoaded = false;
            }
        });
    }

    @PluginMethod
    public void prepareInterstitial(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            loadLevelPlayInterstitialInternal();
            loadUnityInterstitialInternal();
            call.resolve();
        });
    }

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (IronSource.isInterstitialReady()) {
                Log.i(TAG, "Showing LevelPlay Interstitial (Primary)");
                pendingInterstitialCall = call;
                IronSource.showInterstitial();
            } else if (isUnityInterstitialLoaded) {
                Log.i(TAG, "Showing Unity Interstitial (Secondary Fallback)");
                showUnityInterstitialFallback(call);
            } else {
                Log.d(TAG, "No interstitial ready; requesting loads");
                loadLevelPlayInterstitialInternal();
                loadUnityInterstitialInternal();
                call.reject("Interstitial ad was not ready yet.");
            }
        });
    }

    private void showUnityInterstitialFallback(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Activity unavailable");
            return;
        }
        isUnityInterstitialLoaded = false;
        UnityAds.show(getActivity(), DEFAULT_UNITY_INTERSTITIAL_ID, new UnityAdsShowOptions(), new IUnityAdsShowListener() {
            @Override
            public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                Log.w(TAG, "Unity fallback show failed: " + message);
                loadUnityInterstitialInternal();
                call.reject(message);
            }

            @Override
            public void onUnityAdsShowStart(String placementId) { }

            @Override
            public void onUnityAdsShowClick(String placementId) { }

            @Override
            public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                Log.d(TAG, "Unity fallback show complete");
                loadUnityInterstitialInternal();
                call.resolve();
            }
        });
    }

    // ---------------------------------------------------------
    // REWARDED VIDEO (LevelPlay Primary + Unity Ads Secondary)
    // ---------------------------------------------------------
    private void loadUnityRewardedInternal() {
        if (!UnityAds.isInitialized() || isUnityRewardedLoaded) return;
        Log.d(TAG, "Preloading secondary Unity Rewarded Video...");
        UnityAds.load(DEFAULT_UNITY_REWARDED_ID, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String placementId) {
                Log.i(TAG, "Secondary Unity Rewarded loaded: " + placementId);
                isUnityRewardedLoaded = true;
            }

            @Override
            public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                Log.w(TAG, "Secondary Unity Rewarded load failed: " + message);
                isUnityRewardedLoaded = false;
            }
        });
    }

    @PluginMethod
    public void prepareRewardVideoAd(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            loadUnityRewardedInternal();
            call.resolve();
        });
    }

    @PluginMethod
    public void showRewardVideoAd(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (IronSource.isRewardedVideoAvailable()) {
                Log.i(TAG, "Showing LevelPlay Rewarded Video (Primary)");
                pendingRewardedCall = call;
                IronSource.showRewardedVideo();
            } else if (isUnityRewardedLoaded) {
                Log.i(TAG, "Showing Unity Rewarded Video (Secondary Fallback)");
                showUnityRewardedFallback(call);
            } else {
                Log.d(TAG, "No rewarded video ready; requesting preload");
                loadUnityRewardedInternal();
                call.reject("Rewarded video ad was not ready yet.");
            }
        });
    }

    private void showUnityRewardedFallback(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Activity unavailable");
            return;
        }
        isUnityRewardedLoaded = false;
        UnityAds.show(getActivity(), DEFAULT_UNITY_REWARDED_ID, new UnityAdsShowOptions(), new IUnityAdsShowListener() {
            @Override
            public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                Log.w(TAG, "Unity Rewarded fallback show failed: " + message);
                loadUnityRewardedInternal();
                call.reject(message);
            }

            @Override
            public void onUnityAdsShowStart(String placementId) { }

            @Override
            public void onUnityAdsShowClick(String placementId) { }

            @Override
            public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsShowCompletionState state) {
                loadUnityRewardedInternal();
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
    }
}
