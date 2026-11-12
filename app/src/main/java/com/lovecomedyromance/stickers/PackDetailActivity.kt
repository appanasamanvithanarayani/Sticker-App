package com.lovecomedyromance.stickers

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.lovecomedyromance.stickers.databinding.ActivityPackDetailBinding
import com.lovecomedyromance.stickers.databinding.DialogStickerBinding
import com.lovecomedyromance.stickers.databinding.ItemAddStickerBinding
import com.lovecomedyromance.stickers.databinding.ItemStickerBinding

class PackDetailActivity : AddPackActivity() {

    private lateinit var binding: ActivityPackDetailBinding
    private lateinit var packId: String
    private lateinit var pack: StickerPack
    private var added: Set<String> = emptySet()
    private val adapter = StickerAdapter()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val found = intent.getStringExtra(EXTRA_PACK_ID)?.let { StickerPackLoader.find(this, it) }
        if (found == null) {
            finish()
            return
        }
        pack = found
        packId = found.identifier

        binding = ActivityPackDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applySystemBarInsets(binding.root, binding.appBar, binding.bottomBar)
        binding.toolbar.setNavigationOnClickListener { finish() }

        binding.stickerGrid.layoutManager = GridLayoutManager(this, resources.getInteger(R.integer.grid_columns))
        binding.stickerGrid.adapter = adapter
        binding.add.setOnClickListener {
            if (needsMore()) openCreator() else addToWhatsApp(pack)
        }
        bindPack()
    }

    override fun onResume() {
        super.onResume()
        if (::pack.isInitialized && pack.custom) {
            pack = MyStickers.pack(this)
            bindPack()
        }
    }

    private fun needsMore() = pack.custom && pack.stickers.size < MyStickers.MIN_FOR_WHATSAPP

    private fun bindPack() {
        binding.toolbar.title = pack.name
        val count = pack.stickers.size
        binding.tray.isVisible = count > 0
        if (count > 0) {
            StickerImages.load(lifecycleScope, binding.tray, pack, pack.trayImageFile, resources.getDimensionPixelSize(R.dimen.preview_size))
        }
        binding.name.text = pack.name
        binding.subtitle.text = resources.getQuantityString(R.plurals.sticker_count, count, count, pack.publisher)
        binding.hint.isVisible = pack.custom
        adapter.notifyDataSetChanged()
        bindAddButton()
    }

    private fun bindAddButton() {
        val isAdded = packId in added && !needsMore()
        binding.add.isVisible = !isAdded
        binding.added.isVisible = isAdded
        binding.add.text = if (needsMore()) {
            val missing = MyStickers.MIN_FOR_WHATSAPP - pack.stickers.size
            resources.getQuantityString(R.plurals.make_more, missing, missing)
        } else {
            getString(R.string.add_to_whatsapp)
        }
    }

    override fun onPackStatus(added: Set<String>) {
        this.added = added
        if (::binding.isInitialized) bindAddButton()
    }

    private fun openCreator() = startActivity(Intent(this, CreateStickerActivity::class.java))

    private fun showSticker(sticker: Sticker) {
        val dialog = DialogStickerBinding.inflate(layoutInflater)
        StickerImages.load(lifecycleScope, dialog.image, pack, sticker.imageFileName, 512)
        dialog.image.contentDescription = sticker.accessibilityText
        dialog.emojis.text = sticker.emojis.joinToString("  ")
        val builder = MaterialAlertDialogBuilder(this)
            .setView(dialog.root)
            .setPositiveButton(R.string.close, null)
        if (pack.custom) builder.setNegativeButton(R.string.delete) { _, _ -> confirmDelete(sticker) }
        builder.show()
    }

    private fun confirmDelete(sticker: Sticker) {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.delete_title)
            .setMessage(R.string.delete_message)
            .setNegativeButton(android.R.string.cancel, null)
            .setPositiveButton(R.string.delete) { _, _ ->
                MyStickers.delete(this, sticker.imageFileName)
                pack = MyStickers.pack(this)
                bindPack()
                refreshPackStatus()
            }
            .show()
    }

    // For "My Stickers" the first tile is a "+" that opens the sticker maker.
    private inner class StickerAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
        private fun showsAddTile() = pack.custom && pack.stickers.size < MyStickers.MAX_STICKERS
        private fun offset() = if (showsAddTile()) 1 else 0

        override fun getItemCount() = if (::pack.isInitialized) pack.stickers.size + offset() else 0

        override fun getItemViewType(position: Int) = if (showsAddTile() && position == 0) TYPE_ADD else TYPE_STICKER

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
            val inflater = LayoutInflater.from(parent.context)
            return if (viewType == TYPE_ADD) {
                object : RecyclerView.ViewHolder(ItemAddStickerBinding.inflate(inflater, parent, false).root) {}
            } else {
                StickerHolder(ItemStickerBinding.inflate(inflater, parent, false).root)
            }
        }

        override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
            if (holder !is StickerHolder) {
                holder.itemView.setOnClickListener { openCreator() }
                return
            }
            val sticker = pack.stickers[position - offset()]
            val image = holder.image
            StickerImages.load(lifecycleScope, image, pack, sticker.imageFileName, resources.getDimensionPixelSize(R.dimen.grid_sticker_size))
            image.contentDescription = sticker.accessibilityText
            image.setOnClickListener { showSticker(sticker) }
            image.setOnLongClickListener(if (pack.custom) View.OnLongClickListener { confirmDelete(sticker); true } else null)
        }
    }

    private class StickerHolder(val image: ImageView) : RecyclerView.ViewHolder(image)

    companion object {
        const val EXTRA_PACK_ID = "pack_id"
        private const val TYPE_ADD = 0
        private const val TYPE_STICKER = 1
    }
}
