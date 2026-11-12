package com.lovecomedyromance.stickers

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import androidx.core.view.isVisible
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.lovecomedyromance.stickers.databinding.ActivityMainBinding
import com.lovecomedyromance.stickers.databinding.ItemPackBinding

class MainActivity : AddPackActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var adapter: PackAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applySystemBarInsets(binding.root, binding.appBar, binding.packList)

        adapter = PackAdapter(StickerPackLoader.load(this))
        binding.packList.layoutManager = LinearLayoutManager(this)
        binding.packList.adapter = adapter
    }

    override fun onPackStatus(added: Set<String>) = adapter.setAdded(added)

    private inner class PackAdapter(private val packs: List<StickerPack>) : RecyclerView.Adapter<PackHolder>() {
        private var added: Set<String> = emptySet()

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
            StickerImages.load(lifecycleScope, b.tray, pack.assetPath(pack.trayImageFile), px)
            b.name.text = pack.name
            b.subtitle.text = resources.getQuantityString(R.plurals.sticker_count, pack.stickers.size, pack.stickers.size, pack.publisher)
            previews.forEachIndexed { i, view ->
                val sticker = pack.stickers.getOrNull(i)
                view.isVisible = sticker != null
                if (sticker != null) {
                    StickerImages.load(lifecycleScope, view, pack.assetPath(sticker.imageFileName), px)
                    view.contentDescription = sticker.accessibilityText
                }
            }
            b.add.isVisible = !isAdded
            b.added.isVisible = isAdded
            b.add.setOnClickListener { addToWhatsApp(pack) }
            b.root.setOnClickListener {
                startActivity(Intent(this@MainActivity, PackDetailActivity::class.java).putExtra(PackDetailActivity.EXTRA_PACK_ID, pack.identifier))
            }
        }
    }
}
