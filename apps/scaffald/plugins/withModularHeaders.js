const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Force `:modular_headers => true` on GoogleUtilities and RecaptchaInterop.
 *
 * AppCheckCore (a Swift pod pulled in transitively by
 * @react-native-google-signin) depends on these two, which do not define
 * modules. When integrated as static libraries (the EAS precompiled-modules
 * path), `pod install` fails with:
 *
 *   [!] The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and
 *       `RecaptchaInterop`, which do not define modules.
 *
 * expo-build-properties@56 has no `extraPods` option, so we patch the
 * generated Podfile directly. The pods are declared with no version so
 * CocoaPods uses the version resolved by the transitive dependency graph.
 */
const POD_LINES = [
  "  pod 'GoogleUtilities', :modular_headers => true",
  "  pod 'RecaptchaInterop', :modular_headers => true",
];

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");

      if (!contents.includes("pod 'GoogleUtilities', :modular_headers")) {
        // Insert into every target right after `use_expo_modules!`.
        contents = contents.replace(
          /^(\s*use_expo_modules!.*\n)/gm,
          (match) => `${match}${POD_LINES.join("\n")}\n`,
        );
        fs.writeFileSync(podfile, contents);
      }

      return cfg;
    },
  ]);
};
