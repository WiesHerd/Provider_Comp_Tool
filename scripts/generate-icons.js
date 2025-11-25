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

    console.log('Generating beautiful circular badge PWA icons (mobile-first design)...');

    // Generate each icon size
    for (const size of iconSizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      // For circular badge design:
      // - Circle takes up 85% of icon (safe zone)
      // - Logo inside circle takes up 60% of circle size
      // - This ensures nothing gets cut off
      const circleSize = Math.round(size * 0.85); // 85% safe zone for the circle
      const circlePadding = Math.round((size - circleSize) / 2); // Center the circle
      const logoSize = Math.round(circleSize * 0.60); // Logo is 60% of circle
      const logoPadding = Math.round((circleSize - logoSize) / 2); // Center logo in circle
      
      // Resize the logo to fit inside the circle
      const resized = await sharp(logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .toBuffer();
      
      // Create a white background
      const whiteBg = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
        }
      })
        .png()
        .toBuffer();
      
      // Create a circular badge with primary green color
      const circleSvg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size/2}" cy="${size/2}" r="${circleSize/2}" fill="#00C805"/>
        </svg>
      `;
      
      const circleBadge = await sharp(Buffer.from(circleSvg))
        .resize(size, size)
        .png()
        .toBuffer();
      
      // Composite: white background -> green circle -> logo
      await sharp(whiteBg)
        .composite([
          {
            input: circleBadge,
            blend: 'over'
          },
          {
            input: resized,
            left: circlePadding + logoPadding,
            top: circlePadding + logoPadding,
            blend: 'over'
          }
        ])
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated circular badge icon-${size}x${size}.png (green circle, white background, mobile-optimized)`);
    }

    // Generate favicon using the same circular badge design
    const faviconSize = 64; // Generate at higher resolution for quality
    const circleSize = Math.round(faviconSize * 0.85);
    const circlePadding = Math.round((faviconSize - circleSize) / 2);
    const logoSize = Math.round(circleSize * 0.60);
    const logoPadding = Math.round((circleSize - logoSize) / 2);
    
    // Resize the logo
    const faviconLogo = await sharp(logoPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();
    
    // Create white background
    const faviconWhiteBg = await sharp({
      create: {
        width: faviconSize,
        height: faviconSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .png()
      .toBuffer();
    
    // Create green circle
    const faviconCircleSvg = `
      <svg width="${faviconSize}" height="${faviconSize}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${faviconSize/2}" cy="${faviconSize/2}" r="${circleSize/2}" fill="#00C805"/>
      </svg>
    `;
    
    const faviconCircle = await sharp(Buffer.from(faviconCircleSvg))
      .resize(faviconSize, faviconSize)
      .png()
      .toBuffer();
    
    // Composite favicon
    const faviconFinal = await sharp(faviconWhiteBg)
      .composite([
        {
          input: faviconCircle,
          blend: 'over'
        },
        {
          input: faviconLogo,
          left: circlePadding + logoPadding,
          top: circlePadding + logoPadding,
          blend: 'over'
        }
      ])
      .png()
      .toBuffer();
    
    // Save as favicon.png (resize to 32x32 for browser compatibility)
    const faviconPngPath = path.join(projectRoot, 'public', 'favicon.png');
    await sharp(faviconFinal)
      .resize(32, 32)
      .toFile(faviconPngPath);
    
    // Save as favicon.ico (resize to 32x32)
    const faviconIcoPath = path.join(projectRoot, 'public', 'favicon.ico');
    await sharp(faviconFinal)
      .resize(32, 32)
      .toFile(faviconIcoPath);
    
    console.log('✓ Generated favicon.png and favicon.ico with circular badge design');
    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

