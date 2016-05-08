export default class Events {
  constructor() {
    this._types = {};
    this._seq = 0;
  }

  on(eventType, listener) {
    var subs = this._types[eventType];
    if (!subs) {
      subs = this._types[eventType] = {};
    }
    var sub = "sub" + (this._seq++);
    subs[sub] = listener;
    return sub;
  }

  off(eventType, listener) {
    var subs = this._types[eventType];
    if (typeof(listener) === "function") {
      for (var key in subs) {
        if (subs.hasOwnProperty(key)) {
          if (subs[key] === listener) {
            delete subs[key];
            return;
          }
        }
      }
    } else if (typeof(listener) === "string") {
      if (subs) {
        delete subs[listener];
        return;
      }
    } else {
      throw new Error("Unexpected type for listener");
    }
  }

  trigger(eventType, arg, thisObj) {
    var subs = this._types[eventType];
    for (var key in subs) {
      if (subs.hasOwnProperty(key)) {
        subs[key].call(thisObj, arg);
      }
    }
  }
}

var stampSeq = 1;

export function stamp(el) {
  if (el === null) {
    return "";
  }
  if (!el.__crosstalkStamp) {
    el.__crosstalkStamp = "ct" + stampSeq++;
  }
  return el.__crosstalkStamp;
}
