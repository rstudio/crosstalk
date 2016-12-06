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
      labelField: "label"
    };

    let select = $(el).find("select")[0];

    let selectize = $(select).selectize(opts)[0].selectize;

    let ctHandle = new FilterHandle(data.group);

    selectize.on("change", function() {
      if (selectize.items.length === 0) {
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
        ctHandle.set(keyArray);
      }
    });

    return selectize;
  }
});
