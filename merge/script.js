const tileContainer = document.getElementById('tileContainer');
const scoreDisplay = document.getElementById('currentScore');
const highScoreDisplay = document.getElementById('highScore');
const finalScoreDisplay = document.getElementById('finalScore');

const restartBtn = document.getElementById('restartBtn');
const newGameBtn = document.getElementById('newGameBtn');
const keepPlayingBtn = document.getElementById('keepPlayingBtn');

const gameOverOverlay = document.getElementById('gameOverOverlay');
const winOverlay = document.getElementById('winOverlay');
const themeBtns = document.querySelectorAll('.theme-btn');

// Game state variables
let grid = Array(4).fill(null).map(() => Array(4).fill(null));
let activeTiles = [];
let score = 0;
let highScore = localStorage.getItem('2048_high_score') || 0;
let isPlaying = false;
let hasWon = false;
let keepPlayingAfterWin = false;
let nextTileId = 0;

highScoreDisplay.textContent = highScore;

// Audio synth context
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

  if (type === 'slide') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'merge') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.22);
  } else if (type === 'win') {
    osc.type = 'triangle';
    const chords = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    chords.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
    });
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } else if (type === 'gameover') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(196, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.6);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  }
}

// Floating score popup generator
function createScorePopup(points, row, col) {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = `+${points}`;
  
  // Calculate approximate position inside board
  const board = document.getElementById('gameBoard');
  const rect = board.getBoundingClientRect();
  const cellSize = rect.width / 4;
  
  popup.style.left = `${col * cellSize + cellSize / 3}px`;
  popup.style.top = `${row * cellSize + cellSize / 4}px`;
  
  tileContainer.appendChild(popup);
  setTimeout(() => popup.remove(), 600);
}

// Start Game
function startNewGame() {
  initAudio();
  tileContainer.innerHTML = '';
  grid = Array(4).fill(null).map(() => Array(4).fill(null));
  activeTiles = [];
  score = 0;
  scoreDisplay.textContent = score;
  isPlaying = true;
  hasWon = false;
  keepPlayingAfterWin = false;

  gameOverOverlay.classList.remove('active');
  winOverlay.classList.remove('active');

  spawnRandomTile();
  spawnRandomTile();
  updateDOM();
}

function spawnRandomTile() {
  const emptyCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) {
        emptyCells.push({ r, c });
      }
    }
  }

  if (emptyCells.length === 0) return;

  const randCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;

  const tileEl = document.createElement('div');
  tileEl.classList.add('tile', `tile-${value}`);
  tileEl.textContent = value;
  tileEl.style.setProperty('--row', randCell.r);
  tileEl.style.setProperty('--col', randCell.c);
  tileContainer.appendChild(tileEl);

  const newTile = {
    id: nextTileId++,
    value: value,
    row: randCell.r,
    col: randCell.c,
    element: tileEl,
    mergedInto: null
  };

  grid[randCell.r][randCell.c] = newTile;
  activeTiles.push(newTile);
}

