package com.lovecomedyromance.stickers

import android.content.Context
import android.graphics.Bitmap
import com.google.android.gms.common.moduleinstall.ModuleInstall
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import kotlinx.coroutines.delay
import kotlinx.coroutines.tasks.await

/**
 * Cuts the main subject out of a photo with ML Kit, on the device. Photos never leave the phone.
 * The model is a Google Play services module that is downloaded the first time it is needed.
 */
object BackgroundRemover {

    private val segmenter by lazy {
        SubjectSegmentation.getClient(SubjectSegmenterOptions.Builder().enableForegroundBitmap().build())
    }

    /** Returns the subject on a transparent background, or null if it could not be done. */
    suspend fun removeBackground(context: Context, photo: Bitmap): Bitmap? {
        val installer = ModuleInstall.getClient(context)
        try {
            if (!installer.areModulesAvailable(segmenter).await().areModulesAvailable()) {
                installer.installModules(ModuleInstallRequest.newBuilder().addApi(segmenter).build()).await()
            }
        } catch (e: Exception) {
            return null // no Google Play services, or the download failed
        }
        // The first run can fail while the freshly downloaded module is still being set up.
        repeat(10) {
            try {
                return segmenter.process(InputImage.fromBitmap(photo, 0)).await().foregroundBitmap
            } catch (e: Exception) {
                delay(1500)
            }
        }
        return null
    }
}
