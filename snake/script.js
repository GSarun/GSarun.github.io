const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const scoreDisplay = document.getElementById('currentScore');
const highScoreDisplay = document.getElementById('highScore');
const newRecordMsg = document.getElementById('newRecordMsg');
const powerupDisplay = document.getElementById('powerupStatus');
const finalScoreDisplay = document.getElementById('finalScore');

const mapBtns = document.querySelectorAll('.map-btn');

// Mobile buttons
const btnUp = document.getElementById('ctrlUp');
const btnDown = document.getElementById('ctrlDown');
const btnLeft = document.getElementById('ctrlLeft');
const btnRight = document.getElementById('ctrlRight');

// Grid configs
const gridSize = 20;
const tileCount = canvas.width / gridSize; // 20x20 grid

// Game states
let snake = [];
let food = null;
let dx = 1;
let dy = 0;
let nextDx = 1;
let nextDy = 0;
let score = 0;
let highScore = 0;
let currentMap = 'classic';
let isPlaying = false;
let gameTimeout = null;

// Powerup states
let activePowerup = 'none'; // 'none', 'speed', 'double'
let powerupTimer = null;
let baseSpeed = 130;
let currentSpeed = 130;

// Particles
let particles = [];

// Wall layouts
let walls = [];

// Audio
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === 'eat') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'powerup') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'die') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.5);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

// Generate walls based on map
function loadMap() {
  walls = [];
  if (currentMap === 'box') {
    // Outer walls are boundaries (checked in logic)
    // Add central block
    for (let x = 7; x <= 12; x++) {
      walls.push({ x: x, y: 7 });
      walls.push({ x: x, y: 12 });
    }
    for (let y = 8; y <= 11; y++) {
      walls.push({ x: 7, y: y });
      walls.push({ x: 12, y: y });
    }
  } else if (currentMap === 'maze') {
    // Top-left line
    for (let x = 3; x <= 8; x++) walls.push({ x: x, y: 5 });
    // Bottom-right line
    for (let x = 11; x <= 16; x++) walls.push({ x: x, y: 14 });
    // Vertical left
    for (let y = 8; y <= 13; y++) walls.push({ x: 5, y: y });
    // Vertical right
    for (let y = 6; y <= 11; y++) walls.push({ x: 14, y: y });
  }

  // Load High Score for map
  highScore = localStorage.getItem(`snake_high_${currentMap}`) || 0;
  highScoreDisplay.textContent = highScore;
}

// Particle bursts
function createBurst(x, y, color) {
  const px = x * gridSize + gridSize / 2;
  const py = y * gridSize + gridSize / 2;
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color,
      alpha: 1,
      decay: Math.random() * 0.05 + 0.02
    });
  }
}

// Game Controls
function changeDirection(newDx, newDy) {
  // Prevent 180 degree turns instantly
  if (newDx !== 0 && dx === 0) {
    nextDx = newDx;
    nextDy = 0;
  }
  if (newDy !== 0 && dy === 0) {
    nextDx = 0;
    nextDy = newDy;
  }
}

// Listen to Keyboard
window.addEventListener('keydown', (e) => {
  if (!isPlaying) return;
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      changeDirection(0, -1);
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      changeDirection(0, 1);
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      changeDirection(-1, 0);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      changeDirection(1, 0);
      break;
  }
});

// Mobile button binds
btnUp.addEventListener('click', () => changeDirection(0, -1));
btnDown.addEventListener('click', () => changeDirection(0, 1));
btnLeft.addEventListener('click', () => changeDirection(-1, 0));
btnRight.addEventListener('click', () => changeDirection(1, 0));

// Start game routine
function startGame() {
  initAudio();
  clearTimeout(gameTimeout);
  clearTimeout(powerupTimer);
  
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  
  dx = 1;
  dy = 0;
  nextDx = 1;
  nextDy = 0;
  
  score = 0;
  scoreDisplay.textContent = score;

  activePowerup = 'none';
  currentSpeed = baseSpeed;
  updatePowerupUI();

  particles = [];
  loadMap();
  spawnFood();

  isPlaying = true;
  startOverlay.classList.remove('active');
  gameOverOverlay.classList.remove('active');
  newRecordMsg.classList.add('hide');

  gameLoop();
}

