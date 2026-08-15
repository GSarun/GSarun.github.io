const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const scoreDisplay = document.getElementById('currentScore');
const highScoreDisplay = document.getElementById('highScore');
const comboDisplay = document.getElementById('comboCount');
const finalScoreDisplay = document.getElementById('finalScore');
const newRecordMsg = document.getElementById('newRecordMsg');

// Game state variables
let stack = [];
let debris = [];
let ripples = [];
let sparkles = [];
let bgStars = [];
let activeBlock = null;
let cameraY = 0;
let targetCameraY = 0;
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('tower_high_score') || 0;
let combo = 0;
let blockHeight = 32;
let gameSpeed = 3;
let screenShake = 0;

highScoreDisplay.textContent = highScore;

// Audio synthesis context
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === 'place') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.1);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'perfect') {
    osc.type = 'triangle';
    // Brilliant chime
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
    });
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } else if (type === 'gameover') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.6);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  }
}

// Block color generator (Pastel Neon Rainbow)
function getBlockColor(index) {
  const hue = (index * 14 + 20) % 360;
  return `hsl(${hue}, 85%, 60%)`;
}
function getBlockLight(index) {
  const hue = (index * 14 + 20) % 360;
  return `hsl(${hue}, 90%, 75%)`;
}

// Background stars
function initBgStars() {
  bgStars = [];
  for (let i = 0; i < 40; i++) {
    bgStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.2
    });
  }
}

// Start Game
function startGame() {
  initAudio();
  stack = [];
  debris = [];
  ripples = [];
  sparkles = [];
  score = 0;
  combo = 0;
  cameraY = 0;
  targetCameraY = 0;
  gameSpeed = 3.2;
  screenShake = 0;

  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;

  const baseW = 190;
  stack.push({
    x: (canvas.width - baseW) / 2,
    y: canvas.height - blockHeight,
    w: baseW,
    index: 0
  });

  spawnActiveBlock();

  isPlaying = true;
  startOverlay.classList.remove('active');
  gameOverOverlay.classList.remove('active');
  newRecordMsg.classList.add('hide');

  initBgStars();
  requestAnimationFrame(gameLoop);
}

function spawnActiveBlock() {
  const lastPlaced = stack[stack.length - 1];
  const newY = lastPlaced.y - blockHeight;

  activeBlock = {
    x: 0,
    y: newY,
    w: lastPlaced.w,
    index: stack.length,
    vx: gameSpeed,
    direction: 1
  };

  gameSpeed = 3.2 + Math.floor(stack.length / 5) * 0.45;
  activeBlock.vx = gameSpeed;
}

// Action: Drop Block
function dropBlock() {
  if (!isPlaying || !activeBlock) return;

  const topBlock = stack[stack.length - 1];
  const overlapLeft = Math.max(activeBlock.x, topBlock.x);
  const overlapRight = Math.min(activeBlock.x + activeBlock.w, topBlock.x + topBlock.w);
  const overlapW = overlapRight - overlapLeft;

  if (overlapW <= 0) {
    // Missed completely -> Game Over
    isPlaying = false;
    screenShake = 12;
    playSound('gameover');
    gameOver();
    return;
  }

  const diff = activeBlock.x - topBlock.x;
  screenShake = 4;

  if (Math.abs(diff) < 5) {
    // Perfect alignment!
    activeBlock.x = topBlock.x;
    combo++;
    playSound('perfect');
    screenShake = 6;

    // Create expanding ripple wave
    ripples.push({
      x: activeBlock.x + activeBlock.w / 2,
      y: activeBlock.y + blockHeight / 2,
      radius: 10,
      color: getBlockColor(activeBlock.index),
      alpha: 1
    });

    // Create golden sparkle burst
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      sparkles.push({
        x: activeBlock.x + activeBlock.w / 2,
        y: activeBlock.y + blockHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: '#fde047',
        alpha: 1,
        decay: Math.random() * 0.04 + 0.02
      });
    }

    if (combo >= 3) {
      activeBlock.w = Math.min(190, activeBlock.w + 10);
      activeBlock.x = Math.max(0, activeBlock.x - 5);
    }
  } else {
    // Standard Placement
    combo = 0;
    playSound('place');

    let debrisX, debrisW;
    if (diff > 0) {
      debrisX = overlapRight;
      debrisW = (activeBlock.x + activeBlock.w) - overlapRight;
    } else {
      debrisX = activeBlock.x;
      debrisW = topBlock.x - activeBlock.x;
    }

    debris.push({
      x: debrisX,
      y: activeBlock.y,
      w: debrisW,
      index: activeBlock.index,
      vx: diff > 0 ? 2.5 : -2.5,
      vy: -1.5,
      rot: 0,
      vRot: (diff > 0 ? 1 : -1) * 0.08,
      gravity: 0.55
    });

    activeBlock.x = overlapLeft;
    activeBlock.w = overlapW;
  }

  stack.push({
    x: activeBlock.x,
    y: activeBlock.y,
    w: activeBlock.w,
    index: activeBlock.index
  });

  score = stack.length - 1;
  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;

  if (stack.length * blockHeight > 240) {
    targetCameraY = stack.length * blockHeight - 240;
  }

  spawnActiveBlock();
}

