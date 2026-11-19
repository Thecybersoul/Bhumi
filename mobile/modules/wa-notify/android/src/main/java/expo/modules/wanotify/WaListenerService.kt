package expo.modules.wanotify

import android.app.Notification
import android.app.Person
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.Executors

/* Reads WhatsApp's notifications on this phone and posts each chat's new
   messages to the ERP (POST /api/capture, action 'share', source
   'notification'). The ERP applies the Personal list before storing
   anything and holds chats it doesn't know until someone marks them
   Business, so this sends what Android shows and the server decides.

   It runs inside Android's notification service, so it works while the
   Bhumi app is closed. A post that fails (no signal, token expired) is
   kept in a small file and sent with the next one. */
class WaListenerService : NotificationListenerService() {

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    try {
      handle(sbn)
    } catch (e: Exception) {
      WaNotifyStore.setError(this, "read: ${e.message}")
    }
  }

  private fun handle(sbn: StatusBarNotification) {
    if (sbn.packageName != "com.whatsapp" && sbn.packageName != "com.whatsapp.w4b") return
    val n = sbn.notification ?: return
    if (n.flags and Notification.FLAG_GROUP_SUMMARY != 0) return
    val prefs = WaNotifyStore.prefs(this)
    if (!prefs.getBoolean("enabled", false)) return
    val ex = n.extras ?: return

    val title = ex.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim().orEmpty()
    val convTitle = ex.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)?.toString()?.trim()
    val isGroup = ex.getBoolean(Notification.EXTRA_IS_GROUP_CONVERSATION, false) || !convTitle.isNullOrEmpty()
    // "Plots Group (3 messages)" → "Plots Group"
    val chat = (convTitle ?: title).replace(Regex("""\s*\(\d+\s+messages?\)\s*$"""), "").trim()
    if (chat.isEmpty() || NOISE.containsMatchIn(chat)) return

    val messages = JSONArray()
    val arr = ex.getParcelableArray(Notification.EXTRA_MESSAGES)
    if (arr != null && arr.isNotEmpty()) {
      for (p in arr) {
        val b = p as? Bundle ?: continue
        val text = b.getCharSequence("text")?.toString()?.trim().orEmpty()
        if (text.isEmpty()) continue
        val time = b.getLong("time", sbn.postTime)
        var sender = b.getCharSequence("sender")?.toString()
        if (sender.isNullOrEmpty() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          @Suppress("DEPRECATION")
          sender = (b.getParcelable<Person>("sender_person"))?.name?.toString()
        }
        messages.put(JSONObject().put("text", text).put("at", iso(time)).put("sender", sender ?: if (isGroup) "" else chat))
      }
    } else {
      val text = ex.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim().orEmpty()
      if (text.isEmpty() || NOISE.containsMatchIn(text)) return
      // A group's single-line form is "Sender: text".
      val sender = if (isGroup && title.contains(": ")) title.substringAfterLast(": ") else if (isGroup) "" else chat
      messages.put(JSONObject().put("text", text).put("at", iso(sbn.postTime)).put("sender", sender))
    }
    if (messages.length() == 0) return

    val body = JSONObject()
      .put("action", "share")
      .put("source", "notification")
      .put("chat", chat)
      .put("is_group", isGroup)
      .put("messages", messages)
    WaNotifyStore.enqueue(this, body.toString())
    executor.execute { WaNotifyStore.flush(applicationContext) }
  }

  companion object {
    private val executor = Executors.newSingleThreadExecutor()
    private val NOISE = Regex("""^(\d+ new messages?|checking for new messages|whatsapp web|backup in progress|ongoing (voice|video) call|missed (voice|video) call)""", RegexOption.IGNORE_CASE)
    private fun iso(ms: Long): String {
      val f = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
      f.timeZone = TimeZone.getTimeZone("UTC")
      return f.format(Date(ms))
    }
  }
}

/** Settings, the retry queue and the last result, shared by the service and the app. */
object WaNotifyStore {
  private const val QUEUE = "wa_capture_queue.jsonl"
  private const val MAX_QUEUED = 500

  fun prefs(ctx: Context) = ctx.getSharedPreferences("bhumi_wa_notify", Context.MODE_PRIVATE)

  fun setError(ctx: Context, msg: String) {
    prefs(ctx).edit().putString("last_error", msg.take(300)).putLong("last_error_at", System.currentTimeMillis()).apply()
  }

  @Synchronized
  fun enqueue(ctx: Context, payload: String) {
    val f = File(ctx.filesDir, QUEUE)
    val lines = if (f.exists()) f.readLines().toMutableList() else mutableListOf()
    lines.add(payload.replace("\n", " "))
    f.writeText(lines.takeLast(MAX_QUEUED).joinToString("\n"))
  }

  fun queued(ctx: Context): Int {
    val f = File(ctx.filesDir, QUEUE)
    return if (f.exists()) f.readLines().count { it.isNotBlank() } else 0
  }

  /** Send everything waiting, oldest first; stop at the first failure and keep the rest. */
  @Synchronized
  fun flush(ctx: Context) {
    val p = prefs(ctx)
    val url = p.getString("url", null) ?: return
    val token = p.getString("token", null) ?: return
    val f = File(ctx.filesDir, QUEUE)
    if (!f.exists()) return
    val lines = f.readLines().filter { it.isNotBlank() }.toMutableList()
    while (lines.isNotEmpty()) {
      val code = try {
        post("$url/api/capture", token, lines.first())
      } catch (e: Exception) {
        setError(ctx, "send: ${e.message}")
        -1
      }
      if (code in 200..299) {
        lines.removeAt(0)
        p.edit().putLong("last_sent_at", System.currentTimeMillis()).remove("last_error").apply()
      } else {
        if (code == 401) setError(ctx, "Signed out: open the Bhumi app to reconnect")
        else if (code > 0) setError(ctx, "Server answered $code")
        // A message the server rejects outright (400) would block the queue forever: drop it.
        if (code == 400) lines.removeAt(0) else break
      }
    }
    f.writeText(lines.joinToString("\n"))
  }

  private fun post(url: String, token: String, body: String): Int {
    val c = URL(url).openConnection() as HttpURLConnection
    c.requestMethod = "POST"
    c.connectTimeout = 15_000
    c.readTimeout = 30_000
    c.doOutput = true
    c.setRequestProperty("Content-Type", "application/json")
    c.setRequestProperty("Authorization", "Bearer $token")
    c.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
    val code = c.responseCode
    c.disconnect()
    return code
  }
}
