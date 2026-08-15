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
const laneWidth = canvas.width / laneCount; // 85px
const targetY = 440;
const noteSpeed = 380; // pixels per second
const laneColors = ['#06b6d4', '#ec4899', '#f59e0b', '#10b981'];
const laneKeys = ['d', 'f', 'j', 'k'];
const keyLaneMap = {
  'd': 0, 'D': 0, 'ก': 0,
  'f': 1, 'F': 1, 'ด': 1,
  'j': 2, 'J': 2, '่': 2,
  'k': 3, 'K': 3, 'า': 3
};

// Game state
let isPlaying = false;
let currentMode = 'synth'; // 'synth' or 'yt'
let currentTrack = 'city';
let currentYtVideoId = 'gCYcTST8sVY';

let notes = [];
let score = 0;
let combo = 0;
let maxCombo = 0;
let groove = 100; // 0 to 100%

let stats = { perfect: 0, great: 0, miss: 0 };

let songStartTime = 0;
let particles = [];
let lanePressStates = [false, false, false, false];

// YouTube IFrame Player
let ytPlayer = null;
let isYtReady = false;

// Audio synth context
let audioCtx = null;
let synthInterval = null;

// Initialize YouTube API
window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('ytPlayer', {
    height: '140',
    width: '320',
    videoId: currentYtVideoId,
    playerVars: {
      'playsinline': 1,
      'controls': 0,
      'disablekb': 1,
      'rel': 0
    },
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
  // If video ends, show results
  if (event.data === YT.PlayerState.ENDED) {
    endGame(true);
  }
}

// Audio synthesis
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSynthNote(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
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
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  } else if (type === 'snare') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

// Generate Note Charts
function generateChart() {
  notes = [];
  const duration = currentMode === 'yt' ? 90 : 45; // seconds
  const bpm = currentTrack === 'city' ? 120 : currentTrack === 'highway' ? 135 : 150;
  const beatInterval = 60 / bpm; // seconds per beat

  let t = 2.0; // start after 2 seconds
  const leadFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

  while (t < duration) {
    // 1-2 notes per beat or sub-beat
    const lane1 = Math.floor(Math.random() * laneCount);
    notes.push({
      lane: lane1,
      hitTime: t * 1000,
      hit: false,
      missed: false,
      freq: leadFreqs[Math.floor(Math.random() * leadFreqs.length)]
    });

    if (Math.random() < 0.25) {
      let lane2 = (lane1 + 1 + Math.floor(Math.random() * 2)) % laneCount;
      notes.push({
        lane: lane2,
        hitTime: t * 1000,
        hit: false,
        missed: false,
        freq: leadFreqs[Math.floor(Math.random() * leadFreqs.length)]
      });
    }

    t += (Math.random() < 0.3 ? beatInterval / 2 : beatInterval);
  }

  // Sort notes by hitTime
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

  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;
  gaugeFill.style.width = '100%';

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

// Synthwave procedural music player
let synthStep = 0;
function startSynthMusic() {
  clearInterval(synthInterval);
  synthStep = 0;
  const bpm = currentTrack === 'city' ? 120 : currentTrack === 'highway' ? 135 : 150;
  const intervalMs = (60 / bpm / 2) * 1000; // 8th notes

  const bassScale = [110, 110, 130.81, 146.83, 98, 98, 110, 123.47];

  synthInterval = setInterval(() => {
    if (!isPlaying) {
      clearInterval(synthInterval);
      return;
    }

    // Drums
    if (synthStep % 4 === 0) playDrumSound('kick');
    if (synthStep % 4 === 2) playDrumSound('snare');

    // Bassline
    const bassFreq = bassScale[Math.floor(synthStep / 2) % bassScale.length];
    playSynthNote(bassFreq, 'sawtooth', 0.12, 0.08);

    synthStep++;
  }, intervalMs);
}

// Floating judgment animation
function showJudgment(type) {
  judgmentText.textContent = type.toUpperCase() + (type === 'perfect' ? '!' : '');
  judgmentText.className = `judgment-text ${type} pop`;
  setTimeout(() => {
    judgmentText.classList.remove('pop');
  }, 350);
}

// Trigger Note Hit
function hitLane(lane) {
  if (!isPlaying) return;
  initAudio();

  lanePressStates[lane] = true;
  setTimeout(() => { lanePressStates[lane] = false; }, 100);

  const currentTime = Date.now() - songStartTime;

  // Find closest unhit note in lane
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

  if (candidate) {
    candidate.hit = true;

    // Trigger hit sound
    if (currentMode === 'synth') {
      playSynthNote(candidate.freq, 'sine', 0.2, 0.15);
    } else {
      playSynthNote(523.25, 'triangle', 0.1, 0.08);
    }

    createHitParticles(lane * laneWidth + laneWidth / 2, targetY, laneColors[lane]);

    if (minDiff <= 55) {
      // Perfect
      stats.perfect++;
      score += 100 + combo * 2;
      combo++;
      groove = Math.min(100, groove + 4);
      showJudgment('perfect');
    } else if (minDiff <= 110) {
      // Great
      stats.great++;
      score += 70 + combo;
      combo++;
      groove = Math.min(100, groove + 2);
      showJudgment('great');
    } else {
      // Good
      score += 40;
      combo++;
      groove = Math.min(100, groove + 1);
      showJudgment('good');
    }
  } else {
    // Empty strike
    showJudgment('miss');
    combo = 0;
    groove = Math.max(0, groove - 4);
  }

  maxCombo = Math.max(maxCombo, combo);
  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;
  gaugeFill.style.width = groove + '%';

  if (groove <= 0) {
    endGame(false);
  }
}

// Particle system
function createHitParticles(x, y, color) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
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

        if (groove <= 0) {
          endGame(false);
        }
      }
    }
  });

  // End song when notes finish
  if (!activeRemaining && notes.length > 0 && currentTime > notes[notes.length - 1].hitTime + 1500) {
    endGame(true);
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw 4 Lanes
  for (let i = 0; i < laneCount; i++) {
    const lx = i * laneWidth;
    
    // Lane background tint if pressed
    if (lanePressStates[i]) {
      ctx.fillStyle = `rgba(${i === 0 ? '6,182,212' : i === 1 ? '236,72,153' : i === 2 ? '245,158,11' : '16,185,129'}, 0.25)`;
      ctx.fillRect(lx, 0, laneWidth, canvas.height);
    }

    // Lane border dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, canvas.height);
    ctx.stroke();
  }

  // Draw Hit Target Line
  ctx.save();
  ctx.strokeStyle = '#a855f7';
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#a855f7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, targetY);
  ctx.lineTo(canvas.width, targetY);
  ctx.stroke();

  // Target lane indicators
  for (let i = 0; i < laneCount; i++) {
    ctx.fillStyle = laneColors[i];
    ctx.shadowColor = laneColors[i];
    ctx.fillRect(i * laneWidth + 8, targetY - 6, laneWidth - 16, 12);
  }
  ctx.restore();

  // Draw Falling Notes
  const currentTime = Date.now() - songStartTime;

  notes.forEach(note => {
    if (!note.hit && !note.missed) {
      // Calculate Y based on time delta
      const timeDelta = (note.hitTime - currentTime) / 1000;
      const ny = targetY - timeDelta * noteSpeed;

      if (ny > -30 && ny < canvas.height) {
        const nx = note.lane * laneWidth + 8;
        const nw = laneWidth - 16;
        const nh = 14;

        ctx.save();
        ctx.fillStyle = laneColors[note.lane];
        ctx.shadowBlur = 12;
        ctx.shadowColor = laneColors[note.lane];
        
        // Rounded note pill
        ctx.beginPath();
        ctx.roundRect(nx, ny - nh / 2, nw, nh, 6);
        ctx.fill();

        // Inner shine
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(nx + 6, ny - 2, nw - 12, 3);
        ctx.restore();
      }
    }
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

// Input Handlers
window.addEventListener('keydown', (e) => {
  if (keyLaneMap[e.key] !== undefined) {
    e.preventDefault();
    hitLane(keyLaneMap[e.key]);
  }
});

// Touch buttons
touchButtons.forEach(btn => {
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const lane = parseInt(btn.dataset.lane, 10);
    hitLane(lane);
  }, { passive: false });

  btn.addEventListener('mousedown', () => {
    const lane = parseInt(btn.dataset.lane, 10);
    hitLane(lane);
  });
});

// Mode switcher
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

// Track selection
trackButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    trackButtons.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentTrack = e.target.dataset.track;
  });
});

// YouTube selection
ytSongSelect.addEventListener('change', (e) => {
  currentYtVideoId = e.target.value;
  if (ytPlayer && isYtReady) ytPlayer.loadVideoById(currentYtVideoId);
});

applyYtBtn.addEventListener('click', () => {
  const val = customYtInput.value.trim();
  if (val) {
    // Extract video ID if URL is pasted
    let videoId = val;
    if (val.includes('v=')) {
      videoId = val.split('v=')[1].split('&')[0];
    } else if (val.includes('youtu.be/')) {
      videoId = val.split('youtu.be/')[1].split('?')[0];
    }
    currentYtVideoId = videoId;
    if (ytPlayer && isYtReady) ytPlayer.loadVideoById(currentYtVideoId);
  }
});

// Overlays
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
