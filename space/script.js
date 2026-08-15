const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const scoreDisplay = document.getElementById('currentScore');
const highScoreDisplay = document.getElementById('highScore');
const finalScoreDisplay = document.getElementById('finalScore');
const newRecordMsg = document.getElementById('newRecordMsg');

const shieldPips = document.querySelectorAll('.shield-pip');
const weaponText = document.getElementById('weaponLevelText');
const bombCountDisplay = document.getElementById('bombCount');
const bombBtn = document.getElementById('bombBtn');

const bossBarContainer = document.getElementById('bossBarContainer');
const bossHpFill = document.getElementById('bossHpFill');

// Game state
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('space_high_score') || 0;
highScoreDisplay.textContent = highScore;

let player = {
  x: canvas.width / 2,
  y: canvas.height - 80,
  w: 34,
  h: 38,
  shields: 3,
  weaponLevel: 1,
  bombs: 1,
  invulnerableTime: 0,
  targetX: canvas.width / 2,
  targetY: canvas.height - 80,
  flameCycle: 0
};

let stars = [];
let nebulae = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerups = [];
let particles = [];
let shockwaves = [];

let boss = null;
let nextBossScore = 500;
let bossMaxHp = 50;
let screenShake = 0;

let lastShotTime = 0;
let isShooting = false;
let keys = {};

// Audio synthesizer
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'laser') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'hit') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.06);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (type === 'explode') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.start(now);
    osc.stop(now + 0.28);
  } else if (type === 'powerup') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(659.25, now + 0.06);
    osc.frequency.setValueAtTime(880, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'bomb') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(20, now + 0.7);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.start(now);
    osc.stop(now + 0.7);
  } else if (type === 'gameover') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.7);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.start(now);
    osc.stop(now + 0.7);
  }
}

// Background Cosmic Elements
function initCosmicScene() {
  stars = [];
  for (let i = 0; i < 75; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.8,
      speed: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.7 + 0.3
    });
  }

  nebulae = [
    { x: 100, y: 150, r: 180, color: 'rgba(59, 130, 246, 0.06)', vy: 0.2 },
    { x: 300, y: 400, r: 220, color: 'rgba(168, 85, 247, 0.06)', vy: 0.15 }
  ];
}

// Start Mission
function startGame() {
  initAudio();
  score = 0;
  scoreDisplay.textContent = score;

  player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    w: 34,
    h: 38,
    shields: 3,
    weaponLevel: 1,
    bombs: 1,
    invulnerableTime: 0,
    targetX: canvas.width / 2,
    targetY: canvas.height - 80,
    flameCycle: 0
  };

  bullets = [];
  enemyBullets = [];
  enemies = [];
  powerups = [];
  particles = [];
  shockwaves = [];
  boss = null;
  nextBossScore = 500;
  screenShake = 0;
  bossBarContainer.classList.add('hide');

  updateHUD();

  isPlaying = true;
  startOverlay.classList.remove('active');
  gameOverOverlay.classList.remove('active');
  newRecordMsg.classList.add('hide');

  initCosmicScene();
  requestAnimationFrame(gameLoop);
}

function updateHUD() {
  shieldPips.forEach((pip, i) => {
    if (i < player.shields) pip.classList.add('active');
    else pip.classList.remove('active');
  });

  const names = ['SINGLE BLASTER', 'DOUBLE BLASTER', 'TRIPLE SPREAD', 'PLASMA BEAM'];
  weaponText.textContent = names[player.weaponLevel - 1] || 'HYPER CANNON';
  bombCountDisplay.textContent = player.bombs;
}

// Player shoot
function shoot() {
  const now = Date.now();
  const fireRate = player.weaponLevel >= 4 ? 120 : player.weaponLevel >= 2 ? 160 : 200;

  if (now - lastShotTime < fireRate) return;
  lastShotTime = now;

  playSound('laser');

  if (player.weaponLevel === 1) {
    bullets.push({ x: player.x, y: player.y - 18, vx: 0, vy: -11, color: '#38bdf8' });
  } else if (player.weaponLevel === 2) {
    bullets.push({ x: player.x - 8, y: player.y - 12, vx: 0, vy: -11, color: '#38bdf8' });
    bullets.push({ x: player.x + 8, y: player.y - 12, vx: 0, vy: -11, color: '#38bdf8' });
  } else if (player.weaponLevel === 3) {
    bullets.push({ x: player.x, y: player.y - 18, vx: 0, vy: -11, color: '#818cf8' });
    bullets.push({ x: player.x - 10, y: player.y - 12, vx: -2, vy: -10, color: '#818cf8' });
    bullets.push({ x: player.x + 10, y: player.y - 12, vx: 2, vy: -10, color: '#818cf8' });
  } else {
    bullets.push({ x: player.x - 12, y: player.y - 12, vx: -1.5, vy: -12, color: '#c084fc' });
    bullets.push({ x: player.x - 4, y: player.y - 18, vx: 0, vy: -13, color: '#06b6d4' });
    bullets.push({ x: player.x + 4, y: player.y - 18, vx: 0, vy: -13, color: '#06b6d4' });
    bullets.push({ x: player.x + 12, y: player.y - 12, vx: 1.5, vy: -12, color: '#c084fc' });
  }
}

