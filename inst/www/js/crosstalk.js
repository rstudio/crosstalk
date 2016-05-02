(function() {
  var crosstalk;
  var shinyMode;
  if (typeof(window) !== "undefined") {
    // Only use global object if in browser
    crosstalk = window.crosstalk = {};
    shinyMode = !!window.Shiny;
  } else {
    // Use exports for node.js testing
    crosstalk = exports;
    shinyMode = false;
  }

  function Events() {
    this._types = {};
    this._seq = 0;
  }

  Events.prototype.on = function(eventType, listener) {
    var subs = this._types[eventType];
    if (!subs) {
      subs = this._types[eventType] = {};
    }
    var sub = "sub" + (this._seq++);
    subs[sub] = listener;
    return sub;
  };
  Events.prototype.off = function(eventType, listener) {
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
  };
  Events.prototype.trigger = function(eventType, arg, thisObj) {
    var subs = this._types[eventType];
    for (var key in subs) {
      if (subs.hasOwnProperty(key)) {
        subs[key].call(thisObj, arg);
      }
    }
  };

  // For testing only
  crosstalk.Events = Events;

  var stampSeq = 1;
  function stamp(el) {
    if (el === null) {
      return "";
    }
    if (!el.__crosstalkStamp) {
      el.__crosstalkStamp = "ct" + stampSeq++;
    }
    return el.__crosstalkStamp;
  }
  crosstalk.stamp = stamp;

  function Var(group, name, /*optional*/ value) {
    this._group = group;
    this._name = name;
    this._value = value;
    this._events = new Events();
  }
  crosstalk.Var = Var;
  Var.prototype.get = function() {
    return this._value;
  };
  Var.prototype.set = function(value, /*optional*/ event) {
    if (this._value === value) {
      // Do nothing; the value hasn't changed
      return;
    }
    var oldValue = this._value;
    this._value = value;
    // Alert JavaScript listeners that the value has changed
    var evt = {};
    if (event && typeof(event) === "object") {
      for (var k in event) {
        if (event.hasOwnProperty(k))
          evt[k] = event[k];
      }
    }
    evt.oldValue = oldValue;
    evt.value = value;
    this._events.trigger("change", evt, this);

    // TODO: Make this extensible, to let arbitrary back-ends know that
    // something has changed
    if (shinyMode) {
      Shiny.onInputChange(
        ".clientValue-" +
          (this._group.name !== null ? this._group.name + "-" : "") +
          this._name,
        value
      );
    }
  };
  Var.prototype.on = function(eventType, listener) {
    return this._events.on(eventType, listener);
  };
  Var.prototype.removeChangeListener = function(eventType, listener) {
    return this._events.off(eventType, listener);
  };

  function Group(name) {
    this.name = name;
    this._vars = {};
  }
  Group.prototype.var = function(name) {
    if (typeof(name) !== "string") {
      throw new Error("Invalid var name");
    }

    if (!this._vars.hasOwnProperty(name))
      this._vars[name] = new Var(this, name);
    return this._vars[name];
  };
  Group.prototype.has = function(name) {
    if (typeof(name) !== "string") {
      throw new Error("Invalid var name");
    }

    return this._vars.hasOwnProperty(name);
  };

  crosstalk.var = function(name) {
    return crosstalk.defaultGroup.var(name);
  };
  crosstalk.has = function(name) {
    return crosstalk.defaultGroup.has(name);
  };
  var groups = {};
  crosstalk.group = function(groupName) {
    if (!groups.hasOwnProperty(groupName)) {
      groups[groupName] = new Group(groupName);
    }
    return groups[groupName];
  };
  crosstalk.defaultGroup = crosstalk.group("default");


  crosstalk.selection = {};

  crosstalk.selection.add = function(group, keys) {
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
  };

  crosstalk.selection.remove = function(group, keys) {
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
  };

  crosstalk.selection.toggle = function(group, keys) {
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
  };

  if (shinyMode) {
    Shiny.addCustomMessageHandler("update-client-value", function(message) {
      if (typeof(message.group) === "string") {
        crosstalk.group(message.group).var(message.name).set(message.value);
      } else {
        crosstalk.var(message.name).set(message.value);
      }
    });
  }


  crosstalk.FilterSet = FilterSet;
  function FilterSet() {
    this.reset();
  }

  FilterSet.prototype.reset = function() {
    // Key: handle ID, Value: array of selected keys, or null
    this._handles = {};
    // Key: key string, Value: count of handles that include it
    this._keys = {};
    this._value = null;
    this._activeHandles = 0;
  };

  FilterSet.prototype.acquireKeys = function(keys) {
    var newlyAdded = [];
    for (var i = 0; i < keys.length; i++) {
      var count = this._keys[keys[i]];
      if (!count) {
        this._keys[keys[i]] = 1;
        newlyAdded.push(keys[i]);
      } else {
        this._keys[keys[i]]++;
      }
    }

    this._value = this._value.concat(newlyAdded);
    this._value.sort();
  };
  FilterSet.prototype.releaseKeys = function(keys) {
    var newlyRemoved = [];
    for (var i = 0; i < keys.length; i++) {
      var count = --this._keys[keys[i]];
      if (!count) {
        delete this._keys[keys[i]];
        newlyRemoved.push(keys[i]);
      }
    }

    // Remove newlyRemoved from this._value, and what's left is
    // the remaining keys.
    var diff = diffSortedLists(this._value, newlyRemoved);
    // This looks unintuitive (setting the value to .removed) but
    // it's only because of diffSortedLists' semantics being a bit
    // backwards to what we're using it for here. diff.removed is
    // all of the entries that are present in this._value but not
    // in newlyRemoved.
    this._value = diff.removed;
  };

  FilterSet.prototype.update = function(handleId, keys) {
    if (keys !== null) {
      keys = keys.slice(0); // clone before sorting
      keys.sort();
    }

    var diff = diffSortedLists(this._handles[handleId], keys);
    this._handles[handleId] = keys;

    this.acquireKeys(diff.added);
    this.releaseKeys(diff.removed);
  };

  function diffSortedLists(a, b) {
    var i_a = 0;
    var i_b = 0;

    a = a || [];
    b = b || [];

    var a_only = [];
    var b_only = [];

    while (i_a < a.length && i_b < b.length) {
      if (a[i_a] === b[i_b]) {
        i_a++;
        i_b++;
      }
      if (a[i_a] < b[i_b]) {
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

})();
