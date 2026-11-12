package com.lovecomedyromance.stickers

import android.content.Context
import android.content.res.AssetFileDescriptor
import android.os.ParcelFileDescriptor
import java.io.InputStream

/** Opens a pack's image files, whether they ship in the APK or were made in the app. */
object StickerFiles {

    fun open(context: Context, pack: StickerPack, fileName: String): InputStream =
        if (pack.custom) MyStickers.file(context, fileName).inputStream()
        else context.assets.open(pack.assetPath(fileName))

    fun openFd(context: Context, pack: StickerPack, fileName: String): AssetFileDescriptor =
        if (pack.custom) {
            val pfd = ParcelFileDescriptor.open(MyStickers.file(context, fileName), ParcelFileDescriptor.MODE_READ_ONLY)
            AssetFileDescriptor(pfd, 0, AssetFileDescriptor.UNKNOWN_LENGTH)
        } else {
            context.assets.openFd(pack.assetPath(fileName))
        }
}
