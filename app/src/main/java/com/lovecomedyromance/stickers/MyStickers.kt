package com.lovecomedyromance.stickers

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

/**
 * The "My Stickers" pack: stickers the user makes from their own photos.
 * Files live in app storage, listed in stickers.json next to them.
 */
object MyStickers {

    const val IDENTIFIER = "my_stickers"
    const val MIN_FOR_WHATSAPP = 3
    const val MAX_STICKERS = 30
    private const val TRAY = "tray.png"
    private const val INDEX = "stickers.json"

    private data class Entry(val file: String, val emoji: String, val caption: String)
    private data class State(val version: Int, val entries: List<Entry>)

    private fun dir(context: Context) = File(context.filesDir, IDENTIFIER).apply { mkdirs() }

    fun file(context: Context, fileName: String) = File(dir(context), fileName)

    @Synchronized
    fun pack(context: Context): StickerPack {
        val state = read(context)
        return StickerPack(
            identifier = IDENTIFIER,
            name = context.getString(R.string.my_stickers),
            publisher = context.getString(R.string.my_stickers_publisher),
            trayImageFile = TRAY,
            publisherEmail = "",
            publisherWebsite = "",
            privacyPolicyWebsite = "",
            licenseAgreementWebsite = "",
            // WhatsApp re-reads the images whenever this changes.
            imageDataVersion = state.version.toString(),
            avoidCache = false,
            animatedStickerPack = false,
            stickers = state.entries.map {
                Sticker(it.file, listOf(it.emoji), it.caption.ifBlank { context.getString(R.string.my_sticker_alt) })
            },
            androidPlayStoreLink = "",
            iosAppStoreLink = "",
            custom = true,
        )
    }

    fun isFull(context: Context) = pack(context).stickers.size >= MAX_STICKERS

    /** Saves a finished sticker. [webp] must already meet WhatsApp's size rules. */
    @Synchronized
    fun add(context: Context, webp: ByteArray, tray: Bitmap, emoji: String, caption: String) {
        val state = read(context)
        check(state.entries.size < MAX_STICKERS) { "My Stickers is full" }
        val name = "s_${UUID.randomUUID().toString().take(8)}.webp"
        file(context, name).writeBytes(webp)
        if (state.entries.isEmpty()) writeTray(context, tray)
        write(context, State(state.version + 1, state.entries + Entry(name, emoji, caption.take(100))))
        notifyChange(context)
    }

    @Synchronized
    fun delete(context: Context, fileName: String) {
        val state = read(context)
        val remaining = state.entries.filterNot { it.file == fileName }
        if (remaining.size == state.entries.size) return
        file(context, fileName).delete()
        // Keep the tray icon in step with the first sticker.
        remaining.firstOrNull()?.let { first ->
            file(context, first.file).inputStream().use { android.graphics.BitmapFactory.decodeStream(it) }
                ?.let { writeTray(context, StickerComposer.tray(it)) }
        }
        write(context, State(state.version + 1, remaining))
        notifyChange(context)
    }

    private fun writeTray(context: Context, tray: Bitmap) {
        file(context, TRAY).outputStream().use { tray.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    private fun read(context: Context): State {
        val f = File(dir(context), INDEX)
        if (!f.exists()) return State(1, emptyList())
        return try {
            val json = JSONObject(f.readText())
            val arr = json.getJSONArray("stickers")
            State(
                json.optInt("version", 1),
                (0 until arr.length()).map {
                    val o = arr.getJSONObject(it)
                    Entry(o.getString("file"), o.optString("emoji", "😂"), o.optString("caption"))
                }.filter { file(context, it.file).exists() },
            )
        } catch (e: Exception) {
            State(1, emptyList())
        }
    }

    private fun write(context: Context, state: State) {
        val arr = JSONArray()
        state.entries.forEach { arr.put(JSONObject().put("file", it.file).put("emoji", it.emoji).put("caption", it.caption)) }
        val tmp = File(dir(context), "$INDEX.tmp")
        tmp.writeText(JSONObject().put("version", state.version).put("stickers", arr).toString())
        tmp.renameTo(File(dir(context), INDEX))
    }

    private fun notifyChange(context: Context) {
        val authority = StickerContentProvider.authorityFor(context.packageName)
        context.contentResolver.notifyChange(Uri.parse("content://$authority/metadata"), null)
    }
}
