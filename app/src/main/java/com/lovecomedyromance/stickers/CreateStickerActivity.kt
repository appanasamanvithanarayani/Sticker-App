package com.lovecomedyromance.stickers

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.graphics.Matrix
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.content.res.ResourcesCompat
import androidx.core.view.isVisible
import androidx.core.widget.doAfterTextChanged
import androidx.exifinterface.media.ExifInterface
import androidx.lifecycle.ViewModel
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.viewModelScope
import com.google.android.material.chip.Chip
import com.lovecomedyromance.stickers.databinding.ActivityCreateStickerBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Makes a sticker from one of the user's photos: cut out, caption, save to "My Stickers". */
class CreateStickerActivity : AddPackActivity() {

    /** Keeps the picked photo and its cut-out across rotation. */
    class EditorState : ViewModel() {
        var photo: Bitmap? = null
        var cutout: Bitmap? = null
        var removeBackground = true
        var captionColor = 0
        var emoji = "😂"
        var cutoutJob: Job? = null
        /** Set by whichever activity instance is currently showing. */
        var onCutoutDone: (() -> Unit)? = null
    }

    private val state: EditorState by viewModels()
    private lateinit var binding: ActivityCreateStickerBinding
    private lateinit var typeface: Typeface
    private var renderJob: Job? = null

