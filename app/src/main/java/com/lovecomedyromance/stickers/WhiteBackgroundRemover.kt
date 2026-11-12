package com.lovecomedyromance.stickers

import android.graphics.Bitmap

/**
 * Makes the plain white background around a drawing transparent by flood-filling from the edges.
 * Stops at the drawing's dark outline, so white parts inside the character are kept.
 */
object WhiteBackgroundRemover {

    /** Returns the cut-out, or null if the background did not look plain white. */
    fun remove(source: Bitmap): Bitmap? {
        val bitmap = source.copy(Bitmap.Config.ARGB_8888, true)
        val w = bitmap.width
        val h = bitmap.height
        val pixels = IntArray(w * h)
        bitmap.getPixels(pixels, 0, w, 0, 0, w, h)

        fun isBackground(p: Int): Boolean {
            val r = (p shr 16) and 0xFF
            val g = (p shr 8) and 0xFF
            val b = p and 0xFF
            return r > 225 && g > 225 && b > 225 && maxOf(r, g, b) - minOf(r, g, b) < 24
        }

        val visited = BooleanArray(w * h)
        val stack = IntArray(w * h)
        var top = 0
        fun push(i: Int) {
            if (!visited[i] && isBackground(pixels[i])) {
                visited[i] = true
                stack[top++] = i
            }
        }
        for (x in 0 until w) { push(x); push((h - 1) * w + x) }
        for (y in 0 until h) { push(y * w); push(y * w + w - 1) }

        var cleared = 0
        while (top > 0) {
            val i = stack[--top]
            pixels[i] = 0
            cleared++
            val x = i % w
            val y = i / w
            if (x > 0) push(i - 1)
            if (x < w - 1) push(i + 1)
            if (y > 0) push(i - w)
            if (y < h - 1) push(i + w)
        }
        // Too little removed means the background was not plain white.
        if (cleared < w * h / 10) return null

        // Soften the edge: light, anti-aliased pixels next to the cleared area become partly transparent.
        val soft = pixels.copyOf()
        for (i in pixels.indices) {
            val p = pixels[i]
            if (p == 0) continue
            val x = i % w
            val y = i / w
            val touches = (x > 0 && pixels[i - 1] == 0) || (x < w - 1 && pixels[i + 1] == 0) ||
                (y > 0 && pixels[i - w] == 0) || (y < h - 1 && pixels[i + w] == 0)
            if (!touches) continue
            val light = (((p shr 16) and 0xFF) + ((p shr 8) and 0xFF) + (p and 0xFF)) / 3
            if (light > 150) soft[i] = (p and 0x00FFFFFF) or ((255 - (light - 150) * 2).coerceIn(40, 255) shl 24)
        }
        System.arraycopy(soft, 0, pixels, 0, pixels.size)
        bitmap.setPixels(pixels, 0, w, 0, 0, w, h)
        return bitmap
    }
}
