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


var a = crosstalk.var("a");
var a1 = crosstalk.var("a");
if (a !== a1) {
  throw new Error("crosstalk.var('a') didn't return consistent object");
}

a.on("change", function(e) {
  count++;
  if (e.extraInfo !== "yes") {
    throw new Error("Extra info wasn't found");
  }
});
a.set("foo", {extraInfo: "yes"});

if (count !== 2) {
  throw new Error("Unexpected click count 2");
}
if (a.get() !== "foo") {
  throw new Error("Unexpected value of a");
}

a.set("foo");
if (count !== 2) {
  throw new Error("Click count changed when no-op set was performed");
}

var success = false;
try {
  crosstalk.var(null);
  success = true;
} catch(e) {
}
if (success) {
  console.error("Didn't expect var(null) to succeed");
}
