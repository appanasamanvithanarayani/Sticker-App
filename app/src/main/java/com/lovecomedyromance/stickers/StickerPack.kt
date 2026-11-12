package com.lovecomedyromance.stickers

data class Sticker(
    val imageFileName: String,
    val emojis: List<String>,
    val accessibilityText: String,
)

data class StickerPack(
    val identifier: String,
    val name: String,
    val publisher: String,
    val trayImageFile: String,
    val publisherEmail: String,
    val publisherWebsite: String,
    val privacyPolicyWebsite: String,
    val licenseAgreementWebsite: String,
    val imageDataVersion: String,
    val avoidCache: Boolean,
    val animatedStickerPack: Boolean,
    val stickers: List<Sticker>,
    val androidPlayStoreLink: String,
    val iosAppStoreLink: String,
) {
    /** Path of a file belonging to this pack inside the APK's assets folder. */
    fun assetPath(fileName: String) = "$identifier/$fileName"
}
