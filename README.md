# expo-config-plugin-appodeal

[![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/yonasvalentin)

A **TypeScript-based** Expo Config Plugin that automates the native setup for the **Appodeal** ads SDK in Expo‑managed apps (SDK 48+). This plugin saves you from manually editing Podfiles, Gradle files, and Info.plist. Just install the plugin, configure your `app.json`, and **EAS Build** does the rest!

---

## ✨ What This Plugin Does

1. **Android**:

   - Adds the `maven { url "https://artifactory.appodeal.com/appodeal" }` repo to `android/build.gradle`.
   - Appends the Appodeal core SDK dependency (`implementation 'com.appodeal.ads:sdk:X.Y.Z'`) in `android/app/build.gradle`.

2. **iOS**:

   - Modifies the Podfile to include `pod 'Appodeal'` with `use_frameworks!`.
   - Sets `NSAllowsArbitraryLoads` in Info.plist to ensure ads can load over HTTP.

3. **Extra (When `fullSetup: true`)**:

   - Adds the AdMob adapter line for iOS + Android.
   - Adds a sample SKAdNetwork identifier to Info.plist (for demonstration).

4. **Configuration**:

   - Allows you to provide an Appodeal Key (`appKey`) via plugin options or environment (`EXPO_PUBLIC_APPODEAL_KEY`).
   - Exposes your key at runtime via `config.extra.appodealKey`.

5. **One‑Step Integration**:
   - No more manual `Podfile` or `Gradle` edits – everything happens automatically during `expo prebuild` or EAS Build.

---

## 📦 Installation

1. **Install** the plugin and the `react-native-appodeal` library:

   ```bash
   npm install expo-config-plugin-appodeal react-native-appodeal
   ```

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
             "androidSdkVersion": "3.5.2.0",

             // If true, adds AdMob adapter lines + example SKAdNetwork
             "fullSetup": true
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
      AppodealAdType.BANNER | AppodealAdType.INTERSTITIAL | AppodealAdType.REWARDED_VIDEO
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

If you prefer using environment variables, you can access `process.env.EXPO_PUBLIC_APPODEAL_KEY` or `Constants.expoConfig?.extra?.appodealKey`.

---

## ⚙️ Advanced Topics

- **Additional Adapters**: If you need more adapters (Facebook, Unity, etc.), you must either set `fullSetup` to true or manually add them to your Podfile/Gradle. This plugin only demonstrates AdMob in “fullSetup” mode.

- **SKAdNetwork**: Real-world usage often requires you to add many SKAdNetwork IDs. In “fullSetup” mode, we just insert an example. You can modify `plugin.ts` to add the entire list.

- **NSUserTrackingUsageDescription**: For iOS 14+ IDFA. You should set it in your config or use a separate plugin (e.g. expo-tracking-transparency).

- **iOS Adapters**: If you want more ad networks than the built-in core, you must add network adapter pods (e.g., `APDGoogleAdMobAdapter`). You can do this manually by editing your Podfile or by using [expo-build-properties](https://docs.expo.dev/versions/latest/config-plugins/build-properties/) to inject extra pods.

- **Android Adapters**: The Gradle artifact `com.appodeal.ads:sdk:3.5.0.0` often includes multiple networks, but you’ll still need to define network-specific IDs in `AndroidManifest.xml` if the network requires them (for example, AdMob’s App ID).

---

## 💡 Common Questions

**Q: Why do I only see “no fill” or no ads on iOS?**  
A: You may need to add each network’s adapter or set test mode. Also, the iOS simulator typically doesn’t serve real ads, so test on a device. By default, `pod 'Appodeal'` only installs **core**. You might need to add specific adapter pods for each ad network you intend to use. See [Appodeal’s iOS docs](https://wiki.appodeal.com/en/ios/Get_Started) for the list of adapter pods.

**Q: Do I still need to call `Appodeal.initialize()`?**  
A: Yes! The plugin only sets up the native build. You still handle initialization in your JavaScript.

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

## How to Publish to npm

1. Commit all your changes and bump the version in package.json (e.g. 1.0.4 → 1.0.5).
2. Build your plugin code:

   ```bash
   npm run build
   ```

3. Log in to npm if you haven’t already:

   ```bash
   npm login
   ```

4. Publish:

   ```bash
   npm publish --access public
   ```

Your plugin is now updated on npm. Users can install with:

```bash
npm install expo-config-plugin-appodeal
```

---

## 💰 You Can Help Me by Donating

[![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/yonasvalentin)

---

### License

[MIT License](LICENSE) – free to use, modify, and distribute.
