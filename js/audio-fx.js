const HOVER_SOUND_URL = "assets/hover.mp3";
const BACKGROUND_NOISE_URL = "assets/background.mp3";
const HOVER_SOUND_VOLUME = 0.5;
const BACKGROUND_NOISE_VOLUME = 0.4;
const HOVER_TARGET_SELECTOR = "button, a, .source-btn, .identity-box, .logout-btn, .back-link, [data-magnify]";


/**
 * all audio effects get activated at this point
 * so it  builds a small pool of 4 audio instances for
 * the hover sound (so they dont cut each other off), then defines
 * playHoverSound() to play them without interruptions, also defines
 * attachHoverSound() to bind "mouseenter" listener to every element matching
 * HOVER_TARGET_SELECTOR (5th lines) while avoiding double-binding via the
 * hoverSoundBound flag, and then defines startBackgroundNoise() to create
 * the bgm looping background audio element and attempt to play it instantly
 * it also retries on the first user click. It then calls attachHoverSound() once, sets
 * up a MutationObserver to re-run attachHoverSound whenever new DOM nodes are added 
 * (covering dynamically-created buttons so they get the sound), then calls startBackgroundNoise() again.
 */
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


  /**
   * help functions, it plays the next audio instance 
   */
  function playHoverSound() {
    if (!HOVER_SOUND_URL) return;
    const instance = hoverPool[hoverPoolIndex];
    hoverPoolIndex = (hoverPoolIndex + 1) % hoverPool.length;
    instance.currentTime = 0;
    instance.play().catch(() => {});
  }

  /**
   * another helper, queries all hoverable elements and binds the hover sound listener
   * once per each element
   */
  function attachHoverSound() {
    document.querySelectorAll(HOVER_TARGET_SELECTOR).forEach((el) => {
      if (el.dataset.hoverSoundBound) return;
      el.dataset.hoverSoundBound = "1";
      el.addEventListener("mouseenter", playHoverSound);
    });
  }

  /**
   * creates and loops the bgm track, retrying playback
   * on firstclick if the autoplay was blocked
   */
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
