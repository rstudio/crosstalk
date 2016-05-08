export function add(group, keys) {
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
    group.var("selection").set(result);
  }

  return this;
}

export function remove(group, keys) {
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
    group.var("selection").set(result);
  }

  return this;
}

export function toggle(group, keys) {
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

  group.var("selection").set(result);
  return this;
}
