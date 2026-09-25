#!/usr/bin/env node
// Render the reel to video.
//
//   node tools/render.js                      → dist/showreel.mp4 (1080p60, motion blur, grain, audio)
//   node tools/render.js --draft              → fast preview: no motion blur, 30 fps
//   node tools/render.js --from 4 --to 6      → just a slice (seconds)
//   node tools/render.js --encode-only        → re-encode the last lossless master with new settings
//
// Motion blur is real temporal supersampling: each output frame averages N
// subframes spread across a 180° shutter. N adapts to the choreography (see
// SUBFRAMES) — fast whips and dives get 16 samples, calm passages 4. Hard cuts
// snap to frame starts, so a cut never smears across two shots.
//
// Frames are rendered in short chunks pulled from a queue by --workers headless
// Chromium instances; each chunk streams PNGs into ffmpeg, which averages the
// subframes and writes a lossless piece. The pieces are joined into a lossless
// master, then encoded with grain and the soundtrack.
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { ROOT, openReel, findFfmpeg, mkdirp } = require('./common');

const argv = process.argv.slice(2);
const opt = {
  fps: 60, shutter: 0.5, workers: 2, from: 0, to: 15, chunk: 12, sub: 0,
  out: path.join(ROOT, 'dist', 'showreel.mp4'),
  audio: path.join(ROOT, 'reel', 'audio', 'soundtrack.wav'),
  crf: 18, grain: 4, tmp: path.join(ROOT, '.render'), encodeOnly: false, draft: false,
};
for (let i = 0; i < argv.length; i++) {
  const k = argv[i].replace(/^--/, '').replace(/-(\w)/g, (_, c) => c.toUpperCase());
  if (k === 'draft') Object.assign(opt, { draft: true, fps: 30, sub: 1, crf: 23, grain: 0 });
  else if (k === 'encodeOnly') opt.encodeOnly = true;
  else if (k in opt) opt[k] = typeof opt[k] === 'number' ? +argv[++i] : argv[++i];
  else throw new Error(`unknown option ${argv[i]}`);
}
const FF = findFfmpeg();
const B = 60 / 128;

// [from beat, to beat, subframes] — where the choreography moves fastest
const SUBFRAMES = [
  [0.45, 2.05, 8],     // the point shoots out and sweeps the circle
  [3.4, 4.35, 12],     // implosion, then the drop
  [4.5, 5.2, 16], [5.5, 6.3, 16], [6.5, 7.35, 16], [7.5, 8.1, 16],   // camera whips + letter entrances
  [9.2, 10.05, 16],    // the dive into the full stop
  [11.9, 12.8, 8],     // card flips
  [12.95, 14.6, 8],    // Truchet re-routing
  [14.95, 16.6, 8],    // dots spiral in, iris, disc → sphere
  [19.9, 20.7, 12],    // the dolly, before the shader takes over
  [25.0, 27.0, 12],    // the tunnel
  [28.0, 28.5, 16],    // the name bursts out
  [31.2, 32.0, 12],    // everything folds back into the point
];
function subsFor(frame) {
  if (opt.sub) return opt.sub;
  const b = frame / opt.fps / B;
  for (const [a, e, n] of SUBFRAMES) if (b >= a && b < e) return n;
  return 4;
}

function run(args) {
  return new Promise((res, rej) => {
    const p = spawn(FF, args, { stdio: 'inherit' });
    p.on('exit', c => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res()));
  });
}

// split [first, last) into chunks that never straddle a change in subframe count
function plan(first, last) {
  const jobs = [];
  let cur = null;
  for (let j = first; j < last; j++) {
    const sub = subsFor(j);
    if (!cur || cur.sub !== sub || cur.frames.length >= opt.chunk) jobs.push(cur = { sub, frames: [] });
    cur.frames.push(j);
  }
  jobs.forEach((c, i) => { c.file = path.join(opt.tmp, `piece${String(i).padStart(4, '0')}.mkv`); });
  return jobs;
}

async function renderPiece(reel, job) {
  const { fps, shutter } = opt, { sub } = job;
  const vf = sub > 1 ? `tmix=frames=${sub},select='eq(mod(n,${sub}),${sub - 1})',setpts=N/${fps}/TB` : `setpts=N/${fps}/TB`;
  const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps * sub), '-c:v', 'png', '-i', '-',
    '-vf', vf, '-r', String(fps), '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', job.file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('exit', c => (c ? rej(new Error(`${job.file}: ffmpeg exited ${c}`)) : res())));
  for (const j of job.frames) {
    const tf = j / fps;
    for (let k = 0; k < sub; k++) {
      const t = tf + (k / sub) * (shutter / fps);
      await reel.page.evaluate(([t, tf]) => window.REEL.seek(t, tf), [t, tf]);
      const png = await reel.shot();
      if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    }
  }
  ff.stdin.end();
  await done;
}

async function renderMaster(master) {
  const t0 = Date.now();
  const first = Math.round(opt.from * opt.fps), last = Math.round(opt.to * opt.fps);
  const jobs = plan(first, last);
  const total = jobs.reduce((s, j) => s + j.frames.length * j.sub, 0);
  console.log(`rendering ${last - first} frames (${total} subframes) @ ${opt.fps} fps on ${opt.workers} workers`);
  let next = 0, doneSub = 0;
  const report = () => {
    const el = (Date.now() - t0) / 1000;
    process.stdout.write(`\r  ${(100 * doneSub / total).toFixed(1)}% · ${el.toFixed(0)}s elapsed · ~${(el / Math.max(doneSub, 1) * (total - doneSub)).toFixed(0)}s left   `);
  };
  await Promise.all(Array.from({ length: opt.workers }, async () => {
    const reel = await openReel({ fastCapture: true });
    while (next < jobs.length) {
      const job = jobs[next++];
      await renderPiece(reel, job);
      doneSub += job.frames.length * job.sub;
      report();
    }
    await reel.browser.close();
  }));
  const list = path.join(opt.tmp, 'pieces.txt');
  fs.writeFileSync(list, jobs.map(j => `file '${j.file}'`).join('\n'));
  await run(['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', master]);
  for (const j of jobs) fs.rmSync(j.file, { force: true });
  fs.rmSync(list, { force: true });
  console.log(`\nmaster ready in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

async function encode(master) {
  const hasAudio = fs.existsSync(opt.audio);
  const vf = [
    'scale=out_color_matrix=bt709:out_range=tv',
    'format=yuv420p',
    opt.grain ? `noise=c0s=${opt.grain}:c0f=t` : null,
  ].filter(Boolean).join(',');
  await run(['-y', '-loglevel', 'error', '-i', master,
    ...(hasAudio ? ['-ss', String(opt.from), '-t', String(opt.to - opt.from), '-i', opt.audio] : []),
    '-map', '0:v', ...(hasAudio ? ['-map', '1:a'] : []),
    '-vf', vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(opt.crf), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    ...(hasAudio ? ['-c:a', 'aac', '-b:a', '256k', '-shortest'] : []),
    '-movflags', '+faststart', opt.out]);
  const mb = fs.statSync(opt.out).size / 1e6;
  console.log(`wrote ${path.relative(process.cwd(), opt.out)} (${mb.toFixed(1)} MB)`);
}

(async () => {
  mkdirp(opt.tmp); mkdirp(path.dirname(opt.out));
  const master = path.join(opt.tmp, opt.draft ? 'draft.mkv' : 'master.mkv');
  if (!opt.encodeOnly) await renderMaster(master);
  await encode(master);
})().catch(e => { console.error(e); process.exit(1); });
