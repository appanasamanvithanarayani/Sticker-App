package com.lovecomedyromance.stickers

import android.content.Context

/** Release builds have no debug helpers. */
object DebugTools {
    const val UNLIMITED_AI = false
    @Suppress("UNUSED_PARAMETER")
    fun appCheckDebugToken(context: Context): String? = null
}
