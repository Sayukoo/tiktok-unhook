import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const promoDir = path.resolve('promo');
if (!fs.existsSync(promoDir)) {
  fs.mkdirSync(promoDir, { recursive: true });
}

// 1. Screenshot 1 (1280 x 800) - Main Features Overview
const screenshot1Svg = `
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="50%" stop-color="#12131c"/>
      <stop offset="100%" stop-color="#0e0f17"/>
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#25F4EE"/>
      <stop offset="100%" stop-color="#FE2C55"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1c1d29"/>
      <stop offset="100%" stop-color="#141520"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1280" height="800" fill="url(#bgGrad)"/>

  <!-- Subtle Glows -->
  <circle cx="200" cy="150" r="280" fill="#25F4EE" opacity="0.08" filter="blur(80px)"/>
  <circle cx="1080" cy="650" r="320" fill="#FE2C55" opacity="0.09" filter="blur(90px)"/>

  <!-- Top Badge -->
  <rect x="490" y="55" width="300" height="38" rx="19" fill="#1e202f" stroke="#25F4EE" stroke-width="1.5" stroke-opacity="0.4"/>
  <text x="640" y="79" fill="#25F4EE" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" letter-spacing="1.5" text-anchor="middle">DISTRACTION-FREE TIKTOK</text>

  <!-- Title & Subtitle -->
  <text x="640" y="145" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="46" font-weight="800" text-anchor="middle">TikTok Unhook Focus Mode</text>
  <text x="640" y="185" fill="#9CA3AF" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" text-anchor="middle">Break free from the endless scroll. Browse intentionally.</text>

  <!-- Feature Grid -->
  <!-- Card 1 -->
  <g transform="translate(100, 240)">
    <rect width="330" height="220" rx="16" fill="url(#cardGrad)" stroke="#2b2d42" stroke-width="1.5"/>
    <rect x="24" y="24" width="46" height="46" rx="12" fill="#FE2C55" fill-opacity="0.15"/>
    <text x="47" y="54" fill="#FE2C55" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">🚫</text>
    <text x="24" y="105" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="20" font-weight="700">Hide "For You" Feed</text>
    <text x="24" y="138" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">Removes the infinite algorithmic</text>
    <text x="24" y="160" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">trap so you never lose track</text>
    <text x="24" y="182" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">of your valuable time.</text>
  </g>

  <!-- Card 2 -->
  <g transform="translate(475, 240)">
    <rect width="330" height="220" rx="16" fill="url(#cardGrad)" stroke="#2b2d42" stroke-width="1.5"/>
    <rect x="24" y="24" width="46" height="46" rx="12" fill="#25F4EE" fill-opacity="0.15"/>
    <text x="47" y="54" fill="#25F4EE" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">❤️</text>
    <text x="24" y="105" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="20" font-weight="700">Hide Vanity Metrics</text>
    <text x="24" y="138" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">Removes view counts, likes,</text>
    <text x="24" y="160" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">and follower counters to</text>
    <text x="24" y="182" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">stop dopamine triggers.</text>
  </g>

  <!-- Card 3 -->
  <g transform="translate(850, 240)">
    <rect width="330" height="220" rx="16" fill="url(#cardGrad)" stroke="#2b2d42" stroke-width="1.5"/>
    <rect x="24" y="24" width="46" height="46" rx="12" fill="#FE2C55" fill-opacity="0.15"/>
    <text x="47" y="54" fill="#FE2C55" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">💬</text>
    <text x="24" y="105" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="20" font-weight="700">Block Comments</text>
    <text x="24" y="138" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">Eliminates toxic comment</text>
    <text x="24" y="160" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">sections and halts background</text>
    <text x="24" y="182" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">comment thread loading.</text>
  </g>

  <!-- Card 4 -->
  <g transform="translate(100, 495)">
    <rect width="330" height="220" rx="16" fill="url(#cardGrad)" stroke="#2b2d42" stroke-width="1.5"/>
    <rect x="24" y="24" width="46" height="46" rx="12" fill="#25F4EE" fill-opacity="0.15"/>
    <text x="47" y="54" fill="#25F4EE" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">🔒</text>
    <text x="24" y="105" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="20" font-weight="700">Search Challenge Lock</text>
    <text x="24" y="138" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">Requires typing 30 characters</text>
    <text x="24" y="160" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">before unlocking search</text>
    <text x="24" y="182" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">to stop impulsive searching.</text>
  </g>

  <!-- Card 5 -->
  <g transform="translate(475, 495)">
    <rect width="330" height="220" rx="16" fill="url(#cardGrad)" stroke="#2b2d42" stroke-width="1.5"/>
    <rect x="24" y="24" width="46" height="46" rx="12" fill="#FE2C55" fill-opacity="0.15"/>
    <text x="47" y="54" fill="#FE2C55" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">🛍️</text>
    <text x="24" y="105" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="20" font-weight="700">Hide Shop, Ads &amp; Coins</text>
    <text x="24" y="138" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">Removes promoted listings,</text>
    <text x="24" y="160" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">TikTok Shop tabs, coin nags,</text>
    <text x="24" y="182" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">and app download buttons.</text>
  </g>

  <!-- Card 6 -->
  <g transform="translate(850, 495)">
    <rect width="330" height="220" rx="16" fill="url(#cardGrad)" stroke="#2b2d42" stroke-width="1.5"/>
    <rect x="24" y="24" width="46" height="46" rx="12" fill="#25F4EE" fill-opacity="0.15"/>
    <text x="47" y="54" fill="#25F4EE" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" text-anchor="middle">⚡</text>
    <text x="24" y="105" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="20" font-weight="700">Private by Design</text>
    <text x="24" y="138" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">No tracking or analytics.</text>
    <text x="24" y="160" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">No developer-operated servers.</text>
    <text x="24" y="182" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="400">Fully open source on GitHub.</text>
  </g>

  <!-- Footer Banner -->
  <text x="640" y="760" fill="#6B7280" font-family="system-ui, sans-serif" font-size="14" font-weight="500" text-anchor="middle">Free &amp; Open Source • Manifest V3 • Works seamlessly on desktop Chrome</text>
</svg>
`;

