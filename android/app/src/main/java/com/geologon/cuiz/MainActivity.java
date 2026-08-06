package com.geologon.cuiz;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the in-repo Unity LevelPlay bridge before the bridge boots.
        registerPlugin(LevelPlayPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
