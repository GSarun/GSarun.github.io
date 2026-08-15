document.addEventListener('DOMContentLoaded', () => {
  // Web Audio Context for gentle hover interaction
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playHoverTick() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Interactive 3D Card Tilt
  const cards = document.querySelectorAll('.game-card');

  cards.forEach((card, index) => {
    // Staggered Fade-in Entrance
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 80);

    // Hover audio trigger
    card.addEventListener('mouseenter', () => {
      initAudio();
      playHoverTick();
    });

    // 3D Parallax Tilt on Mousemove
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });

    // Reset on Mouseleave
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
    });
  });

  // Track mouse coordinates for ambient floating glows
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;

  document.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
    targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;
  });

  function animateAmbientGlows() {
    currentMouseX += (targetMouseX - currentMouseX) * 0.08;
    currentMouseY += (targetMouseY - currentMouseY) * 0.08;

    const glow1 = document.querySelector('.glow-1');
    const glow2 = document.querySelector('.glow-2');
    const glow3 = document.querySelector('.glow-3');

    if (glow1) glow1.style.transform = `translate(${currentMouseX}px, ${currentMouseY}px)`;
    if (glow2) glow2.style.transform = `translate(${-currentMouseX}px, ${-currentMouseY}px)`;
    if (glow3) glow3.style.transform = `translate(${currentMouseX * 0.5}px, ${currentMouseY * 0.5}px)`;

    requestAnimationFrame(animateAmbientGlows);
  }
  animateAmbientGlows();
});
