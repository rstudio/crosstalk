export default class Events {
  constructor() {
    this._types = {};
    this._seq = 0;
  }

  on(eventType, listener) {
    let subs = this._types[eventType];
    if (!subs) {
      subs = this._types[eventType] = {};
    }
    let sub = "sub" + (this._seq++);
    subs[sub] = listener;
    return sub;
  }

  // Returns false if no match, or string for sub name if matched
  off(eventType, listener) {
    let subs = this._types[eventType];
    if (typeof(listener) === "function") {
      for (let key in subs) {
        if (subs.hasOwnProperty(key)) {
          if (subs[key] === listener) {
            delete subs[key];
            return key;
          }
        }
      }
      return false;
    } else if (typeof(listener) === "string") {
      if (subs) {
        delete subs[listener];
        return listener;
      }
      return false;
    } else {
      throw new Error("Unexpected type for listener");
    }
  }

  trigger(eventType, arg, thisObj) {
    let subs = this._types[eventType];
    for (let key in subs) {
      if (subs.hasOwnProperty(key)) {
        subs[key].call(thisObj, arg);
      }
    }
  }
}
