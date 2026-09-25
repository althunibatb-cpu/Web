// Shared bits for the render tools: headless Chromium setup and ffmpeg discovery.
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.join(ROOT, 'reel', 'index.html') + '?render';
const W = 1920, H = 1080;

// WebGL2 in headless Chromium runs on SwiftShader (CPU). Deterministic, just slow-ish.
const CHROME_ARGS = [
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  '--ignore-gpu-blocklist',
  '--allow-file-access-from-files',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--font-render-hinting=none',
  '--disable-lcd-text',
];

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    return execSync('python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch { /* fall through */ }
  return 'ffmpeg';
}

function loadPlaywright() {
  try { return require('playwright'); } catch { /* try the global install */ }
  const globalRoot = execSync('npm root -g').toString().trim();
  return require(path.join(globalRoot, 'playwright'));
}

async function openReel({ fastCapture = false } = {}) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: CHROME_ARGS });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(PAGE);
  await page.evaluate(() => window.REEL.ready);
  const cdp = await page.context().newCDPSession(page);
  // optimizeForSpeed trades PNG compression for encode time; still lossless
  const shot = async () => Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: fastCapture })).data, 'base64');
  return { browser, page, shot };
}

const mkdirp = d => fs.mkdirSync(d, { recursive: true });

module.exports = { ROOT, W, H, openReel, findFfmpeg, mkdirp };
