// Dynamic Expo config.
//
// app.json stays the single source of truth for every real setting. We only wrap
// it here so we can drop the iOS-only "@bacons/apple-targets" plugin when we're
// prebuilding for Android. That plugin manages Apple widget / app-extension
// targets and has no job to do on Android — but Expo still tries to load and run
// it during `expo prebuild`, which can break an Android-only prebuild.
//
// The Codemagic "Expo Android (APK)" workflow sets ALCHONO_SKIP_APPLE_TARGETS=1,
// so the plugin is removed ONLY there. iOS builds (Codemagic + EAS + TestFlight)
// never set that var, so they keep the plugin and are completely unaffected.
module.exports = ({ config }) => {
  const skipAppleTargets = process.env.ALCHONO_SKIP_APPLE_TARGETS === "1";

  if (skipAppleTargets && Array.isArray(config.plugins)) {
    config.plugins = config.plugins.filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return name !== "@bacons/apple-targets";
    });
  }

  return config;
};
