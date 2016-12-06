import assert from "assert";
import { SelectionHandle } from "../src/selection";
import * as test_common from "./test-common";

describe("SelectionHandle", () => {
  let handle1, handle2;

  before(() => {
    handle1 = new SelectionHandle("shtest");
    handle2 = new SelectionHandle("shtest");
  });

  it("can be created", () => {
    assert(handle1);
    assert(handle2);
  });

  it("stays synchronized", () => {
    handle1.set(["foo"]);
    assert.deepEqual(["foo"], handle2.value);

    handle2.set(["foo", "bar", "baz"]);
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
    handle2.set(["foo", "bar"]);
    assert(fired === 1);

    handle1.off("change", subscription);
  });

  // it("uses case sensitive key names", () => {
  //   handle1.set(["Aa", "aa"]);
  //   handle1.remove(["aA"]);
  //   assert.deepEqual(handle1.value, ["Aa", "aa"]);
  //   handle1.toggle(["Aa", "aA"]);
  //   assert.deepEqual(handle1.value, ["aa", "aA"]);
  // });

  it("allows event handler deregistration", () => {
    let fired = 0;
    let handler = (e) => {
      fired++;
    };

    let sub = handle1.on("change", handler);
    handle1.set(["one"]);
    assert(fired === 1);
    handle1.off("change", sub);
    handle1.set(["one", "two"]);
    assert(fired === 1);

    handle1.on("change", handler);
    handle1.set(["one", "two", "three"]);
    assert(fired === 2);
    handle1.off("change", handler);
    handle1.set(["one", "two", "three", "four"]);
    assert(fired === 2);
  });

  it("always passes along extraInfo", () => {
    let fired = 0;
    let handler = (e) => {
      fired++;
      assert(e.sender === handle1);
      assert(e.foo === "bar");
    };

    handle1.on("change", handler);

    handle1.set(["test"], {foo: "bar"});
    handle1.clear({foo: "bar"});

    assert.equal(2, fired);

    handle1.off("change", handler);
  });

  it("always passes along default extraInfo", () => {
    let handle3 = new SelectionHandle("shtest",
      // Just making stuff up here
      { interactive: true }
    );
    let handle3_event;
    let sub = handle3.on("change", (e) => {
      handle3_event = e;
    });

    handle3.set([]);
    assert.equal(handle3_event.sender, handle3);
    assert.equal(handle3_event.interactive, true);

    handle3.set(["test"], {sender: "different", normal: true});
    assert.equal(handle3_event.sender, "different");
    assert.equal(handle3_event.interactive, true);
    assert.equal(handle3_event.normal, true);

    // Make sure default extraInfo can be overrided, and also that the sender
    // can be overrided
    let handle4 = new SelectionHandle("shtest",
      // More nonsense
      {sender: "handle4", fuzzy: true}
    );
    handle4.set(["hello"], {fuzzy: false});
    assert.equal(handle3_event.sender, "handle4");
    assert.equal(handle3_event.fuzzy, false);
    assert.equal(handle3_event.interactive, void 0);

    handle3.off("change", sub);
  });

  it("removes all event listeners when closed", () => {
    let handle5 = new SelectionHandle("shtest");
    let counter = test_common.createInvokeCounter();
    handle5.on("change", counter);
    handle1.set(["one"]);
    assert.equal(counter.count, 1);

    handle5.close();
    handle1.set(["two"]);
    assert.equal(counter.count, 1);
  });
});
