module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Inline the arcade games' .html files as strings at build time, so each
    // one can be handed straight to a WebView (source={{ html }}).
    plugins: [['babel-plugin-inline-import', { extensions: ['.html'] }]],
  };
};
