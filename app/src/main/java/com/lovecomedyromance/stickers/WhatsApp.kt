package com.lovecomedyromance.stickers

import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri

/** Talks to WhatsApp: is it installed, does it already have a pack, and the "add pack" intent. */
object WhatsApp {

    const val CONSUMER = "com.whatsapp"
    const val BUSINESS = "com.whatsapp.w4b"

    const val EXTRA_VALIDATION_ERROR = "validation_error"

    private const val ACTION_ENABLE_STICKER_PACK = "com.whatsapp.intent.action.ENABLE_STICKER_PACK"
    private const val EXTRA_PACK_ID = "sticker_pack_id"
    private const val EXTRA_PACK_AUTHORITY = "sticker_pack_authority"
    private const val EXTRA_PACK_NAME = "sticker_pack_name"

    fun isInstalled(context: Context, packageName: String): Boolean = try {
        context.packageManager.getApplicationInfo(packageName, 0).enabled
    } catch (e: PackageManager.NameNotFoundException) {
        false
    }

    fun installedApps(context: Context): List<String> = listOf(CONSUMER, BUSINESS).filter { isInstalled(context, it) }

    /** True if [packageName] already has this sticker pack. */
    fun hasPack(context: Context, packageName: String, packId: String): Boolean {
        if (!isInstalled(context, packageName)) return false
        val providerAuthority = "$packageName.provider.sticker_whitelist_check"
        if (context.packageManager.resolveContentProvider(providerAuthority, PackageManager.GET_META_DATA) == null) {
            return false
        }
        val uri = Uri.Builder()
            .scheme(ContentResolver.SCHEME_CONTENT)
            .authority(providerAuthority)
            .appendPath("is_whitelisted")
            .appendQueryParameter("authority", StickerContentProvider.authorityFor(context.packageName))
            .appendQueryParameter("identifier", packId)
            .build()
        return try {
            context.contentResolver.query(uri, null, null, null, null)?.use { c ->
                c.moveToFirst() && c.getInt(c.getColumnIndexOrThrow("result")) == 1
            } ?: false
        } catch (e: Exception) {
            false
        }
    }

    /** True once every installed WhatsApp app has the pack (false if none is installed). */
    fun isPackAdded(context: Context, packId: String): Boolean {
        val apps = installedApps(context)
        return apps.isNotEmpty() && apps.all { hasPack(context, it, packId) }
    }

    /**
     * Builds the intent that asks WhatsApp to add the pack, or null if no WhatsApp app
     * is installed. If only one app still needs the pack, the intent targets that app;
     * otherwise Android lets the user choose.
     */
    fun addPackIntent(context: Context, pack: StickerPack): Intent? {
        val missing = installedApps(context).filterNot { hasPack(context, it, pack.identifier) }
        val target = when {
            missing.size == 1 -> missing.first()
            missing.isEmpty() -> installedApps(context).firstOrNull() ?: return null
            else -> null
        }
        return Intent(ACTION_ENABLE_STICKER_PACK).apply {
            putExtra(EXTRA_PACK_ID, pack.identifier)
            putExtra(EXTRA_PACK_AUTHORITY, StickerContentProvider.authorityFor(context.packageName))
            putExtra(EXTRA_PACK_NAME, pack.name)
            target?.let { setPackage(it) }
        }
    }
}
