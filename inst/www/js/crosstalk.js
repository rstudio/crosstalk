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
    if (!el.__crosstalkStamp) {
      el.__crosstalkStamp = "ct" + stampSeq++;
    }
    return el.__crosstalkStamp;
  }
  crosstalk.stamp = stamp;


  function GroupController(name) {
    this._name = name;
    this._events = new Events();
    this._eventId = 0;
    this._selection = null;
  }

  GroupController.prototype.clearSelection = function() {
    this._selection = null;
    this._events.trigger("selection", null, this);
    return this;
  };

  GroupController.prototype.selection = function(x) {
    if (!arguments.length) {
      return this._selection;
    }
    this._selection = x;
    this._events.trigger("selection", x, this);
    if (window.Shiny) {
      Shiny.onInputChange(this._name + "-crosstalk-selection", x);
    }
    return this;
  };

  GroupController.prototype.toggleSelection = function(el, id) {
    if (typeof(id) === "string")
      id = [id];

    var elId = stamp(el);

    var obs = null;
    if (this._selection && this._selection.ownerId === elId) {
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
      return this.clearSelection();
    } else {
      return this.selection({
        ownerId: elId,
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

  if (window.Shiny) {
    Shiny.addCustomMessageHandler("crosstalk-selection",
      function(message) {
        var g = group(message.group);
        g.selection({
          ownerId: message.ownerId,
          observations: message.observations
        });
      }
    );
  }

})();
