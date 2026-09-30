/* ================= sound: synthesised, zero assets ================= */
export const store = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch(e) { return null; } },
  set(k: string, v: string): void { try { localStorage.setItem(k, v); } catch(e) {} },
};

export const BEST = {
  get: (k: string): number => parseInt(store.get('capy.best.' + k) || '0', 10),
  set: (k: string, v: number): void => store.set('capy.best.' + k, String(v)),
};
