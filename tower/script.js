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
let activeBlock = null;
let cameraY = 0;
let targetCameraY = 0;
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('tower_high_score') || 0;
let combo = 0;
let blockHeight = 30;
let gameSpeed = 3;

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
    osc.frequency.setValueAtTime(440, now); // A4
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'perfect') {
    osc.type = 'triangle';
    // Arpeggio
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.18); // C6
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (type === 'gameover') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.6);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  }
}

// Block generation helper
function getBlockColor(index) {
  const hue = (index * 12) % 360;
  return `hsl(${hue}, 85%, 60%)`;
}

// Start Game function
function startGame() {
  initAudio();
  stack = [];
  debris = [];
  score = 0;
  combo = 0;
  cameraY = 0;
  targetCameraY = 0;
  gameSpeed = 3;

  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;

  // Initial base block
  const baseW = 180;
  stack.push({
    x: (canvas.width - baseW) / 2,
    y: canvas.height - blockHeight,
    w: baseW,
    color: getBlockColor(0)
  });

  spawnActiveBlock();

  isPlaying = true;
  startOverlay.classList.remove('active');
  gameOverOverlay.classList.remove('active');
  newRecordMsg.classList.add('hide');

  requestAnimationFrame(gameLoop);
}

function spawnActiveBlock() {
  const lastPlaced = stack[stack.length - 1];
  const newY = lastPlaced.y - blockHeight;

  activeBlock = {
    x: 0,
    y: newY,
    w: lastPlaced.w,
    color: getBlockColor(stack.length),
    vx: gameSpeed,
    direction: 1
  };

  // Gradually increase speed
  gameSpeed = 3 + Math.floor(stack.length / 5) * 0.5;
  activeBlock.vx = gameSpeed;
}

// Action: Drop block
function dropBlock() {
  if (!isPlaying || !activeBlock) return;

  const topBlock = stack[stack.length - 1];

  // Overlap bounds
  const overlapLeft = Math.max(activeBlock.x, topBlock.x);
  const overlapRight = Math.min(activeBlock.x + activeBlock.w, topBlock.x + topBlock.w);
  const overlapW = overlapRight - overlapLeft;

  if (overlapW <= 0) {
    // Game Over
    isPlaying = false;
    playSound('gameover');
    gameOver();
    return;
  }

  const diff = activeBlock.x - topBlock.x;
  
  // Check for perfect overlap
  if (Math.abs(diff) < 6) {
    // Snap to perfect
    activeBlock.x = topBlock.x;
    combo++;
    playSound('perfect');
    // If combo builds up, maybe reward with wider block (max base width)
    if (combo >= 3) {
      activeBlock.w = Math.min(180, activeBlock.w + 10);
      activeBlock.x = Math.max(0, activeBlock.x - 5);
    }
  } else {
    // Cut off part and create debris
    combo = 0;
    playSound('place');

    let debrisX, debrisW;
    if (diff > 0) {
      // Cutoff is on the right
      debrisX = overlapRight;
      debrisW = (activeBlock.x + activeBlock.w) - overlapRight;
    } else {
      // Cutoff is on the left
      debrisX = activeBlock.x;
      debrisW = topBlock.x - activeBlock.x;
    }

    debris.push({
      x: debrisX,
      y: activeBlock.y,
      w: debrisW,
      color: activeBlock.color,
      vx: diff > 0 ? 2 : -2,
      vy: -1,
      gravity: 0.6
    });

    activeBlock.x = overlapLeft;
    activeBlock.w = overlapW;
  }

  // Push to stack
  stack.push({
    x: activeBlock.x,
    y: activeBlock.y,
    w: activeBlock.w,
    color: activeBlock.color
  });

  score = stack.length - 1;
  scoreDisplay.textContent = score;
  comboDisplay.textContent = combo;

  // Move camera upwards
  if (stack.length * blockHeight > 250) {
    targetCameraY = stack.length * blockHeight - 250;
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

    // Filter out debris fallen off-screen
    if (d.y > canvas.height + 100) {
      debris.splice(i, 1);
    }
  }

  // Interpolate camera position
  cameraY += (targetCameraY - cameraY) * 0.1;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Translate camera view
  ctx.translate(0, cameraY);

  // Draw placed stack
  stack.forEach(block => {
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.w, blockHeight - 1);
    
    // Highlights for 3D depth
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(block.x, block.y, block.w, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(block.x, block.y + blockHeight - 5, block.w, 4);
  });

  // Draw debris
  debris.forEach(d => {
    ctx.fillStyle = d.color;
    ctx.fillRect(d.x, d.y, d.w, blockHeight - 1);
  });

  // Draw active block
  if (activeBlock) {
    ctx.fillStyle = activeBlock.color;
    ctx.fillRect(activeBlock.x, activeBlock.y, activeBlock.w, blockHeight - 1);

    // Highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(activeBlock.x, activeBlock.y, activeBlock.w, 4);
  }

  ctx.restore();
}

// User Inputs
startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

restartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

// Drop trigger (Clicking canvas or pressing space)
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
