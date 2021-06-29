export function extend(target, ...sources) {
  for (let i = 0; i < sources.length; i++) {
    let src = sources[i];
    if (typeof(src) === "undefined" || src === null)
      continue;

    for (let key in src) {
      if (src.hasOwnProperty(key)) {
        target[key] = src[key];
      }
    }
  }
  return target;
}

export function checkSorted(list) {
  for (let i = 1; i < list.length; i++) {
    if (list[i] <= list[i-1]) {
      throw new Error("List is not sorted or contains duplicate");
    }
  }
}

export function diffSortedLists(a, b) {
  let i_a = 0;
  let i_b = 0;

  if (!a) a = [];
  if (!b) b = [];

  let a_only = [];
  let b_only = [];

  checkSorted(a);
  checkSorted(b);

  while (i_a < a.length && i_b < b.length) {
    if (a[i_a] === b[i_b]) {
      i_a++;
      i_b++;
    } else if (a[i_a] < b[i_b]) {
      a_only.push(a[i_a++]);
    } else {
      b_only.push(b[i_b++]);
    }
  }

  if (i_a < a.length)
    a_only = a_only.concat(a.slice(i_a));
  if (i_b < b.length)
    b_only = b_only.concat(b.slice(i_b));
  return {
    removed: a_only,
    added: b_only
  };
}

// Convert from wide: { colA: [1,2,3], colB: [4,5,6], ... }
// to long: [ {colA: 1, colB: 4}, {colA: 2, colB: 5}, ... ]
export function dataframeToD3(df) {
  let names = [];
  let length;
  for (let name in df) {
    if (df.hasOwnProperty(name))
      names.push(name);
    if (typeof(df[name]) !== "object" || typeof(df[name].length) === "undefined") {
      throw new Error("All fields must be arrays");
    } else if (typeof(length) !== "undefined" && length !== df[name].length) {
      throw new Error("All fields must be arrays of the same length");
    }
    length = df[name].length;
  }
  let results = [];
  let item;
  for (let row = 0; row < length; row++) {
    item = {};
    for (let col = 0; col < names.length; col++) {
      item[names[col]] = df[names[col]][row];
    }
    results.push(item);
  }
  return results;
}

/**
 * Keeps track of all event listener additions/removals and lets all active
 * listeners be removed with a single operation.
 *
 * @private
 */
export class SubscriptionTracker {
  constructor(emitter) {
    this._emitter = emitter;
    this._subs = {};
  }

  on(eventType, listener) {
    let sub = this._emitter.on(eventType, listener);
    this._subs[sub] = eventType;
    return sub;
  }

  off(eventType, listener) {
    let sub = this._emitter.off(eventType, listener);
    if (sub) {
      delete this._subs[sub];
    }
    return sub;
  }

  trigger(eventType, arg, thisObj) {
    this._emitter.trigger(eventType, arg, thisObj);
  }

  removeAllListeners() {
    let current_subs = this._subs;
    this._subs = {};
    Object.keys(current_subs).forEach((sub) => {
      this._emitter.off(current_subs[sub], sub);
    });
  }
}
