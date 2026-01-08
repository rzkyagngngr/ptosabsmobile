const fs = require('fs');
const path = require('path');

// Create simple PNG files with transparent background
// This is a minimal 1x1 transparent PNG
const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// For a proper icon, we need at least 1024x1024 with blue background
// This is a minimal 1x1 blue PNG
const bluePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64'
);

// Write files
fs.writeFileSync(path.join(assetsDir, 'icon.png'), bluePng);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), bluePng);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), bluePng);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), bluePng);

console.log('✅ Generated placeholder icon files in assets/');
console.log('⚠️  These are minimal 1x1 placeholders. Replace with proper icons later.');
