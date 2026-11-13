package com.lovecomedyromance.stickers

import android.app.Application
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.viewModels
import androidx.core.content.res.ResourcesCompat
import androidx.core.view.isVisible
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewModelScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.firebase.ai.type.APINotConfiguredException
import com.google.firebase.ai.type.InvalidAPIKeyException
import com.google.firebase.ai.type.PromptBlockedException
import com.google.firebase.ai.type.QuotaExceededException
import com.google.firebase.ai.type.RequestTimeoutException
import com.google.firebase.ai.type.ServerException
import com.google.firebase.ai.type.ServiceDisabledException
import com.google.firebase.ai.type.UnsupportedUserLocationException
import com.google.firebase.ai.type.ResponseStoppedException
import com.lovecomedyromance.stickers.databinding.ActivityAiStudioBinding
import com.lovecomedyromance.stickers.databinding.ItemAiStickerBinding
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Describe a scenario, pick a genre, and Gemini makes a set of stickers for it. */
class AiStudioActivity : AddPackActivity() {

    data class Result(val id: Int, val idea: AiStickerGenerator.Idea, val sticker: Bitmap, val selected: Boolean = true)

    data class UiState(
        val busy: Boolean = false,
        val status: String = "",
        val progress: Int = 0,
        val results: List<Result> = emptyList(),
        val error: String? = null,
    )

    /** Runs generation outside the activity so it survives rotation. */
    class StudioModel(app: Application) : AndroidViewModel(app) {
        val state = MutableStateFlow(UiState())
        private val typeface: Typeface = ResourcesCompat.getFont(app, R.font.fredoka_bold) ?: Typeface.DEFAULT_BOLD
        private var nextId = 0

        fun generate(scenario: String, genre: String, language: String, style: String, drawn: Boolean) {
            val app = getApplication<Application>()
            if (state.value.busy) return
            AiQuota.use(app, if (drawn) AiQuota.Kind.DRAWN else AiQuota.Kind.FREE)
            state.value = UiState(busy = true, status = app.getString(R.string.ai_status_planning), progress = 5)
            viewModelScope.launch {
                if (!drawn) {
                    generateWithCharacters(app, scenario, genre, language)
                    return@launch
                }
                try {
                    val ideas = AiStickerGenerator.planIdeas(scenario, genre, language)
                    ideas.forEachIndexed { index, idea ->
                        state.update {
                            it.copy(
                                status = app.getString(R.string.ai_status_drawing, index + 1, ideas.size),
                                progress = 10 + 90 * index / ideas.size,
                            )
                        }
                        // One failed drawing shouldn't lose the others.
                        val sticker = try {
                            val drawing = AiStickerGenerator.drawScene(idea, style)
                            withContext(Dispatchers.Default) { finish(app, drawing, idea, AiStickerGenerator.isRealistic(style)) }
                        } catch (e: CancellationException) {
                            throw e
                        } catch (e: Exception) {
                            android.util.Log.e("AiStudio", "Drawing failed", e)
                            null
                        }
                        if (sticker != null) {
                            state.update { it.copy(results = it.results + Result(nextId++, idea, sticker)) }
                        }
                    }
                    state.update {
                        it.copy(
                            busy = false,
                            progress = 100,
                            status = "",
                            // Drawings usually fail on the free Spark plan; point to the free mode.
                            error = if (it.results.isEmpty()) app.getString(R.string.ai_error_drawing) else null,
                        )
                    }
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    state.update { it.copy(busy = false, status = "", error = errorMessage(app, e)) }
                }
            }
        }

