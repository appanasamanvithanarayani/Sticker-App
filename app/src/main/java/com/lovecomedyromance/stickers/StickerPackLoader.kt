package com.lovecomedyromance.stickers

import android.content.Context
import org.json.JSONObject

/**
 * Reads the sticker packs from assets/contents.json and checks them against
 * WhatsApp's rules, so a broken pack fails loudly here instead of inside WhatsApp.
 */
object StickerPackLoader {

    private const val CONTENTS_FILE = "contents.json"
    private const val MIN_STICKERS = 3
    private const val MAX_STICKERS = 30
    private const val MAX_EMOJIS = 3
    private const val MAX_TEXT = 128
    private val IDENTIFIER = Regex("[\\w\\-.,' ]+")

    @Volatile
    private var cached: List<StickerPack>? = null

    /** The packs that ship inside the app. */
    fun assetPacks(context: Context): List<StickerPack> =
        cached ?: synchronized(this) {
            cached ?: parse(context.applicationContext).also { cached = it }
        }

    /** Every pack to show in the app, with "My Stickers" first. */
    fun allPacks(context: Context): List<StickerPack> = listOf(MyStickers.pack(context)) + assetPacks(context)

    /** The packs WhatsApp may read: "My Stickers" only counts once it has enough stickers. */
    fun packsForWhatsApp(context: Context): List<StickerPack> {
        val mine = MyStickers.pack(context)
        return if (mine.stickers.size >= MyStickers.MIN_FOR_WHATSAPP) listOf(mine) + assetPacks(context) else assetPacks(context)
    }

    fun find(context: Context, identifier: String): StickerPack? =
        if (identifier == MyStickers.IDENTIFIER) MyStickers.pack(context)
        else assetPacks(context).firstOrNull { it.identifier == identifier }

    private fun parse(context: Context): List<StickerPack> {
        val json = context.assets.open(CONTENTS_FILE).bufferedReader().use { JSONObject(it.readText()) }
        val playLink = json.optString("android_play_store_link")
        val iosLink = json.optString("ios_app_store_link")
        val packsJson = json.getJSONArray("sticker_packs")

        val packs = (0 until packsJson.length()).map { i ->
            val p = packsJson.getJSONObject(i)
            val stickersJson = p.getJSONArray("stickers")
            val stickers = (0 until stickersJson.length()).map { j ->
                val s = stickersJson.getJSONObject(j)
                val emojis = s.optJSONArray("emojis")
                Sticker(
                    imageFileName = s.getString("image_file"),
                    emojis = if (emojis == null) emptyList() else (0 until emojis.length()).map { emojis.getString(it) },
                    accessibilityText = s.optString("accessibility_text"),
                )
            }
            StickerPack(
                identifier = p.getString("identifier"),
                name = p.getString("name"),
                publisher = p.getString("publisher"),
                trayImageFile = p.getString("tray_image_file"),
                publisherEmail = p.optString("publisher_email"),
                publisherWebsite = p.optString("publisher_website"),
                privacyPolicyWebsite = p.optString("privacy_policy_website"),
                licenseAgreementWebsite = p.optString("license_agreement_website"),
                imageDataVersion = p.optString("image_data_version", "1"),
                avoidCache = p.optBoolean("avoid_cache", false),
                animatedStickerPack = p.optBoolean("animated_sticker_pack", false),
                stickers = stickers,
                androidPlayStoreLink = playLink,
                iosAppStoreLink = iosLink,
            )
        }
        packs.forEach { validate(context, it) }
        require(packs.map { it.identifier }.toSet().size == packs.size) { "Sticker pack identifiers must be unique" }
        return packs
    }

    private fun validate(context: Context, pack: StickerPack) {
        val id = pack.identifier
        require(IDENTIFIER.matches(id)) { "Pack identifier '$id' has characters WhatsApp does not allow" }
        require(pack.name.isNotBlank() && pack.name.length <= MAX_TEXT) { "Pack '$id' needs a name of 1-$MAX_TEXT characters" }
        require(pack.publisher.isNotBlank() && pack.publisher.length <= MAX_TEXT) { "Pack '$id' needs a publisher of 1-$MAX_TEXT characters" }
        require(pack.stickers.size in MIN_STICKERS..MAX_STICKERS) {
            "Pack '$id' has ${pack.stickers.size} stickers; WhatsApp needs $MIN_STICKERS-$MAX_STICKERS"
        }
        val files = context.assets.list(id)?.toSet().orEmpty()
        require(pack.trayImageFile in files) { "Pack '$id' is missing its tray image ${pack.trayImageFile}" }
        pack.stickers.forEach { s ->
            require(s.imageFileName in files) { "Pack '$id' is missing ${s.imageFileName}" }
            require(s.emojis.size <= MAX_EMOJIS) { "${s.imageFileName} has more than $MAX_EMOJIS emojis" }
        }
    }
}
