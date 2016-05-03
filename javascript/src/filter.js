import FilterSet from "./filterset";

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

export function createHandle(group) {
  return new FilterHandle(
    getFilterSet(group),
    group.var("filter")
  );
}

class FilterHandle {
  constructor(filterSet, filterVar, handleId = "filter" + nextId()) {
    this._filterSet = filterSet;
    this._filterVar = filterVar;
    this._id = handleId;
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
