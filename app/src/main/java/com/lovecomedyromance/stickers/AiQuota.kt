package com.lovecomedyromance.stickers

import android.content.Context
import java.time.LocalDate

/** Simple per-device daily limits, so one user can't use up the whole Gemini quota. */
object AiQuota {

    enum class Kind(val perDay: Int) {
        /** Captions on the app's own characters: one cheap text request. */
        FREE(20),
        /** Gemini drawings: one text request plus an image request per sticker. */
        DRAWN(5),
    }

    private const val PREFS = "ai_quota"

    fun remaining(context: Context, kind: Kind): Int {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val today = LocalDate.now().toString()
        val used = if (prefs.getString("day_${kind.name}", null) == today) prefs.getInt("used_${kind.name}", 0) else 0
        return kind.perDay - used
    }

    fun use(context: Context, kind: Kind) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val today = LocalDate.now().toString()
        val used = if (prefs.getString("day_${kind.name}", null) == today) prefs.getInt("used_${kind.name}", 0) else 0
        prefs.edit().putString("day_${kind.name}", today).putInt("used_${kind.name}", used + 1).apply()
    }
}
