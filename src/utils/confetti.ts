import confetti from 'canvas-confetti';

export function triggerConfetti(originX?: number, originY?: number) {
  // Default to center of viewport
  const x = originX ?? 0.5;
  const y = originY ?? 0.5;

  // Quick celebratory burst
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x, y },
    colors: ['#12AFCB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
    ticks: 150,
    gravity: 1.2,
    scalar: 0.9,
    shapes: ['circle', 'square'],
    disableForReducedMotion: true,
  });
}

export function triggerPillConfetti(element: HTMLElement | null) {
  if (!element) {
    triggerConfetti();
    return;
  }

  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 50,
    spread: 45,
    origin: { x, y },
    colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
    ticks: 120,
    gravity: 1.5,
    scalar: 0.8,
    shapes: ['circle'],
    disableForReducedMotion: true,
  });
}

export function triggerRewardConfetti() {
  // Big celebratory burst for earning rewards
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#12AFCB', '#10B981'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#12AFCB', '#10B981'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
