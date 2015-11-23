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

  function Var(scope, name, /*optional*/ value) {
    this._scope = scope;
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
          (this._scope.name !== null ? this._scope.name + "-" : "") +
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

  function Scope(name) {
    this.name = name;
    this._vars = {};
  }
  Scope.prototype.var = function(name) {
    if (typeof(name) !== "string") {
      throw new Error("Invalid var name");
    }

    if (!this._vars.hasOwnProperty(name))
      this._vars[name] = new Var(this, name);
    return this._vars[name];
  };
  Scope.prototype.has = function(name) {
    if (typeof(name) !== "string") {
      throw new Error("Invalid var name");
    }

    return this._vars.hasOwnProperty(name);
  };

  crosstalk.defaultScope = new Scope(null);
  crosstalk.var = function(name) {
    return crosstalk.defaultScope.var(name);
  };
  crosstalk.has = function(name) {
    return crosstalk.defaultScope.has(name);
  };
  var scopes = {};
  crosstalk.scope = function(scopeName) {
    if (!scopes.hasOwnProperty(scopeName)) {
      scopes[scopeName] = new Scope(scopeName);
    }
    return scopes[scopeName];
  };

  if (shinyMode) {
    Shiny.addCustomMessageHandler("update-client-value", function(message) {
      if (typeof(message.scope) === "string") {
        crosstalk.scope(message.scope).var(message.name).set(message.value);
      } else {
        crosstalk.var(message.name).set(message.value);
      }
    });
  }

})();
