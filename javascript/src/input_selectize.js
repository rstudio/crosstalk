let $ = global.jQuery;

function registerFilterInput(reg) {
  setTimeout(function() {
    $(".crosstalk-input-select").each(function(i, el) {
      reg.factory(el, null);
    });
  }, 100);
}

registerFilterInput({
  className: "crosstalk-input-select",

  factory: function(el, data) {
    /*
     * items: {value: [...], label: [...]}
     * map: {"groupA": ["keyA", "keyB", ...], ...}
     * group: "ct-groupname"
     */

    // This should be pulled out
    var jsonEl = $(el).find("script[type='application/json']");
    data = JSON.parse(jsonEl[0].innerText);

    let first = {value: "", label: "(All)"};
    let opts = {
      options: [first].concat(global.HTMLWidgets.dataframeToD3(data.items)),
      valueField: "value",
      labelField: "label"
    };

    let selectize = $(el).find("select").selectize(opts)[0].selectize;

    let ctGroup = global.crosstalk.group(data.group);
    let ctHandle = global.crosstalk.filter.createHandle(ctGroup);

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