// 2. Small Promo Tile (440 x 280)
const promoSmallSvg = `
<svg width="440" height="280" viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="smallBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d0e17"/>
      <stop offset="100%" stop-color="#171826"/>
    </linearGradient>
  </defs>

  <rect width="440" height="280" fill="url(#smallBg)"/>

  <!-- Icon Circle -->
  <circle cx="220" cy="90" r="44" fill="#1e202f" stroke="#25F4EE" stroke-width="2"/>
  <text x="220" y="103" fill="#FE2C55" font-family="system-ui, sans-serif" font-size="34" font-weight="bold" text-anchor="middle">🛡️</text>

  <!-- Titles -->
  <text x="220" y="165" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="22" font-weight="800" text-anchor="middle">TikTok Unhook</text>
  <text x="220" y="195" fill="#25F4EE" font-family="system-ui, sans-serif" font-size="14" font-weight="700" letter-spacing="1" text-anchor="middle">DISTRACTION-FREE FOCUS MODE</text>
  <text x="220" y="232" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="13" font-weight="400" text-anchor="middle">Block addictive feeds &amp; regain your attention</text>
</svg>
`;

// 3. Marquee Promo Banner (1400 x 560)
const promoMarqueeSvg = `
<svg width="1400" height="560" viewBox="0 0 1400 560" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="marqBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a12"/>
      <stop offset="50%" stop-color="#141523"/>
      <stop offset="100%" stop-color="#0d0e18"/>
    </linearGradient>
    <linearGradient id="marqBadge" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#25F4EE"/>
      <stop offset="100%" stop-color="#FE2C55"/>
    </linearGradient>
  </defs>

  <rect width="1400" height="560" fill="url(#marqBg)"/>

  <!-- Glows -->
  <circle cx="250" cy="200" r="300" fill="#25F4EE" opacity="0.12" filter="blur(90px)"/>
  <circle cx="1150" cy="380" r="320" fill="#FE2C55" opacity="0.12" filter="blur(100px)"/>

  <!-- Left Content -->
  <g transform="translate(100, 110)">
    <rect x="0" y="0" width="280" height="34" rx="17" fill="#1e202f" stroke="#25F4EE" stroke-width="1.5" stroke-opacity="0.5"/>
    <text x="140" y="22" fill="#25F4EE" font-family="system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5" text-anchor="middle">INTENTIONAL BROWSING</text>

    <text x="0" y="95" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="52" font-weight="800">TikTok Unhook</text>
    <text x="0" y="145" fill="#FE2C55" font-family="system-ui, sans-serif" font-size="32" font-weight="700">Distraction-Free Focus Mode</text>

    <text x="0" y="200" fill="#D1D5DB" font-family="system-ui, sans-serif" font-size="20" font-weight="400">Hide infinite feeds, comments, likes, explore tab &amp; shop ads.</text>
    <text x="0" y="235" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="18" font-weight="400">Regain control of your attention with no tracking or external analytics.</text>

    <!-- Badges -->
    <g transform="translate(0, 280)">
      <rect width="180" height="42" rx="21" fill="#1b1c2b" stroke="#374151" stroke-width="1"/>
      <text x="90" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">✓ 100% Free</text>

      <rect x="195" width="210" height="42" rx="21" fill="#1b1c2b" stroke="#374151" stroke-width="1"/>
      <text x="300" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">✓ No Tracking or Analytics</text>

      <rect x="420" width="190" height="42" rx="21" fill="#1b1c2b" stroke="#374151" stroke-width="1"/>
      <text x="515" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">✓ Open Source</text>
    </g>
  </g>

  <!-- Right Visual Feature Card -->
  <g transform="translate(860, 85)">
    <rect width="440" height="390" rx="24" fill="#161726" stroke="#2b2d42" stroke-width="2"/>
    <text x="35" y="55" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="22" font-weight="700">Quick Controls</text>
    <text x="35" y="82" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14">Master switch &amp; individual toggles</text>

    <!-- Toggle 1 -->
    <g transform="translate(35, 115)">
      <rect width="370" height="50" rx="10" fill="#1f2033"/>
      <text x="20" y="31" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="600">Hide "For You" Feed</text>
      <rect x="305" y="13" width="46" height="24" rx="12" fill="#25F4EE"/>
      <circle cx="339" cy="25" r="9" fill="#0d0e17"/>
    </g>

    <!-- Toggle 2 -->
    <g transform="translate(35, 175)">
      <rect width="370" height="50" rx="10" fill="#1f2033"/>
      <text x="20" y="31" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="600">Hide Comments Section</text>
      <rect x="305" y="13" width="46" height="24" rx="12" fill="#25F4EE"/>
      <circle cx="339" cy="25" r="9" fill="#0d0e17"/>
    </g>

    <!-- Toggle 3 -->
    <g transform="translate(35, 235)">
      <rect width="370" height="50" rx="10" fill="#1f2033"/>
      <text x="20" y="31" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="600">Hide Vanity Likes &amp; Views</text>
      <rect x="305" y="13" width="46" height="24" rx="12" fill="#25F4EE"/>
      <circle cx="339" cy="25" r="9" fill="#0d0e17"/>
    </g>

    <!-- Toggle 4 -->
    <g transform="translate(35, 295)">
      <rect width="370" height="50" rx="10" fill="#1f2033"/>
      <text x="20" y="31" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="600">Search Challenge Lock</text>
      <rect x="305" y="13" width="46" height="24" rx="12" fill="#25F4EE"/>
      <circle cx="339" cy="25" r="9" fill="#0d0e17"/>
    </g>
  </g>
</svg>
`;

async function buildPromo() {
  console.log('Generating Chrome Web Store promo assets...');

  // 1. Screenshot 1 (1280x800) - PNG without alpha
  await sharp(Buffer.from(screenshot1Svg))
    .removeAlpha()
    .png({ progressive: false })
    .toFile(path.join(promoDir, 'screenshot-1280x800.png'));
  console.log('✓ Created promo/screenshot-1280x800.png (1280x800, 24-bit PNG, no alpha)');

  // 2. Small Promo Tile (440x280)
  await sharp(Buffer.from(promoSmallSvg))
    .removeAlpha()
    .png({ progressive: false })
    .toFile(path.join(promoDir, 'promo-small-440x280.png'));
  console.log('✓ Created promo/promo-small-440x280.png (440x280, 24-bit PNG, no alpha)');

  // 3. Marquee Promo Banner (1400x560)
  await sharp(Buffer.from(promoMarqueeSvg))
    .removeAlpha()
    .png({ progressive: false })
    .toFile(path.join(promoDir, 'promo-marquee-1400x560.png'));
  console.log('✓ Created promo/promo-marquee-1400x560.png (1400x560, 24-bit PNG, no alpha)');
}

buildPromo().catch(console.error);
