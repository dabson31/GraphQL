const HOVER_SOUND_URL = "assets/hover.mp3";
const BACKGROUND_NOISE_URL = "assets/background.mp3";
const HOVER_SOUND_VOLUME = 0.5;
const BACKGROUND_NOISE_VOLUME = 0.5;
const HOVER_TARGET_SELECTOR = "button, a, .source-btn, .identity-box, .logout-btn, .back-link, [data-magnify]";

export function initAudioFx() {
  let hoverAudio = null;
  if (HOVER_SOUND_URL) {
    hoverAudio = new Audio(HOVER_SOUND_URL);
    hoverAudio.volume = HOVER_SOUND_VOLUME;
  }

  function playHoverSound() {
    if (!HOVER_SOUND_URL) return;
    hoverAudio.currentTime = 0;
    hoverAudio.play().catch(() => {});
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
