package com.lovecomedyromance.stickers

import android.app.Application
import com.google.firebase.FirebaseApp

class FilmyFeelsApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Firebase starts itself when the app was built with google-services.json.
        if (FirebaseApp.getApps(this).isNotEmpty()) AppCheckSetup.install()
    }
}
