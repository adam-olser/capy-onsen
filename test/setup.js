/* Minimal DOM shim so modules that construct `new Image()` at load time
   (capy.js, capyFace.js) can be imported under `bun test`, which has no DOM. */
if (typeof globalThis.Image === 'undefined'){
  globalThis.Image = class {
    constructor(){ this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; }
    set src(v){ this._src = v; }
    get src(){ return this._src; }
    addEventListener(){}
  };
}
