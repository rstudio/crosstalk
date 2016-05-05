(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.stamp = stamp;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Events = function () {
  function Events() {
    _classCallCheck(this, Events);

    this._types = {};
    this._seq = 0;
  }

  _createClass(Events, [{
    key: "on",
    value: function on(eventType, listener) {
      var subs = this._types[eventType];
      if (!subs) {
        subs = this._types[eventType] = {};
      }
      var sub = "sub" + this._seq++;
      subs[sub] = listener;
      return sub;
    }
  }, {
    key: "off",
    value: function off(eventType, listener) {
      var subs = this._types[eventType];
      if (typeof listener === "function") {
        for (var key in subs) {
          if (subs.hasOwnProperty(key)) {
            if (subs[key] === listener) {
              delete subs[key];
              return;
            }
          }
        }
      } else if (typeof listener === "string") {
        if (subs) {
          delete subs[listener];
          return;
        }
      } else {
        throw new Error("Unexpected type for listener");
      }
    }
  }, {
    key: "trigger",
    value: function trigger(eventType, arg, thisObj) {
      var subs = this._types[eventType];
      for (var key in subs) {
        if (subs.hasOwnProperty(key)) {
          subs[key].call(thisObj, arg);
        }
      }
    }
  }]);

  return Events;
}();

exports.default = Events;


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

if (global.Shiny) {
  Shiny.addCustomMessageHandler("update-client-value", function (message) {
    if (typeof message.group === "string") {
      group(message.group).var(message.name).set(message.value);
    } else {
      var_(message.name).set(message.value);
    }
  });
}


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.createHandle = createHandle;

var _filterset = require("./filterset");

var _filterset2 = _interopRequireDefault(_filterset);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function getFilterSet(group) {
  var fsVar = group.var("filterset");
  var result = fsVar.get();
  if (!result) {
    result = new _filterset2.default();
    fsVar.set(result);
  }
  return result;
}

var id = 1;
function nextId() {
  return id++;
}

function createHandle(group) {
  return new FilterHandle(getFilterSet(group), group.var("filter"));
}

var FilterHandle = function () {
  function FilterHandle(filterSet, filterVar) {
    var handleId = arguments.length <= 2 || arguments[2] === undefined ? "filter" + nextId() : arguments[2];

    _classCallCheck(this, FilterHandle);

    this._filterSet = filterSet;
    this._filterVar = filterVar;
    this._id = handleId;
  }

  _createClass(FilterHandle, [{
    key: "close",
    value: function close() {
      this.clear();
    }
  }, {
    key: "clear",
    value: function clear() {
      this._filterSet.clear(this._id);
      this._onChange();
    }
  }, {
    key: "set",
    value: function set(keys) {
      this._filterSet.update(this._id, keys);
      this._onChange();
    }
  }, {
    key: "on",
    value: function on(eventType, listener) {
      return this._filterVar.on(eventType, listener);
    }
  }, {
    key: "_onChange",
    value: function _onChange() {
      this._filterVar.set(this._filterSet.value);
    }
  }, {
    key: "filteredKeys",
    get: function get() {
      return this._filterSet.value;
    }
  }]);

  return FilterHandle;
}();


},{"./filterset":3}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require("./util");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function naturalComparator(a, b) {
  if (a === b) {
    return 0;
  } else if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
}

var FilterSet = function () {
  function FilterSet() {
    _classCallCheck(this, FilterSet);

    this.reset();
  }

  _createClass(FilterSet, [{
    key: "reset",
    value: function reset() {
      // Key: handle ID, Value: array of selected keys, or null
      this._handles = {};
      // Key: key string, Value: count of handles that include it
      this._keys = {};
      this._value = null;
      this._activeHandles = 0;
    }
  }, {
    key: "update",
    value: function update(handleId, keys) {
      if (keys !== null) {
        keys = keys.slice(0); // clone before sorting
        keys.sort(naturalComparator);
      }

      var _diffSortedLists = (0, _util.diffSortedLists)(this._handles[handleId], keys);

      var added = _diffSortedLists.added;
      var removed = _diffSortedLists.removed;

      this._handles[handleId] = keys;

      for (var i = 0; i < added.length; i++) {
        this._keys[added[i]] = (this._keys[added[i]] || 0) + 1;
      }
      for (var _i = 0; _i < removed.length; _i++) {
        this._keys[removed[_i]]--;
      }

      this._updateValue(keys);
    }

    /**
     * @param {string[]} keys Sorted array of strings that indicate
     * a superset of possible keys.
     */

  }, {
    key: "_updateValue",
    value: function _updateValue() {
      var keys = arguments.length <= 0 || arguments[0] === undefined ? this._allKeys : arguments[0];

      var handleCount = Object.keys(this._handles).length;
      this._value = [];
      for (var i = 0; i < keys.length; i++) {
        var count = this._keys[keys[i]];
        if (count === handleCount) {
          this._value.push(keys[i]);
        }
      }
    }
  }, {
    key: "clear",
    value: function clear(handleId) {
      if (typeof this._handles[handleId] === "undefined") {
        return;
      }

      var keys = this._handles[handleId] || [];
      for (var i = 0; i < keys.length; i++) {
        this._keys[keys[i]]--;
      }
      delete this._handles[handleId];

      this._updateValue();
    }
  }, {
    key: "value",
    get: function get() {
      return this._value;
    }
  }, {
    key: "_allKeys",
    get: function get() {
      var allKeys = Object.keys(this._keys);
      allKeys.sort(naturalComparator);
      return allKeys;
    }
  }]);

  return FilterSet;
}();

