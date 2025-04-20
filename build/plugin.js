"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Minimal change: typed constant instead of "function" declaration
const withAppodealPlugin = (config, props = {}) => {
    var _a, _b, _c, _d;
    // Fallback to ENV if no explicit appKey passed
    const appKey = (_b = (_a = props.appKey) !== null && _a !== void 0 ? _a : process.env.EXPO_PUBLIC_APPODEAL_KEY) !== null && _b !== void 0 ? _b : '<YOUR_DEFAULT_KEY>';
    // Default versions if none provided
    const iosSdkVersion = (_c = props.iosSdkVersion) !== null && _c !== void 0 ? _c : '3.5.2';
    const androidSdkVersion = (_d = props.androidSdkVersion) !== null && _d !== void 0 ? _d : '3.5.2.0';
    // 1) Add the Appodeal Maven repo to android/build.gradle (project-level)
    config = (0, config_plugins_1.withProjectBuildGradle)(config, (configWithGradle) => {
        let gradleContents = configWithGradle.modResults.contents;
        const repoLine = `maven { url "https://artifactory.appodeal.com/appodeal" }`;
        if (!gradleContents.includes(repoLine)) {
            gradleContents = gradleContents.replace(/(allprojects\s*{[\s\S]*?repositories\s*{)/, `$1\n        ${repoLine}`);
        }
        configWithGradle.modResults.contents = gradleContents;
        return configWithGradle;
    });
    // 2) Add the Appodeal SDK dependency in android/app/build.gradle (app-level)
    config = (0, config_plugins_1.withAppBuildGradle)(config, (configWithGradle) => {
        let gradleContents = configWithGradle.modResults.contents;
        const depLine = `    implementation 'com.appodeal.ads:sdk:${androidSdkVersion}'`;
        if (!gradleContents.includes(depLine)) {
            gradleContents = gradleContents.replace(/(dependencies\s*{)/, `$1\n${depLine}`);
        }
        configWithGradle.modResults.contents = gradleContents;
        return configWithGradle;
    });
    // 3) Patch iOS Podfile to include Appodeal + `use_frameworks!`
    config = (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (iosConfig) => {
            const podfilePath = path_1.default.join(iosConfig.modRequest.platformProjectRoot, 'Podfile');
            if (fs_1.default.existsSync(podfilePath)) {
                let podfileContent = await fs_1.default.promises.readFile(podfilePath, 'utf8');
                const appodealPodSnippet = `
  # Appodeal
  pod 'Appodeal', '${iosSdkVersion}'
  use_frameworks!
`;
                // Avoid duplicating if 'pod "Appodeal"' is already present
                if (!podfileContent.includes(`pod 'Appodeal'`)) {
                    // Attempt to insert after "use_react_native!...":
                    const anchorMatch = podfileContent.match(/use_react_native!\([\s\S]*?\)\n/);
                    if (anchorMatch) {
                        podfileContent = podfileContent.replace(anchorMatch[0], `${anchorMatch[0]}${appodealPodSnippet}`);
                    }
                    else {
                        // If no known anchor, just append to the end
                        podfileContent += `\n${appodealPodSnippet}\n`;
                    }
                    await fs_1.default.promises.writeFile(podfilePath, podfileContent, 'utf8');
                }
            }
            return iosConfig;
        },
    ]);
    // 4) Update Info.plist to allow ATS
    config = (0, config_plugins_1.withInfoPlist)(config, (configWithInfo) => {
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
exports.default = (0, config_plugins_1.createRunOncePlugin)(withAppodealPlugin, pkg.name, pkg.version);
