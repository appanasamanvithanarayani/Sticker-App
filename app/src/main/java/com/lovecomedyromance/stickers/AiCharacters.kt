package com.lovecomedyromance.stickers

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import org.json.JSONArray

/** The app's own caption-free characters, used by the free AI mode. */
object AiCharacters {

    data class Character(val id: String, val file: String, val description: String)

    private const val DIR = "ai_characters"

    @Volatile
    private var cached: List<Character>? = null

    fun all(context: Context): List<Character> = cached ?: synchronized(this) {
        cached ?: run {
            val json = context.assets.open("$DIR/characters.json").bufferedReader().use { JSONArray(it.readText()) }
            (0 until json.length()).map {
                val o = json.getJSONObject(it)
                Character(o.getString("id"), o.getString("file"), o.getString("description"))
            }.also { cached = it }
        }
    }

    fun bitmap(context: Context, character: Character): Bitmap =
        context.assets.open("$DIR/${character.file}").use { BitmapFactory.decodeStream(it) }
}
