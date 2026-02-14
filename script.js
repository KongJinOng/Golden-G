// ───────── YouTube Background Music ─────────
const YOUTUBE_VIDEO_ID = 'NM4e606yFJg'; // Just the video ID, not the full URL

let ytPlayer;
let ytReady = false;
let bgMusicStarted = false;

function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('yt-player', {
    videoId: YOUTUBE_VIDEO_ID,
    playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: YOUTUBE_VIDEO_ID },
    events: {
      onReady: () => { ytReady = true; }
    }
  });
}

function startBgMusic() {
  if (ytReady && ytPlayer && ytPlayer.playVideo) {
    ytPlayer.seekTo(40);
    ytPlayer.playVideo();
  }
}

// ───────── Floating Particles (Hearts & Sparkles) ─────────
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 20;
    this.size = Math.random() * 14 + 6;
    this.speedY = Math.random() * 0.8 + 0.3;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.4 + 0.1;
    this.fadeSpeed = Math.random() * 0.002 + 0.001;
    this.type = Math.random() > 0.4 ? 'heart' : 'sparkle';
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    // Warm scrapbook color palette
    const colors = ['#d4a0a0', '#c0605a', '#d4b896', '#b8ccb0', '#c8b0d8', '#dcc890'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.y -= this.speedY;
    this.x += this.speedX + Math.sin(this.y * 0.01) * 0.3;
    this.rotation += this.rotationSpeed;
    this.opacity -= this.fadeSpeed;

    if (this.opacity <= 0 || this.y < -20) {
      this.reset();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity;

    if (this.type === 'heart') {
      this.drawHeart();
    } else {
      this.drawSparkle();
    }

    ctx.restore();
  }

  drawHeart() {
    const s = this.size / 16;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, s * 3);
    ctx.bezierCurveTo(0, s * 0, -s * 10, s * 0, -s * 10, s * 7);
    ctx.bezierCurveTo(-s * 10, s * 12, 0, s * 14, 0, s * 18);
    ctx.bezierCurveTo(0, s * 14, s * 10, s * 12, s * 10, s * 7);
    ctx.bezierCurveTo(s * 10, s * 0, 0, s * 0, 0, s * 3);
    ctx.fill();
  }

  drawSparkle() {
    const s = this.size / 2;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle - 0.2) * s * 0.4, Math.sin(angle - 0.2) * s * 0.4);
      ctx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
      ctx.lineTo(Math.cos(angle + 0.2) * s * 0.4, Math.sin(angle + 0.2) * s * 0.4);
    }
    ctx.closePath();
    ctx.fill();
  }
}

// Spawn particles
for (let i = 0; i < 35; i++) {
  const p = new Particle();
  p.y = Math.random() * canvas.height;
  particles.push(p);
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}

animateParticles();

// ───────── Sound Effects (Web Audio API) ─────────
let audioCtx;

async function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  return audioCtx;
}

async function playEnvelopeSound() {
  const ctx = await ensureAudioCtx();
  const now = ctx.currentTime;

  // Soft whoosh — rising filtered noise
  const bufferSize = ctx.sampleRate * 0.6;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.linearRampToValueAtTime(1800, now + 0.3);
  filter.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.5);

  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.6);

  // Gentle chime
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now + i * 0.12);
    g.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.05);
    g.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.5);

    osc.connect(g).connect(ctx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.5);
  });
}

async function playCardOpenSound() {
  const ctx = await ensureAudioCtx();
  const now = ctx.currentTime;

  // Magical sparkle arpeggio
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const g = ctx.createGain();
    const t = now + i * 0.09;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.8);
  });

  // Warm pad chord underneath
  [262, 330, 392].forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now + 0.1);
    g.gain.linearRampToValueAtTime(0.06, now + 0.4);
    g.gain.linearRampToValueAtTime(0, now + 2.0);

    osc.connect(g).connect(ctx.destination);
    osc.start(now + 0.1);
    osc.stop(now + 2.0);
  });
}

async function playReplaySound() {
  const ctx = await ensureAudioCtx();
  const now = ctx.currentTime;

  // Quick descending chime
  [784, 659, 523].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now + i * 0.08);
    g.gain.linearRampToValueAtTime(0.08, now + i * 0.08 + 0.03);
    g.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.35);

    osc.connect(g).connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.35);
  });
}

async function playSpinSound() {
  const ctx = await ensureAudioCtx();
  const now = ctx.currentTime;

  // Lucky-draw wheel flaps — soft peg hits that slow down
  const totalFlaps = 20;
  const totalDuration = 1.8;

  // Pre-create a short noise buffer for the woody "flap" texture
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.07, ctx.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let j = 0; j < noiseData.length; j++) {
    noiseData[j] = (Math.random() * 2 - 1) * (1 - j / noiseData.length);
  }

  for (let i = 0; i < totalFlaps; i++) {
    const t = i / totalFlaps;
    const time = now + t * t * totalDuration;
    const vol = 0.10 + 0.06 * (1 - t);

    // Soft triangle tone — the main "flap" body
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 280 + Math.random() * 80;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(g).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.07);

    // Tiny noise burst — woody/plasticky peg texture
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 600;
    nf.Q.value = 1.5;

    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, time);
    ng.gain.linearRampToValueAtTime(vol * 0.5, time + 0.005);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(nf).connect(ng).connect(ctx.destination);
    noise.start(time);
    noise.stop(time + 0.07);
  }
}

