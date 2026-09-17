/* ================= sound: synthesised, zero assets ================= */
export const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e) {} },
};

export const BEST = {
  get: k => parseInt(store.get('capy.best.' + k) || '0', 10),
  set: (k, v) => store.set('capy.best.' + k, String(v)),
};
