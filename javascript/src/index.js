import group from "./group";
import * as selection from "./selection";
import * as filter from "./filter";
import "./input";
import "./input_selectize";
import "./input_checkboxgroup";
import "./input_slider";

var defaultGroup = group("default");

function var_(name) {
  return defaultGroup.var(name);
}

function has(name) {
  return defaultGroup.has(name);
}

if (global.Shiny) {
  global.Shiny.addCustomMessageHandler("update-client-value", function(message) {
    if (typeof(message.group) === "string") {
      group(message.group).var(message.name).set(message.value);
    } else {
      var_(message.name).set(message.value);
    }
  });
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
