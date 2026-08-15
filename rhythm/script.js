const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startOverlay = document.getElementById('startOverlay');
const resultOverlay = document.getElementById('resultOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const scoreDisplay = document.getElementById('currentScore');
const comboDisplay = document.getElementById('comboDisplay');
const gaugeFill = document.getElementById('gaugeFill');
const judgmentText = document.getElementById('judgmentText');

const finalScoreDisplay = document.getElementById('finalScore');
const maxComboDisplay = document.getElementById('maxComboDisplay');
const perfectCountDisplay = document.getElementById('perfectCount');
const greatCountDisplay = document.getElementById('greatCount');
const missCountDisplay = document.getElementById('missCount');

const modeSynthBtn = document.getElementById('modeSynthBtn');
const modeYtBtn = document.getElementById('modeYtBtn');
const synthOptions = document.getElementById('synthOptions');
const ytOptions = document.getElementById('ytOptions');
const ytContainer = document.getElementById('ytContainer');
const ytSongSelect = document.getElementById('ytSongSelect');
const customYtInput = document.getElementById('customYtInput');
const applyYtBtn = document.getElementById('applyYtBtn');

const trackButtons = document.querySelectorAll('.track-btn');
const touchButtons = document.querySelectorAll('.lane-touch-btn');

// Lane configs
const laneCount = 4;
const laneWidth = canvas.width / laneCount;
const targetY = 440;
const noteSpeed = 390;
const laneColors = ['#06b6d4', '#ec4899', '#f59e0b', '#10b981'];
const keyLaneMap = {
  'd': 0, 'D': 0, 'ก': 0,
  'f': 1, 'F': 1, 'ด': 1,
  'j': 2, 'J': 2, '่': 2,
  'k': 3, 'K': 3, 'า': 3
};

// Game state
let isPlaying = false;
let currentMode = 'synth';
let currentTrack = 'city';
let currentYtVideoId = 'gCYcTST8sVY';

let notes = [];
let score = 0;
let combo = 0;
let maxCombo = 0;
let groove = 100;
let stats = { perfect: 0, great: 0, miss: 0 };
let songStartTime = 0;

let particles = [];
let ripples = [];
let visualizerBars = [];
let lanePressStates = [false, false, false, false];
let screenShake = 0;

// YouTube Player
let ytPlayer = null;
let isYtReady = false;

// Audio synth context
let audioCtx = null;
let synthInterval = null;

// Init YouTube API
window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('ytPlayer', {
    height: '140',
    width: '320',
    videoId: currentYtVideoId,
    playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1, 'rel': 0 },
    events: {
      'onReady': () => { isYtReady = true; },
      'onStateChange': onYtStateChange
    }
  });
};

function loadYouTubeAPI() {
  if (window.YT) return;
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
loadYouTubeAPI();

function onYtStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) endGame(true);
}

// Audio synthesis
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSynthNote(freq, type = 'sine', duration = 0.18, gainVal = 0.1) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(gainVal, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

function playDrumSound(type) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  if (type === 'kick') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.14);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.start(now);
    osc.stop(now + 0.14);
  } else if (type === 'snare') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

// Generate Note Charts
function generateChart() {
  notes = [];
  const duration = currentMode === 'yt' ? 90 : 45;
  const bpm = currentTrack === 'city' ? 120 : currentTrack === 'highway' ? 135 : 150;
  const beatInterval = 60 / bpm;

  let t = 2.0;
  const leadFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

  while (t < duration) {
    const lane1 = Math.floor(Math.random() * laneCount);
    notes.push({
      lane: lane1,
      hitTime: t * 1000,
      hit: false,
      missed: false,
      freq: leadFreqs[Math.floor(Math.random() * leadFreqs.length)]
    });

    if (Math.random() < 0.28) {
      let lane2 = (lane1 + 1 + Math.floor(Math.random() * 2)) % laneCount;
      notes.push({
        lane: lane2,
        hitTime: t * 1000,
        hit: false,
        missed: false,
        freq: leadFreqs[Math.floor(Math.random() * leadFreqs.length)]
      });
    }

    t += (Math.random() < 0.35 ? beatInterval / 2 : beatInterval);
  }

  notes.sort((a, b) => a.hitTime - b.hitTime);
}

// Start Game
function startGame() {
  initAudio();
  score = 0;
  combo = 0;
  maxCombo = 0;
  groove = 100;
  stats = { perfect: 0, great: 0, miss: 0 };
  particles = [];
  ripples = [];
  screenShake = 0;

  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;
  gaugeFill.style.width = '100%';

  // Init visualizer bars
  visualizerBars = Array(8).fill(0);

  generateChart();

  isPlaying = true;
  startOverlay.classList.remove('active');
  resultOverlay.classList.remove('active');

  songStartTime = Date.now();

  if (currentMode === 'yt' && ytPlayer && isYtReady) {
    ytPlayer.seekTo(0);
    ytPlayer.playVideo();
  } else if (currentMode === 'synth') {
    startSynthMusic();
  }

  requestAnimationFrame(gameLoop);
}

