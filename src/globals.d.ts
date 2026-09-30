/* Bun's HTML/bundler entry (index.html) resolves these imports to a URL
   string at build time -- see PNGs in sprites/faces/ and MP3s in audio/tracks/. */
declare module '*.png' {
  const url: string;
  export default url;
}
declare module '*.mp3' {
  const url: string;
  export default url;
}

/* read-only hooks for the Playwright visual test suite -- see main.ts's
   window.__* assignments and test/visual/*.spec.js */
interface Window {
  __sceneDebug: () => unknown;
  __faceSize: { FACE_LW: number; FACE_LH: number };
  __currentGame: () => unknown;
  __PW_PH: () => [number, number];
  __musicDebug: () => unknown;
}
