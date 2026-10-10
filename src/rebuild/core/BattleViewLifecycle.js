export class BattleViewLifecycle {
  constructor(){this._version=0;this._active=null;}
  begin(){this._active=++this._version;return this._active;}
  leave(){this._active=null;this._version++;}
  isCurrent(token){return token!==null&&token===this._active;}
}
