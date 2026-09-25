#!/usr/bin/env python3
"""
Soundtrack for the reel, synthesised from nothing but numpy and scipy.

It is written against the same grid as reel/reel.js: 128 BPM, 32 beats = 15.000 s.
Every cue below names the on-screen event it is scored to, in beats.

    python3 tools/soundtrack.py [reel/audio/soundtrack.wav]
"""
import sys
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
BPM = 128
B = 60 / BPM
DUR = 15.0
N = int(SR * DUR)
PAD = 4 * SR                      # room for tails; trimmed at the end
rng = np.random.default_rng(2026)


def T(b):
    return b * B


def secs(n):
    return np.arange(n) / SR


def ns(dur):
    return max(1, int(round(dur * SR)))


NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def hz(name):
    pc = NOTE[name[0]]
    rest = name[1:]
    if rest.startswith('#'):
        pc, rest = pc + 1, rest[1:]
    elif rest.startswith('b'):
        pc, rest = pc - 1, rest[1:]
    midi = 12 * (int(rest) + 1) + pc
    return 440.0 * 2 ** ((midi - 69) / 12)


# ───────────────────────── mixing ─────────────────────────

BREATH = T(27.72)   # everything that starts before this is choked for the pre-impact silence


class Bus:
    """A stereo bus with two lanes: sounds that start before the breath get gated with it."""

    def __init__(self):
        self.pre = np.zeros((2, N + PAD))
        self.post = np.zeros((2, N + PAD))

    def add(self, t, sig, gain=1.0, pan=0.0):
        sig = np.asarray(sig, dtype=np.float64)
        if sig.ndim == 1:
            sig = pan_mono(sig, pan)
        i = int(round(t * SR))
        if i < 0:
            sig, i = sig[:, -i:], 0
        lane = self.pre if t < BREATH else self.post
        n = min(sig.shape[1], lane.shape[1] - i)
        if n > 0:
            lane[:, i:i + n] += sig[:, :n] * gain


def pan_mono(x, pan):
    """Equal-power pan. `pan` may be a scalar or a per-sample curve in [-1, 1]."""
    a = (np.asarray(pan) + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)


def fade(x, fin=0.002, fout=0.01):
    x = np.array(x, dtype=np.float64)
    n = x.shape[-1]
    a, b = min(ns(fin), n), min(ns(fout), n)
    x[..., :a] *= np.linspace(0, 1, a)
    x[..., n - b:] *= np.linspace(1, 0, b)
    return x


# ───────────────────────── filters ─────────────────────────

def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, 'low', fs=SR, output='sos'), x, axis=-1)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, 'high', fs=SR, output='sos'), x, axis=-1)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=-1)


def rbj(kind, fc, q):
    fc = min(max(fc, 20.0), SR * 0.45)
    w0 = 2 * np.pi * fc / SR
    cw, alpha = np.cos(w0), np.sin(w0) / (2 * q)
    if kind == 'lp':
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]
    elif kind == 'hp':
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]
    else:
        b = [alpha, 0.0, -alpha]
    a = [1 + alpha, -2 * cw, 1 - alpha]
    return np.array(b) / a[0], np.array(a) / a[0]