    private val pickPhoto = registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) loadPhoto(uri) else if (state.photo == null) finish()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCreateStickerBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applySystemBarInsets(binding.root, binding.appBar, binding.bottomBar)
        binding.toolbar.setNavigationOnClickListener { finish() }
        typeface = ResourcesCompat.getFont(this, R.font.fredoka_bold) ?: Typeface.DEFAULT_BOLD
        if (state.captionColor == 0) state.captionColor = getColor(R.color.caption_yellow)

        binding.preview.background = CheckerDrawable(this)
        binding.choosePhoto.setOnClickListener { launchPicker() }
        binding.removeBackground.isChecked = state.removeBackground
        binding.removeBackground.setOnCheckedChangeListener { _, checked ->
            state.removeBackground = checked
            if (checked && state.cutout == null) startCutout() else render()
        }
        binding.caption.doAfterTextChanged { render() }

        resources.getStringArray(R.array.quick_captions).forEach { text ->
            binding.quickCaptions.addView(Chip(this).apply {
                this.text = text
                setOnClickListener { binding.caption.setText(text); binding.caption.setSelection(text.length) }
            })
        }
        val colors = mapOf(
            R.id.colorYellow to R.color.caption_yellow,
            R.id.colorWhite to R.color.white,
            R.id.colorPink to R.color.caption_pink,
        )
        binding.captionColors.check(colors.entries.firstOrNull { getColor(it.value) == state.captionColor }?.key ?: R.id.colorYellow)
        binding.captionColors.addOnButtonCheckedListener { _, id, checked ->
            if (checked) {
                state.captionColor = getColor(colors.getValue(id))
                render()
            }
        }
        resources.getStringArray(R.array.sticker_emojis).forEach { e ->
            binding.emojis.addView(Chip(this).apply {
                text = e
                isCheckable = true
                isChecked = e == state.emoji
                setOnCheckedChangeListener { _, checked -> if (checked) state.emoji = e }
            })
        }
        binding.save.setOnClickListener { save() }

        state.onCutoutDone = ::onCutoutFinished
        when {
            state.photo == null && savedInstanceState == null -> launchPicker()
            state.cutoutJob?.isActive == true -> setBusy(true, R.string.removing_background)
            else -> render()
        }
    }

    override fun onDestroy() {
        if (state.onCutoutDone == ::onCutoutFinished) state.onCutoutDone = null
        super.onDestroy()
    }

    private fun onCutoutFinished() {
        binding.removeBackground.isChecked = state.removeBackground
        setBusy(false)
        render()
    }

    private fun launchPicker() {
        if (MyStickers.isFull(this)) {
            Toast.makeText(this, getString(R.string.my_stickers_full, MyStickers.MAX_STICKERS), Toast.LENGTH_LONG).show()
            finish()
            return
        }
        pickPhoto.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
    }

    private fun loadPhoto(uri: Uri) {
        lifecycleScope.launch {
            setBusy(true, R.string.loading_photo)
            val bitmap = withContext(Dispatchers.IO) { decode(uri) }
            if (bitmap == null) {
                setBusy(false)
                Toast.makeText(this@CreateStickerActivity, R.string.photo_failed, Toast.LENGTH_LONG).show()
                return@launch
            }
            state.photo = bitmap
            state.cutout = null
            state.cutoutJob?.cancel()
            if (state.removeBackground) startCutout() else { setBusy(false); render() }
        }
    }

    private fun startCutout() {
        val photo = state.photo ?: return
        state.cutoutJob?.cancel()
        setBusy(true, R.string.removing_background)
        // Runs in the ViewModel so it survives rotation.
        state.cutoutJob = state.viewModelScope.launch {
            val result = BackgroundRemover.removeBackground(applicationContext, photo)
            if (result == null) {
                state.removeBackground = false
                Toast.makeText(applicationContext, R.string.cutout_failed, Toast.LENGTH_LONG).show()
            }
            state.cutout = result
            state.onCutoutDone?.invoke()
        }
    }

    private fun captionText() = binding.caption.text?.toString().orEmpty()

    // Safe to call off the main thread: it only reads state captured beforehand.
    private fun currentSticker(caption: String): Bitmap? {
        val photo = state.photo ?: return null
        val useCutout = state.removeBackground && state.cutout != null
        return StickerComposer.compose(
            subject = if (useCutout) state.cutout!! else photo,
            cutout = useCutout,
            caption = caption,
            captionColor = state.captionColor,
            typeface = typeface,
        )
    }

    private fun render() {
        if (state.photo == null || state.cutoutJob?.isActive == true) return
        renderJob?.cancel()
        val caption = captionText()
        renderJob = lifecycleScope.launch {
            val sticker = withContext(Dispatchers.Default) { currentSticker(caption) } ?: return@launch
            binding.preview.setImageBitmap(sticker)
            binding.save.isEnabled = true
        }
    }

    private fun save() {
        binding.save.isEnabled = false
        val caption = captionText()
        val emoji = state.emoji
        lifecycleScope.launch {
            val ok = withContext(Dispatchers.Default) {
                val sticker = currentSticker(caption) ?: return@withContext false
                val webp = StickerComposer.toWebp(sticker)
                withContext(Dispatchers.IO) {
                    MyStickers.add(applicationContext, webp, StickerComposer.tray(sticker), emoji, caption)
                }
                true
            }
            if (ok) {
                val count = MyStickers.pack(this@CreateStickerActivity).stickers.size
                val msg = if (count < MyStickers.MIN_FOR_WHATSAPP) {
                    resources.getQuantityString(R.plurals.make_more, MyStickers.MIN_FOR_WHATSAPP - count, MyStickers.MIN_FOR_WHATSAPP - count)
                } else {
                    getString(R.string.sticker_saved)
                }
                Toast.makeText(this@CreateStickerActivity, msg, Toast.LENGTH_LONG).show()
                finish()
            } else {
                binding.save.isEnabled = true
            }
        }
    }

    private fun setBusy(busy: Boolean, message: Int = 0) {
        binding.progress.isVisible = busy
        binding.progressText.isVisible = busy
        if (message != 0) binding.progressText.setText(message)
        binding.save.isEnabled = !busy && state.photo != null
    }

    private fun decode(uri: Uri): Bitmap? = try {
        val bitmap = if (Build.VERSION.SDK_INT >= 28) {
            // ImageDecoder applies the EXIF rotation itself.
            ImageDecoder.decodeBitmap(ImageDecoder.createSource(contentResolver, uri)) { decoder, info, _ ->
                decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                val longest = maxOf(info.size.width, info.size.height)
                if (longest > 1024) decoder.setTargetSampleSize(longest / 1024)
            }
        } else {
            val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, opts) }
            var sample = 1
            while (maxOf(opts.outWidth, opts.outHeight) / (sample * 2) >= 1024) sample *= 2
            val raw = contentResolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
            }
            val rotation = contentResolver.openInputStream(uri)?.use { ExifInterface(it).rotationDegrees } ?: 0
            if (raw != null && rotation != 0) {
                Bitmap.createBitmap(raw, 0, 0, raw.width, raw.height, Matrix().apply { postRotate(rotation.toFloat()) }, true)
            } else raw
        }
        bitmap?.let { StickerComposer.limitSize(it.copy(Bitmap.Config.ARGB_8888, false)) }
    } catch (e: Exception) {
        null
    }

    override fun onPackStatus(added: Set<String>) = Unit
}