// EMP Bomb
function useBomb() {
  if (!isPlaying || player.bombs <= 0) return;
  player.bombs--;
  updateHUD();

  playSound('bomb');
  screenShake = 16;

  shockwaves.push({
    x: player.x,
    y: player.y,
    radius: 10,
    maxRadius: 450,
    color: '#06b6d4',
    alpha: 1
  });

  enemyBullets = [];
  enemies.forEach(e => {
    e.hp -= 25;
    createExplosion(e.x, e.y, '#ef4444', 18);
  });
  if (boss) {
    boss.hp -= 30;
    createExplosion(boss.x, boss.y, '#ef4444', 30);
  }
}

// Explosion generator
function createExplosion(x, y, color, count = 14) {
  shockwaves.push({
    x: x,
    y: y,
    radius: 5,
    maxRadius: 40,
    color: color,
    alpha: 0.8
  });

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4.5 + 1.5;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color,
      alpha: 1,
      decay: Math.random() * 0.04 + 0.02,
      size: Math.random() * 3.5 + 1.5
    });
  }
}

// Spawn Enemy routine
let spawnTimer = 0;
function spawnEnemies() {
  if (boss) return;

  spawnTimer++;
  if (spawnTimer % 48 === 0) {
    const typeRand = Math.random();
    const rx = Math.random() * (canvas.width - 60) + 30;

    if (typeRand < 0.5) {
      enemies.push({
        x: rx, y: -30, w: 26, h: 26, hp: 1, maxHp: 1, type: 'scout',
        vx: (Math.random() - 0.5) * 2.2, vy: 2.6, color: '#f87171', points: 10
      });
    } else if (typeRand < 0.8) {
      enemies.push({
        x: rx, y: -40, w: 40, h: 40, hp: 4, maxHp: 4, type: 'cruiser',
        vx: 0, vy: 1.4, color: '#a855f7', points: 30, lastShoot: 0
      });
    } else {
      enemies.push({
        x: rx, y: -35, w: 32, h: 32, hp: 6, maxHp: 6, type: 'meteor',
        vx: (Math.random() - 0.5) * 1.5, vy: 1.8, color: '#fb923c', points: 20
      });
    }
  }

  if (score >= nextBossScore && !boss) {
    bossMaxHp = 50 + Math.floor(score / 500) * 30;
    boss = {
      x: canvas.width / 2, y: -60, w: 84, h: 64, hp: bossMaxHp, maxHp: bossMaxHp,
      vx: 2.2, vy: 1.2, targetY: 80, lastShoot: 0, points: 300
    };
    bossBarContainer.classList.remove('hide');
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
  // Stars & Nebulae
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
  });

  nebulae.forEach(n => {
    n.y += n.vy;
    if (n.y - n.r > canvas.height) n.y = -n.r;
  });

  // Controls
  const speed = 5.5;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.targetX -= speed;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player.targetX += speed;
  if (keys['ArrowUp'] || keys['w'] || keys['W']) player.targetY -= speed;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) player.targetY += speed;
  if (keys[' '] || isShooting) shoot();

  player.targetX = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.targetX));
  player.targetY = Math.max(player.h / 2, Math.min(canvas.height - player.h / 2, player.targetY));

  player.x += (player.targetX - player.x) * 0.22;
  player.y += (player.targetY - player.y) * 0.22;
  player.flameCycle += 0.3;

  if (player.invulnerableTime > 0) player.invulnerableTime--;

  // Player Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.vx; b.y += b.vy;
    if (b.y < -20 || b.x < -10 || b.x > canvas.width + 10) bullets.splice(i, 1);
  }

  // Enemy Bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let eb = enemyBullets[i];
    eb.x += eb.vx; eb.y += eb.vy;

    if (player.invulnerableTime === 0 && Math.hypot(eb.x - player.x, eb.y - player.y) < player.w / 2 + 4) {
      enemyBullets.splice(i, 1);
      hitPlayer();
      continue;
    }
    if (eb.y > canvas.height + 20) enemyBullets.splice(i, 1);
  }

  spawnEnemies();

  // Update Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.x += e.vx; e.y += e.vy;

    if (e.type === 'scout' && (e.x < 20 || e.x > canvas.width - 20)) e.vx *= -1;

    if (e.type === 'cruiser' && Date.now() - e.lastShoot > 1700) {
      e.lastShoot = Date.now();
      enemyBullets.push({ x: e.x, y: e.y + 16, vx: 0, vy: 4.2, color: '#f87171' });
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.w / 2 + 6) {
        bullets.splice(j, 1);
        e.hp--;
        playSound('hit');
        createExplosion(b.x, b.y, '#38bdf8', 4);

        if (e.hp <= 0) {
          destroyEnemy(e, i);
          break;
        }
      }
    }

    if (player.invulnerableTime === 0 && Math.hypot(e.x - player.x, e.y - player.y) < (e.w + player.w) / 2 - 4) {
      destroyEnemy(e, i);
      hitPlayer();
      continue;
    }

    if (e.y > canvas.height + 50) enemies.splice(i, 1);
  }

  // Update Boss
  if (boss) {
    if (boss.y < boss.targetY) {
      boss.y += boss.vy;
    } else {
      boss.x += boss.vx;
      if (boss.x < 60 || boss.x > canvas.width - 60) boss.vx *= -1;

      if (Date.now() - boss.lastShoot > 1150) {
        boss.lastShoot = Date.now();
        enemyBullets.push({ x: boss.x - 15, y: boss.y + 25, vx: -2, vy: 4.8, color: '#ef4444' });
        enemyBullets.push({ x: boss.x, y: boss.y + 28, vx: 0, vy: 5.2, color: '#ef4444' });
        enemyBullets.push({ x: boss.x + 15, y: boss.y + 25, vx: 2, vy: 4.8, color: '#ef4444' });
      }
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (Math.abs(b.x - boss.x) < boss.w / 2 && Math.abs(b.y - boss.y) < boss.h / 2) {
        bullets.splice(j, 1);
        boss.hp--;
        playSound('hit');
        createExplosion(b.x, b.y, '#38bdf8', 4);

        const hpPercent = Math.max(0, (boss.hp / boss.maxHp) * 100);
        bossHpFill.style.width = hpPercent + '%';

        if (boss.hp <= 0) {
          playSound('explode');
          screenShake = 15;
          createExplosion(boss.x, boss.y, '#ef4444', 45);
          score += boss.points;
          scoreDisplay.textContent = score;
          
          powerups.push({ x: boss.x - 25, y: boss.y, type: 'weapon', vy: 1.5 });
          powerups.push({ x: boss.x + 25, y: boss.y, type: 'bomb', vy: 1.5 });

          boss = null;
          bossBarContainer.classList.add('hide');
          nextBossScore += 650;
          break;
        }
      }
    }
  }

  // Update Powerups
  for (let i = powerups.length - 1; i >= 0; i--) {
    let p = powerups[i];
    p.y += p.vy;

    if (Math.hypot(p.x - player.x, p.y - player.y) < player.w / 2 + 14) {
      collectPowerup(p.type);
      powerups.splice(i, 1);
      continue;
    }
    if (p.y > canvas.height + 20) powerups.splice(i, 1);
  }

  // Update Shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    let sw = shockwaves[i];
    sw.radius += 5;
    sw.alpha -= 0.035;
    if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) shockwaves.splice(i, 1);
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let pt = particles[i];
    pt.x += pt.vx; pt.y += pt.vy;
    pt.alpha -= pt.decay;
    if (pt.alpha <= 0) particles.splice(i, 1);
  }

  // Shake decay
  if (screenShake > 0) screenShake *= 0.85;
  if (screenShake < 0.2) screenShake = 0;
}