        // Free mode: Gemini writes captions and picks from the app's own characters.
        private suspend fun generateWithCharacters(app: Application, scenario: String, genre: String, language: String) {
            try {
                val characters = withContext(Dispatchers.IO) { AiCharacters.all(app) }
                val ideas = AiStickerGenerator.planWithCharacters(scenario, genre, language, characters)
                state.update { it.copy(progress = 60) }
                val made = withContext(Dispatchers.Default) {
                    ideas.mapNotNull { idea ->
                        val character = characters.firstOrNull { it.id == idea.character } ?: return@mapNotNull null
                        val art = AiCharacters.bitmap(app, character)
                        val sticker = StickerComposer.compose(art, true, idea.caption, app.getColor(R.color.caption_yellow), typeface)
                        Result(nextId++, idea, sticker)
                    }
                }
                state.update {
                    it.copy(
                        busy = false,
                        progress = 100,
                        status = "",
                        results = it.results + made,
                        error = if (made.isEmpty()) app.getString(R.string.ai_error_nothing) else null,
                    )
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                state.update { it.copy(busy = false, status = "", error = errorMessage(app, e)) }
            }
        }

        private fun errorMessage(app: Application, e: Exception): String {
            android.util.Log.e("AiStudio", "Generation failed", e)
            val reason = when (e) {
                is PromptBlockedException, is ResponseStoppedException -> R.string.ai_error_blocked
                is APINotConfiguredException -> R.string.ai_error_not_enabled
                is ServiceDisabledException -> R.string.ai_error_service_disabled
                is InvalidAPIKeyException -> R.string.ai_error_api_key
                is QuotaExceededException -> R.string.ai_error_quota
                is UnsupportedUserLocationException -> R.string.ai_error_location
                is RequestTimeoutException -> R.string.ai_error_timeout
                is ServerException -> R.string.ai_error_server
                else -> R.string.ai_error_generic
            }
            // Technical details help when reporting a problem.
            val details = "${e.javaClass.simpleName}: ${e.message.orEmpty().take(400)}"
            return app.getString(reason) + "\n\n" + app.getString(R.string.ai_error_details, details)
        }

        // Cut out the drawing and add the border and caption.
        private suspend fun finish(app: Application, drawing: Bitmap, idea: AiStickerGenerator.Idea, realistic: Boolean): Bitmap {
            val small = StickerComposer.limitSize(drawing.copy(Bitmap.Config.ARGB_8888, false))
            // Photos have soft shadows, so ML Kit cuts them out better; cartoons have clean white backgrounds.
            val cutout = if (realistic) {
                BackgroundRemover.removeBackground(app, small) ?: WhiteBackgroundRemover.remove(small)
            } else {
                WhiteBackgroundRemover.remove(small) ?: BackgroundRemover.removeBackground(app, small)
            }
            return StickerComposer.compose(
                subject = cutout ?: small,
                cutout = cutout != null,
                caption = idea.caption,
                captionColor = app.getColor(R.color.caption_yellow),
                typeface = typeface,
            )
        }

        fun toggle(id: Int) = state.update { s ->
            s.copy(results = s.results.map { if (it.id == id) it.copy(selected = !it.selected) else it })
        }

        fun remove(id: Int) = state.update { s -> s.copy(results = s.results.filterNot { it.id == id }) }

        fun clearError() = state.update { it.copy(error = null) }

        /** Saves the selected stickers to My Stickers and returns how many were saved. */
        suspend fun saveSelected(): Int = withContext(Dispatchers.Default) {
            val app = getApplication<Application>()
            var saved = 0
            for (r in state.value.results.filter { it.selected }) {
                if (MyStickers.isFull(app)) break
                MyStickers.add(app, StickerComposer.toWebp(r.sticker), StickerComposer.tray(r.sticker), r.idea.emoji, r.idea.caption)
                saved++
            }
            val savedIds = state.value.results.filter { it.selected }.take(saved).map { it.id }.toSet()
            state.update { s -> s.copy(results = s.results.filterNot { it.id in savedIds }) }
            saved
        }
    }

    private val model: StudioModel by viewModels()
    private lateinit var binding: ActivityAiStudioBinding
    private val adapter = ResultAdapter()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAiStudioBinding.inflate(layoutInflater)
        setContentView(binding.root)
        applySystemBarInsets(binding.root, binding.appBar, binding.bottomBar)
        binding.toolbar.setNavigationOnClickListener { finish() }

        val configured = AiStickerGenerator.isConfigured(this)
        binding.notConfigured.isVisible = !configured
        binding.form.isVisible = configured

        fillChips(binding.genres, R.array.ai_genres)
        fillChips(binding.languages, R.array.ai_languages)
        fillChips(binding.styles, R.array.ai_styles)
        binding.modes.check(R.id.modeFree)
        binding.modes.setOnCheckedStateChangeListener { _, _ -> updateMode() }
        updateMode()
        resources.getStringArray(R.array.ai_examples).forEach { example ->
            binding.examples.addView(Chip(this).apply {
                text = example
                setOnClickListener { binding.scenario.setText(example) }
            })
        }

