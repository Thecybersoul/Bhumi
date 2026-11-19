package expo.modules.wanotify

import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.Executors

/* The app's side of WhatsApp capture: turn it on or off, hand the service
   the ERP address and the signed-in token, open Android's Notification
   access screen, and report status. */
class WaNotifyModule : Module() {
  private val executor = Executors.newSingleThreadExecutor()
  private val ctx get() = appContext.reactContext ?: throw IllegalStateException("No context")

  override fun definition() = ModuleDefinition {
    Name("WaNotify")

    Function("isPermissionGranted") {
      NotificationManagerCompat.getEnabledListenerPackages(ctx).contains(ctx.packageName)
    }

    Function("openPermissionSettings") {
      val i = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(i)
    }

    Function("configure") { url: String, token: String?, enabled: Boolean ->
      val e = WaNotifyStore.prefs(ctx).edit().putString("url", url.trimEnd('/')).putBoolean("enabled", enabled)
      if (token.isNullOrEmpty()) e.remove("token") else e.putString("token", token)
      e.apply()
      if (enabled && !token.isNullOrEmpty()) executor.execute { WaNotifyStore.flush(ctx.applicationContext) }
    }

    Function("status") {
      val p = WaNotifyStore.prefs(ctx)
      mapOf(
        "enabled" to p.getBoolean("enabled", false),
        "granted" to NotificationManagerCompat.getEnabledListenerPackages(ctx).contains(ctx.packageName),
        "lastSentAt" to p.getLong("last_sent_at", 0L).toDouble(),
        "lastError" to p.getString("last_error", null),
        "queued" to WaNotifyStore.queued(ctx),
      )
    }
  }
}