function spawnFood() {
  let valid = false;
  let rx, ry;

  while (!valid) {
    rx = Math.floor(Math.random() * tileCount);
    ry = Math.floor(Math.random() * tileCount);
    valid = true;

    // Check collision with snake
    for (let segment of snake) {
      if (segment.x === rx && segment.y === ry) {
        valid = false;
        break;
      }
    }

    // Check collision with walls
    for (let wall of walls) {
      if (wall.x === rx && wall.y === ry) {
        valid = false;
        break;
      }
    }
  }

  // Determine food type
  const rand = Math.random();
  let type = 'normal';
  let color = '#ef4444'; // Red

  if (rand < 0.12) {
    type = 'speed';
    color = '#3b82f6'; // Blue
  } else if (rand > 0.88) {
    type = 'double';
    color = '#f59e0b'; // Gold/Yellow
  }

  food = { x: rx, y: ry, type: type, color: color };
}

function updatePowerupUI() {
  powerupDisplay.textContent = activePowerup === 'none' ? 'ไม่มี' : activePowerup === 'speed' ? 'ความเร็วสูง (x1.5)' : 'คะแนน x2';
  powerupDisplay.className = 'powerup-val ' + activePowerup;
}

function triggerPowerup(type) {
  playSound('powerup');
  activePowerup = type;
  updatePowerupUI();

  clearTimeout(powerupTimer);

  if (type === 'speed') {
    currentSpeed = baseSpeed * 0.65; // Faster
  } else {
    currentSpeed = baseSpeed; // Normal speed
  }

  // Lasts for 7 seconds
  powerupTimer = setTimeout(() => {
    activePowerup = 'none';
    currentSpeed = baseSpeed;
    updatePowerupUI();
  }, 7000);
}

// Game Loop
function gameLoop() {
  if (!isPlaying) return;

  update();
  draw();

  gameTimeout = setTimeout(gameLoop, currentSpeed);
}

function update() {
  // Commit direction
  dx = nextDx;
  dy = nextDy;

  // Move snake
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Collision checks: Border collision
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    handleGameOver();
    return;
  }

  // Collision with obstacles
  for (let wall of walls) {
    if (head.x === wall.x && head.y === wall.y) {
      handleGameOver();
      return;
    }
  }

  // Collision with self
  for (let segment of snake) {
    if (head.x === segment.x && head.y === segment.y) {
      handleGameOver();
      return;
    }
  }

  snake.unshift(head);

  // Check eating food
  if (head.x === food.x && head.y === food.y) {
    // Score reward
    let pts = 10;
    if (food.type === 'speed') {
      pts = 15;
      triggerPowerup('speed');
    } else if (food.type === 'double') {
      pts = 20;
      triggerPowerup('double');
    } else {
      playSound('eat');
    }

    if (activePowerup === 'double') {
      pts *= 2;
    }

    score += pts;
    scoreDisplay.textContent = score;

    createBurst(food.x, food.y, food.color);
    spawnFood();
  } else {
    snake.pop();
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid border glowing lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }

  // Draw Obstacles (Walls)
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#4b5563'; // Gray glow
  ctx.fillStyle = '#1e293b';
  for (let wall of walls) {
    ctx.fillRect(wall.x * gridSize + 1, wall.y * gridSize + 1, gridSize - 2, gridSize - 2);
  }
  ctx.restore();

  // Draw Food with Glow
  ctx.save();
  ctx.shadowBlur = 15;
  ctx.shadowColor = food.color;
  ctx.fillStyle = food.color;
  ctx.beginPath();
  const radius = gridSize / 2 - 2;
  ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw Snake with Glow
  snake.forEach((segment, idx) => {
    ctx.save();
    ctx.shadowBlur = idx === 0 ? 18 : 10;
    
    // Choose snake skin color depending on active powerup
    let snakeColor = '#10b981'; // Green
    if (activePowerup === 'speed') snakeColor = '#3b82f6'; // Blue
    else if (activePowerup === 'double') snakeColor = '#f59e0b'; // Gold

    ctx.shadowColor = snakeColor;
    ctx.fillStyle = snakeColor;

    // Corner softening
    const pad = idx === 0 ? 1 : 2;
    ctx.fillRect(segment.x * gridSize + pad, segment.y * gridSize + pad, gridSize - pad * 2, gridSize - pad * 2);
    ctx.restore();
  });

  // Draw Particles
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function handleGameOver() {
  isPlaying = false;
  playSound('die');
  clearTimeout(gameTimeout);

  finalScoreDisplay.textContent = score;
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(`snake_high_${currentMap}`, highScore);
    highScoreDisplay.textContent = highScore;
    newRecordMsg.classList.remove('hide');
  } else {
    newRecordMsg.classList.add('hide');
  }

  gameOverOverlay.classList.add('active');
}

// Map Selection
mapBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (isPlaying) return; // Prevent changing map mid-game
    mapBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentMap = e.target.dataset.map;
    loadMap();
  });
});

// Overlays Buttons
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Load default high score
loadMap();