function destroyEnemy(enemy, index) {
  playSound('explode');
  createExplosion(enemy.x, enemy.y, enemy.color, 16);
  score += enemy.points;
  scoreDisplay.textContent = score;

  if (Math.random() < 0.2) {
    const pick = Math.random() < 0.6 ? 'weapon' : Math.random() < 0.85 ? 'shield' : 'bomb';
    powerups.push({ x: enemy.x, y: enemy.y, type: pick, vy: 1.5 });
  }
  enemies.splice(index, 1);
}

function collectPowerup(type) {
  playSound('powerup');
  if (type === 'weapon') player.weaponLevel = Math.min(4, player.weaponLevel + 1);
  else if (type === 'shield') player.shields = Math.min(3, player.shields + 1);
  else if (type === 'bomb') player.bombs = Math.min(3, player.bombs + 1);
  updateHUD();
}

function hitPlayer() {
  playSound('explode');
  screenShake = 8;
  createExplosion(player.x, player.y, '#06b6d4', 20);
  player.shields--;
  player.weaponLevel = Math.max(1, player.weaponLevel - 1);
  player.invulnerableTime = 60;
  updateHUD();

  if (player.shields <= 0) handleGameOver();
}

function handleGameOver() {
  isPlaying = false;
  playSound('gameover');
  finalScoreDisplay.textContent = score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('space_high_score', highScore);
    highScoreDisplay.textContent = highScore;
    newRecordMsg.classList.remove('hide');
  } else {
    newRecordMsg.classList.add('hide');
  }
  gameOverOverlay.classList.add('active');
}

