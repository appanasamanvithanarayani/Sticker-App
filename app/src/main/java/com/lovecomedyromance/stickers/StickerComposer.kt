package com.lovecomedyromance.stickers

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Build
import java.io.ByteArrayOutputStream
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

/** Turns a photo (or a cut-out subject) plus a caption into a WhatsApp sticker. */
object StickerComposer {

    const val SIZE = 512
    private const val MARGIN = 16f       // WhatsApp asks for a 16 px margin
    private const val BORDER = 10f       // white die-cut border
    private const val TRAY_SIZE = 96
    private const val MAX_BYTES = 100 * 1024
    private const val INK = 0xFF3A1E2C.toInt()

    /**
     * Draws the sticker. If [cutout] is true, [subject] should have a transparent background;
     * otherwise it is cropped to a rounded square.
     */
    fun compose(subject: Bitmap, cutout: Boolean, caption: String, captionColor: Int, typeface: Typeface): Bitmap {
        val out = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(out)
        val inset = MARGIN + BORDER

        val lines = wrap(caption.trim(), typeface)
        val textSize = lines?.second ?: 0f
        val captionHeight = if (lines == null) 0f else lines.first.size * textSize * 1.05f + 8f

        val art = if (cutout) trim(subject) else roundedSquare(subject)
        val box = RectF(inset, inset, SIZE - inset, SIZE - inset - captionHeight)
        val scale = min(box.width() / art.width, box.height() / art.height)
        val w = art.width * scale
        val h = art.height * scale
        val left = box.centerX() - w / 2
        val top = box.bottom - h // sit the subject on top of the caption
        val dst = RectF(left, top, left + w, top + h)

        // White border: the silhouette drawn in white at small offsets all the way round.
        val border = Paint(Paint.FILTER_BITMAP_FLAG).apply {
            colorFilter = PorterDuffColorFilter(Color.WHITE, PorterDuff.Mode.SRC_IN)
        }
        for (i in 0 until 24) {
            val a = Math.toRadians(i * 15.0)
            val o = RectF(dst).apply { offset((cos(a) * BORDER).toFloat(), (sin(a) * BORDER).toFloat()) }
            canvas.drawBitmap(art, null, o, border)
        }
        canvas.drawBitmap(art, null, dst, Paint(Paint.FILTER_BITMAP_FLAG))

        lines?.let { (textLines, size) -> drawCaption(canvas, textLines, size, captionColor, typeface) }
        return out
    }

    /** Encodes as WebP, lowering quality until it is under WhatsApp's 100 KB limit. */
    fun toWebp(sticker: Bitmap): ByteArray {
        @Suppress("DEPRECATION")
        val format = if (Build.VERSION.SDK_INT >= 30) Bitmap.CompressFormat.WEBP_LOSSY else Bitmap.CompressFormat.WEBP
        var quality = 90
        while (true) {
            val bytes = ByteArrayOutputStream().use { sticker.compress(format, quality, it); it.toByteArray() }
            if (bytes.size <= MAX_BYTES || quality <= 20) return bytes
            quality -= 10
        }
    }

    fun tray(sticker: Bitmap): Bitmap = Bitmap.createScaledBitmap(sticker, TRAY_SIZE, TRAY_SIZE, true)

    // Splits the caption into at most two lines and picks the biggest size that fits.
    private fun wrap(caption: String, typeface: Typeface): Pair<List<String>, Float>? {
        if (caption.isEmpty()) return null
        val maxWidth = SIZE - 2 * (MARGIN + BORDER) - 12
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.typeface = typeface }
        val words = caption.split(Regex("\\s+"))
        val options = mutableListOf(listOf(caption))
        for (i in 1 until words.size) {
            options += listOf(words.take(i).joinToString(" "), words.drop(i).joinToString(" "))
        }
        var best: Pair<List<String>, Float>? = null
        for (lines in options) {
            var size = if (lines.size == 1) 84f else 60f
            while (size > 22f) {
                paint.textSize = size
                if (lines.all { paint.measureText(it) <= maxWidth }) break
                size -= 2f
            }
            if (best == null || size > best.second) best = lines to size
        }
        return best
    }

    private fun drawCaption(canvas: Canvas, lines: List<String>, size: Float, color: Int, typeface: Typeface) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            this.typeface = typeface
            textSize = size
            textAlign = Paint.Align.CENTER
            strokeJoin = Paint.Join.ROUND
        }
        val lineHeight = size * 1.05f
        var baseline = SIZE - MARGIN - BORDER - 6f - (lines.size - 1) * lineHeight
        for (line in lines) {
            val x = SIZE / 2f
            paint.style = Paint.Style.STROKE
            paint.color = Color.WHITE
            paint.strokeWidth = size * 0.16f + BORDER * 2
            canvas.drawText(line, x, baseline, paint)
            paint.color = INK
            paint.strokeWidth = size * 0.16f
            canvas.drawText(line, x, baseline, paint)
            paint.style = Paint.Style.FILL
            paint.color = color
            canvas.drawText(line, x, baseline, paint)
            baseline += lineHeight
        }
    }

    // Crops away fully transparent edges so the subject fills the sticker.
    private fun trim(bitmap: Bitmap): Bitmap {
        val w = bitmap.width
        val h = bitmap.height
        val pixels = IntArray(w * h)
        bitmap.getPixels(pixels, 0, w, 0, 0, w, h)
        var minX = w; var minY = h; var maxX = -1; var maxY = -1
        for (y in 0 until h) {
            val row = y * w
            for (x in 0 until w) {
                if ((pixels[row + x] ushr 24) > 16) {
                    if (x < minX) minX = x
                    if (x > maxX) maxX = x
                    if (y < minY) minY = y
                    if (y > maxY) maxY = y
                }
            }
        }
        if (maxX < 0) return bitmap
        return Bitmap.createBitmap(bitmap, minX, minY, maxX - minX + 1, maxY - minY + 1)
    }

    private fun roundedSquare(bitmap: Bitmap): Bitmap {
        val side = min(bitmap.width, bitmap.height)
        val src = Rect((bitmap.width - side) / 2, (bitmap.height - side) / 2, 0, 0).apply {
            right = left + side
            bottom = top + side
        }
        val out = Bitmap.createBitmap(side, side, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(out)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
        val r = side * 0.12f
        canvas.drawRoundRect(RectF(0f, 0f, side.toFloat(), side.toFloat()), r, r, paint)
        paint.xfermode = android.graphics.PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
        canvas.drawBitmap(bitmap, src, Rect(0, 0, side, side), paint)
        return out
    }

    /** Scales a picked photo down so editing stays fast and memory-friendly. */
    fun limitSize(bitmap: Bitmap, maxSide: Int = 1024): Bitmap {
        val longest = maxOf(bitmap.width, bitmap.height)
        if (longest <= maxSide) return bitmap
        val f = maxSide.toFloat() / longest
        return Bitmap.createScaledBitmap(bitmap, (bitmap.width * f).roundToInt(), (bitmap.height * f).roundToInt(), true)
    }
}
