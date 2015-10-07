var crosstalk = require("./crosstalk");

var evts = new crosstalk.Events();

var count = 0;
evts.on("click", function() {
  count++;
});

evts.trigger("click");

if (count !== 1) {
  throw new Error("Unexpected click count");
}


var a = crosstalk.group("a");
a.on("selection", function(e) {
  count++;
});
a.trigger("selection", "Hello");

if (count !== 2) {
  throw new Error("Unexpected click count 2");
}
