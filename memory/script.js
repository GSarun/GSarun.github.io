// Emoji themes
const emojiThemes = {
  space: ['🚀', '🛸', '🪐', '🌠', '🛰️', '👽', '☄️', '🌙', '☀️', '🧑‍🚀', '👾', '🔭'],
  animals: ['🦁', '🐯', '🐼', '🐨', '🦊', '🐰', '🐸', '🐙', '🐳', '🦄', '🐝', '🦩'],
  food: ['🍕', '🍔', '🍟', '🍣', '🍰', '🍩', '🍦', '🍓', '🥑', '🥞', '🌮', '🍿']
};

// State variables
let currentGrid = '4x3';
let currentTheme = 'space';
let flippedCards = [];
let moves = 0;
let matches = 0;
let totalPairs = 6;
let timer = 0;
let timerInterval = null;
let isTimerRunning = false;
let isProcessing = false;

// Audio context
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

  if (type === 'flip') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'match') {
    // Beautiful double chime
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(783.99, now + 0.08); // G5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'mismatch') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(160, now + 0.1);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'win') {
    osc.type = 'triangle';
    const freqs = [392.00, 523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
    });
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.8);
  }
}

// Elements
const gameBoard = document.getElementById('gameBoard');
const timerDisplay = document.getElementById('timer');
const movesDisplay = document.getElementById('moves');
const bestTimeDisplay = document.getElementById('bestTime');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const winOverlay = document.getElementById('winOverlay');
const winTimeDisplay = document.getElementById('winTime');
const winMovesDisplay = document.getElementById('winMoves');
const newRecordMsg = document.getElementById('newRecordMsg');

const diffButtons = document.querySelectorAll('.diff-btn');
const themeButtons = document.querySelectorAll('.theme-btn');

// Start/Reset Game
function initGame() {
  clearInterval(timerInterval);
  timer = 0;
  moves = 0;
  matches = 0;
  isTimerRunning = false;
  isProcessing = false;
  flippedCards = [];
  
  timerDisplay.textContent = '00:00';
  movesDisplay.textContent = '0';
  
  updateBestTime();
  setupBoard();
}

function setupBoard() {
  gameBoard.className = 'game-board';
  gameBoard.classList.add(`grid-${currentGrid}`);
  gameBoard.innerHTML = '';

  const parts = currentGrid.split('x');
  const cols = parseInt(parts[0], 10);
  const rows = parseInt(parts[1], 10);
  const totalCards = cols * rows;
  totalPairs = totalCards / 2;

  const baseEmojis = emojiThemes[currentTheme];
  const selectedEmojis = baseEmojis.slice(0, totalPairs);
  
  let gameDeck = [...selectedEmojis, ...selectedEmojis];
  shuffle(gameDeck);

  gameDeck.forEach((emoji, index) => {
    const cardEl = document.createElement('div');
    cardEl.classList.add('card');
    cardEl.dataset.name = emoji;
    cardEl.dataset.index = index;

    cardEl.innerHTML = `
      <div class="card-inner">
        <div class="card-back">
          <span class="card-back-symbol">◆</span>
        </div>
        <div class="card-front">${emoji}</div>
      </div>
    `;

    cardEl.addEventListener('click', () => handleCardClick(cardEl));
    gameBoard.appendChild(cardEl);
  });
}

function handleCardClick(cardEl) {
  initAudio();
  if (isProcessing) return;
  if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

  if (!isTimerRunning) {
    startTimer();
  }

  cardEl.classList.add('flipped');
  flippedCards.push(cardEl);
  playSound('flip');

  if (flippedCards.length === 2) {
    moves++;
    movesDisplay.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [card1, card2] = flippedCards;
  const isMatch = card1.dataset.name === card2.dataset.name;

  if (isMatch) {
    card1.classList.add('matched');
    card2.classList.add('matched');
    playSound('match');
    flippedCards = [];
    matches++;

    if (matches === totalPairs) {
      handleWin();
    }
  } else {
    isProcessing = true;
    playSound('mismatch');
    
    setTimeout(() => {
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      flippedCards = [];
      isProcessing = false;
    }, 850);
  }
}

function startTimer() {
  isTimerRunning = true;
  timerInterval = setInterval(() => {
    timer++;
    timerDisplay.textContent = formatTime(timer);
  }, 1000);
}

function handleWin() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  playSound('win');

  const finalTimeStr = formatTime(timer);
  winTimeDisplay.textContent = finalTimeStr;
  winMovesDisplay.textContent = moves;

  const scoreKey = `memory_best_${currentGrid}_${currentTheme}`;
  const bestTime = localStorage.getItem(scoreKey);
  
  if (!bestTime || timer < parseInt(bestTime, 10)) {
    localStorage.setItem(scoreKey, timer.toString());
    newRecordMsg.classList.remove('hide');
  } else {
    newRecordMsg.classList.add('hide');
  }

  winOverlay.classList.add('active');
  updateBestTime();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateBestTime() {
  const scoreKey = `memory_best_${currentGrid}_${currentTheme}`;
  const bestTime = localStorage.getItem(scoreKey);
  if (bestTime) {
    bestTimeDisplay.textContent = formatTime(parseInt(bestTime, 10));
  } else {
    bestTimeDisplay.textContent = '-';
  }
}

// Event Listeners
diffButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    diffButtons.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentGrid = e.target.dataset.grid;
    initGame();
  });
});

themeButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    themeButtons.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentTheme = e.target.dataset.theme;
    initGame();
  });
});

restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', () => {
  winOverlay.classList.remove('active');
  initGame();
});

window.addEventListener('DOMContentLoaded', initGame);
