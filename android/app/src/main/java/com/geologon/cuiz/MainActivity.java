package com.geologon.cuiz;

import android.os.Bundle;
import android.graphics.Color;
import android.view.Window;
import android.view.View;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.ActionBar;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CustomAdMobPlugin.class);
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);
        EdgeToEdge.enable(this);

        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.rgb(12, 10, 9));
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.rgb(12, 10, 9));
            getBridge().getWebView().setLayerType(View.LAYER_TYPE_HARDWARE, null);
        }
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.hide();
        }
        android.app.ActionBar nativeBar = getActionBar();
        if (nativeBar != null) {
            nativeBar.hide();
        }
        setTitle("");
    }
}
