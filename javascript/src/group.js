import Var from "./var";

// Use a global so that multiple copies of crosstalk.js can be loaded and still
// have groups behave as singletons across all copies.
global.__crosstalk_groups = global.__crosstalk_groups || {};
let groups = global.__crosstalk_groups;

export default function group(groupName) {
  if (typeof(groupName) === "string") {
    if (!groups.hasOwnProperty(groupName)) {
      groups[groupName] = new Group(groupName);
    }
    return groups[groupName];
  } else if (typeof(groupName) === "object" && groupName._vars && groupName.var) {
    // Appears to already be a group object
    return groupName;
  } else if (Array.isArray(groupName) &&
      groupName.length == 1 &&
      typeof(groupName[0]) === "string") {
    return group(groupName[0]);
  } else {
    throw new Error("Invalid groupName argument");
  }
}

class Group {
  constructor(name) {
    this.name = name;
    this._vars = {};
  }

  var(name) {
    if (typeof(name) !== "string") {
      throw new Error("Invalid var name");
    }

    if (!this._vars.hasOwnProperty(name))
      this._vars[name] = new Var(this, name);
    return this._vars[name];
  }

  has(name) {
    if (typeof(name) !== "string") {
      throw new Error("Invalid var name");
    }

    return this._vars.hasOwnProperty(name);
  }
}