// Synthwave procedural music
let synthStep = 0;
function startSynthMusic() {
  clearInterval(synthInterval);
  synthStep = 0;
  const bpm = currentTrack === 'city' ? 120 : currentTrack === 'highway' ? 135 : 150;
  const intervalMs = (60 / bpm / 2) * 1000;

  const bassScale = [110, 110, 130.81, 146.83, 98, 98, 110, 123.47];

  synthInterval = setInterval(() => {
    if (!isPlaying) {
      clearInterval(synthInterval);
      return;
    }

    if (synthStep % 4 === 0) {
      playDrumSound('kick');
      visualizerBars[0] = 30;
      visualizerBars[1] = 22;
    }
    if (synthStep % 4 === 2) {
      playDrumSound('snare');
      visualizerBars[6] = 25;
      visualizerBars[7] = 28;
    }

    const bassFreq = bassScale[Math.floor(synthStep / 2) % bassScale.length];
    playSynthNote(bassFreq, 'sawtooth', 0.12, 0.08);

    synthStep++;
  }, intervalMs);
}

function showJudgment(type) {
  judgmentText.textContent = type.toUpperCase() + (type === 'perfect' ? '!' : '');
  judgmentText.className = `judgment-text ${type} pop`;
  setTimeout(() => { judgmentText.classList.remove('pop'); }, 350);
}

// Hit Note
function hitLane(lane) {
  if (!isPlaying) return;
  initAudio();

  lanePressStates[lane] = true;
  setTimeout(() => { lanePressStates[lane] = false; }, 100);

  const currentTime = Date.now() - songStartTime;
  let candidate = null;
  let minDiff = Infinity;

  for (let note of notes) {
    if (!note.hit && !note.missed && note.lane === lane) {
      const diff = Math.abs(currentTime - note.hitTime);
      if (diff < minDiff && diff < 220) {
        minDiff = diff;
        candidate = note;
      }
    }
  }

  const lx = lane * laneWidth + laneWidth / 2;

  if (candidate) {
    candidate.hit = true;

    if (currentMode === 'synth') {
      playSynthNote(candidate.freq, 'sine', 0.22, 0.15);
    } else {
      playSynthNote(523.25, 'triangle', 0.1, 0.08);
    }

    createHitParticles(lx, targetY, laneColors[lane]);

    // Radial shockwave
    ripples.push({
      x: lx,
      y: targetY,
      radius: 8,
      maxRadius: 45,
      color: laneColors[lane],
      alpha: 1
    });

    if (minDiff <= 55) {
      stats.perfect++;
      score += 100 + combo * 2;
      combo++;
      groove = Math.min(100, groove + 4);
      screenShake = 3;
      showJudgment('perfect');
    } else if (minDiff <= 110) {
      stats.great++;
      score += 70 + combo;
      combo++;
      groove = Math.min(100, groove + 2);
      showJudgment('great');
    } else {
      score += 40;
      combo++;
      groove = Math.min(100, groove + 1);
      showJudgment('good');
    }
  } else {
    showJudgment('miss');
    combo = 0;
    groove = Math.max(0, groove - 4);
  }

  maxCombo = Math.max(maxCombo, combo);
  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;
  gaugeFill.style.width = groove + '%';

  if (groove <= 0) endGame(false);
}

function createHitParticles(x, y, color) {
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2.5;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color,
      alpha: 1,
      decay: Math.random() * 0.05 + 0.03
    });
  }
}

// Game Loop
function gameLoop() {
  if (!isPlaying) return;

  update();
  draw();

  requestAnimationFrame(gameLoop);
}

