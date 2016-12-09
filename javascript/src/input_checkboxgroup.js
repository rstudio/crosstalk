import * as input from "./input";
import { FilterHandle } from "./filter";

let $ = global.jQuery;

input.register({
  className: "crosstalk-input-checkboxgroup",

  factory: function(el, data) {
    /*
     * map: {"groupA": ["keyA", "keyB", ...], ...}
     * group: "ct-groupname"
     */
    let ctHandle = new FilterHandle(data.group);

    let lastKnownKeys;
    let $el = $(el);
    $el.on("change", "input[type='checkbox']", function() {
      let checked = $el.find("input[type='checkbox']:checked");
      if (checked.length === 0) {
        lastKnownKeys = null;
        ctHandle.clear();
      } else {
        let keys = {};
        checked.each(function() {
          data.map[this.value].forEach(function(key) {
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
