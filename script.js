document.addEventListener('DOMContentLoaded', () => {
  // Animate cards on entrance
  const cards = document.querySelectorAll('.game-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      
      // After entrance transition, set normal hover styles in stylesheet
      setTimeout(() => {
        card.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      }, 600);
    }, index * 100);
  });

  // Track mouse coordinates for interactive glow effect
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    
    // Update ambient glows subtly based on cursor position
    const glow1 = document.querySelector('.glow-1');
    const glow2 = document.querySelector('.glow-2');
    
    if (glow1) {
      glow1.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
    }
    if (glow2) {
      glow2.style.transform = `translate(${-x * 0.05}px, ${-y * 0.05}px)`;
    }
  });
});
