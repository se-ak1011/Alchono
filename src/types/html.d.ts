// .html files are inlined as strings at build time by babel-plugin-inline-import
// (configured in babel.config.js). This lets us import a game's HTML and hand it
// straight to a WebView via source={{ html }}.
declare module '*.html' {
  const content: string;
  export default content;
}
