package com.partonmobile

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    createPushChannels()
    loadReactNative(this)
  }

  private fun createPushChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = getSystemService(NotificationManager::class.java)
    val channels =
      listOf(
        Triple("shifts", "Vardiyalar", NotificationManager.IMPORTANCE_HIGH),
        Triple("applications", "Başvurular", NotificationManager.IMPORTANCE_DEFAULT),
        Triple("default", "Bildirimler", NotificationManager.IMPORTANCE_DEFAULT),
      )
    for ((id, name, importance) in channels) {
      manager.createNotificationChannel(NotificationChannel(id, name, importance))
    }
  }
}
