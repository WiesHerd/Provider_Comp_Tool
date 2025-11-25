const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Get the project root directory (where package.json is)
const projectRoot = path.resolve(__dirname, '..');
const logoPath = path.join(projectRoot, 'public', 'New Image.png');
const iconsDir = path.join(projectRoot, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA (standard sizes)
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// iOS-specific icon sizes
const iosIconSizes = [180, 167]; // 180x180 for iPhone, 167x167 for iPad Pro

// All icon sizes combined
const allIconSizes = [...iconSizes, ...iosIconSizes].sort((a, b) => a - b);

// Safe zone for maskable icons: 98% of canvas (minimal padding for maximum icon size)
// This ensures the icon fills almost the entire space while still being maskable
// Apps like Coinbase/Snapchat use 95-98% fill for maskable icons
const SAFE_ZONE_RATIO = 0.98;

async function generateIcons() {
  try {
    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error(`Logo not found at: ${logoPath}`);
      process.exit(1);
    }

    console.log('Generating enterprise-grade PWA icons with maskable support...');
    console.log('Creating icons that fill the safe zone for optimal mobile display...\n');

    // First, trim any transparent padding from the source image
    const trimmedLogo = await sharp(logoPath)
      .trim({ threshold: 10 }) // Remove transparent edges
      .toBuffer();

    // Generate regular icons (fill 100% of canvas) - for iOS and fallback
    for (const size of allIconSizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      // Resize the circular icon to fill 100% of the canvas - edge to edge, no padding
      // Trimmed source ensures no transparent padding is included
      await sharp(trimmedLogo)
        .resize(size, size, {
          fit: 'cover', // Cover the entire canvas
          position: 'center' // Center the crop
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon-${size}x${size}.png (full-size, fills entire canvas, no padding)`);
    }

    // Generate maskable icons (fill 98% safe zone) - for Android adaptive icons
    // Using 98% ensures maximum icon size while still being maskable
    console.log('\nGenerating maskable icons for Android adaptive icons (98% fill, minimal padding)...');
    for (const size of allIconSizes) {
      const maskablePath = path.join(iconsDir, `icon-${size}x${size}-maskable.png`);
      const safeZoneSize = Math.floor(size * SAFE_ZONE_RATIO);
      
      // Resize icon to fill 98% of canvas (minimal padding for maximum size)
      // Using trimmed logo to ensure no source padding
      const iconBuffer = await sharp(trimmedLogo)
        .resize(safeZoneSize, safeZoneSize, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();
      
      // Center the icon on a transparent canvas of full size
      // Minimal padding (1% on each side) for maximum icon visibility
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{
          input: iconBuffer,
          top: Math.floor((size - safeZoneSize) / 2),
          left: Math.floor((size - safeZoneSize) / 2)
        }])
        .png()
        .toFile(maskablePath);
      
      console.log(`✓ Generated icon-${size}x${size}-maskable.png (98% fill: ${safeZoneSize}x${safeZoneSize}px, minimal padding)`);
    }

    // Generate favicon - full size, no padding
    const finalFaviconSize = 32; // Final size for browser
    
    // Resize the circular icon to fill the entire favicon space
    // Using trimmed logo to ensure no source padding
    const faviconIcon = await sharp(trimmedLogo)
      .resize(finalFaviconSize, finalFaviconSize, {
        fit: 'cover', // Cover the entire canvas
        position: 'center'
      })
      .png()
      .toBuffer();
    
    // Save as favicon.png
    const faviconPngPath = path.join(projectRoot, 'public', 'favicon.png');
    await sharp(faviconIcon)
      .toFile(faviconPngPath);
    
    // Save as favicon.ico
    const faviconIcoPath = path.join(projectRoot, 'public', 'favicon.ico');
    await sharp(faviconIcon)
      .toFile(faviconIcoPath);
    
    console.log('✓ Generated favicon.png and favicon.ico (full-size, no padding)');
    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

