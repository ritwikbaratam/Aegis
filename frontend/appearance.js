// Load before the stylesheet so returning users see their saved theme on first paint.
(() => {
  const key = 'bits-support-appearance';
  const defaults = { theme: 'dark', accent: 'blue', reducedMotion: false };
  const themes = ['light', 'dark', 'system'];
  const accents = ['blue', 'purple', 'green', 'orange', 'pink'];
  let preferences;
  function update(value, persist = true) {
    preferences = {
      theme: themes.includes(value?.theme) ? value.theme : defaults.theme,
      accent: accents.includes(value?.accent) ? value.accent : defaults.accent,
      reducedMotion: value?.reducedMotion === true,
    };
    const { theme, accent, reducedMotion } = preferences;
    Object.assign(document.documentElement.dataset, { theme, accent, motion: reducedMotion ? 'reduced' : 'normal' });
    if (persist) try { localStorage.setItem(key, JSON.stringify(preferences)); } catch { /* Browser storage is optional. */ }
  }
  try { update(JSON.parse(localStorage.getItem(key)), false); } catch { update(defaults, false); }
  window.bitsAppearance = {
    get: () => ({ ...preferences }),
    set: (changes) => update({ ...preferences, ...changes }),
    reset: () => update(defaults),
    isReduced: () => preferences.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
})();
