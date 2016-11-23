import assert from "assert";
import { FilterHandle } from "../src/filter";
import group from "../src/group";
import * as test_common from "./test-common";

describe("Filter API", () => {
  let handle1 = new FilterHandle(group("groupA"));

  it("handles basic read/write cases", () => {
    assert.deepEqual(handle1.filteredKeys, null);

    handle1.set(["a", "b", "c"]);
    assert.deepEqual(handle1.filteredKeys, ["a", "b", "c"]);
  });

  let handle2 = new FilterHandle("groupA");
  it("works with a second handle in the same group", () => {
    assert(handle1._filterSet === handle2._filterSet);
    assert.deepEqual(handle1.filteredKeys, handle2.filteredKeys);
    assert.deepEqual(handle2.filteredKeys, ["a", "b", "c"]);
  });

  it("isn't impacted by a handle in a different group", () => {
    let otherGroupHandle = new FilterHandle(group("groupB"));
    otherGroupHandle.set([]);
    assert.deepEqual(handle1.filteredKeys, handle2.filteredKeys);
    assert.deepEqual(handle2.filteredKeys, ["a", "b", "c"]);
    otherGroupHandle.clear();
  });

  it("uses the intersection of handle filter values", () => {
    handle2.set(["b", "d"]);
    assert.deepEqual(handle1.filteredKeys, handle2.filteredKeys);
    assert.deepEqual(handle2.filteredKeys, ["b"]);
  });

  it("invokes change callbacks", () => {
    let callbackCount = 0;

    function h1change(e) {
      assert.deepEqual(e.oldValue, ["b"]);
      assert.deepEqual(e.value, ["b", "d"]);
      callbackCount++;
    }
    function h2change(e) {
      assert.deepEqual(e.oldValue, ["b"]);
      assert.deepEqual(e.value, ["b", "d"]);
      callbackCount++;
    }

    handle1.on("change", h1change);
    handle2.on("change", h2change);

    handle1.set(["a", "b", "c", "d"]);
    assert.equal(callbackCount, 2);

    handle1.off("change", h1change);
    handle2.off("change", h2change);

    handle1.set(["a", "b", "c"]);
    assert.equal(callbackCount, 2);
  });

  it("passes along extraInfo", () => {
    let handle3 = new FilterHandle("groupA", { a: 1, b: 2 });

    let callbackCount = 0;
    let sub = handle1.on("change", (e) => {
      assert.equal(e.a, 1);
      assert.equal(e.b, 2);
      callbackCount++;
    });

    handle3.set(["b"]);

    assert.equal(callbackCount, 1);
    assert.deepEqual(handle3.filteredKeys, ["b"]);

    handle1.off("change", sub);
    handle1.clear();

    let sub2 = handle2.on("change", (e) => {
      assert.equal(e.a, 1);
      assert.equal(e.b, 3);
      assert.equal(e.c, 4);
    });
    handle3.set(["b", "c", "d", "e"], { b: 3, c: 4 });
    handle3.clear({ b: 3, c: 4 });
    assert.equal(callbackCount, 1);
    assert.deepEqual(handle3.filteredKeys, ["b", "d"]);

    handle2.off("change", sub2);
  });

  it("removes all event listeners when closed", () => {
    let handle4 = new FilterHandle("groupA");
    let counter = test_common.createInvokeCounter();

    handle4.on("change", counter);

    handle1.set([]);
    assert.equal(counter.count, 1);

    handle4.close();
    handle1.set(["a", "b", "c"]);
    assert.equal(counter.count, 1);
  });
});
