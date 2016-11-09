let $ = global.jQuery;

let bindings = {};

export function register(reg) {
  bindings[reg.className] = reg;
  if (global.document && global.document.readyState !== "complete") {
    $(() => {
      bind();
    });
  } else if (global.document) {
    setTimeout(bind, 100);
  }
}

function bind() {
  Object.keys(bindings).forEach(function(className) {
    let binding = bindings[className];
    $("." + binding.className).not(".crosstalk-input-bound").each(function(i, el) {
      bindInstance(binding, el);
    });
  });
}

// Escape jQuery identifier
function $escape(val) {
  return val.replace(/([!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~])/g, "\\$1");
}

function bindInstance(binding, el) {
  let jsonEl = $(el).find("script[type='application/json'][data-for='" + $escape(el.id) + "']");
  let data = JSON.parse(jsonEl[0].innerText);

  let instance = binding.factory(el, data);
  $(el).data("crosstalk-instance", instance);
  $(el).addClass("crosstalk-input-bound");
}

if (global.Shiny) {
  let inputBinding = new global.Shiny.InputBinding();
  let $ = global.jQuery;
  $.extend(inputBinding, {
    find: function(scope) {
      return $(scope).find(".crosstalk-input");
    },
    getId: function(el) {
      return el.id;
    },
    getValue: function(el) {

    },
    setValue: function(el, value) {

    },
    receiveMessage: function(el, data) {

    },
    subscribe: function(el, callback) {
      $(el).on("crosstalk-value-change.crosstalk", function(event) {
        callback(false);
      });
    },
    unsubscribe: function(el) {
      $(el).off(".crosstalk");
    }
  });
  global.Shiny.inputBindings.register(inputBinding, "crosstalk.inputBinding");
}
