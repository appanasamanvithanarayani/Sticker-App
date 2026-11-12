package com.lovecomedyromance.stickers

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import android.widget.ImageView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Decodes sticker images from assets off the main thread, with a small memory cache. */
object StickerImages {

    private val cache = object : LruCache<String, Bitmap>((Runtime.getRuntime().maxMemory() / 8).toInt()) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount
    }

    fun load(scope: CoroutineScope, view: ImageView, assetPath: String, targetPx: Int) {
        val key = "$assetPath@$targetPx"
        view.tag = key
        cache.get(key)?.let {
            view.setImageBitmap(it)
            return
        }
        view.setImageDrawable(null)
        val context = view.context.applicationContext
        scope.launch {
            val bitmap = withContext(Dispatchers.IO) { decode(context, assetPath, targetPx) } ?: return@launch
            cache.put(key, bitmap)
            if (view.tag == key) view.setImageBitmap(bitmap)
        }
    }

    private fun decode(context: Context, assetPath: String, targetPx: Int): Bitmap? = try {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.assets.open(assetPath).use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (bounds.outWidth / (sample * 2) >= targetPx) sample *= 2
        val opts = BitmapFactory.Options().apply { inSampleSize = sample }
        context.assets.open(assetPath).use { BitmapFactory.decodeStream(it, null, opts) }
    } catch (e: Exception) {
        null
    }
}
