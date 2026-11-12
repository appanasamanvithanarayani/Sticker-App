package com.lovecomedyromance.stickers

import android.content.Context
import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.drawable.Drawable

/** The grey checkerboard that shows which parts of a sticker are transparent. */
class CheckerDrawable(context: Context) : Drawable() {
    private val cell = 12 * context.resources.displayMetrics.density
    private val light = Paint().apply { color = 0xFFFFFFFF.toInt() }
    private val dark = Paint().apply { color = 0xFFE9E3E6.toInt() }

    override fun draw(canvas: Canvas) {
        val b = bounds
        canvas.drawRect(b, light)
        var y = b.top.toFloat()
        var row = 0
        while (y < b.bottom) {
            var x = b.left.toFloat() + if (row % 2 == 0) 0f else cell
            while (x < b.right) {
                canvas.drawRect(x, y, minOf(x + cell, b.right.toFloat()), minOf(y + cell, b.bottom.toFloat()), dark)
                x += cell * 2
            }
            y += cell
            row++
        }
    }

    override fun setAlpha(alpha: Int) = Unit
    override fun setColorFilter(colorFilter: ColorFilter?) = Unit
    @Deprecated("Deprecated in Java")
    override fun getOpacity() = PixelFormat.OPAQUE
}
