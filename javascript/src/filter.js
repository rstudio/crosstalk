import FilterSet from "./filterset";

function getFilterSet(group) {
  return group.var("filterset");
}

let id = 1;
function nextId() {
  return id++;
}

export function createHandle(group) {
  return new FilterHandle(getFilterSet(group));
}

export class FilterHandle {
  constructor(filterSet, handleId = "filter" + nextId()) {
    this._filterSet = filterSet;
    this._id = handleId;
  }

  close() {
    this.clear();
  }

  clear() {
    this._filterSet.clear(this._id);
  }

  set(keys) {
    this._filterSet.update(this._id, keys);
  }

  get filteredKeys() {
    return this._filterSet.value;
  }
}