exports.default = FilterSet;


},{"./util":7}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = group;

var _var2 = require("./var");

var _var3 = _interopRequireDefault(_var2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var groups = {};

function group(groupName) {
  if (!groups.hasOwnProperty(groupName)) {
    groups[groupName] = new Group(groupName);
  }
  return groups[groupName];
}

var Group = function () {
  function Group(name) {
    _classCallCheck(this, Group);

    this.name = name;
    this._vars = {};
  }

  _createClass(Group, [{
    key: "var",
    value: function _var(name) {
      if (typeof name !== "string") {
        throw new Error("Invalid var name");
      }

      if (!this._vars.hasOwnProperty(name)) this._vars[name] = new _var3.default(this, name);
      return this._vars[name];
    }
  }, {
    key: "has",
    value: function has(name) {
      if (typeof name !== "string") {
        throw new Error("Invalid var name");
      }

      return this._vars.hasOwnProperty(name);
    }
  }]);

  return Group;
}();


},{"./var":8}],5:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _group = require("./group");

var _group2 = _interopRequireDefault(_group);

var _selection = require("./selection");

var selection = _interopRequireWildcard(_selection);

var _filter = require("./filter");

var filter = _interopRequireWildcard(_filter);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultGroup = (0, _group2.default)("default");

function var_(name) {
  return defaultGroup.var(name);
}

function has(name) {
  return defaultGroup.has(name);
}

var crosstalk = {
  group: _group2.default,
  var: var_,
  has: has,
  selection: selection,
  filter: filter
};

exports.default = crosstalk;

global.crosstalk = crosstalk;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./filter":2,"./group":4,"./selection":6}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.remove = remove;
exports.toggle = toggle;
function add(group, keys) {
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
    if (keySet.hasOwnProperty(key)) result.push(key);
  }

  if (anyKeys) {
    group.var("selection").set(result);
  }

  return this;
};

function remove(group, keys) {
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

function toggle(group, keys) {
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


},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkSorted = checkSorted;
exports.diffSortedLists = diffSortedLists;
function checkSorted(list) {
  for (var i = 1; i < list.length; i++) {
    if (list[i] <= list[i - 1]) {
      throw new Error("List is not sorted or contains duplicate");
    }
  }
}

function diffSortedLists(a, b) {
  var i_a = 0;
  var i_b = 0;

  a = a || [];
  b = b || [];

  var a_only = [];
  var b_only = [];

  checkSorted(a);
  checkSorted(b);

  while (i_a < a.length && i_b < b.length) {
    if (a[i_a] === b[i_b]) {
      i_a++;
      i_b++;
    } else if (a[i_a] < b[i_b]) {
      a_only.push(a[i_a++]);
    } else {
      b_only.push(b[i_b++]);
    }
  }

  if (i_a < a.length) a_only = a_only.concat(a.slice(i_a));
  if (i_b < b.length) b_only = b_only.concat(b.slice(i_b));
  return {
    removed: a_only,
    added: b_only
  };
}


},{}],8:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require("./events");

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Var = function () {
  function Var(group, name, /*optional*/value) {
    _classCallCheck(this, Var);

    this._group = group;
    this._name = name;
    this._value = value;
    this._events = new _events2.default();
  }

  _createClass(Var, [{
    key: "get",
    value: function get() {
      return this._value;
    }
  }, {
    key: "set",
    value: function set(value, /*optional*/event) {
      if (this._value === value) {
        // Do nothing; the value hasn't changed
        return;
      }
      var oldValue = this._value;
      this._value = value;
      // Alert JavaScript listeners that the value has changed
      var evt = {};
      if (event && (typeof event === "undefined" ? "undefined" : _typeof(event)) === "object") {
        for (var k in event) {
          if (event.hasOwnProperty(k)) evt[k] = event[k];
        }
      }
      evt.oldValue = oldValue;
      evt.value = value;
      this._events.trigger("change", evt, this);

      // TODO: Make this extensible, to let arbitrary back-ends know that
      // something has changed
      if (global.Shiny) {
        Shiny.onInputChange(".clientValue-" + (this._group.name !== null ? this._group.name + "-" : "") + this._name, value);
      }
    }
  }, {
    key: "on",
    value: function on(eventType, listener) {
      return this._events.on(eventType, listener);
    }
  }, {
    key: "removeChangeListenerfunction",
    value: function removeChangeListenerfunction(eventType, listener) {
      return this._events.off(eventType, listener);
    }
  }]);

  return Var;
}();

exports.default = Var;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./events":1}]},{},[5]);
