# RomCom Stickers

An Android app with six original sticker packs for WhatsApp and WhatsApp Business, plus a sticker maker for your own photos.

![All 60 stickers](docs/preview.png)

| Pack | Theme | Stickers |
| --- | --- | --- |
| **Love Bites** | Cute hearts | Love You, Hugs, Crushing, Miss You, XOXO, Aww, Ouch!, You're Mine |
| **LOL Beans** | Comedy | LOL, ROFL, Oops!, Cool Story, What?!, JK, Bored, Sus |
| **Sweet Nothings** | Romance | Together, Mwah, For You, Good Night, Date?, Forever, Thinking of You, Always |
| **Filmy Dialogues** | Comedy lines in English, Hinglish and Telugu | Main late nahi hoon…, Diet starts tomorrow, Nenu busy…, Seen karke reply nahi?, Enti ra idi?!, Aakali vestondi… and 6 more |
| **Mass Hero** | Original mass hero and heroine, Telugu romcom lines | Mass Entry!, Nenu vasthe… storm vasthundi!, Hero aithe enti? first coffee techko!, Villains ki bayapadanu… kaani amma ki bayam!, Dhishum! and 7 more |
| **Movie Mania** | Cinema-going jokes | First Day First Show!, Interval… popcorn time!, Hero Entry!, Mwahaha!, Climax twist, Blockbuster!, Housefull!, Paisa Vasool! and 4 more |

All artwork and dialogue lines are original. None of them use film stills, actors' likenesses or quotes from real films, so the app is safe to publish.

## Make your own stickers

Tap **Make a sticker**, pick a photo, and the app:

1. Cuts out the person or object with Google ML Kit, on the phone. Photos are never uploaded. The model is downloaded through Google Play services the first time.
2. Lets you add a caption, typed or from quick captions like "Enti ra idi?!" or "Hero entry!", in yellow, white or pink.
3. Adds a white sticker border, saves a 512×512 WebP under 100 KB and puts it in **My Stickers**.

With AI set up, **Suggest captions** lets Gemini look at the photo and suggest 5 funny captions in Telugu, Hindi or English. This uses the text model only, so it works on the free Spark plan.

Once **My Stickers** has 3 stickers, it can be added to WhatsApp like the other packs. It holds up to 30. Long-press a sticker to delete it.

## How it works

- The home screen lists the packs. Tap **Add** to send a pack to WhatsApp, or tap a pack to see every sticker.
- The app works out whether each pack is already in WhatsApp and shows **Added ✓** when it is.
- WhatsApp reads the stickers through `StickerContentProvider`, using the URI layout and column names that WhatsApp expects.
- Every sticker is a 512×512 WebP with a transparent background, under 100 KB. Every pack has a 96×96 tray icon, 1–3 emojis per sticker and accessibility text, as WhatsApp requires.

## AI Sticker Studio

Tap **AI stickers** on the home screen, describe a scenario ("my friend is always late to college and we tease him"), and pick a genre (comedy, romance, romcom, mass, filmy drama, cute…), a caption language and a drawing style. Then:

There are two kinds of sticker art:

- **RomCom characters (free, the default):** Gemini writes 6 original captions and picks the best of 53 caption-free app characters for each (beans, hearts, the hero and heroine, popcorn…). This only uses the text model, so it works on Firebase's free **Spark** plan.
- **New AI drawings:** Gemini writes 4 captions and creates a new picture for each, in a **Realistic photo** style (photos of made-up people, never real ones) or a cartoon style; the phone cuts it out and adds the border and caption. Image generation usually needs the **Blaze** plan.

You keep the ones you like, and they go into **My Stickers**.

The prompts tell Gemini not to draw real people or film characters and to keep things light-hearted. Every result has a **Report** button, as Google Play requires for AI-generated content. Each phone gets 20 free-mode and 5 drawing generations a day (`AiQuota.kt`) to keep usage down.

