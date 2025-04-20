import {
  ConfigPlugin,
  createRunOncePlugin,
  withProjectBuildGradle,
  withAppBuildGradle,
  withDangerousMod,
  withInfoPlist,
} from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

/**
 * Define any plugin options you'd like to expose.
 * For example, allowing custom iOS/Android versions of the SDK
 * or letting the user specify their Appodeal key inline.
 */
export interface AppodealPluginProps {
  /** Provide your Appodeal key inline. If not set, uses process.env.EXPO_PUBLIC_APPODEAL_KEY. */
  appKey?: string;
  /** iOS SDK pod version (defaults to "3.5.0"). */
  iosSdkVersion?: string;
  /** Android SDK version (defaults to "3.5.0.0"). */
  androidSdkVersion?: string;
}

// Minimal change: typed constant instead of "function" declaration
const withAppodealPlugin: ConfigPlugin<AppodealPluginProps> = (
  config,
  props = {}
) => {
  // Fallback to ENV if no explicit appKey passed
  const appKey =
    props.appKey ??
    process.env.EXPO_PUBLIC_APPODEAL_KEY ??
    '<YOUR_DEFAULT_KEY>';

  // Default versions if none provided
  const iosSdkVersion = props.iosSdkVersion ?? '3.5.0';
  const androidSdkVersion = props.androidSdkVersion ?? '3.5.0.0';

  // 1) Add the Appodeal Maven repo to android/build.gradle (project-level)
  config = withProjectBuildGradle(config, (configWithGradle) => {
    let gradleContents = configWithGradle.modResults.contents;
    const repoLine = `maven { url "https://artifactory.appodeal.com/appodeal" }`;

    if (!gradleContents.includes(repoLine)) {
      gradleContents = gradleContents.replace(
        /(allprojects\s*{[\s\S]*?repositories\s*{)/,
        `$1\n        ${repoLine}`
      );
    }
    configWithGradle.modResults.contents = gradleContents;
    return configWithGradle;
  });

  // 2) Add the Appodeal SDK dependency in android/app/build.gradle (app-level)
  config = withAppBuildGradle(config, (configWithGradle) => {
    let gradleContents = configWithGradle.modResults.contents;
    const depLine = `    implementation 'com.appodeal.ads:sdk:${androidSdkVersion}'`;

    if (!gradleContents.includes(depLine)) {
      gradleContents = gradleContents.replace(
        /(dependencies\s*{)/,
        `$1\n${depLine}`
      );
    }
    configWithGradle.modResults.contents = gradleContents;
    return configWithGradle;
  });

  // 3) Patch iOS Podfile to include Appodeal + `use_frameworks!`
  config = withDangerousMod(config, [
    'ios',
    async (iosConfig) => {
      const podfilePath = path.join(
        iosConfig.modRequest.platformProjectRoot,
        'Podfile'
      );
      if (fs.existsSync(podfilePath)) {
        let podfileContent = await fs.promises.readFile(podfilePath, 'utf8');

        const appodealPodSnippet = `
  # Appodeal
  pod 'Appodeal', '${iosSdkVersion}'
  use_frameworks!
`;

        // Avoid duplicating if 'pod "Appodeal"' is already present
        if (!podfileContent.includes(`pod 'Appodeal'`)) {
          // Attempt to insert after "use_react_native!...":
          const anchorMatch = podfileContent.match(
            /use_react_native!\([\s\S]*?\)\n/
          );
          if (anchorMatch) {
            podfileContent = podfileContent.replace(
              anchorMatch[0],
              `${anchorMatch[0]}${appodealPodSnippet}`
            );
          } else {
            // If no known anchor, just append to the end
            podfileContent += `\n${appodealPodSnippet}\n`;
          }
          await fs.promises.writeFile(podfilePath, podfileContent, 'utf8');
        }
      }
      return iosConfig;
    },
  ]);

  // 4) Update Info.plist to allow ATS
  config = withInfoPlist(config, (configWithInfo) => {
    configWithInfo.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: true,
    };
    return configWithInfo;
  });

  // Expose the appKey for your JS to read at runtime if desired
  config.extra = config.extra || {};
  config.extra.appodealKey = appKey;

  return config;
};

// We import our package.json so we can pass the plugin name + version
const pkg = require('../package.json');

/**
 * By wrapping with `createRunOncePlugin` we ensure that if
 * the user calls this plugin multiple times with the same config,
 * it won't patch Gradle/Podfiles repeatedly in a single build.
 */
export default createRunOncePlugin<AppodealPluginProps>(
  withAppodealPlugin,
  pkg.name,
  pkg.version
);
