package com.lovecomedyromance.stickers

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import org.json.JSONArray

/** The app's own caption-free characters, used by the free AI mode. */
object AiCharacters {

    /** [age] is baby, kid, teen, young, adult, middle, elder or any; [gender] is female, male or any. */
    data class Character(val id: String, val file: String, val description: String, val age: String, val gender: String)

    private const val DIR = "ai_characters"

    @Volatile
    private var cached: List<Character>? = null

    fun all(context: Context): List<Character> = cached ?: synchronized(this) {
        cached ?: run {
            val json = context.assets.open("$DIR/characters.json").bufferedReader().use { JSONArray(it.readText()) }
            (0 until json.length()).map {
                val o = json.getJSONObject(it)
                Character(
                    o.getString("id"), o.getString("file"), o.getString("description"),
                    o.optString("age", "any"), o.optString("gender", "any"),
                )
            }.also { cached = it }
        }
    }

    /**
     * The characters matching an age and gender ("" = any). Falls back to everything
     * if the filter leaves too few to choose from.
     */
    fun matching(context: Context, age: String, gender: String): List<Character> {
        val all = all(context)
        val filtered = all.filter { c ->
            (age.isEmpty() || c.age == age) && (gender.isEmpty() || c.gender == gender || c.gender == "any" && age.isEmpty())
        }
        return if (filtered.size >= 6) filtered else all
    }

    fun bitmap(context: Context, character: Character): Bitmap =
        context.assets.open("$DIR/${character.file}").use { BitmapFactory.decodeStream(it) }
}
