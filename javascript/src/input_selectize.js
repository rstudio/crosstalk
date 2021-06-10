import * as input from "./input";
import * as util from "./util";
import { FilterHandle } from "./filter";

let $ = global.jQuery;

input.register({
  className: "crosstalk-input-select",

  factory: function(el, data) {
    /*
     * items: {value: [...], label: [...]}
     * map: {"groupA": ["keyA", "keyB", ...], ...}
     * group: "ct-groupname"
     */

    let first = [{value: "", label: "(All)"}];
    let items = util.dataframeToD3(data.items);
    let opts = {
      options: first.concat(items),
      valueField: "value",
      labelField: "label",
      searchField: "label",
      items: data.selected,
    };

    let select = $(el).find("select")[0];

    let selectize = $(select).selectize(opts)[0].selectize;

    let ctHandle = new FilterHandle(data.group);

    // set default selection 
    // check if empty array []
    if(data.selected.length > 0)
      ctHandle.set(data.map[data.selected]);

    let lastKnownKeys;
    selectize.on("change", function() {
      if (selectize.items.length === 0) {
        lastKnownKeys = null;
        ctHandle.clear();
      } else {
        let keys = {};
        selectize.items.forEach(function(group) {
          data.map[group].forEach(function(key) {
            keys[key] = true;
          });
        });
        let keyArray = Object.keys(keys);
        keyArray.sort();
        lastKnownKeys = keyArray;
        ctHandle.set(keyArray);
      }
    });

    return {
      suspend: function() {
        ctHandle.clear();
      },
      resume: function() {
        if (lastKnownKeys)
          ctHandle.set(lastKnownKeys);
      }
    };
  }
});
