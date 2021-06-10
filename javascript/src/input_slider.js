import * as input from "./input";
import { FilterHandle } from "./filter";

let $ = global.jQuery;
let strftime = global.strftime;

input.register({
  className: "crosstalk-input-slider",

  factory: function(el, data) {
    /*
     * map: {"groupA": ["keyA", "keyB", ...], ...}
     * group: "ct-groupname"
     */
    let ctHandle = new FilterHandle(data.group);

    let opts = {};
    let $el = $(el).find("input");
    let dataType = $el.data("data-type");
    let timeFormat = $el.data("time-format");
    let round = $el.data("round");
    let timeFormatter;

    // Set up formatting functions
    if (dataType === "date") {
      timeFormatter = strftime.utc();
      opts.prettify = function(num) {
        return timeFormatter(timeFormat, new Date(num));
      };

    } else if (dataType === "datetime") {
      let timezone = $el.data("timezone");
      if (timezone)
        timeFormatter = strftime.timezone(timezone);
      else
        timeFormatter = strftime;

      opts.prettify = function(num) {
        return timeFormatter(timeFormat, new Date(num));
      };
    } else if (dataType === "number") {
      if (typeof round !== "undefined")
        opts.prettify = function(num) {
          let factor = Math.pow(10, round);
          return Math.round(num * factor) / factor;
        };
    }

    $el.ionRangeSlider(opts);

    function getValue() {
      let result = $el.data("ionRangeSlider").result;

      // Function for converting numeric value from slider to appropriate type.
      let convert;
      let dataType = $el.data("data-type");
      if (dataType === "date") {
        convert = function(val) {
          return formatDateUTC(new Date(+val));
        };
      } else if (dataType === "datetime") {
        convert = function(val) {
          // Convert ms to s
          return +val / 1000;
        };
      } else {
        convert = function(val) { return +val; };
      }

      if ($el.data("ionRangeSlider").options.type === "double") {
        return [convert(result.from), convert(result.to)];
      } else {
        return convert(result.from);
      }
    }

    let lastKnownKeys = null;

    function updateFilter() {
      if (!$el.data("updating") && !$el.data("animating")) {
        let [from, to] = getValue();
        let keys = [];
        for (let i = 0; i < data.values.length; i++) {
          let val = data.values[i];
          if (val >= from && val <= to) {
            keys.push(data.keys[i]);
          }
        }
        keys.sort();
        ctHandle.set(keys);
        lastKnownKeys = keys;
      }
    }
    $el.on("change.crosstalkSliderInput", updateFilter);

    updateFilter();

    // Update filter now in case this code happens to execute
    // after widget(s) are done rendering
    updateFilter();

    // Schedule another update when all widgets are done rendering
    // This is especially relevant for `runtime: shiny` where widgets
    // likely haven't rendered at this point and may only register
    // FilterHandle.on("change", ...) callbacks in their renderValue
    if (window.HTMLWidgets) {
      window.HTMLWidgets.addPostRenderHandler(updateFilter);
    }

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


// Convert a number to a string with leading zeros
function padZeros(n, digits) {
  let str = n.toString();
  while (str.length < digits)
    str = "0" + str;
  return str;
}

// Given a Date object, return a string in yyyy-mm-dd format, using the
// UTC date. This may be a day off from the date in the local time zone.
function formatDateUTC(date) {
  if (date instanceof Date) {
    return date.getUTCFullYear() + "-" +
           padZeros(date.getUTCMonth()+1, 2) + "-" +
           padZeros(date.getUTCDate(), 2);

  } else {
    return null;
  }
}
