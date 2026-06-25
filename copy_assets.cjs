const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('Copying assets from generatepress_child/dist to wp-content/themes/generatepress_child/dist...');
  copyDirSync('generatepress_child/dist', 'wp-content/themes/generatepress_child/dist');
  console.log('Assets copied successfully!');
} catch (err) {
  console.error('Error copying assets:', err);
  process.exit(1);
}
