import group from "./group";
import selection from "./selection";
import filter from "./filter";

var defaultGroup = group("default");

function var_(name) {
  return defaultGroup.var(name);
}

function has(name) {
  return defaultGroup.has(name);
}

var crosstalk = {
  group: group,
  var: var_,
  has: has,
  selection: selection,
  filter: filter
};

export default crosstalk;
global.crosstalk = crosstalk;