function update() {
  const currentTime = Date.now() - songStartTime;

  // Check missed notes
  let activeRemaining = false;
  notes.forEach(note => {
    if (!note.hit && !note.missed) {
      activeRemaining = true;
      if (currentTime - note.hitTime > 160) {
        note.missed = true;
        stats.miss++;
        combo = 0;
        comboDisplay.textContent = combo;
        groove = Math.max(0, groove - 8);
        gaugeFill.style.width = groove + '%';
        showJudgment('miss');

        if (groove <= 0) endGame(false);
      }
    }
  });

  if (!activeRemaining && notes.length > 0 && currentTime > notes[notes.length - 1].hitTime + 1500) {
    endGame(true);
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.alpha -= p.decay;
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  // Update Ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    let r = ripples[i];
    r.radius += 4;
    r.alpha -= 0.05;
    if (r.alpha <= 0 || r.radius >= r.maxRadius) ripples.splice(i, 1);
  }

  // Decay visualizer bars
  for (let i = 0; i < visualizerBars.length; i++) {
    visualizerBars[i] *= 0.88;
  }

  // Decay shake
  if (screenShake > 0) screenShake *= 0.85;
  if (screenShake < 0.2) screenShake = 0;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  // Draw 4 Highway Lanes with Perspective depth
  for (let i = 0; i < laneCount; i++) {
    const lx = i * laneWidth;
    
    // Lane press glow
    if (lanePressStates[i]) {
      const grad = ctx.createLinearGradient(lx, 0, lx, canvas.height);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, laneColors[i]);
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(lx, 0, laneWidth, canvas.height);
      ctx.globalAlpha = 1;
    }

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, 0); ctx.lineTo(lx, canvas.height);
    ctx.stroke();
  }

  // Visualizer bars at edges
  ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
  for (let i = 0; i < 4; i++) {
    const h = visualizerBars[i] || 0;
    ctx.fillRect(4, targetY - h * 2, 4, h * 2);
    const h2 = visualizerBars[i + 4] || 0;
    ctx.fillRect(canvas.width - 8, targetY - h2 * 2, 4, h2 * 2);
  }

  // Target Hit Line
  ctx.save();
  ctx.strokeStyle = '#a855f7';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#a855f7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, targetY);
  ctx.lineTo(canvas.width, targetY);
  ctx.stroke();

  // Target pill slots
  for (let i = 0; i < laneCount; i++) {
    ctx.fillStyle = laneColors[i];
    ctx.shadowColor = laneColors[i];
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(i * laneWidth + 10, targetY - 7, laneWidth - 20, 14, 6);
    ctx.fill();
  }
  ctx.restore();

  // Draw Notes with Light Trails
  const currentTime = Date.now() - songStartTime;

  notes.forEach(note => {
    if (!note.hit && !note.missed) {
      const timeDelta = (note.hitTime - currentTime) / 1000;
      const ny = targetY - timeDelta * noteSpeed;

      if (ny > -40 && ny < canvas.height) {
        const nx = note.lane * laneWidth + 10;
        const nw = laneWidth - 20;
        const nh = 16;

        ctx.save();
        
        // Trail gradient
        const trailGrad = ctx.createLinearGradient(nx, ny - 30, nx, ny);
        trailGrad.addColorStop(0, 'transparent');
        trailGrad.addColorStop(1, laneColors[note.lane]);
        ctx.fillStyle = trailGrad;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(nx + 4, ny - 30, nw - 8, 30);
        ctx.globalAlpha = 1;

        // Main Note
        ctx.fillStyle = laneColors[note.lane];
        ctx.shadowBlur = 16;
        ctx.shadowColor = laneColors[note.lane];
        ctx.beginPath();
        ctx.roundRect(nx, ny - nh / 2, nw, nh, 8);
        ctx.fill();

        // Inner specular highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(nx + 6, ny - 3, nw - 12, 4, 2);
        ctx.fill();

        ctx.restore();
      }
    }
  });

  // Draw Ripples
  ripples.forEach(r => {
    ctx.save();
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = r.alpha;
    ctx.shadowBlur = 10;
    ctx.shadowColor = r.color;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // Draw Particles
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}

function endGame(isClear) {
  isPlaying = false;
  clearInterval(synthInterval);
  if (ytPlayer && isYtReady) ytPlayer.pauseVideo();

  finalScoreDisplay.textContent = score;
  maxComboDisplay.textContent = maxCombo;
  perfectCountDisplay.textContent = stats.perfect;
  greatCountDisplay.textContent = stats.great;
  missCountDisplay.textContent = stats.miss;

  const resultTitle = document.getElementById('resultTitle');
  if (isClear) {
    resultTitle.textContent = 'STAGE CLEAR! 🎉';
    resultTitle.className = 'highlight';
  } else {
    resultTitle.textContent = 'STAGE FAILED!';
    resultTitle.className = 'danger-text';
  }

  resultOverlay.classList.add('active');
}

// Event Listeners
window.addEventListener('keydown', (e) => {
  if (keyLaneMap[e.key] !== undefined) {
    e.preventDefault();
    hitLane(keyLaneMap[e.key]);
  }
});

touchButtons.forEach(btn => {
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    hitLane(parseInt(btn.dataset.lane, 10));
  }, { passive: false });

  btn.addEventListener('mousedown', () => {
    hitLane(parseInt(btn.dataset.lane, 10));
  });
});

modeSynthBtn.addEventListener('click', () => {
  modeSynthBtn.classList.add('active');
  modeYtBtn.classList.remove('active');
  synthOptions.classList.remove('hide');
  ytOptions.classList.add('hide');
  ytContainer.classList.add('hide');
  currentMode = 'synth';
});

modeYtBtn.addEventListener('click', () => {
  modeYtBtn.classList.add('active');
  modeSynthBtn.classList.remove('active');
  ytOptions.classList.remove('hide');
  synthOptions.classList.add('hide');
  ytContainer.classList.remove('hide');
  currentMode = 'yt';
});

trackButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    trackButtons.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentTrack = e.target.dataset.track;
  });
});

ytSongSelect.addEventListener('change', (e) => {
  currentYtVideoId = e.target.value;
  if (ytPlayer && isYtReady) ytPlayer.loadVideoById(currentYtVideoId);
});

applyYtBtn.addEventListener('click', () => {
  const val = customYtInput.value.trim();
  if (val) {
    let videoId = val;
    if (val.includes('v=')) videoId = val.split('v=')[1].split('&')[0];
    else if (val.includes('youtu.be/')) videoId = val.split('youtu.be/')[1].split('?')[0];
    currentYtVideoId = videoId;
    if (ytPlayer && isYtReady) ytPlayer.loadVideoById(currentYtVideoId);
  }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
