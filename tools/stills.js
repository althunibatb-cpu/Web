#!/usr/bin/env node
// Render individual frames for review, plus an optional contact sheet.
//   node tools/stills.js --out stills 0.5 1.25 3.0        (times in seconds)
//   node tools/stills.js --out stills --beats 4 4.5 5      (times in beats @128 BPM)
//   node tools/stills.js --out stills --every 0.25 --sheet  (whole reel, contact sheet)
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { openReel, findFfmpeg, mkdirp } = require('./common');

const argv = process.argv.slice(2);
const opt = { out: 'stills', beats: false, sheet: false, every: 0, cols: 4, from: 0, to: 15 };
const times = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--out') opt.out = argv[++i];
  else if (a === '--beats') opt.beats = true;
  else if (a === '--sheet') opt.sheet = true;
  else if (a === '--every') opt.every = +argv[++i];
  else if (a === '--cols') opt.cols = +argv[++i];
  else if (a === '--from') opt.from = +argv[++i];
  else if (a === '--to') opt.to = +argv[++i];
  else times.push(+a);
}
const B = 60 / 128;
if (opt.every) for (let t = opt.from; t < opt.to - 1e-9; t += opt.every) times.push(opt.beats ? t : t);
const secs = times.map(t => (opt.beats ? t * B : t));

(async () => {
  mkdirp(opt.out);
  for (const f of fs.readdirSync(opt.out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(opt.out, f));
  const { browser, page, shot } = await openReel();
  let i = 0;
  for (const t of secs) {
    await page.evaluate(t => window.REEL.seek(t), t);
    const name = `${String(i++).padStart(3, '0')}_${t.toFixed(3)}s.png`;
    fs.writeFileSync(path.join(opt.out, name), await shot());
  }
  await browser.close();
  if (opt.sheet) {
    const rows = Math.ceil(secs.length / opt.cols);
    spawnSync(findFfmpeg(), ['-y', '-loglevel', 'error', '-framerate', '1', '-pattern_type', 'glob', '-i', path.join(opt.out, '*.png'),
      '-vf', `scale=480:270,tile=${opt.cols}x${rows}:padding=4:color=0x333333`, '-frames:v', '1', path.join(opt.out, 'sheet.jpg')], { stdio: 'inherit' });
  }
  console.log(`rendered ${secs.length} still(s) → ${opt.out}`);
})().catch(e => { console.error(e); process.exit(1); });
