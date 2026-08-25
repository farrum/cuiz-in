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
        
        Integer marginDpObj = call.getInt("margin");
        final int marginDp = marginDpObj != null ? marginDpObj : 0;

        getActivity().runOnUiThread(() -> {
            float density = getActivity().getResources().getDisplayMetrics().density;
            final int marginPx = (int) (marginDp * density);

            if (adView != null) {
                // If the view exists, update its layout params in case margin changed
                ViewGroup.LayoutParams lp = adView.getLayoutParams();
                if (lp instanceof FrameLayout.LayoutParams) {
                    FrameLayout.LayoutParams flp = (FrameLayout.LayoutParams) lp;
                    androidx.core.view.WindowInsetsCompat insets = androidx.core.view.ViewCompat.getRootWindowInsets(getActivity().getWindow().getDecorView());
                    int bottomInset = (insets != null) ? insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars()).bottom : 0;
                    flp.bottomMargin = marginPx + bottomInset;
                    adView.setLayoutParams(flp);
                }
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
            // density is already defined above
            int adWidth = (int) (widthPixels / density);
            AdSize adSize = AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(getContext(), adWidth);
            adView.setAdSize(adSize);

            // We use FrameLayout.LayoutParams because we are adding this directly to the Activity's root content frame.
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
            
            androidx.core.view.WindowInsetsCompat insets = androidx.core.view.ViewCompat.getRootWindowInsets(getActivity().getWindow().getDecorView());
            int bottomInset = (insets != null) ? insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars()).bottom : 0;
            params.bottomMargin = marginPx + bottomInset;

            // Add the view directly to the Window's content layout (always a FrameLayout).
            // This prevents issues with CoordinatorLayout or WebView parents overriding gravity.
            ViewGroup content = (ViewGroup) getActivity().findViewById(android.R.id.content);
            content.addView(adView, params);
            
            // Listen for window inset changes (e.g., keyboard or navigation bar appearing/disappearing)
            androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(adView, (v, windowInsets) -> {
                int newBottomInset = windowInsets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars()).bottom;
                ViewGroup.LayoutParams lp = v.getLayoutParams();
                if (lp instanceof FrameLayout.LayoutParams) {
                    ((FrameLayout.LayoutParams) lp).bottomMargin = marginPx + newBottomInset;
                    v.setLayoutParams(lp);
                }
                return windowInsets;
            });

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
