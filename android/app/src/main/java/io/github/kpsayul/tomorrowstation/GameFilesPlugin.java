package io.github.kpsayul.tomorrowstation;

import android.app.Activity;
import android.content.Intent;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

/** Export a save or image to a location chosen by the player, without storage permissions. */
@CapacitorPlugin(name = "GameFiles")
public class GameFilesPlugin extends Plugin {
    private boolean choosingFile = false;

    @PluginMethod
    public void save(PluginCall call) {
        String data = call.getString("data");
        String name = call.getString("filename", "tomorrow-station.json");
        String type = call.getString("mimeType", "application/json");
        if (choosingFile) { call.reject("An export is already open"); return; }
        if (data == null || data.length() > 8 * 1024 * 1024 ||
            !(type.equals("application/json") || type.equals("image/png")) || name.contains("/") || name.contains("\\")) {
            call.reject("Invalid export"); return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(type);
        intent.putExtra(Intent.EXTRA_TITLE, name);
        choosingFile = true;
        try { startActivityForResult(call, intent, "fileChosen"); }
        catch (Exception error) { choosingFile = false; call.reject("Cannot open file picker", error); }
    }

    @ActivityCallback
    private void fileChosen(PluginCall call, ActivityResult result) {
        choosingFile = false;
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            JSObject response = new JSObject(); response.put("cancelled", true); call.resolve(response); return;
        }
        try (OutputStream stream = getContext().getContentResolver().openOutputStream(result.getData().getData(), "wt")) {
            if (stream == null) throw new java.io.IOException("No output stream");
            stream.write(Base64.decode(call.getString("data", ""), Base64.DEFAULT));
            JSObject response = new JSObject(); response.put("cancelled", false); call.resolve(response);
        } catch (Exception error) { call.reject("Cannot write exported file", error); }
    }
}
