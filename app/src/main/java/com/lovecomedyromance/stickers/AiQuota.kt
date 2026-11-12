package com.lovecomedyromance.stickers

import android.content.Context
import java.time.LocalDate

/** A simple per-device daily limit, so one user can't run up the Gemini bill. */
object AiQuota {
    const val REQUESTS_PER_DAY = 5
    private const val PREFS = "ai_quota"

    fun remaining(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val today = LocalDate.now().toString()
        return if (prefs.getString("day", null) == today) REQUESTS_PER_DAY - prefs.getInt("used", 0) else REQUESTS_PER_DAY
    }

    fun use(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val today = LocalDate.now().toString()
        val used = if (prefs.getString("day", null) == today) prefs.getInt("used", 0) else 0
        prefs.edit().putString("day", today).putInt("used", used + 1).apply()
    }
}