async function playLandSound() {
  const ctx = await ensureAudioCtx();
  const now = ctx.currentTime;

  // Soft chime ding
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 880;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.15, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.6);

  // Harmonic overtone
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 1320;

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0, now);
  g2.gain.linearRampToValueAtTime(0.06, now + 0.02);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc2.connect(g2).connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.4);
}

// ───────── Reasons Roulette ─────────
const REASONS = [
  'Yall autistic asf fr',
  "Yall cute",
  'Yall are high tier normies',
  "Yall are not degloved",
];

const rouletteScene = document.getElementById('roulette-scene');
const spinBtn = document.getElementById('spin-btn');
const continueBtn = document.getElementById('continue-btn');
const spinCounter = document.getElementById('spin-counter');
const rouletteStrip = document.getElementById('roulette-strip');

let spinCount = 0;
let isSpinning = false;
let usedReasons = [];

function getNextReason() {
  if (usedReasons.length >= REASONS.length) usedReasons = [];
  let available = REASONS.filter(r => !usedReasons.includes(r));
  const pick = available[Math.floor(Math.random() * available.length)];
  usedReasons.push(pick);
  return pick;
}

function spinRoulette() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.classList.add('spinning');
  playSpinSound();

  const finalReason = getNextReason();

  // Build a strip of random reasons + the final one at the end
  const itemCount = 12;
  let items = [];
  for (let i = 0; i < itemCount - 1; i++) {
    items.push(REASONS[Math.floor(Math.random() * REASONS.length)]);
  }
  items.push(finalReason);

  // Populate the strip
  rouletteStrip.innerHTML = items
    .map(r => `<div class="roulette-item">${r}</div>`)
    .join('');

  // Animate: scroll from top to the last item
  const totalHeight = itemCount * 80;
  const finalOffset = -(totalHeight - 80);

  rouletteStrip.style.transition = 'none';
  rouletteStrip.style.transform = 'translateY(0)';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      rouletteStrip.style.transition = 'transform 1.8s cubic-bezier(0.15, 0.85, 0.35, 1)';
      rouletteStrip.style.transform = `translateY(${finalOffset}px)`;
    });
  });

  setTimeout(() => {
    playLandSound();
    spinCount++;
    spinCounter.textContent = `${spinCount} / ${REASONS.length} revealed`;
    spinBtn.classList.remove('spinning');
    isSpinning = false;

    if (spinCount >= REASONS.length) {
      spinBtn.style.display = 'none';
      spinCounter.textContent = 'All reasons revealed!';
      continueBtn.classList.add('visible');
    } else {
      spinBtn.textContent = 'Tap again';
    }
  }, 2000);
}

spinBtn.addEventListener('click', spinRoulette);

continueBtn.addEventListener('click', () => {
  rouletteScene.classList.remove('active');
  document.getElementById('envelope-scene').classList.add('active');
});

document.getElementById('skip-btn').addEventListener('click', () => {
  rouletteScene.classList.remove('active');
  document.getElementById('envelope-scene').classList.add('active');
});

// ───────── Envelope Interaction ─────────
const envelope = document.getElementById('envelope');
const envelopeScene = document.getElementById('envelope-scene');
const cardScene = document.getElementById('card-scene');

envelope.addEventListener('click', () => {
  if (envelope.classList.contains('opened')) return;

  envelope.classList.add('opened');
  playEnvelopeSound();

  // Transition to card scene after envelope animation
  setTimeout(() => {
    envelopeScene.classList.remove('active');
    cardScene.classList.add('active');

    // Show replay button after card appears
    setTimeout(() => {
      document.getElementById('replay-btn').classList.add('visible');
    }, 600);
  }, 1200);
});

// ───────── Card Open Interaction ─────────
const card = document.getElementById('card');

card.addEventListener('click', () => {
  if (card.classList.contains('opened')) return;

  card.classList.add('opened');
  playCardOpenSound();

  startBgMusic();

  // Burst of hearts on open
  spawnHeartBurst();
});

// ───────── Heart Burst Effect ─────────
function spawnHeartBurst() {
  const burstCount = 20;
  for (let i = 0; i < burstCount; i++) {
    const p = new Particle();
    p.x = canvas.width / 2 + (Math.random() - 0.5) * 100;
    p.y = canvas.height / 2;
    p.speedY = Math.random() * 2 + 1;
    p.speedX = (Math.random() - 0.5) * 3;
    p.opacity = 0.7;
    p.size = Math.random() * 18 + 10;
    p.type = 'heart';
    particles.push(p);
  }

  // Clean up extra particles after a while
  setTimeout(() => {
    particles = particles.slice(0, 35);
  }, 5000);
}

// ───────── Replay ─────────
document.getElementById('replay-btn').addEventListener('click', () => {
  // Reset everything
  card.classList.remove('opened');
  envelope.classList.remove('opened');

  document.getElementById('replay-btn').classList.remove('visible');
  playReplaySound();

  // Reset roulette state
  spinCount = 0;
  usedReasons = [];
  spinCounter.textContent = '';
  spinBtn.textContent = 'Tap to reveal';
  spinBtn.style.display = '';
  continueBtn.classList.remove('visible');
  rouletteStrip.innerHTML = '<div class="roulette-item"></div>';
  rouletteStrip.style.transition = 'none';
  rouletteStrip.style.transform = 'translateY(0)';

  cardScene.classList.remove('active');
  rouletteScene.classList.add('active');
});
