import { diffSortedLists } from "./util";

function naturalComparator(a, b) {
  if (a === b) {
    return 0;
  } else if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
}

/**
 * @private
 */
export default class FilterSet {
  constructor() {
    this.reset();
  }

  reset() {
    // Key: handle ID, Value: array of selected keys, or null
    this._handles = {};
    // Key: key string, Value: count of handles that include it
    this._keys = {};
    this._value = null;
    this._activeHandles = 0;
  }

  get value() {
    return this._value;
  }

  update(handleId, keys) {
    if (keys !== null) {
      keys = keys.slice(0); // clone before sorting
      keys.sort(naturalComparator);
    }

    let {added, removed} = diffSortedLists(this._handles[handleId], keys);
    this._handles[handleId] = keys;

    for (let i = 0; i < added.length; i++) {
      this._keys[added[i]] = (this._keys[added[i]] || 0) + 1;
    }
    for (let i = 0; i < removed.length; i++) {
      this._keys[removed[i]]--;
    }

    this._updateValue(keys);
  }

  /**
   * @param {string[]} keys Sorted array of strings that indicate
   * a superset of possible keys.
   * @private
   */
  _updateValue(keys = this._allKeys) {
    let handleCount = Object.keys(this._handles).length;
    if (handleCount === 0) {
      this._value = null;
    } else {
      this._value = [];
      for (let i = 0; i < keys.length; i++) {
        let count = this._keys[keys[i]];
        if (count === handleCount) {
          this._value.push(keys[i]);
        }
      }
    }
  }

  clear(handleId) {
    if (typeof(this._handles[handleId]) === "undefined") {
      return;
    }

    let keys = this._handles[handleId] || [];
    for (let i = 0; i < keys.length; i++) {
      this._keys[keys[i]]--;
    }
    delete this._handles[handleId];

    this._updateValue();
  }

  get _allKeys() {
    let allKeys = Object.keys(this._keys);
    allKeys.sort(naturalComparator);
    return allKeys;
  }
}