def sweep(x, fc, q=0.8, kind='lp', block=128):
    """Time-varying biquad; `fc` is a per-sample cutoff curve. Works on mono or stereo."""
    x = np.atleast_2d(x)
    y = np.zeros_like(x)
    zi = np.zeros((x.shape[0], 2))
    for s in range(0, x.shape[1], block):
        e = min(s + block, x.shape[1])
        b, a = rbj(kind, float(fc[(s + e) // 2]), q)
        for c in range(x.shape[0]):
            y[c, s:e], zi[c] = signal.lfilter(b, a, x[c, s:e], zi=zi[c])
    return y if y.shape[0] > 1 else y[0]


def expcurve(n, a, b):
    return a * (b / a) ** np.linspace(0, 1, n)


# ───────────────────────── oscillators ─────────────────────────

def sine(freq, n, ph=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.sin(ph + 2 * np.pi * np.cumsum(f) / SR)


def saw(freq, n, ph=None):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    dt = f / SR
    p = ((rng.random() if ph is None else ph) + np.cumsum(dt)) % 1.0
    y = 2 * p - 1
    m = p < dt                                  # polyBLEP at the wrap
    x = p[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = p > 1 - dt
    x = (p[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def noise(n, ch=1):
    return rng.standard_normal((ch, n)) if ch > 1 else rng.standard_normal(n)


# ───────────────────────── instruments ─────────────────────────

def kick(dur=0.55, punch=1.0, low=44):
    n = ns(dur)
    t = secs(n)
    f = low + 125 * np.exp(-t * 30) + 60 * np.exp(-t * 260)
    body = np.tanh(sine(f, n) * np.exp(-t * 5.2) * 1.9) / np.tanh(1.9)
    click = hp(noise(n), 2500) * np.exp(-t * 650) * 0.3
    return fade((body + click) * punch, 0.0005, 0.03)


def clap(dur=0.45):
    n = ns(dur)
    t = secs(n)
    env = np.zeros(n)
    for k, off in enumerate([0, 0.009, 0.019, 0.029]):
        m = t >= off
        env[m] += np.exp(-(t[m] - off) * (230 if k < 3 else 16)) * (1 if k < 3 else 0.9)
    body = bp(noise(n), 900, 5200) * env
    tone = sine(190, n) * np.exp(-t * 45) * 0.35
    return fade(body * 0.75 + tone)


def snare(pitch=1.0, dur=0.22):
    n = ns(dur)
    t = secs(n)
    body = bp(noise(n), 1400 * pitch, min(9000 * pitch, 20000)) * np.exp(-t * 26)
    tone = sine(200 * pitch * (1 + 0.5 * np.exp(-t * 60)), n) * np.exp(-t * 38)
    return fade(body * 0.8 + tone * 0.5)


def hat(open_=False, dur=None):
    dur = dur or (0.35 if open_ else 0.06)
    n = ns(dur)
    t = secs(n)
    return fade(hp(noise(n), 7800, 4) * np.exp(-t * (9 if open_ else 70)))


def crash(dur=2.4):
    n = ns(dur)
    t = secs(n)
    x = hp(noise(n, 2), 3800, 2)
    x += bp(noise(n, 2), 5000, 11000) * 0.6
    return fade(x * np.exp(-t * 2.0) * (1 - np.exp(-t * 400)))


def boom(dur=2.2, f0=62, f1=28):
    n = ns(dur)
    t = secs(n)
    f = f1 + (f0 - f1) * np.exp(-t * 3.2)
    body = np.tanh(sine(f, n) * np.exp(-t * 2.1) * 2.2)
    rumble = lp(noise(n), 180, 4) * np.exp(-t * 3.5) * 0.9
    return fade(body + rumble, 0.001, 0.2)


def tick(freq=2100, dur=0.05, amp=1.0):
    n = ns(dur)
    t = secs(n)
    y = (sine(freq, n) + 0.4 * sine(freq * 2.01, n)) * np.exp(-t * 90)
    y += hp(noise(n), 5000) * np.exp(-t * 900) * 0.3
    return fade(y * amp, 0.0003, 0.005)


def blip(f0, f1, dur=0.06):
    n = ns(dur)
    t = secs(n)
    return fade(sine(expcurve(n, f0, f1), n) * np.exp(-t * 40), 0.001, 0.01)


def bell(freq, dur=2.5, index=3.5, ratio=3.5):
    n = ns(dur)
    t = secs(n)
    mod = sine(freq * ratio, n) * index * np.exp(-t * 5)
    car = np.sin(2 * np.pi * freq * t + mod)
    return fade(car * np.exp(-t * 1.9), 0.001, 0.2)


def pluck(freq, dur=0.5, bright=1.0, decay=5.0):
    n = ns(dur)
    t = secs(n)
    y = np.zeros(n)
    for k in range(1, 10):
        if freq * k > 16000:
            break
        y += np.sin(2 * np.pi * freq * k * t + k) / k * np.exp(-t * (decay + (4 + 10 / bright) * k))
    return fade(y * 0.8, 0.001, 0.02)


def pad_voice(freqs, dur, cutoff, detune=0.12, voices=5, att=0.08, rel=0.35):
    """Detuned supersaw chord through a moving low-pass. `cutoff` is (start, end) Hz or a curve."""
    n = ns(dur + rel)
    t = secs(n)
    out = np.zeros((2, n))
    for f in freqs:
        f = hz(f) if isinstance(f, str) else f
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune * 100
            s = saw(f * 2 ** (cents / 1200), n)
            out += pan_mono(s, (v - (voices - 1) / 2) / (voices - 1) * 1.4) / (voices * len(freqs) ** 0.5)
    cut = cutoff if not isinstance(cutoff, tuple) else expcurve(n, *cutoff)
    out = hp(sweep(out, cut, 0.9), 140)
    env = np.minimum(1, t / att) * np.where(t > dur, np.exp(-(t - dur) * 5 / rel), 1)
    return out * env


def whoosh(dur, f0, f1, pan0=0.0, pan1=0.0, peak=0.5, q=1.4, width=0.35):
    """Band-passed noise swept f0→f1, loudest at `peak` (0..1), panned pan0→pan1."""
    n = ns(dur)
    u = np.linspace(0, 1, n)
    x = sweep(noise(n), expcurve(n, f0, f1), q, 'bp')
    env = np.exp(-((u - peak) / width) ** 2)
    env *= np.minimum(1, u / 0.02) * np.minimum(1, (1 - u) / 0.05)
    return pan_mono(x * env, pan0 + (pan1 - pan0) * u)


def riser(dur, f0=300, f1=9000, tone0=110, tone1=880, curve=3.0):
    n = ns(dur)
    u = np.linspace(0, 1, n)
    x = sweep(noise(n, 2), expcurve(n, f0, f1), 1.2, 'bp')
    tone = saw(expcurve(n, tone0, tone1), n) + saw(expcurve(n, tone0 * 1.006, tone1 * 1.006), n)
    tone = sweep(tone, expcurve(n, 400, 6000), 0.8)
    env = u ** curve
    return (x + pan_mono(tone * 0.25, 0)) * env * np.minimum(1, (1 - u) / 0.01 + 0.0)


def reverse_swell(dur, bright=6000):
    c = crash(dur)[:, ::-1]
    return lp(c, bright) * np.linspace(0, 1, c.shape[1]) ** 2


# ───────────────────────── reverb ─────────────────────────

def make_ir(rt60=1.9, pre=0.018):
    n = ns(rt60 + pre)
    t = secs(n)
    env = np.exp(-6.9 * t / rt60)
    env[:ns(pre)] = 0
    ir = noise(n, 2) * env
    bright, dark = lp(ir, 7000), lp(ir, 1400)
    w = np.clip(t / rt60, 0, 1) ** 0.7
    ir = bright * (1 - w) + dark * w
    return ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))


def reverb(x, ir):
    return np.vstack([signal.fftconvolve(x[c], ir[c])[:x.shape[1]] for c in range(2)])


# ═════════════════════════ the score ═════════════════════════

drums, bass, pads, keys, fx, hits = (Bus() for _ in range(6))
sends = Bus()                                     # reverb send

CHORDS = [   # (start beat, end beat, voicing, cutoff start/end)
    (4, 8, ['D3', 'A3', 'C4', 'F4'], (900, 2200)),                   # Dm7
    (8, 12, ['Bb2', 'F3', 'A3', 'D4'], (1200, 2400)),                # Bbmaj7
    (12, 16, ['F3', 'A3', 'C4', 'E4'], (1400, 2800)),                # Fmaj7
    (16, 20, ['G2', 'D3', 'F3', 'Bb3', 'A4'], (700, 4200)),          # Gm9 — the sphere opens up
    (20, 24, ['Bb2', 'F3', 'D4', 'F4'], (1000, 2600)),               # Bb
    (24, 26, ['A2', 'E3', 'G3', 'D4'], (1800, 4200)),                # A7sus4
    (26, 27.72, ['A2', 'E3', 'G3', 'C#4'], (3000, 7000)),            # A7 — wants to resolve
]
BASSLINE = [(4, 'D2'), (8, 'Bb1'), (12, 'F2'), (16, 'G1'), (20, 'Bb1'), (24, 'A1')]

# ── 00 · IGNITION (0–4) ──────────────────────────────────────
fx.add(T(0), tick(2100, amp=0.9))                                   # the point appears
hits.add(T(0), boom(0.6, 90, 40) * 0.25)
pads.add(T(0), pad_voice(['D2', 'A2', 'D3', 'E3'], T(3.85), (160, 1500), rel=0.08) * 0.9)
fx.add(T(0.5), pan_mono(blip(380, 1100, T(0.5)) * 0.35, np.linspace(0, 0.5, ns(T(0.5)) + 1)[:ns(T(0.5))]))  # radius arm
# the compass sweep: a whoosh that travels round the stereo field with the pen
n = ns(T(1.0))
u = np.linspace(0, 1, n)
ease = np.where(u < .5, 8 * u ** 4, 1 - (-2 * u + 2) ** 4 / 2)
ang = -ease * 2 * np.pi
speed = np.gradient(ease)
speed /= speed.max()
sw = sweep(noise(n), 700 + 2600 * speed, 1.6, 'bp') * speed ** 1.4
fx.add(T(1.0), pan_mono(sw * 0.55, np.cos(ang) * 0.8))
for k in range(1, 5):                                               # degree marks tick in
    tk = T(1.0) + np.argmax(ease * 2 * np.pi >= k * np.pi / 2 - 0.2) / SR
    fx.add(tk, tick(3200 + 300 * k, 0.03, 0.25), pan=np.cos(k * np.pi / 2) * 0.6)
for f, g in [('D5', 0.3), ('A5', 0.22), ('E6', 0.16), ('D6', 0.12)]:  # circle closes: bell
    keys.add(T(2.0), bell(hz(f), 2.2) * g)
    sends.add(T(2.0), bell(hz(f), 2.2) * g * 0.8)
hits.add(T(2.0), boom(1.2, 110, 45) * 0.4)
for k, (b0, f) in enumerate([(2.0, 'A4'), (2.1, 'D5'), (2.2, 'F5')]):  # three rings spring out
    keys.add(T(b0), pluck(hz(f), 0.5, 2) * 0.22, pan=(k - 1) * 0.5)
for lo, hi in [(2.25, 2.85), (3.3, 3.55)]:                          # badge text scramble chatter
    for j in range(int(T(lo) * 24), int(T(hi) * 24)):
        fx.add(j / 24, tick(2400 + 2600 * rng.random(), 0.018, 0.12), pan=rng.uniform(-0.6, 0.6))
fx.add(T(2.6), riser(T(1.33), 200, 7000, 55, 440, 2.5) * 0.45)       # rings spin up
fx.add(T(3.3), reverse_swell(T(0.63)) * 0.7)                         # implode into the point

# ── 01 · KINETIC TYPE (4–10) ─────────────────────────────────
hits.add(T(4), boom(1.4, 80, 32) * 0.55)                             # the drop
hits.add(T(4), crash(1.8) * 0.18)
for b0, pan0, pan1 in [(5, -0.6, 0.6), (6, 0.5, -0.5), (7, 0.0, 0.0), (8, -0.3, 0.3)]:
    fx.add(T(b0 - 0.42), whoosh(T(0.52), 500, 4200, pan0, pan1, 0.6, 1.2, 0.28) * 0.5)   # camera whips
for i, f in enumerate(['A4', 'C5', 'E5', 'F5']):                     # "make": italic letters rise
    keys.add(T(4.78 + 0.07 * i), bell(hz(f), 1.0, 1.2, 2.0) * 0.12, pan=-0.3 + 0.2 * i)
n = ns(T(1.0))                                                       # THINGS stretches on a spring
t = secs(n)
w0, z = np.sqrt(150), 11 / (2 * np.sqrt(150))
wd = w0 * np.sqrt(1 - z * z)
spr = 1 - np.exp(-z * w0 * t) * (np.cos(wd * t) + z * w0 / wd * np.sin(wd * t))
keys.add(T(5.76), fade(saw(hz('D3') * 2 ** (spr * 1.0), n) * np.exp(-t * 4) * 0.12))
for i in range(4):                                                   # MOVE letters punch in
    drums.add(T(6.8 + 0.05 * i), kick(0.25, 0.35, 90 + 25 * i), pan=(-1) ** i * 0.3)
fx.add(T(7.12), blip(1600, 500, 0.08) * 0.4)                         # the full stop pops
fx.add(T(9.2), riser(T(0.8), 400, 12000, 110, 1760, 3.2) * 0.55)    # dive into the full stop
fx.add(T(9.35), whoosh(T(0.65), 300, 6000, 0, 0, 0.9, 1.0, 0.3) * 0.7)
hits.add(T(10), boom(1.2, 90, 36) * 0.5)

# ── 02 · SHAPE & RHYTHM (10–16) ──────────────────────────────
PENTA = ['D5', 'F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'G6', 'A6']
for k in range(12):                                                  # grid pops outward from centre
    tk = T(10 + (k / 11) ** 1.2 * 0.55)
    keys.add(tk, blip(1400 + 90 * k, 420, 0.05) * 0.2, pan=rng.uniform(-0.7, 0.7))
fx.add(T(10.9), whoosh(T(0.5), 800, 3000, -0.4, 0.4, 0.5, 1.8) * 0.25)  # dots twist into squares
for k in range(16):                                                  # card-flip cascade
    tk = T(11.95 + 0.16 + k / 15 * 0.55)
    fx.add(tk, fade(bp(noise(ns(0.012)), 2500, 7000)) * 0.35, pan=-0.8 + 1.6 * k / 15)
for wb, spread, notes in [(13.0, 0.45, [0, 2, 4]), (13.5, 0.45, [1, 3, 5]), (14.0, 0.4, [2, 4, 6, 8])]:
    for k in range(9):                                               # tile re-route waves: wooden clacks
        tk = T(wb + k / 8 * spread)
        c = sweep(noise(ns(0.05)), np.full(ns(0.05), 900 + 200 * (k % 3)), 12, 'bp')
        drums.add(tk, fade(c * np.exp(-secs(ns(0.05)) * 80)) * 0.5, pan=rng.uniform(-0.7, 0.7))
    for j, ni in enumerate(notes):
        keys.add(T(wb) + j * 0.03, pluck(hz(PENTA[ni]), 0.6, 2.5) * 0.16, pan=(j - 1) * 0.4)
fx.add(T(14.2), reverse_swell(T(0.7), 4000) * 0.3)                   # arcs retract
for k in range(16):                                                  # dots spiral in: rising arpeggio
    keys.add(T(15.0 + k / 15 * 0.9), pluck(hz(PENTA[k % 9]) * (2 if k >= 9 else 1) / 2, 0.4, 2.5) * 0.14,
             pan=np.sin(k * 2.4) * 0.6)
for k in range(60):                                                  # sunflower grows: shimmer
    tk = T(15.25 + 0.62 * (k / 59) ** 0.8)
    keys.add(tk, tick(4000 + 3000 * rng.random(), 0.03, 0.07), pan=rng.uniform(-0.9, 0.9))
fx.add(T(15.0), whoosh(T(1.0), 3000, 180, 0, 0, 0.7, 1.0, 0.35) * 0.4)  # iris closes
fx.add(T(15.2), riser(T(0.8), 500, 9000, 147, 587, 3.0) * 0.35)

# ── 03 · PARTICLES IN 3D (16–21) ─────────────────────────────
hits.add(T(16), boom(2.0, 70, 30) * 0.6)                             # flat disc → sphere
hits.add(T(16), crash(2.2) * 0.14)
SPARK = ['D6', 'F6', 'A6', 'Bb6', 'C7', 'D7', 'G6']
for k in range(22):                                                  # particles glint
    tk = T(16.5 + k * 0.1875 + rng.uniform(0, 0.05))
    if tk < T(20):
        keys.add(tk, pluck(hz(SPARK[rng.integers(len(SPARK))]), 0.5, 3, 7) * 0.07, pan=rng.uniform(-0.9, 0.9))
fx.add(T(18.0), whoosh(T(1.4), 200, 2500, -0.7, 0.7, 0.45, 2.2, 0.3) * 0.35)   # sphere → torus knot
fx.add(T(19.4), riser(T(1.6), 300, 12000, 98, 1568, 3.0) * 0.55)    # the dolly
fx.add(T(20.3), whoosh(T(0.9), 9000, 250, -0.9, 0.9, 0.65, 1.1, 0.22) * 0.8)   # particles rush past

# ── 04 · REAL-TIME SHADERS (21–25) ───────────────────────────
n = ns(T(0.9))                                                       # liquid floods in: bloop
t = secs(n)
bl = sweep(noise(n), expcurve(n, 3500, 160), 6, 'lp') * np.exp(-t * 3) * 0.3
bl += sine(expcurve(n, 520, 70), n) * np.exp(-t * 4) * 0.5
fx.add(T(20.75), bl)
hits.add(T(21), boom(1.6, 75, 30) * 0.5)
fx.add(T(21.5), whoosh(T(0.8), 600, 5000, -0.8, 0.8, 0.5, 2.0) * 0.28)  # FLOW wipes in
for sb in (23, 24):                                                  # shockwaves
    hits.add(T(sb), boom(1.0, 120, 40) * 0.45)
    n = ns(0.9)
    t = secs(n)
    ripple = sweep(noise(n), expcurve(n, 2400, 300), 3, 'bp') * np.exp(-t * 5) * 0.35
    fx.add(T(sb), ripple)
for k in range(10):                                                  # bubbles
    tk = T(21.3 + k * 0.33 + rng.uniform(0, 0.12))
    fx.add(tk, blip(300 + 500 * rng.random(), 900 + 900 * rng.random(), 0.05) * 0.12, pan=rng.uniform(-0.8, 0.8))
n = ns(T(0.75))                                                      # the vortex: noise spinning round the head
u = np.linspace(0, 1, n)
vort = sweep(noise(n), expcurve(n, 400, 6000), 1.3, 'bp') * u ** 2
fx.add(T(24.25), pan_mono(vort * 0.55, np.sin(2 * np.pi * np.cumsum(2 + 14 * u) / SR)))
fx.add(T(24.1), riser(T(0.9), 300, 10000, 110, 880, 2.6) * 0.45)

# ── 05 · EDIT & PACING (25–28) ───────────────────────────────
for b0 in (25.0, 25.5, 26.0, 26.5):                                  # recap words
    hits.add(T(b0), boom(0.5, 110, 50) * 0.3)
    fx.add(T(b0) - 0.05, whoosh(0.11, 1500, 6000, 0, 0, 0.9, 1.2, 0.3) * 0.3)
for k in range(8):                                                   # snare roll: eighths → sixteenths
    drums.add(T(25 + k * 0.25) if k < 4 else T(26 + (k - 4) * 0.25), snare(1 + k * 0.04) * (0.25 + k * 0.03))
for k in range(8, 12):
    drums.add(T(26 + (k - 8) * 0.25 + 0.125), snare(1 + k * 0.04) * (0.3 + k * 0.02))
for i, f in enumerate(['A3', 'C#4', 'E4', 'G4', 'A4', 'C#5']):     # C-L-A-U-D-E on thirty-seconds
    tk = T(27.0 + i * 0.125)
    keys.add(tk, pluck(hz(f), 0.2, 3, 12) * 0.35, pan=(-1) ** i * 0.35)
    keys.add(tk, pluck(hz(f) * 2, 0.15, 3, 14) * 0.15, pan=(-1) ** (i + 1) * 0.35)
    drums.add(tk, snare(1.2 + i * 0.12, 0.1) * 0.35)
fx.add(T(25.0), riser(T(2.72), 200, 14000, 55, 880, 3.2) * 0.5)    # the tunnel keeps accelerating
fx.add(T(27.75), tick(2100, amp=0.9))                                # …the breath. one point.

# ── 06 · SIGN-OFF (28–32) ────────────────────────────────────
hits.add(T(28), boom(2.6, 70, 26) * 0.95)                            # IMPACT
hits.add(T(28), crash(3.2) * 0.35)
drums.add(T(28), kick(0.7, 1.1))
END = ['D3', 'A3', 'C4', 'F4', 'E5']                                 # resolves home: Dm9
pads.add(T(28), pad_voice(END, T(3.3), (5200, 700), 0.14, 6, 0.004, 0.5) * 1.1)
sends.add(T(28), pad_voice(END, T(1.5), (4000, 1000), 0.14, 5, 0.004, 0.4) * 0.6)
for i, f in enumerate(['D5', 'A5', 'E6']):
    keys.add(T(28) + i * 0.012, bell(hz(f), 2.6, 2.5) * 0.14)
    sends.add(T(28) + i * 0.012, bell(hz(f), 2.6, 2.5) * 0.14)
bass.add(T(28), fade(np.tanh(sine(hz('D2'), ns(T(3.2))) * 1.5) * np.exp(-secs(ns(T(3.2))) * 0.9) * 0.5, 0.004, 0.3))
fx.add(T(28.2), whoosh(T(0.7), 1200, 6000, -0.8, 0.8, 0.3, 1.5, 0.25) * 0.3)   # the bar wipes in
for j in range(int(T(28.7) * 24), int(T(29.8) * 24)):               # meta text scrambles in
    if rng.random() < 0.6:
        fx.add(j / 24, tick(2800 + 2400 * rng.random(), 0.015, 0.06), pan=rng.uniform(-0.8, 0.8))
ARP = ['D5', 'F5', 'A5', 'C6', 'E6', 'C6', 'A5', 'F5']
for k in range(10):                                                  # gentle arp while it breathes
    tk = T(29.0 + k * 0.25)
    keys.add(tk, pluck(hz(ARP[k % 8]), 0.5, 2, 6) * (0.08 - k * 0.004), pan=np.sin(k * 1.3) * 0.5)
    sends.add(tk, pluck(hz(ARP[k % 8]), 0.5, 2, 6) * 0.06)
for k in range(12):
    drums.add(T(28.5 + k * 0.5), hat(False) * 0.05, pan=0.3)
keys.add(T(29.6), bell(hz('A6'), 1.8, 1.5, 2.0) * 0.07)             # the tagline
sends.add(T(29.6), bell(hz('A6'), 1.8, 1.5, 2.0) * 0.1)
fx.add(T(30.75), reverse_swell(T(0.93), 5000) * 0.45)               # everything folds back…
fx.add(T(31.58), tick(2100, amp=0.8))                                # …into the point
fx.add(T(31.8), blip(900, 180, 0.12) * 0.35)                         # and out
hits.add(T(31.8), boom(0.9, 70, 35) * 0.3)

# ── the band: drums, bass, pads under everything from the drop ──
KICKS = [b for b in range(4, 28)]
for b0 in KICKS:
    drums.add(T(b0), kick(0.55, 1.0 if b0 % 4 == 0 else 0.92))
for b0 in range(5, 28, 2):
    drums.add(T(b0), clap() * 0.42, pan=0.05)
    sends.add(T(b0), clap() * 0.25)
for b0 in range(4, 28):
    drums.add(T(b0 + 0.5), hat(b0 % 4 == 3) * (0.16 if b0 % 4 == 3 else 0.12), pan=0.25)
    if 16 <= b0 < 20 or b0 >= 25:
        for s in (0.25, 0.75):
            drums.add(T(b0 + s), hat() * 0.06, pan=-0.3)
for b0, nm in BASSLINE:                                              # sub + offbeat pluck bass
    end = min(b0 + 4, 27.72)
    n = ns(T(end - b0))
    t = secs(n)
    f = hz(nm)
    if b0 == 20:   # the liquid: bass wobbles on eighths
        wob = 400 + 1800 * (0.5 + 0.5 * np.cos(2 * np.pi * t / T(0.5)))
        sub = sweep(saw(f, n) + saw(f * 1.005, n), wob, 3.0) * 0.26 + sine(f, n) * 0.5
    else:
        sub = np.tanh(sine(f, n) * 1.4) * 0.55
    bass.add(T(b0), fade(sub, 0.01, 0.05))
    if b0 in (4, 8, 12, 24):
        for k in range(4):
            if b0 + k + 0.5 < 27.72:
                bass.add(T(b0 + k + 0.5), pluck(f, 0.22, 1.2, 10) * 0.35)
for b0, b1, voicing, cut in CHORDS:
    pv = pad_voice([hz(x) for x in voicing], T(b1 - b0), cut, 0.12, 5, 0.03, 0.25)
    pads.add(T(b0), pv * 0.55)
    sends.add(T(b0), pv * 0.2)
for b0 in (4, 5, 6, 7):                                              # a chord stab on every word
    keys.add(T(b0), pad_voice([hz(x) * 2 for x in CHORDS[0][2]], 0.08, (6000, 1500), 0.1, 3, 0.002, 0.2) * 0.35)
for b0 in (25.0, 25.5, 26.0, 26.5):
    ch = CHORDS[5][2] if b0 < 26 else CHORDS[6][2]
    keys.add(T(b0), pad_voice([hz(x) * 2 for x in ch], 0.1, (7000, 2000), 0.1, 3, 0.002, 0.2) * 0.35)

# ═════════════════════════ mixdown ═════════════════════════

L = N + PAD
tt = np.arange(L) / SR

# sidechain: the pads and bass breathe with the kick
duck = np.ones(L)
for b0 in KICKS + [28]:
    i = int(T(b0) * SR)
    seg = tt[i:i + SR // 2] - T(b0)
    duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], 1 - 0.72 * np.exp(-seg / 0.11))

ir = make_ir(1.9)
lanes = {}
for lane in ('pre', 'post'):
    g = lambda bus: getattr(bus, lane)
    wet = reverb(g(sends) + 0.25 * g(keys) + 0.12 * g(fx), ir)
    lanes[lane] = (g(drums) * 1.0 + g(bass) * duck * 0.9 + g(pads) * duck * 0.55
                   + g(keys) * 0.9 + g(fx) * 0.8 + g(hits) * 0.9 + wet * 0.35)

# the breath: a hard choke before the final hit
gate = np.ones(L)
a, b_ = int(BREATH * SR), int(T(27.75) * SR)
gate[a:b_] = np.linspace(1, 0, b_ - a)
gate[b_:] = 0
mix = lanes['pre'] * gate + lanes['post']

# clean up the lows, glue, soft-clip, normalise
mix = hp(mix, 24)
mix /= np.max(np.abs(mix)) + 1e-9
drive = 1.8
mix = np.tanh(mix * drive) / np.tanh(drive)
mix = mix[:, :N]
end = ns(0.06)
mix[:, -end:] *= np.linspace(1, 0, end)
mix *= 10 ** (-1.0 / 20) / np.max(np.abs(mix))

out = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / 'reel' / 'audio' / 'soundtrack.wav')
out.parent.mkdir(parents=True, exist_ok=True)
pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

rms = np.sqrt(np.mean(mix ** 2))
print(f'wrote {out}  ({DUR:.3f}s, {SR} Hz, peak -1.0 dBFS, rms {20 * np.log10(rms):.1f} dBFS)')
