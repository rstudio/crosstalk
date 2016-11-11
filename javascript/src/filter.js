import FilterSet from "./filterset";
import grp from "./group";

function getFilterSet(group) {
  let fsVar = group.var("filterset");
  let result = fsVar.get();
  if (!result) {
    result = new FilterSet();
    fsVar.set(result);
  }
  return result;
}

let id = 1;
function nextId() {
  return id++;
}

/**
 * Legacy only
 * @ignore
 */
export function createHandle(group) {
  return new FilterHandle(group);
}

export class FilterHandle {
  constructor(group) {
    group = grp(group);
    this._filterSet = getFilterSet(group);
    this._filterVar = group.var("filter");
    this._id = "filter" + nextId();
  }

  close() {
    this.clear();
  }

  clear() {
    this._filterSet.clear(this._id);
    this._onChange();
  }

  set(keys) {
    this._filterSet.update(this._id, keys);
    this._onChange();
  }

  get filteredKeys() {
    return this._filterSet.value;
  }

  on(eventType, listener) {
    return this._filterVar.on(eventType, listener);
  }

  _onChange() {
    this._filterVar.set(this._filterSet.value);
  }
}
