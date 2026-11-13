package com.lovecomedyromance.stickers

import android.content.Context
import com.google.firebase.FirebaseApp

/** Test-build helpers. The release build has an empty version of this object. */
object DebugTools {

    /** Test builds have no daily AI limit, so the developer can keep testing. */
    const val UNLIMITED_AI = true

    private val UUID = Regex("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")

    /**
     * The App Check debug token this install uses. It has to be added in the Firebase console
     * (App Check > Apps > Manage debug tokens) before Firebase accepts requests from this build.
     */
    fun appCheckDebugToken(context: Context): String? = fromStorage(context) ?: fromLog()

    // Where the App Check debug provider keeps the token it generated.
    private fun fromStorage(context: Context): String? = try {
        val key = FirebaseApp.getInstance().persistenceKey
        context.getSharedPreferences("com.google.firebase.appcheck.debug.store.$key", Context.MODE_PRIVATE)
            .getString("com.google.firebase.appcheck.debug.DEBUG_SECRET", null)
            ?.takeIf { UUID.matches(it) }
    } catch (e: Exception) {
        null
    }

    // The provider also prints the token to Logcat when it creates it.
    private fun fromLog(): String? = try {
        val process = ProcessBuilder("logcat", "-d", "-s", "DebugAppCheckProvider").redirectErrorStream(true).start()
        val log = process.inputStream.bufferedReader().use { it.readText() }
        UUID.findAll(log).lastOrNull()?.value
    } catch (e: Exception) {
        null
    }
}
