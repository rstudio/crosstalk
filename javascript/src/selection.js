import group from "./group";

/**
 * Use this class to get (`.value`) and set (`.set()`) the selection for
 * a Crosstalk group. This is intended to be used for linked brushing.
 * 
 * Besides getting and setting, you can also use the convenience methods
 * `add`, `remove`, and `toggle` to modify the active selection, and
 * subscribe/unsubscribe to `"change"` events to be notified whenever the
 * selection changes.
 * 
 * @constructor
 */
class SelectionHandle {
  /**
   * @ignore
   */
  constructor(group, owner = null, options = null) {
    this._group = group;
    this._var = group.var("selection");

    this._extraInfo = {};
    if (owner) {
      this._extraInfo.sender = owner;
    }

    if (options) {
      for (let key in options) {
        if (options.hasOwnProperty(key)) {
          this._extraInfo[key] = options[key];
        }
      }
    }
  }

  /**
   * Retrieves the current selection for the group represented by this
   * `SelectionHandle`. Can be `undefined` (meaning no selection is active),
   * an empty array (meaning a selection with no elements is active), or an
   * array with one or more keys.
   */
  get value() {
    return this._var.get();
  }

  /**
   * Overwrites the current selection for the group, and raises the `"change"`
   * event among all of the group's '`SelectionHandle` instances (including
   * this one).
   * 
   * @param {string[]} selectedKeys - `undefined`, empty array, or array of keys.
   * @param {Object} [extraInfo] - Extra attributes to be included on the event
   *   object that's passed to listeners. One common usage is `{sender: this}`
   *   if the caller needs to distinguish between events raised by itself and
   *   events raised by others. 
   */
  set(selectedKeys, extraInfo) {
    this._var.set(selectedKeys, extraInfo);
  }

  clear(extraInfo) {
    this.set(void 0, extraInfo);
  }

  add(keys, extraInfo) {
    add(this._group, keys, extraInfo);
  }

  remove(keys, extraInfo) {
    remove(this._group, keys, extraInfo);
  }

  toggle(keys, extraInfo) {
    toggle(this._group, keys, extraInfo);
  }

  on(eventType, listener) {
    return this._var.on(eventType, listener);
  }

  off(eventType, listener) {
    return this._var.off(eventType, listener);
  }
}

export function createHandle(groupName, owner = null, options = null) {
  let grp = group(groupName);
  return new SelectionHandle(grp);
}

export function add(group, keys, extraInfo) {
  if (!keys || keys.length === 0) {
    // Nothing to do
    return this;
  }

  var sel = group.var("selection").get();

  if (!sel) {
    // No keys to keep, but go through the machinery below anyway,
    // to remove dupes in `keys`
    sel = [];
  }

  var result = sel.slice(0);

  // Populate an object with the keys to add
  var keySet = {};
  for (var i = 0; i < keys.length; i++) {
    keySet[keys[i]] = true;
  }

  // Remove any keys that are already in the set
  for (var j = 0; j < sel.length; j++) {
    delete keySet[sel[j]];
  }

  var anyKeys = false;
  // Add the remaining keys
  for (var key in keySet) {
    anyKeys = true;
    if (keySet.hasOwnProperty(key))
      result.push(key);
  }

  if (anyKeys) {
    group.var("selection").set(result, extraInfo);
  }

  return this;
}

export function remove(group, keys, extraInfo) {
  if (!keys || keys.length === 0) {
    // Nothing to do
    return this;
  }

  var sel = group.var("selection").get();

  var keySet = {};
  for (var i = 0; i < keys.length; i++) {
    keySet[keys[i]] = true;
  }

  var anyKeys = false;
  var result = [];
  for (var j = 0; j < sel.length; j++) {
    if (!keySet.hasOwnProperty(sel[j])) {
      result.push(sel[j]);
    } else {
      anyKeys = true;
    }
  }

  // Only set the selection if values actually changed
  if (anyKeys) {
    group.var("selection").set(result, extraInfo);
  }

  return this;
}

export function toggle(group, keys, extraInfo) {
  if (!keys || keys.length === 0) {
    // Nothing to do
    return this;
  }

  var sel = group.var("selection").get();

  var keySet = {};
  for (var i = 0; i < keys.length; i++) {
    keySet[keys[i]] = true;
  }

  var result = [];
  for (var j = 0; j < sel.length; j++) {
    if (!keySet.hasOwnProperty(sel[j])) {
      result.push(sel[j]);
    } else {
      keySet[sel[j]] = false;
    }
  }

  for (var key in keySet) {
    if (keySet[key]) {
      result.push(key);
    }
  }

  group.var("selection").set(result, extraInfo);
  return this;
}
