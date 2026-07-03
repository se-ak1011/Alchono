/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'Alchono',
  bundleIdentifier: 'com.alchono.app.widget',
  deploymentTarget: '17.0',
  colors: {
    // Referenced from index.swift as Color("WidgetBackground") / Color("AccentColor").
    WidgetBackground: '#0E0F10',
    AccentColor: '#C4C9D0',
  },
  entitlements: {
    'com.apple.security.application-groups': ['group.com.alchono.app'],
  },
};
