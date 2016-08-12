import * as input from "./input";

let $ = global.jQuery;

input.register({
  className: "crosstalk-input-colour-picker",

  factory: function(el, data) {
    // initiate the colourpicker
    let $el = $(el).find("input")[0];
    $el.colourpicker(data.settings);
    // set the starting value
    $el.colourpicker("value", data.value);

    $el.on("change", function() {
      let ctGroup = global.crosstalk.group(data.group);
      ctGroup.var("colourPalette").set($el.colourpicker("value"));
    });

    return $el;
  }
});
