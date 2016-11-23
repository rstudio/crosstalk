import assert from "assert";
import crosstalk from "../src/index";

let foo = crosstalk.group("foo");

describe("crosstalk group API", () => {
  it("returns the same object multiple times", () => {
    assert(foo === crosstalk.group("foo"));
  });
});


let var1 = foo.var("one");

describe("crosstalk var API", () => {
  it("returns the same object multiple times", () => {
    assert(var1 === foo.var("one"));
  });
});
