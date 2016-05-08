if (global.Shiny) {
  let inputBinding = new global.Shiny.InputBinding();
  let $ = global.jQuery;
  $.extend(inputBinding, {
    find: function(scope) {
      return $(scope).find(".crosstalk-input");
    },
    getId: function(el) {

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
