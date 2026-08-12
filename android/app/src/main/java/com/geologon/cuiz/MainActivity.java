package com.geologon.cuiz;

import android.os.Bundle;
import android.view.Window;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.ActionBar;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Belt-and-braces: make sure no native title/action bar is ever shown,
        // even if a cached theme still enables one.
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);
        // Enable edge-to-edge display explicitly for Android 15+ and backward compatibility
        EdgeToEdge.enable(this);
        // Register the in-repo Unity LevelPlay bridge before the bridge boots.
        registerPlugin(LevelPlayPlugin.class);
        super.onCreate(savedInstanceState);
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.hide();
        }
        // The launch theme (Theme.SplashScreen) is not an AppCompat theme, so
        // getSupportActionBar() can be null while a *native* action bar is
        // still drawn. Hide that one too.
        android.app.ActionBar nativeBar = getActionBar();
        if (nativeBar != null) {
            nativeBar.hide();
        }
        // Belt-and-braces: an empty title leaves nothing to render even if a
        // cached theme momentarily supplies a title bar.
        setTitle("");
    }
}
