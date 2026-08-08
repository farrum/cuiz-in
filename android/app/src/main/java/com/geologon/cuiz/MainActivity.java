package com.geologon.cuiz;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Enable edge-to-edge display explicitly for Android 15+ and backward compatibility
        EdgeToEdge.enable(this);
        // Register the in-repo Unity LevelPlay bridge before the bridge boots.
        registerPlugin(LevelPlayPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
