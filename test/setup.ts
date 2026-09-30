/* Minimal DOM shim so modules that construct `new Image()` at load time
   (capy.ts, capyFace.ts) can be imported under `bun test`, which has no DOM. */
if (typeof globalThis.Image === 'undefined'){
  class ImageShim {
    complete = false; naturalWidth = 0; naturalHeight = 0;
    private _src = '';
    set src(v: string){ this._src = v; }
    get src(){ return this._src; }
    addEventListener(){}
  }
  (globalThis as unknown as { Image: unknown }).Image = ImageShim;
}
