package com.geologon.cuiz;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

@CapacitorPlugin(name = "CustomAdMob")
public class CustomAdMobPlugin extends Plugin {
    private static final String TAG = "CustomAdMob";

    private AdView adView;
    private InterstitialAd mInterstitialAd;
    private RewardedAd mRewardedAd;
    
    private String lastBannerAdId = null;
    private String lastInterstitialAdId = null;
    private String lastRewardedAdId = null;

    private int currentMarginDp = 0;
    private boolean isAdLoaded = false;
    private boolean isAdLoading = false;
    private boolean isInterstitialLoading = false;
    private boolean isRewardedLoading = false;
    private boolean windowInsetsListenerAttached = false;
    
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void initialize(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            MobileAds.initialize(getContext(), initializationStatus -> {
                Log.d(TAG, "AdMob Initialized successfully");
                call.resolve();
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
        if (adView == null || getActivity() == null) return;
        float density = getActivity().getResources().getDisplayMetrics().density;
        int marginPx = (int) (currentMarginDp * density);
        int bottomInset = getSystemBottomInset();

        ViewGroup.LayoutParams lp = adView.getLayoutParams();
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
        adView.setLayoutParams(flp);
        adView.bringToFront();
    }

    // ---------------------------------------------------------
    // BANNER (Preloading + Instant Visibility + Retention)
    // ---------------------------------------------------------
    private void createAndLoadBannerInternal(String adId, boolean makeVisible, int marginDp) {
        if (getActivity() == null) return;
        currentMarginDp = marginDp;
        lastBannerAdId = adId;

        float density = getActivity().getResources().getDisplayMetrics().density;

        if (adView != null) {
            if (makeVisible) {
                adView.setVisibility(View.VISIBLE);
                updateBannerPosition();
            }
            if (!isAdLoaded && !isAdLoading) {
                isAdLoading = true;
                AdRequest adRequest = new AdRequest.Builder().build();
                adView.loadAd(adRequest);
            }
            return;
        }

        adView = new AdView(getContext());
        adView.setAdUnitId(adId);
        
        // Adaptive Banner Size calculation (API 30+ compliant)
        int adWidthPixels = 0;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            android.view.WindowMetrics windowMetrics = getActivity().getWindowManager().getCurrentWindowMetrics();
            android.graphics.Rect bounds = windowMetrics.getBounds();
            adWidthPixels = bounds.width();
        } else {
            DisplayMetrics displayMetrics = new DisplayMetrics();
            getActivity().getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
            adWidthPixels = displayMetrics.widthPixels;
        }
        int adWidth = (int) (adWidthPixels / density);
        if (adWidth <= 0) adWidth = 320;
        
        AdSize adSize = AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(getContext(), adWidth);
        adView.setAdSize(adSize);

        adView.setAdListener(new com.google.android.gms.ads.AdListener() {
            @Override
            public void onAdLoaded() {
                Log.d(TAG, "AdMob Banner loaded in background/foreground");
                isAdLoaded = true;
                isAdLoading = false;
                if (adView != null && adView.getVisibility() == View.VISIBLE) {
                    updateBannerPosition();
                }
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                Log.w(TAG, "AdMob Banner failed to load: " + loadAdError.getMessage() + " (code: " + loadAdError.getCode() + ")");
                isAdLoaded = false;
                isAdLoading = false;
                // Auto-retry in background after 8 seconds so an ad is always ready
                mainHandler.postDelayed(() -> {
                    if (!isAdLoaded && !isAdLoading && adView != null && lastBannerAdId != null) {
                        isAdLoading = true;
                        adView.loadAd(new AdRequest.Builder().build());
                    }
                }, 8000);
            }
        });

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.bottomMargin = (int) (currentMarginDp * density) + getSystemBottomInset();

        adView.setVisibility(makeVisible ? View.VISIBLE : View.GONE);

        ViewGroup content = (ViewGroup) getActivity().findViewById(android.R.id.content);
        content.addView(adView, params);

        if (!windowInsetsListenerAttached) {
            windowInsetsListenerAttached = true;
            androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(
                getActivity().getWindow().getDecorView(),
                (v, windowInsets) -> {
                    androidx.core.view.WindowInsetsCompat ret = androidx.core.view.ViewCompat.onApplyWindowInsets(v, windowInsets);
                    if (adView != null) {
                        updateBannerPosition();
                    }
                    return ret;
                }
            );
        }

        isAdLoading = true;
        AdRequest adRequest = new AdRequest.Builder().build();
        adView.loadAd(adRequest);
    }

    @PluginMethod
    public void prepareBanner(PluginCall call) {
        String adId = call.getString("adId");
        if (adId == null) {
            call.reject("Must provide adId");
            return;
        }
        Integer marginDpObj = call.getInt("margin");
        final int marginDp = marginDpObj != null ? marginDpObj : 0;

        getActivity().runOnUiThread(() -> {
            createAndLoadBannerInternal(adId, false, marginDp);
            call.resolve();
        });
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        String adId = call.getString("adId");
        if (adId == null) {
            call.reject("Must provide adId");
            return;
        }
        
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
            if (adView != null) {
                // DO NOT destroy the AdView — retain in memory and simply hide
                // so subsequent visits display instantly with zero layout jump or network delay.
                adView.setVisibility(View.GONE);
            }
            call.resolve();
        });
    }

    // ---------------------------------------------------------
    // INTERSTITIAL (Continuous Buffer & Auto-Reload)
    // ---------------------------------------------------------
    private void loadInterstitialInternal(String adId) {
        if (getContext() == null || adId == null) return;
        if (mInterstitialAd != null || isInterstitialLoading) return;

        lastInterstitialAdId = adId;
        isInterstitialLoading = true;

        AdRequest adRequest = new AdRequest.Builder().build();
        InterstitialAd.load(getContext(), adId, adRequest,
                new InterstitialAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull InterstitialAd interstitialAd) {
                        Log.d(TAG, "AdMob Interstitial loaded and ready in memory");
                        mInterstitialAd = interstitialAd;
                        isInterstitialLoading = false;
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                        Log.w(TAG, "AdMob Interstitial failed to load: " + loadAdError.getMessage());
                        mInterstitialAd = null;
                        isInterstitialLoading = false;
                        // Auto-retry in 8 seconds so an interstitial is continuously available
                        mainHandler.postDelayed(() -> {
                            if (mInterstitialAd == null && !isInterstitialLoading && lastInterstitialAdId != null) {
                                loadInterstitialInternal(lastInterstitialAdId);
                            }
                        }, 8000);
                    }
                });
    }

    @PluginMethod
    public void prepareInterstitial(PluginCall call) {
        String adId = call.getString("adId");
        if (adId == null) {
            call.reject("Must provide adId");
            return;
        }

        getActivity().runOnUiThread(() -> {
            loadInterstitialInternal(adId);
            call.resolve();
        });
    }

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (mInterstitialAd != null) {
                final InterstitialAd currentAd = mInterstitialAd;
                currentAd.setFullScreenContentCallback(new FullScreenContentCallback(){
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        Log.d(TAG, "Interstitial dismissed, preloading next immediately");
                        mInterstitialAd = null;
                        if (lastInterstitialAdId != null) {
                            loadInterstitialInternal(lastInterstitialAdId);
                        }
                        call.resolve();
                    }
                    @Override
                    public void onAdFailedToShowFullScreenContent(AdError adError) {
                        Log.w(TAG, "Interstitial show failed: " + adError.getMessage());
                        mInterstitialAd = null;
                        if (lastInterstitialAdId != null) {
                            loadInterstitialInternal(lastInterstitialAdId);
                        }
                        call.reject(adError.getMessage());
                    }
                });
                currentAd.show(getActivity());
            } else {
                // If not ready yet, trigger immediate background load for next turn
                if (lastInterstitialAdId != null) {
                    loadInterstitialInternal(lastInterstitialAdId);
                }
                call.reject("Interstitial ad wasn't ready yet.");
            }
        });
    }

    // ---------------------------------------------------------
    // REWARDED (Continuous Buffer & Auto-Reload)
    // ---------------------------------------------------------
    private void loadRewardedInternal(String adId) {
        if (getContext() == null || adId == null) return;
        if (mRewardedAd != null || isRewardedLoading) return;

        lastRewardedAdId = adId;
        isRewardedLoading = true;

        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(getContext(), adId, adRequest,
                new RewardedAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull RewardedAd rewardedAd) {
                        Log.d(TAG, "AdMob Rewarded Video loaded and ready in memory");
                        mRewardedAd = rewardedAd;
                        isRewardedLoading = false;
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                        Log.w(TAG, "AdMob Rewarded Video failed to load: " + loadAdError.getMessage());
                        mRewardedAd = null;
                        isRewardedLoading = false;
                        mainHandler.postDelayed(() -> {
                            if (mRewardedAd == null && !isRewardedLoading && lastRewardedAdId != null) {
                                loadRewardedInternal(lastRewardedAdId);
                            }
                        }, 8000);
                    }
                });
    }

    @PluginMethod
    public void prepareRewardVideoAd(PluginCall call) {
        String adId = call.getString("adId");
        if (adId == null) {
            call.reject("Must provide adId");
            return;
        }

        getActivity().runOnUiThread(() -> {
            loadRewardedInternal(adId);
            call.resolve();
        });
    }

    @PluginMethod
    public void showRewardVideoAd(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (mRewardedAd != null) {
                final RewardedAd currentAd = mRewardedAd;
                currentAd.setFullScreenContentCallback(new FullScreenContentCallback(){
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        Log.d(TAG, "Rewarded ad dismissed, preloading next immediately");
                        mRewardedAd = null;
                        if (lastRewardedAdId != null) {
                            loadRewardedInternal(lastRewardedAdId);
                        }
                    }
                    @Override
                    public void onAdFailedToShowFullScreenContent(AdError adError) {
                        Log.w(TAG, "Rewarded ad show failed: " + adError.getMessage());
                        mRewardedAd = null;
                        if (lastRewardedAdId != null) {
                            loadRewardedInternal(lastRewardedAdId);
                        }
                        call.reject(adError.getMessage());
                    }
                });
                currentAd.show(getActivity(), rewardItem -> {
                    com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
                    ret.put("type", rewardItem.getType());
                    ret.put("amount", rewardItem.getAmount());
                    call.resolve(ret);
                });
            } else {
                if (lastRewardedAdId != null) {
                    loadRewardedInternal(lastRewardedAdId);
                }
                call.reject("Rewarded ad wasn't ready yet.");
            }
        });
    }
}
