package com.lovecomedyromance.stickers

import android.app.Activity
import android.content.ActivityNotFoundException
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.lifecycle.lifecycleScope
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Shared "Add to WhatsApp" flow for the screens that show packs. */
abstract class AddPackActivity : AppCompatActivity() {

    private var pendingPack: StickerPack? = null

    private val addPack = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val pack = pendingPack
        pendingPack = null
        if (result.resultCode == Activity.RESULT_OK) {
            Toast.makeText(this, getString(R.string.pack_added, pack?.name.orEmpty()), Toast.LENGTH_SHORT).show()
        } else {
            val error = result.data?.getStringExtra(WhatsApp.EXTRA_VALIDATION_ERROR)
            if (error != null) {
                Log.e(TAG, "WhatsApp rejected pack ${pack?.identifier}: $error")
                showMessage(R.string.add_failed_title, getString(R.string.add_failed_message, error))
            }
        }
        refreshPackStatus()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // White status bar icons over the pink header, in light and dark themes.
        enableEdgeToEdge(statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT))
        super.onCreate(savedInstanceState)
    }

    override fun onResume() {
        super.onResume()
        refreshPackStatus()
    }

    /** Called whenever the "added" state of the packs may have changed. */
    protected abstract fun onPackStatus(added: Set<String>)

    protected fun refreshPackStatus() {
        lifecycleScope.launch {
            val added = withContext(Dispatchers.IO) {
                StickerPackLoader.packsForWhatsApp(this@AddPackActivity)
                    .filter { WhatsApp.isPackAdded(this@AddPackActivity, it.identifier) }
                    .map { it.identifier }
                    .toSet()
            }
            onPackStatus(added)
        }
    }

    protected fun addToWhatsApp(pack: StickerPack) {
        lifecycleScope.launch {
            val intent = withContext(Dispatchers.IO) { WhatsApp.addPackIntent(this@AddPackActivity, pack) }
            if (intent == null) {
                showMessage(R.string.no_whatsapp_title, getString(R.string.no_whatsapp_message))
                return@launch
            }
            try {
                pendingPack = pack
                addPack.launch(intent)
            } catch (e: ActivityNotFoundException) {
                pendingPack = null
                showMessage(R.string.no_whatsapp_title, getString(R.string.whatsapp_too_old))
            }
        }
    }

    private fun showMessage(title: Int, message: String) {
        MaterialAlertDialogBuilder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton(android.R.string.ok, null)
            .show()
    }

    /** Pads [top] below the status bar and [bottom] above the navigation bar. */
    protected fun applySystemBarInsets(root: View, top: View, bottom: View) {
        val topStart = top.paddingTop
        val bottomStart = bottom.paddingBottom
        ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            top.updatePadding(top = topStart + bars.top)
            bottom.updatePadding(bottom = bottomStart + bars.bottom)
            insets
        }
    }

    companion object {
        private const val TAG = "AddPackActivity"
    }
}