        binding.results.layoutManager = GridLayoutManager(this, 2)
        binding.results.adapter = adapter
        binding.generate.setOnClickListener { generate() }
        binding.save.setOnClickListener { save() }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                model.state.collect { render(it) }
            }
        }
    }

    private fun drawnMode() = binding.modes.checkedChipId == R.id.modeDrawn

    private fun quotaKind() = if (drawnMode()) AiQuota.Kind.DRAWN else AiQuota.Kind.FREE

    private fun updateMode() {
        binding.styleLabel.isVisible = drawnMode()
        binding.styles.isVisible = drawnMode()
        binding.modeHint.setText(if (drawnMode()) R.string.ai_mode_drawn_hint else R.string.ai_mode_free_hint)
        updateRemaining()
    }

    private fun updateRemaining() {
        val kind = quotaKind()
        binding.remaining.text = getString(R.string.ai_remaining, AiQuota.remaining(this, kind).coerceAtLeast(0), kind.perDay)
    }

    private fun fillChips(group: ChipGroup, array: Int) {
        resources.getStringArray(array).forEachIndexed { i, label ->
            group.addView(Chip(this).apply {
                id = ViewGroup.generateViewId()
                text = label
                isCheckable = true
                isChecked = i == 0
            })
        }
    }

    private fun checkedLabel(group: ChipGroup): String =
        group.findViewById<Chip>(group.checkedChipId)?.text?.toString() ?: (group.getChildAt(0) as Chip).text.toString()

    private fun generate() {
        val scenario = binding.scenario.text?.toString()?.trim().orEmpty()
        if (scenario.length < 5) {
            binding.scenarioLayout.error = getString(R.string.ai_scenario_too_short)
            return
        }
        binding.scenarioLayout.error = null
        val kind = quotaKind()
        if (AiQuota.remaining(this, kind) <= 0) {
            Toast.makeText(this, getString(R.string.ai_quota_used, kind.perDay), Toast.LENGTH_LONG).show()
            return
        }
        model.generate(
            scenario, checkedLabel(binding.genres), checkedLabel(binding.languages), checkedLabel(binding.styles), drawnMode(),
        )
    }

    private fun save() {
        binding.save.isEnabled = false
        lifecycleScope.launch {
            val saved = model.saveSelected()
            val message = if (saved == 0) getString(R.string.ai_nothing_saved)
            else resources.getQuantityString(R.plurals.ai_saved, saved, saved)
            Toast.makeText(this@AiStudioActivity, message, Toast.LENGTH_LONG).show()
            binding.save.isEnabled = true
        }
    }

    private fun render(state: UiState) {
        binding.progress.isVisible = state.busy
        binding.progress.setProgressCompat(state.progress, true)
        binding.status.isVisible = state.status.isNotEmpty()
        binding.status.text = state.status
        binding.generate.isEnabled = !state.busy
        updateRemaining()
        adapter.submit(state.results)
        val selected = state.results.count { it.selected }
        binding.bottomBar.isVisible = state.results.isNotEmpty()
        binding.save.isEnabled = selected > 0 && !state.busy
        binding.save.text = resources.getQuantityString(R.plurals.ai_save_selected, selected, selected)
        state.error?.let {
            model.clearError()
            val dialog = MaterialAlertDialogBuilder(this).setMessage(it).setPositiveButton(android.R.string.ok, null)
            // Test builds: offer the App Check debug token that has to be allowed in Firebase.
            val token = if ("App Check" in it) DebugTools.appCheckDebugToken(this) else null
            if (token != null) dialog.setNeutralButton(R.string.ai_copy_token) { _, _ -> copyToken(token) }
            dialog.show()
        }
    }

    private fun copyToken(token: String) {
        val clipboard = getSystemService(android.content.ClipboardManager::class.java)
        clipboard.setPrimaryClip(android.content.ClipData.newPlainText("App Check debug token", token))
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.ai_token_copied_title)
            .setMessage(getString(R.string.ai_token_copied_message, token))
            .setPositiveButton(android.R.string.ok, null)
            .show()
    }

    // Play requires a way to report offensive AI output. Reports go to the developer by email.
    private fun report(result: Result) {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.ai_report_title)
            .setMessage(R.string.ai_report_message)
            .setNegativeButton(android.R.string.cancel, null)
            .setPositiveButton(R.string.ai_report) { _, _ ->
                model.remove(result.id)
                val email = getString(R.string.support_email)
                if (email.isNotBlank()) {
                    val body = "Caption: ${result.idea.caption}\nScene: ${result.idea.scene}"
                    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$email"))
                        .putExtra(Intent.EXTRA_SUBJECT, getString(R.string.ai_report_subject))
                        .putExtra(Intent.EXTRA_TEXT, body)
                    runCatching { startActivity(intent) }
                }
                Toast.makeText(this, R.string.ai_reported, Toast.LENGTH_SHORT).show()
            }
            .show()
    }

    override fun onPackStatus(added: Set<String>) = Unit

    private inner class ResultAdapter : RecyclerView.Adapter<ResultHolder>() {
        private var items: List<Result> = emptyList()

        fun submit(list: List<Result>) {
            if (list == items) return
            items = list
            notifyDataSetChanged()
        }

        override fun getItemCount() = items.size

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            ResultHolder(ItemAiStickerBinding.inflate(LayoutInflater.from(parent.context), parent, false))

        override fun onBindViewHolder(holder: ResultHolder, position: Int) {
            val r = items[position]
            val b = holder.b
            b.image.background = CheckerDrawable(this@AiStudioActivity)
            b.image.setImageBitmap(r.sticker)
            b.image.contentDescription = r.idea.caption
            b.selected.setOnCheckedChangeListener(null)
            b.selected.isChecked = r.selected
            b.selected.setOnCheckedChangeListener { _, _ -> model.toggle(r.id) }
            b.image.setOnClickListener { model.toggle(r.id) }
            b.report.setOnClickListener { report(r) }
        }
    }

    private class ResultHolder(val b: ItemAiStickerBinding) : RecyclerView.ViewHolder(b.root)
}
