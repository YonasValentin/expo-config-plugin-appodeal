import { ConfigPlugin } from '@expo/config-plugins';
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
/**
 * By wrapping with `createRunOncePlugin` we ensure that if
 * the user calls this plugin multiple times with the same config,
 * it won't patch Gradle/Podfiles repeatedly in a single build.
 */
declare const _default: ConfigPlugin<AppodealPluginProps>;
export default _default;
//# sourceMappingURL=plugin.d.ts.map