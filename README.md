````md
# expo-config-plugin-appodeal

A **TypeScript-based** Expo Config Plugin that automates the native setup for the **Appodeal** ads SDK in Expo‑managed apps (SDK 48+). This plugin saves you from manually editing Podfiles, Gradle files, and Info.plist. Just install the plugin, configure your `app.json`, and **EAS Build** does the rest!

---

## ✨ What This Plugin Does

1. **Android**:

   - Adds the `maven { url "https://artifactory.appodeal.com/appodeal" }` repo to `android/build.gradle`.
   - Appends the Appodeal core SDK dependency (`implementation 'com.appodeal.ads:sdk:X.Y.Z'`) in `android/app/build.gradle`.

2. **iOS**:

   - Modifies the Podfile to include `pod 'Appodeal'` with `use_frameworks!`.
   - Sets `NSAllowsArbitraryLoads` in Info.plist to ensure ads can load over HTTP.

3. **Configuration**:

   - Allows you to provide an Appodeal Key (`appKey`) via plugin options or environment (`EXPO_PUBLIC_APPODEAL_KEY`).
   - Exposes your key at runtime via `config.extra.appodealKey`.

4. **One‑Step Integration**:
   - No more manual `Podfile` or `Gradle` edits – everything happens automatically during `expo prebuild` or EAS Build.

---

## 📦 Installation

1. **Install** the plugin and the `react-native-appodeal` library:

   ```bash
   npm install expo-config-plugin-appodeal react-native-appodeal
   ```
````

Or with yarn:

```bash
yarn add expo-config-plugin-appodeal react-native-appodeal
```

2. **Configure** in your `app.json` or `app.config.js`.
   For a simple `app.json`, add:

   ```jsonc
   {
     "expo": {
       "plugins": [
         [
           "expo-config-plugin-appodeal",
           {
             // Appodeal key inline (optional if using ENV var)
             "appKey": "YOUR_APPODEAL_APP_KEY",

             // Optional: override default Pod & Gradle SDK versions
             "iosSdkVersion": "3.5.2",
             "androidSdkVersion": "3.5.2.0"
           }
         ]
       ],
       "extra": {
         "appodealKey": "YOUR_APPODEAL_APP_KEY"
       }
     }
   }
   ```

3. **Prebuild or Build** your project:

   ```bash
   # Generate native files (no-install prevents auto pod install):
   expo prebuild --no-install

   # (Optional) Install iOS pods manually:
   cd ios && pod install && cd ..

   # Finally, do a dev or production build:
   eas build --platform ios
   eas build --platform android
   ```

---

## 🏗 Usage in Your Code

After the plugin injects the native SDK, you can call `Appodeal` from JavaScript/TypeScript:

```ts
import React, { useEffect } from 'react';
import { View, Button } from 'react-native';
import Appodeal, { AppodealAdType } from 'react-native-appodeal';

export default function App() {
  useEffect(() => {
    // Initialize the SDK with your key
    Appodeal.initialize(
      'YOUR_APPODEAL_KEY',
      AppodealAdType.BANNER | AppodealAdType.INTERSTITIAL
    );
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Show Interstitial"
        onPress={() => Appodeal.show(AppodealAdType.INTERSTITIAL)}
      />
    </View>
  );
}
```

If you prefer using environment variables, you can access `process.env.EXPO_PUBLIC_APPODEAL_KEY` or from `Constants.expoConfig?.extra?.appodealKey`.

---

## ⚙️ Advanced iOS/Android Setup

- **iOS Adapters**: If you want more ad networks than the built-in core, you must add network adapter pods (e.g., `APDGoogleAdMobAdapter`). You can do this manually by editing your Podfile or by using [expo-build-properties](https://docs.expo.dev/versions/latest/config-plugins/build-properties/) to inject extra pods.

- **Android Adapters**: The Gradle artifact `com.appodeal.ads:sdk:3.5.0.0` often includes multiple networks, but you’ll still need to define network-specific IDs in `AndroidManifest.xml` if the network requires them (for example, AdMob’s App ID).

- **SKAdNetwork**: On iOS 14+, you may need to add SKAdNetwork IDs for each mediated network to your Info.plist. This plugin only sets ATS. For full SKAdNetwork support, you can either do it manually or with another config plugin.

---

## 💡 Common Questions

**Q: Why do I only see “no fill” or no ads on iOS?**  
A: By default, `pod 'Appodeal'` only installs **core**. You might need to add specific adapter pods for each ad network you intend to use. See [Appodeal’s iOS docs](https://wiki.appodeal.com/en/ios/Get_Started) for the list of adapter pods.

**Q: Do I still need to call `Appodeal.initialize()`?**  
A: Yes! This plugin only sets up the native dependencies. You must still call `initialize` in your JS code with your App Key.

**Q: Will it conflict with the official `react-native-appodeal` instructions?**  
A: It replaces the manual Podfile/Gradle edits from those instructions. You still need `react-native-appodeal` installed for the JavaScript APIs, but you do **not** need to manually edit your Podfile or Gradle files—this plugin handles that.

---

## 🛠 Maintaining This Plugin

If you cloned or forked this repo to maintain the plugin, here’s how to develop and publish:

1. **Install** dependencies:

   ```bash
   npm install
   ```

2. **Build** the plugin code (TypeScript → JS):

   ```bash
   npm run build
   ```

   This outputs compiled files to the `build/` folder.

3. **Test** locally (optional):

   ```bash
   npm link
   # Then in a test Expo app:
   npm link expo-config-plugin-appodeal
   # Add plugin to app.json and run expo prebuild/eas build
   ```

4. **Publish** changes:

   ```bash
   npm login
   npm publish --access public
   ```

   That’s it—the plugin is live on npm!

---

## 💰 You can help me by Donating

[![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/yonasvalentin)

---

### License

[MIT License](LICENSE) – free to use, modify, and distribute.

```

```