### Turning it on (one-time setup)

The app calls Gemini through [Firebase AI Logic](https://firebase.google.com/docs/ai-logic), so no API key is stored in the app.

1. Create a project in the [Firebase console](https://console.firebase.google.com) and add an Android app with the package name `com.romcomstickers.app` (the `applicationId` in `app/build.gradle.kts`).
2. Download `google-services.json` and put it in `app/` for local builds. It is in `.gitignore`, so it stays out of this public repo. For GitHub Actions builds, save the file's contents as a repository secret named `GOOGLE_SERVICES_JSON` (Settings → Secrets and variables → Actions); the workflow writes it into `app/` before building.
3. In the console, open **AI Logic**, choose the **Gemini Developer API**, and enable it. The free character mode works on the Spark plan; new AI drawings need the pay-as-you-go **Blaze** plan.
4. Turn on **App Check** with **Play Integrity**, and enforce it for AI Logic so only your app can use your quota. For debug builds, copy the debug token the app prints to Logcat into App Check's **Manage debug tokens**.
5. Check that the model names in `AiStickerGenerator.kt` (`TEXT_MODELS`, `IMAGE_MODELS`; the first one found is used) are still listed on the [supported models page](https://firebase.google.com/docs/ai-logic/models); Google retires old models regularly.
6. Set `support_email` in `app/src/main/res/values/strings.xml` so sticker reports reach you.

Builds without `google-services.json` still work; the AI screen just says it isn't set up.

## Build and run

1. Open the project in Android Studio, or build from the command line:

   ```bash
   ./gradlew assembleDebug
   ```

2. Install `app/build/outputs/apk/debug/app-debug.apk` on a phone that has WhatsApp.

Every push also runs the GitHub Actions workflow in `.github/workflows/build.yml`. It checks the stickers, builds the debug APK and uploads it as a downloadable artifact.

## Project layout

```
app/src/main/
  assets/contents.json        pack catalogue (names, files, emojis)
  assets/<pack>/              sticker .webp files and tray.png
  java/.../StickerContentProvider.kt   what WhatsApp reads
  java/.../WhatsApp.kt        "already added?" check and the add-pack intent
  java/.../MainActivity.kt    pack list
  java/.../PackDetailActivity.kt  sticker grid for one pack
  java/.../CreateStickerActivity.kt  photo sticker maker
  java/.../StickerComposer.kt  cut-out, border, caption and WebP encoding
  java/.../MyStickers.kt      storage for the user's own pack
  java/.../AiStudioActivity.kt     AI Sticker Studio screen
  java/.../AiStickerGenerator.kt   Gemini prompts and model names
tools/sticker-gen/            the sticker artwork and the scripts that render it
```

## Changing the stickers

The artwork is drawn in code in `tools/sticker-gen/art.js`, so you can edit a caption, colour or face and regenerate the files:

```bash
cd tools/sticker-gen && npm install && npx playwright install chromium && npm run generate && npm run validate
```

`generate` rewrites the files in `app/src/main/assets`, including `contents.json`, and `docs/preview.png`. `validate` checks them against WhatsApp's limits. It needs Node 18 or newer.

To use your own images instead, put them in `app/src/main/assets/<pack>/`, list them in `contents.json` and run `npm run validate`.

## Before publishing to Google Play

- Change `applicationId` in `app/build.gradle.kts` to an ID you own.
- Add the Play Store link to `android_play_store_link` in `contents.json`.
- If you change a sticker after release, bump that pack's `version` in `art.js` (it becomes `image_data_version` in `contents.json`) so WhatsApp refreshes it.
- Set up a release signing key, and raise `targetSdk` to whatever Google Play currently requires.

## Credits

The sticker artwork and dialogue lines are original. Captions use the [Fredoka](https://fonts.google.com/specimen/Fredoka) font (SIL Open Font License, see `licenses/Fredoka-OFL.txt`).
