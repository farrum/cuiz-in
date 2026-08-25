package com.geologon.cuiz;

import android.app.Activity;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.Gravity;
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

    @PluginMethod
    public void initialize(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            MobileAds.initialize(getContext(), initializationStatus -> {
                Log.d(TAG, "AdMob Initialized");
                call.resolve();
            });
        });
    }

    // ---------------------------------------------------------
    // BANNER
    // ---------------------------------------------------------
    @PluginMethod
    public void showBanner(PluginCall call) {
        String adId = call.getString("adId");
        if (adId == null) {
            call.reject("Must provide adId");
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (adView != null) {
                call.resolve();
                return;
            }

            adView = new AdView(getContext());
            adView.setAdUnitId(adId);
            
            // Adaptive Banner Size
            Display display = getActivity().getWindowManager().getDefaultDisplay();
            DisplayMetrics outMetrics = new DisplayMetrics();
            display.getMetrics(outMetrics);
            float widthPixels = outMetrics.widthPixels;
            float density = outMetrics.density;
            int adWidth = (int) (widthPixels / density);
            AdSize adSize = AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(getContext(), adWidth);
            adView.setAdSize(adSize);

            // Create layout params that place it at bottom WITHOUT resizing WebView
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;

            // Bridge's WebView parent is typically a FrameLayout where we can stack views overlay-style
            ViewGroup root = (ViewGroup) bridge.getWebView().getParent();
            root.addView(adView, params);

            AdRequest adRequest = new AdRequest.Builder().build();
            adView.loadAd(adRequest);
            call.resolve();
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (adView != null) {
                ViewGroup root = (ViewGroup) adView.getParent();
                if (root != null) {
                    root.removeView(adView);
                }
                adView.destroy();
                adView = null;
            }
            call.resolve();
        });
    }

    // ---------------------------------------------------------
    // INTERSTITIAL
    // ---------------------------------------------------------
    @PluginMethod
    public void prepareInterstitial(PluginCall call) {
        String adId = call.getString("adId");
        if (adId == null) {
            call.reject("Must provide adId");
            return;
        }

        getActivity().runOnUiThread(() -> {
            AdRequest adRequest = new AdRequest.Builder().build();
            InterstitialAd.load(getContext(), adId, adRequest,
                    new InterstitialAdLoadCallback() {
                        @Override
                        public void onAdLoaded(@NonNull InterstitialAd interstitialAd) {
                            mInterstitialAd = interstitialAd;
                            call.resolve();
                        }

                        @Override
                        public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                            mInterstitialAd = null;
                            call.reject(loadAdError.getMessage());
                        }
                    });
        });
    }

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (mInterstitialAd != null) {
                mInterstitialAd.setFullScreenContentCallback(new FullScreenContentCallback(){
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        mInterstitialAd = null;
                        call.resolve();
                    }
                    @Override
                    public void onAdFailedToShowFullScreenContent(AdError adError) {
                        mInterstitialAd = null;
                        call.reject(adError.getMessage());
                    }
                });
                mInterstitialAd.show(getActivity());
            } else {
                call.reject("Interstitial ad wasn't ready yet.");
            }
        });
    }

    // ---------------------------------------------------------
    // REWARDED
    // ---------------------------------------------------------
    @PluginMethod
    public void prepareRewardVideoAd(PluginCall call) {
        String adId = call.getString("adId");
        if (adId == null) {
            call.reject("Must provide adId");
            return;
        }

        getActivity().runOnUiThread(() -> {
            AdRequest adRequest = new AdRequest.Builder().build();
            RewardedAd.load(getContext(), adId, adRequest,
                    new RewardedAdLoadCallback() {
                        @Override
                        public void onAdLoaded(@NonNull RewardedAd rewardedAd) {
                            mRewardedAd = rewardedAd;
                            call.resolve();
                        }

                        @Override
                        public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                            mRewardedAd = null;
                            call.reject(loadAdError.getMessage());
                        }
                    });
        });
    }

    @PluginMethod
    public void showRewardVideoAd(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (mRewardedAd != null) {
                mRewardedAd.setFullScreenContentCallback(new FullScreenContentCallback(){
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        mRewardedAd = null;
                    }
                    @Override
                    public void onAdFailedToShowFullScreenContent(AdError adError) {
                        mRewardedAd = null;
                        call.reject(adError.getMessage());
                    }
                });
                mRewardedAd.show(getActivity(), rewardItem -> {
                    // Reward earned! We resolve the call here.
                    com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
                    ret.put("type", rewardItem.getType());
                    ret.put("amount", rewardItem.getAmount());
                    call.resolve(ret);
                });
            } else {
                call.reject("Rewarded ad wasn't ready yet.");
            }
        });
    }
}
