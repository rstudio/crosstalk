import assert from "assert";
import * as filter from "./filter";
import group from "./group";

describe("Filter API", () => {
  let handle1 = filter.createHandle(group("groupA"));

  it("handles basic read/write cases", () => {
    assert.deepEqual(handle1.filteredKeys, null);

    handle1.set(["a", "b", "c"]);
    assert.deepEqual(handle1.filteredKeys, ["a", "b", "c"]);
  });

  let handle2 = filter.createHandle(group("groupA"));
  it("works with a second handle in the same group", () => {
    assert(handle1._filterSet === handle2._filterSet);
    assert.deepEqual(handle1.filteredKeys, handle2.filteredKeys);
    assert.deepEqual(handle2.filteredKeys, ["a", "b", "c"]);
  });

  it("isn't impacted by a handle in a different group", () => {
    let otherGroupHandle = filter.createHandle(group("groupB"));
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

  it("invokes change callbacks", (done) => {
    let callbackCount = 0;

    handle1.on("change", (e) => {
      assert.deepEqual(e.oldValue, ["b"]);
      assert.deepEqual(e.value, ["b", "d"]);
      if (++callbackCount === 2) {
        done();
      }
    });
    handle2.on("change", (e) => {
      assert.deepEqual(e.oldValue, ["b"]);
      assert.deepEqual(e.value, ["b", "d"]);
      if (++callbackCount === 2) {
        done();
      }
    });

    handle1.set(["a", "b", "c", "d"]);
  });
});