function gameOver() {
  finalScoreDisplay.textContent = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('tower_high_score', highScore);
    highScoreDisplay.textContent = highScore;
    newRecordMsg.classList.remove('hide');
  }
  gameOverOverlay.classList.add('active');
}

// Game Loop
function gameLoop() {
  if (!isPlaying) return;

  update();
  draw();

  requestAnimationFrame(gameLoop);
}

function update() {
  // Move active block
  if (activeBlock) {
    activeBlock.x += activeBlock.vx * activeBlock.direction;
    if (activeBlock.x + activeBlock.w >= canvas.width) {
      activeBlock.x = canvas.width - activeBlock.w;
      activeBlock.direction = -1;
    } else if (activeBlock.x <= 0) {
      activeBlock.x = 0;
      activeBlock.direction = 1;
    }
  }

  // Update debris
  for (let i = debris.length - 1; i >= 0; i--) {
    let d = debris[i];
    d.vy += d.gravity;
    d.x += d.vx;
    d.y += d.vy;
    d.rot += d.vRot;
    if (d.y > canvas.height + 150) {
      debris.splice(i, 1);
    }
  }

  // Update ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    let r = ripples[i];
    r.radius += 6;
    r.alpha -= 0.04;
    if (r.alpha <= 0) ripples.splice(i, 1);
  }

  // Update sparkles
  for (let i = sparkles.length - 1; i >= 0; i--) {
    let s = sparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= s.decay;
    if (s.alpha <= 0) sparkles.splice(i, 1);
  }

  // Camera interpolation
  cameraY += (targetCameraY - cameraY) * 0.12;

  // Screen shake decay
  if (screenShake > 0) screenShake *= 0.85;
  if (screenShake < 0.2) screenShake = 0;
}

function drawBlock(x, y, w, h, index) {
  const color = getBlockColor(index);
  const lightColor = getBlockLight(index);

  ctx.save();
  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  // Base block body with rounded corners
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h - 2, 6);
  ctx.fill();

  // Top Specular Shine
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, w - 4, 6, 3);
  ctx.fill();

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  // Apply Screen Shake
  if (screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;
    ctx.translate(shakeX, shakeY);
  }

  // Draw background stars
  bgStars.forEach(s => {
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    ctx.fillRect(s.x, (s.y + cameraY * 0.3) % canvas.height, s.size, s.size);
  });

  // Translate camera view
  ctx.translate(0, cameraY);

  // Draw Stack
  stack.forEach(b => {
    drawBlock(b.x, b.y, b.w, blockHeight, b.index);
  });

  // Draw Debris
  debris.forEach(d => {
    ctx.save();
    ctx.translate(d.x + d.w / 2, d.y + blockHeight / 2);
    ctx.rotate(d.rot);
    drawBlock(-d.w / 2, -blockHeight / 2, d.w, blockHeight, d.index);
    ctx.restore();
  });

  // Draw Active Block
  if (activeBlock) {
    drawBlock(activeBlock.x, activeBlock.y, activeBlock.w, blockHeight, activeBlock.index);
  }

  // Draw Ripples
  ripples.forEach(r => {
    ctx.save();
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = r.alpha;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // Draw Sparkles
  sparkles.forEach(s => {
    ctx.save();
    ctx.fillStyle = s.color;
    ctx.globalAlpha = s.alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}

// User inputs
startBtn.addEventListener('click', (e) => { e.stopPropagation(); startGame(); });
restartBtn.addEventListener('click', (e) => { e.stopPropagation(); startGame(); });

canvas.addEventListener('click', (e) => {
  e.preventDefault();
  dropBlock();
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    dropBlock();
  }
});
