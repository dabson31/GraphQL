const HOVER_SOUND_URL = "assets/hover.mp3";
const BACKGROUND_NOISE_URL = "assets/background.mp3";
const HOVER_SOUND_VOLUME = 0.5;
const BACKGROUND_NOISE_VOLUME = 0.4;
const HOVER_TARGET_SELECTOR = "button, a, .source-btn, .identity-box, .logout-btn, .back-link, [data-magnify]";

export function initAudioFx() {
  const HOVER_POOL_SIZE = 4;
  let hoverPool = [];
  let hoverPoolIndex = 0;
  if (HOVER_SOUND_URL) {
    hoverPool = Array.from({ length: HOVER_POOL_SIZE }, () => {
      const a = new Audio(HOVER_SOUND_URL);
      a.volume = HOVER_SOUND_VOLUME;
      return a;
    });
  }

  function playHoverSound() {
    if (!HOVER_SOUND_URL) return;
    const instance = hoverPool[hoverPoolIndex];
    hoverPoolIndex = (hoverPoolIndex + 1) % hoverPool.length;
    instance.currentTime = 0;
    instance.play().catch(() => {});
  }

  function attachHoverSound() {
    document.querySelectorAll(HOVER_TARGET_SELECTOR).forEach((el) => {
      if (el.dataset.hoverSoundBound) return;
      el.dataset.hoverSoundBound = "1";
      el.addEventListener("mouseenter", playHoverSound);
    });
  }

  function startBackgroundNoise() {
    if (!BACKGROUND_NOISE_URL) return;
    const noise = new Audio(BACKGROUND_NOISE_URL);
    noise.volume = BACKGROUND_NOISE_VOLUME;
    noise.loop = true;
    const tryPlay = () => noise.play().catch(() => {});
    tryPlay();
    document.addEventListener("click", tryPlay, { once: true });
  }

  attachHoverSound();
  new MutationObserver(attachHoverSound).observe(document.body, { childList: true, subtree: true });
  startBackgroundNoise();
}