// Draw Routine
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  // Draw Nebulae
  nebulae.forEach(n => {
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    grad.addColorStop(0, n.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw Starfield
  stars.forEach(s => {
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });

  // Draw Shockwaves
  shockwaves.forEach(sw => {
    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.globalAlpha = sw.alpha;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = sw.color;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // Draw Particles
  particles.forEach(pt => {
    ctx.save();
    ctx.globalAlpha = pt.alpha;
    ctx.fillStyle = pt.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    ctx.restore();
  });

  // Draw Bullets
  bullets.forEach(b => {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = b.color;
    ctx.fillRect(b.x - 2.5, b.y - 8, 5, 16);
    ctx.restore();
  });

  // Draw Enemy Bullets
  enemyBullets.forEach(eb => {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = eb.color;
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw Powerups
  powerups.forEach(p => {
    ctx.save();
    ctx.shadowBlur = 15;
    let col = p.type === 'weapon' ? '#8b5cf6' : p.type === 'shield' ? '#06b6d4' : '#ef4444';
    let letter = p.type === 'weapon' ? 'P' : p.type === 'shield' ? 'S' : 'B';
    ctx.shadowColor = col;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Kanit, Orbitron';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(letter, p.x, p.y);
    ctx.restore();
  });

  // Draw Enemies
  enemies.forEach(e => {
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = e.color;
    ctx.fillStyle = e.color;

    if (e.type === 'scout') {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y + e.h / 2);
      ctx.lineTo(e.x - e.w / 2, e.y - e.h / 2);
      ctx.lineTo(e.x + e.w / 2, e.y - e.h / 2);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'cruiser') {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y + e.h / 2);
      ctx.lineTo(e.x - e.w / 2, e.y);
      ctx.lineTo(e.x - e.w / 4, e.y - e.h / 2);
      ctx.lineTo(e.x + e.w / 4, e.y - e.h / 2);
      ctx.lineTo(e.x + e.w / 2, e.y);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'meteor') {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Draw Boss
  if (boss) {
    ctx.save();
    ctx.shadowBlur = 24;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(boss.x, boss.y + boss.h / 2);
    ctx.lineTo(boss.x - boss.w / 2, boss.y - boss.h / 4);
    ctx.lineTo(boss.x - boss.w / 3, boss.y - boss.h / 2);
    ctx.lineTo(boss.x + boss.w / 3, boss.y - boss.h / 2);
    ctx.lineTo(boss.x + boss.w / 2, boss.y - boss.h / 4);
    ctx.closePath();
    ctx.fill();

    // Core
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#fde047';
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Player Ship & Thruster Jet Flames
  if (player.invulnerableTime % 4 < 2) {
    ctx.save();
    
    // Thruster flame
    const flameH = 12 + Math.sin(player.flameCycle) * 5;
    const flameGrad = ctx.createLinearGradient(player.x, player.y + player.h / 2, player.x, player.y + player.h / 2 + flameH);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.3, '#38bdf8');
    flameGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(player.x - 5, player.y + player.h / 2 - 4);
    ctx.lineTo(player.x, player.y + player.h / 2 + flameH);
    ctx.lineTo(player.x + 5, player.y + player.h / 2 - 4);
    ctx.fill();

    // Ship Hull
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#06b6d4';
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.h / 2);
    ctx.lineTo(player.x - player.w / 2, player.y + player.h / 2);
    ctx.lineTo(player.x, player.y + player.h / 4);
    ctx.lineTo(player.x + player.w / 2, player.y + player.h / 2);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Forcefield Shield Ring if invulnerable
    if (player.invulnerableTime > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.w / 2 + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}

// Mouse & Touch Controls
canvas.addEventListener('mousemove', (e) => {
  if (!isPlaying) return;
  const rect = canvas.getBoundingClientRect();
  player.targetX = (e.clientX - rect.left) * (canvas.width / rect.width);
  player.targetY = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('mousedown', () => { if (isPlaying) isShooting = true; });
window.addEventListener('mouseup', () => isShooting = false);

canvas.addEventListener('touchmove', (e) => {
  if (!isPlaying) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  player.targetX = (touch.clientX - rect.left) * (canvas.width / rect.width);
  player.targetY = (touch.clientY - rect.top) * (canvas.height / rect.height);
  isShooting = true;
}, { passive: false });

canvas.addEventListener('touchend', () => isShooting = false);

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === 'b' || e.key === 'B') useBomb();
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

bombBtn.addEventListener('click', useBomb);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

initCosmicScene();
