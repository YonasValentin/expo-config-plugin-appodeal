// plugin.ts
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

  // 1) Android: add Appodeal Maven repo
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

  // 2) Android: add core + optional adapter
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

  // 3) iOS: podfile tweaks
  config = withDangerousMod(config, [
    'ios',
    async (configWithMod) => {
      const projectRoot = configWithMod.modRequest.platformProjectRoot;
      const podfilePath = path.join(projectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let podfile = await fs.promises.readFile(podfilePath, 'utf8');

        // inject CocoaPods source lines at top
        const sources = [
          "source 'https://github.com/expo/expo.git'",
          "source 'https://github.com/appodeal/CocoaPods.git'",
          "source 'https://github.com/bidon-io/CocoaPods_Specs.git'",
          "source 'https://cdn.cocoapods.org'",
        ];
        const lines = podfile.split('\n');
        let insertAt = 0;
        for (const src of sources) {
          if (!podfile.includes(src)) {
            lines.splice(insertAt++, 0, src);
          }
        }
        podfile = lines.join('\n');

        // inject Appodeal pod + use_frameworks!
        const snippet = `
  # Appodeal
  pod 'Appodeal', '${iosSdkVersion}'
  use_frameworks!
`;
        if (!podfile.includes(`pod 'Appodeal'`)) {
          const anchor = podfile.match(/use_react_native!\([\s\S]*?\)\n/);
          if (anchor) {
            podfile = podfile.replace(anchor[0], anchor[0] + snippet);
          } else {
            podfile += '\n' + snippet;
          }
        }

        // optional: inject AdMob adapter pod
        if (fullSetup && !podfile.includes(`pod 'APDGoogleAdMobAdapter'`)) {
          podfile += `\n  pod 'APDGoogleAdMobAdapter', '${iosSdkVersion}.0'`;
        }

        await fs.promises.writeFile(podfilePath, podfile, 'utf8');
      }

      return configWithMod;
    },
  ]);

  // 4) Info.plist: allow ATS + sample SKAdNetwork + AdMob App ID
  config = withInfoPlist(config, (c) => {
    c.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: true,
    };
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
    // if you want to set GADApplicationIdentifier
    c.modResults.GADApplicationIdentifier = appKey;
    return c;
  });

  // expose appodealKey in JS
  config.extra = { ...config.extra, appodealKey: appKey };
  return config;
};

const pkg = require('../package.json');
export default createRunOncePlugin(withAppodealPlugin, pkg.name, pkg.version);
