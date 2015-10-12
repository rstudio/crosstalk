(function() {
  var crosstalk;
  if (typeof(window) !== "undefined") {
    // Only use global object if in browser
    crosstalk = window.crosstalk = {};
  } else {
    // Use exports for node.js testing
    crosstalk = exports;
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


  function GroupController(name) {
    this._name = name;
    this._eventId = 0;
    this._selection = getNamedValue("crosstalk-selection-" + name);

    this.setSelection(null, null);
  }

  GroupController.prototype.clearSelection = function(el) {
    this._selection.set({
      ownerId: stamp(el),
      eventId: this._eventId++
    });
    return this;
  };

  GroupController.prototype.getSelection = function() {
    return this._selection.get();
  };

  GroupController.prototype.setSelection = function(el, observations) {
    this._selection.set({
      ownerId: stamp(el),
      eventId: this._eventId++,
      observations: observations
    });
    return this;
  };

  GroupController.prototype.toggleSelection = function(el, id) {
    if (typeof(id) === "string")
      id = [id];

    var elId = stamp(el);

    var obs = null;
    if (this._selection && this._selection.get().ownerId === elId) {
      obs = this._selection.observations;
    }
    if (!obs) {
      obs = [];
    }

    for (var i = 0; i < id.length; i++) {
      var idx = obs.indexOf(id[i]);
      if (idx >= 0) {
        do {
          obs.splice(idx, 1);
          idx = obs.indexOf(id[i]);
        }
        while (idx >= 0);
      } else {
        obs.push(id[i]);
      }
    }

    if (obs.length === 0) {
      return this.clearSelection(el);
    } else {
      return this.selection({
        ownerId: elId,
        eventId: this._eventId++,
        observations: obs
      });
    }
  };

  GroupController.prototype.on = function() {
    return this._events.on.apply(this._events, arguments);
  };
  GroupController.prototype.off = function() {
    return this._events.off.apply(this._events, arguments);
  };
  GroupController.prototype.trigger = function() {
    return this._events.trigger.apply(this._events, arguments);
  };

  var groups = {};

  function group(name) {
    if (!groups.hasOwnProperty(name)) {
      groups[name] = new GroupController(name);
    }
    return groups[name];
  }

  crosstalk.group = group;

  var NamedValue = function(name, /*optional*/ value) {
    this._name = name;
    this._value = value;
    this._events = new Events();
  };
  NamedValue.prototype.get = function() {
    return this._value;
  };
  NamedValue.prototype.set = function(value) {
    var oldValue = this._value;
    this._value = value;
    // Alert JavaScript listeners that the value has changed
    this._events.trigger("change", {
      oldValue: oldValue,
      value: value
    }, this);

    // TODO: Make this extensible, to let arbitrary back-ends know that
    // something has changed
    if (window.Shiny) {
      Shiny.onInputChange(".clientValue-" + this._name, value);
    }
  };
  NamedValue.prototype.onChange = function(listener) {
    return this._events.on("change", listener);
  };
  NamedValue.prototype.removeChangeListener = function(listener) {
    return this._events.off("change", listener);
  };

  var namedValues = {};
  function getNamedValue(name) {
    var result = namedValues[name];
    if (!result) {
      result = namedValues[name] = new NamedValue(name);
    }
    return result;
  }

  if (window.Shiny) {
    Shiny.addCustomMessageHandler("update-client-value", function(message) {
      getNamedValue(message.name).set(message.value);
    });
  }

})();
