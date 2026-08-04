// Expo's web export (Metro, no expo-router) doesn't emit PWA/manifest tags,
// so this injects them into the exported dist/index.html after `expo export -p web`.
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
const base = process.env.EXPO_BASE_URL ?? '/harulog';

const tags = `
<link rel="manifest" href="${base}/manifest.webmanifest"/>
<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-title" content="하루로그"/>
<meta name="apple-mobile-web-app-status-bar-style" content="default"/>
</head>`;

let html = fs.readFileSync(indexPath, 'utf8');

// Without viewport-fit=cover, env(safe-area-inset-*) resolves to 0, so
// react-native-safe-area-context reports zero insets on iOS — the header
// then renders under the status bar/notch in standalone home-screen mode.
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />'
);

if (html.includes('manifest.webmanifest')) {
  console.log('PWA tags already present, skipping injection.');
} else {
  html = html.replace('</head>', tags);
  console.log('Injected PWA head tags into dist/index.html');
}

fs.writeFileSync(indexPath, html);
