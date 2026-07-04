/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  // Must differ from the main app target ("Alchono") or Xcode gives both
  // targets the same build-intermediates dir and the asset-catalog compile
  // steps collide ("Multiple commands produce conflicting outputs").
  name: 'AlchonoWidget',
  bundleIdentifier: 'com.alchono.app.widget',
  deploymentTarget: '17.0',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.alchono.app'],
  },
};
