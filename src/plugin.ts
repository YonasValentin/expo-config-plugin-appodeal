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

export interface AppodealPluginProps {
  appKey?: string;
  iosSdkVersion?: string;
  androidSdkVersion?: string;
  fullSetup?: boolean;
}

const withAppodealPlugin: ConfigPlugin<AppodealPluginProps> = (
  config,
  props = {}
) => {
  const appKey =
    props.appKey ??
    process.env.EXPO_PUBLIC_APPODEAL_KEY ??
    '<YOUR_DEFAULT_KEY>';
  const iosSdkVersion = props.iosSdkVersion ?? '3.5.2';
  const androidSdkVersion = props.androidSdkVersion ?? '3.5.2.0';
  const fullSetup = props.fullSetup === true;

  config = withProjectBuildGradle(config, (c) => {
    const marker = `maven { url "https://artifactory.appodeal.com/appodeal" }`;
    if (!c.modResults.contents.includes(marker)) {
      c.modResults.contents = c.modResults.contents.replace(
        /(allprojects\s*{[\s\S]*?repositories\s*{)/,
        `$1\n        ${marker}`
      );
    }
    return c;
  });

  config = withAppBuildGradle(config, (c) => {
    let text = c.modResults.contents;
    const core = `    implementation 'com.appodeal.ads:sdk:${androidSdkVersion}'`;
    if (!text.includes(core)) {
      text = text.replace(/(dependencies\s*{)/, `$1\n${core}`);
    }
    if (fullSetup) {
      const admob = `    implementation 'com.appodeal.ads:admob-adapter:${androidSdkVersion}'`;
      if (!text.includes(admob)) {
        text = text.replace(/(dependencies\s*{)/, `$1\n${admob}`);
      }
    }
    c.modResults.contents = text;
    return c;
  });

  config = withDangerousMod(config, [
    'ios',
    async (expoConfig) => {
      const iosDir = expoConfig.modRequest.platformProjectRoot;
      const podfilePath = path.join(iosDir, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let podfile = await fs.promises.readFile(podfilePath, 'utf8');
        const sources = [
          "source 'https://github.com/expo/expo.git'",
          "source 'https://github.com/appodeal/CocoaPods.git'",
          "source 'https://github.com/bidon-io/CocoaPods_Specs.git'",
          "source 'https://cdn.cocoapods.org'",
        ];
        for (let i = sources.length - 1; i >= 0; i--) {
          if (!podfile.includes(sources[i])) {
            podfile = `${sources[i]}\n${podfile}`;
          }
        }
        const snippet = `
  pod 'Appodeal', '${iosSdkVersion}'
  use_frameworks!
`;
        if (!podfile.includes("pod 'Appodeal'")) {
          podfile += `\n${snippet}`;
        }
        if (fullSetup && !podfile.includes(`pod 'APDGoogleAdMobAdapter'`)) {
          podfile += `\n  pod 'APDGoogleAdMobAdapter', '${iosSdkVersion}.0'`;
        }
        await fs.promises.writeFile(podfilePath, podfile, 'utf8');
      }
      return expoConfig;
    },
  ]);

  config = withInfoPlist(config, (c) => {
    c.modResults.NSAppTransportSecurity = { NSAllowsArbitraryLoads: true };
    if (fullSetup) {
      c.modResults.SKAdNetworkItems = c.modResults.SKAdNetworkItems || [];
      if (
        !c.modResults.SKAdNetworkItems.some(
          (i: any) => i.SKAdNetworkIdentifier === '22mmun2rn5.skadnetwork'
        )
      ) {
        c.modResults.SKAdNetworkItems.push({
          SKAdNetworkIdentifier: '22mmun2rn5.skadnetwork',
        });
      }
    }
    c.modResults.GADApplicationIdentifier = appKey;
    return c;
  });

  config.extra = { ...config.extra, appodealKey: appKey };
  return config;
};

const pkg = require('../package.json');
export default createRunOncePlugin(withAppodealPlugin, pkg.name, pkg.version);
