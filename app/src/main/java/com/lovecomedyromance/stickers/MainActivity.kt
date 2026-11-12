package com.lovecomedyromance.stickers

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.isVisible
import androidx.core.view.updateLayoutParams
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.lovecomedyromance.stickers.databinding.ActivityMainBinding
import com.lovecomedyromance.stickers.databinding.ItemPackBinding

class MainActivity : AddPackActivity() {

    private lateinit var binding: ActivityMainBinding
    private val adapter = PackAdapter()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applySystemBarInsets(binding.root, binding.appBar, binding.packList)
        val fabMargin = resources.getDimensionPixelSize(R.dimen.fab_margin)
        ViewCompat.setOnApplyWindowInsetsListener(binding.makeSticker) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.updateLayoutParams<ViewGroup.MarginLayoutParams> {
                bottomMargin = fabMargin + bars.bottom
                rightMargin = fabMargin + bars.right
            }
            insets
        }

        binding.packList.layoutManager = LinearLayoutManager(this)
        binding.packList.adapter = adapter
        binding.makeSticker.setOnClickListener { openCreator() }
        binding.aiStudio.setOnClickListener { startActivity(Intent(this, AiStudioActivity::class.java)) }
    }

    override fun onResume() {
        super.onResume()
        // "My Stickers" may have changed in another screen.
        adapter.setPacks(StickerPackLoader.allPacks(this))
    }

    override fun onPackStatus(added: Set<String>) = adapter.setAdded(added)

    private fun openCreator() = startActivity(Intent(this, CreateStickerActivity::class.java))

    private fun openPack(pack: StickerPack) = startActivity(
        Intent(this, PackDetailActivity::class.java).putExtra(PackDetailActivity.EXTRA_PACK_ID, pack.identifier),
    )

    private inner class PackAdapter : RecyclerView.Adapter<PackHolder>() {
        private var packs: List<StickerPack> = emptyList()
        private var added: Set<String> = emptySet()

        fun setPacks(list: List<StickerPack>) {
            packs = list
            notifyDataSetChanged()
        }

        fun setAdded(ids: Set<String>) {
            added = ids
            notifyItemRangeChanged(0, packs.size)
        }

        override fun getItemCount() = packs.size

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            PackHolder(ItemPackBinding.inflate(LayoutInflater.from(parent.context), parent, false))

        override fun onBindViewHolder(holder: PackHolder, position: Int) =
            holder.bind(packs[position], packs[position].identifier in added)
    }

    private inner class PackHolder(private val b: ItemPackBinding) : RecyclerView.ViewHolder(b.root) {
        private val previews: List<ImageView> = listOf(b.preview1, b.preview2, b.preview3, b.preview4)

        fun bind(pack: StickerPack, isAdded: Boolean) {
            val px = resources.getDimensionPixelSize(R.dimen.preview_size)
            val count = pack.stickers.size
            b.name.text = pack.name
            b.subtitle.text = if (pack.custom && count == 0) {
                getString(R.string.my_stickers_empty)
            } else {
                resources.getQuantityString(R.plurals.sticker_count, count, count, pack.publisher)
            }

            b.tray.isVisible = count > 0
            if (count > 0) StickerImages.load(lifecycleScope, b.tray, pack, pack.trayImageFile, px)
            b.previewRow.isVisible = count > 0
            previews.forEachIndexed { i, view ->
                val sticker = pack.stickers.getOrNull(i)
                view.isVisible = sticker != null
                if (sticker != null) {
                    StickerImages.load(lifecycleScope, view, pack, sticker.imageFileName, px)
                    view.contentDescription = sticker.accessibilityText
                }
            }

            val needsMore = pack.custom && count < MyStickers.MIN_FOR_WHATSAPP
            b.add.isVisible = !isAdded
            b.added.isVisible = isAdded
            b.add.text = getString(if (needsMore) R.string.create else R.string.add)
            b.add.setOnClickListener { if (needsMore) openCreator() else addToWhatsApp(pack) }
            b.root.setOnClickListener { if (pack.custom && count == 0) openCreator() else openPack(pack) }
        }
    }
}
