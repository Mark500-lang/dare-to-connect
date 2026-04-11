package daretoconnect.app.mobile;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Enable edge-to-edge properly for Android 15+
        // WindowCompat.enableEdgeToEdge(getWindow());
        super.onCreate(savedInstanceState);
    }
}