package com.lovecomedyromance.stickers

import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.lovecomedyromance.stickers.databinding.ActivityPackDetailBinding
import com.lovecomedyromance.stickers.databinding.DialogStickerBinding
import com.lovecomedyromance.stickers.databinding.ItemStickerBinding

class PackDetailActivity : AddPackActivity() {

    private lateinit var binding: ActivityPackDetailBinding
    private lateinit var pack: StickerPack

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val found = intent.getStringExtra(EXTRA_PACK_ID)?.let { StickerPackLoader.find(this, it) }
        if (found == null) {
            finish()
            return
        }
        pack = found

        binding = ActivityPackDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applySystemBarInsets(binding.root, binding.appBar, binding.bottomBar)
        binding.toolbar.title = pack.name
        binding.toolbar.setNavigationOnClickListener { finish() }

        StickerImages.load(lifecycleScope, binding.tray, pack.assetPath(pack.trayImageFile), resources.getDimensionPixelSize(R.dimen.preview_size))
        binding.name.text = pack.name
        binding.subtitle.text = resources.getQuantityString(R.plurals.sticker_count, pack.stickers.size, pack.stickers.size, pack.publisher)

        binding.stickerGrid.layoutManager = GridLayoutManager(this, resources.getInteger(R.integer.grid_columns))
        binding.stickerGrid.adapter = StickerAdapter()
        binding.add.setOnClickListener { addToWhatsApp(pack) }
    }

    override fun onPackStatus(added: Set<String>) {
        if (!::binding.isInitialized) return
        val isAdded = pack.identifier in added
        binding.add.isVisible = !isAdded
        binding.added.isVisible = isAdded
    }

    private fun showSticker(sticker: Sticker) {
        val dialog = DialogStickerBinding.inflate(layoutInflater)
        StickerImages.load(lifecycleScope, dialog.image, pack.assetPath(sticker.imageFileName), 512)
        dialog.image.contentDescription = sticker.accessibilityText
        dialog.emojis.text = sticker.emojis.joinToString("  ")
        MaterialAlertDialogBuilder(this)
            .setView(dialog.root)
            .setPositiveButton(R.string.close, null)
            .show()
    }

    private inner class StickerAdapter : RecyclerView.Adapter<StickerHolder>() {
        override fun getItemCount() = pack.stickers.size

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            StickerHolder(ItemStickerBinding.inflate(LayoutInflater.from(parent.context), parent, false).root)

        override fun onBindViewHolder(holder: StickerHolder, position: Int) {
            val sticker = pack.stickers[position]
            val image = holder.image
            StickerImages.load(lifecycleScope, image, pack.assetPath(sticker.imageFileName), resources.getDimensionPixelSize(R.dimen.grid_sticker_size))
            image.contentDescription = sticker.accessibilityText
            image.setOnClickListener { showSticker(sticker) }
        }
    }

    private class StickerHolder(val image: ImageView) : RecyclerView.ViewHolder(image)

    companion object {
        const val EXTRA_PACK_ID = "pack_id"
    }
}
