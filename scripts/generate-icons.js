const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Get the project root directory (where package.json is)
const projectRoot = path.resolve(__dirname, '..');
const logoPath = path.join(projectRoot, 'public', 'Logo.png');
const iconsDir = path.join(projectRoot, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Helper function to create rounded corners mask
function createRoundedMask(size, radius) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `;
  return Buffer.from(svg);
}

async function generateIcons() {
  try {
    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error(`Logo not found at: ${logoPath}`);
      process.exit(1);
    }

    console.log('Generating PWA icons from Logo.png with rounded corners...');

    // Generate each icon size
    for (const size of iconSizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      // Calculate border radius: rounded-xl is ~12px, scale proportionally
      // For 512px icon, 12px radius = ~2.3% of size
      const radius = Math.round(size * 0.023);
      
      // Resize the logo
      const resized = await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .toBuffer();
      
      // Create rounded mask
      const mask = await sharp(createRoundedMask(size, radius))
        .resize(size, size)
        .greyscale()
        .toBuffer();
      
      // Apply rounded corners using composite
      await sharp(resized)
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon-${size}x${size}.png with ${radius}px rounded corners`);
    }

    // Generate favicon with rounded corners (larger size for better quality)
    // Use a larger size (64x64) and scale down for better quality, with more visible rounded corners
    const faviconSize = 64;
    const faviconRadius = 10; // More pronounced rounded corners
    
    const faviconResized = await sharp(logoPath)
      .resize(faviconSize, faviconSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();
    
    // Create rounded mask with more visible corners
    const faviconMask = await sharp(createRoundedMask(faviconSize, faviconRadius))
      .resize(faviconSize, faviconSize)
      .greyscale()
      .toBuffer();
    
    // Apply rounded corners
    const faviconWithRoundedCorners = await sharp(faviconResized)
      .composite([{ input: faviconMask, blend: 'dest-in' }])
      .png()
      .toBuffer();
    
    // Save as favicon.png (resize to 32x32 for browser compatibility)
    const faviconPngPath = path.join(projectRoot, 'public', 'favicon.png');
    await sharp(faviconWithRoundedCorners)
      .resize(32, 32)
      .toFile(faviconPngPath);
    
    // Save as favicon.ico (resize to 32x32, ICO format)
    const faviconIcoPath = path.join(projectRoot, 'public', 'favicon.ico');
    await sharp(faviconWithRoundedCorners)
      .resize(32, 32)
      .toFile(faviconIcoPath);
    
    console.log('✓ Generated favicon.png and favicon.ico with rounded corners');
    console.log('\n✅ All icons generated successfully with rounded corners!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

