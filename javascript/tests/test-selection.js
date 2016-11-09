import assert from "assert";
import * as selection from "./selection";

describe("SelectionHandle", () => {
  let handle1, handle2;

  before(() => {
    handle1 = selection.createHandle("shtest");
    handle2 = selection.createHandle("shtest");
  });

  it("can be created", () => {
    assert(handle1);
    assert(handle2);
  });

  it("stays synchronized", () => {
    handle1.set(["foo"]);
    assert.deepEqual(["foo"], handle2.value);

    handle2.add(["bar", "baz"]);
    assert.deepEqual(["foo", "bar", "baz"], handle1.value);
    assert.deepEqual(handle1.value, handle2.value);
  });

  it("fires events", () => {
    handle1.set(["foo", "bar", "baz"]);

    let fired = 0;
    let subscription = handle1.on("change", (e) => {
      fired++;
      assert.deepEqual(e.oldValue, ["foo", "bar", "baz"]);
      assert.deepEqual(e.value, ["foo", "bar"]);
    });
    handle2.remove(["baz"]);
    assert(fired === 1);

    handle1.off("change", subscription);
  });

  it("uses case sensitive key names", () => {
    handle1.set(["Aa", "aa"]);
    handle1.remove(["aA"]);
    assert.deepEqual(handle1.value, ["Aa", "aa"]);
    handle1.toggle(["Aa", "aA"]);
    assert.deepEqual(handle1.value, ["aa", "aA"]);
  });

  it("allows event handler deregistration", () => {
    let fired = 0;
    let handler = (e) => {
      fired++;
    };

    let sub = handle1.on("change", handler);
    handle1.add(["one"]);
    assert(fired === 1);
    handle1.off("change", sub);
    handle1.add(["two"]);
    assert(fired === 1);

    handle1.on("change", handler);
    handle1.add(["three"]);
    assert(fired === 2);
    handle1.off("change", handler);
    handle1.add(["four"]);
    assert(fired === 2);
  });

  it("always passes along extraInfo", () => {
    let fired = 0;
    let handler = (e) => {
      fired++;
      assert(e.sender === handle1);
    };

    handle1.on("change", handler);

    handle1.set(["test"], {sender: handle1});
    handle1.add(["test2"], {sender: handle1});
    handle1.remove(["test"], {sender: handle1});
    handle1.clear({sender: handle1});

    assert.equal(4, fired);

    handle1.off("change", handler);
  });
});