// Move logic
function move(direction) {
  if (!isPlaying) return;

  let moved = false;
  let mergedThisTurn = false;

  const vector = { x: 0, y: 0 };
  if (direction === 'UP') vector.y = -1;
  else if (direction === 'DOWN') vector.y = 1;
  else if (direction === 'LEFT') vector.x = -1;
  else if (direction === 'RIGHT') vector.x = 1;

  const rowsOrder = direction === 'DOWN' ? [3, 2, 1, 0] : [0, 1, 2, 3];
  const colsOrder = direction === 'RIGHT' ? [3, 2, 1, 0] : [0, 1, 2, 3];

  const mergedGrid = Array(4).fill(null).map(() => Array(4).fill(false));

  rowsOrder.forEach(r => {
    colsOrder.forEach(c => {
      const tile = grid[r][c];
      if (tile) {
        let currR = r;
        let currC = c;
        let nextR = currR + vector.y;
        let nextC = currC + vector.x;

        while (nextR >= 0 && nextR < 4 && nextC >= 0 && nextC < 4 && !grid[nextR][nextC]) {
          currR = nextR;
          currC = nextC;
          nextR = currR + vector.y;
          nextC = currC + vector.x;
        }

        if (nextR >= 0 && nextR < 4 && nextC >= 0 && nextC < 4) {
          const nextTile = grid[nextR][nextC];
          if (nextTile && nextTile.value === tile.value && !mergedGrid[nextR][nextC]) {
            grid[r][c] = null;
            
            tile.row = nextR;
            tile.col = nextC;
            tile.mergedInto = nextTile;

            nextTile.value *= 2;
            mergedGrid[nextR][nextC] = true;

            score += nextTile.value;
            scoreDisplay.textContent = score;
            createScorePopup(nextTile.value, nextR, nextC);

            if (nextTile.value === 2048 && !hasWon && !keepPlayingAfterWin) {
              hasWon = true;
              triggerWin();
            }

            moved = true;
            mergedThisTurn = true;
            return;
          }
        }

        if (currR !== r || currC !== c) {
          grid[r][c] = null;
          grid[currR][currC] = tile;
          tile.row = currR;
          tile.col = currC;
          moved = true;
        }
      }
    });
  });

  if (moved) {
    playSound(mergedThisTurn ? 'merge' : 'slide');
    
    setTimeout(() => {
      spawnRandomTile();
      updateDOM();
      checkGameOver();
    }, 120);

    updateDOM();
  }
}

function updateDOM() {
  activeTiles.forEach(tile => {
    if (tile.mergedInto) {
      tile.element.style.setProperty('--row', tile.row);
      tile.element.style.setProperty('--col', tile.col);
      tile.element.style.opacity = 0;
      tile.element.style.zIndex = 5;

      const el = tile.element;
      setTimeout(() => {
        el.remove();
      }, 120);
    } else {
      tile.element.style.setProperty('--row', tile.row);
      tile.element.style.setProperty('--col', tile.col);
      tile.element.style.zIndex = 10;

      const el = tile.element;
      const val = tile.value;
      const prevVal = parseInt(el.textContent, 10);
      if (val !== prevVal) {
        setTimeout(() => {
          el.textContent = val;
          el.className = `tile tile-${val} merged`;
        }, 120);
      }
    }
  });

  activeTiles = activeTiles.filter(tile => !tile.mergedInto);
}

function checkGameOver() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) return;
    }
  }

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c].value;
      if (r < 3 && grid[r + 1][c].value === val) return;
      if (c < 3 && grid[r][c + 1].value === val) return;
    }
  }

  handleGameOver();
}

function triggerWin() {
  playSound('win');
  winOverlay.classList.add('active');
}

function handleGameOver() {
  isPlaying = false;
  playSound('gameover');
  finalScoreDisplay.textContent = score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('2048_high_score', highScore);
    highScoreDisplay.textContent = highScore;
  }

  gameOverOverlay.classList.add('active');
}

window.addEventListener('keydown', (e) => {
  if (!isPlaying) return;
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': e.preventDefault(); move('UP'); break;
    case 'ArrowDown': case 's': case 'S': e.preventDefault(); move('DOWN'); break;
    case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); move('LEFT'); break;
    case 'ArrowRight': case 'd': case 'D': e.preventDefault(); move('RIGHT'); break;
  }
});

let startX = 0, startY = 0;
window.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (!isPlaying) return;
  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;
  const dx = endX - startX;
  const dy = endY - startY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) > 40) {
    if (absDx > absDy) {
      if (dx > 0) move('RIGHT'); else move('LEFT');
    } else {
      if (dy > 0) move('DOWN'); else move('UP');
    }
  }
}, { passive: true });

themeBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    themeBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const theme = e.target.dataset.theme;
    document.body.setAttribute('data-game-theme', theme);
  });
});

newGameBtn.addEventListener('click', startNewGame);
restartBtn.addEventListener('click', startNewGame);
keepPlayingBtn.addEventListener('click', () => {
  keepPlayingAfterWin = true;
  winOverlay.classList.remove('active');
});

document.body.setAttribute('data-game-theme', 'neon');
startNewGame();
