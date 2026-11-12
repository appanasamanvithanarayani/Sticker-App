package com.lovecomedyromance.stickers

import android.content.ContentProvider
import android.content.ContentValues
import android.content.UriMatcher
import android.content.res.AssetFileDescriptor
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import java.io.IOException

/**
 * The provider WhatsApp queries to read the sticker packs. The URI layout and the
 * column names are fixed by WhatsApp:
 *
 *   content://<authority>/metadata                     all packs
 *   content://<authority>/metadata/<pack id>           one pack
 *   content://<authority>/stickers/<pack id>           the stickers of a pack
 *   content://<authority>/stickers_asset/<id>/<file>   an image file
 */
class StickerContentProvider : ContentProvider() {

    private lateinit var matcher: UriMatcher
    private lateinit var authority: String

    override fun onCreate(): Boolean {
        val ctx = context ?: return false
        authority = authorityFor(ctx.packageName)
        matcher = UriMatcher(UriMatcher.NO_MATCH).apply {
            addURI(authority, METADATA, CODE_ALL_PACKS)
            addURI(authority, "$METADATA/*", CODE_ONE_PACK)
            addURI(authority, "$STICKERS/*", CODE_STICKERS)
            addURI(authority, "$STICKERS_ASSET/*/*", CODE_ASSET)
        }
        return true
    }

    private fun packs() = StickerPackLoader.packsForWhatsApp(requireNotNull(context))

    override fun query(
        uri: Uri, projection: Array<String>?, selection: String?,
        selectionArgs: Array<String>?, sortOrder: String?,
    ): Cursor = when (matcher.match(uri)) {
        CODE_ALL_PACKS -> packCursor(uri, packs())
        CODE_ONE_PACK -> packCursor(uri, packs().filter { it.identifier == uri.lastPathSegment })
        CODE_STICKERS -> stickerCursor(uri, packs().firstOrNull { it.identifier == uri.lastPathSegment })
        else -> throw IllegalArgumentException("Unknown URI: $uri")
    }

    private fun packCursor(uri: Uri, packs: List<StickerPack>): Cursor {
        val cursor = MatrixCursor(PACK_COLUMNS)
        packs.forEach { p ->
            cursor.addRow(
                arrayOf<Any>(
                    p.identifier, p.name, p.publisher, p.trayImageFile,
                    p.androidPlayStoreLink, p.iosAppStoreLink,
                    p.publisherEmail, p.publisherWebsite, p.privacyPolicyWebsite, p.licenseAgreementWebsite,
                    p.imageDataVersion, if (p.avoidCache) 1 else 0, if (p.animatedStickerPack) 1 else 0,
                ),
            )
        }
        cursor.setNotificationUri(requireNotNull(context).contentResolver, uri)
        return cursor
    }

    private fun stickerCursor(uri: Uri, pack: StickerPack?): Cursor {
        val cursor = MatrixCursor(STICKER_COLUMNS)
        pack?.stickers?.forEach { s ->
            cursor.addRow(arrayOf<Any>(s.imageFileName, s.emojis.joinToString(","), s.accessibilityText))
        }
        cursor.setNotificationUri(requireNotNull(context).contentResolver, uri)
        return cursor
    }

    override fun openAssetFile(uri: Uri, mode: String): AssetFileDescriptor? {
        if (matcher.match(uri) != CODE_ASSET) throw IllegalArgumentException("Unknown URI: $uri")
        val segments = uri.pathSegments
        require(segments.size == 3) { "Bad asset URI: $uri" }
        val (packId, fileName) = segments[1] to segments[2]
        val pack = packs().firstOrNull { it.identifier == packId } ?: return null
        // Only serve files that belong to the pack, never arbitrary asset paths.
        val known = fileName == pack.trayImageFile || pack.stickers.any { it.imageFileName == fileName }
        if (!known) return null
        return try {
            StickerFiles.openFd(requireNotNull(context), pack, fileName)
        } catch (e: IOException) {
            null
        }
    }

    override fun getType(uri: Uri): String = when (matcher.match(uri)) {
        CODE_ALL_PACKS -> "vnd.android.cursor.dir/vnd.$authority.$METADATA"
        CODE_ONE_PACK -> "vnd.android.cursor.item/vnd.$authority.$METADATA"
        CODE_STICKERS -> "vnd.android.cursor.dir/vnd.$authority.$STICKERS"
        CODE_ASSET -> if (uri.lastPathSegment.orEmpty().endsWith(".png")) "image/png" else "image/webp"
        else -> throw IllegalArgumentException("Unknown URI: $uri")
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? = throw UnsupportedOperationException()
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = throw UnsupportedOperationException()
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<String>?): Int =
        throw UnsupportedOperationException()

    companion object {
        fun authorityFor(packageName: String) = "$packageName.stickercontentprovider"

        private const val METADATA = "metadata"
        private const val STICKERS = "stickers"
        private const val STICKERS_ASSET = "stickers_asset"

        private const val CODE_ALL_PACKS = 1
        private const val CODE_ONE_PACK = 2
        private const val CODE_STICKERS = 3
        private const val CODE_ASSET = 4

        private val PACK_COLUMNS = arrayOf(
            "sticker_pack_identifier",
            "sticker_pack_name",
            "sticker_pack_publisher",
            "sticker_pack_icon",
            "android_play_store_link",
            "ios_app_download_link",
            "sticker_pack_publisher_email",
            "sticker_pack_publisher_website",
            "sticker_pack_privacy_policy_website",
            "sticker_pack_license_agreement_website",
            "image_data_version",
            "whatsapp_will_not_cache_stickers",
            "animated_sticker_pack",
        )

        private val STICKER_COLUMNS = arrayOf(
            "sticker_file_name",
            "sticker_emoji",
            "sticker_accessibility_text",
        )
    }
}
