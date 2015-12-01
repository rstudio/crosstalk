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

})();
