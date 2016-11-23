import assert from "assert";
import { FilterHandle } from "../src/filter";
import * as test_common from "./test-common";

describe("FilterHandle#setGroup", () => {

  let counter = test_common.createInvokeCounter();
  let handle1 = new FilterHandle();

  it("no-ops on non-group", () => {
    assert.equal(handle1.filteredKeys, null);

    handle1.on("change", counter);
    assert.equal(counter.count, 0);

    // Should be ignored because no group is assigned
    handle1.set(["test"]);
    assert.equal(handle1.filteredKeys, null);
    assert.equal(counter.count, 0);
  });

  it("accepts real group assignment", () => {
    handle1.setGroup("foo");
    assert.equal(handle1.filteredKeys, null);

    handle1.set(["test"]);
    assert.deepEqual(handle1.filteredKeys, ["test"]);
    assert.equal(counter.count, 1);
  });

  it("unsubscribes from previous group", () => {
    handle1.setGroup("bar");
    assert.equal(handle1.filteredKeys, null);
    assert.equal(counter.count, 1);

    // Now that we've changed group to "bar", let's update "foo" and make sure
    // handle1 doesn't care/notice
    let handle2 = new FilterHandle("foo");

    handle2.set(["baz"]);
    assert.equal(handle1.filteredKeys, null);
    assert.equal(counter.count, 1);

    // As long as we're here, let's make the two handles intersect
    handle2.setGroup("bar");
    handle2.set(["a", "b", "c"]);

    assert.deepEqual(handle1.filteredKeys, handle2.filteredKeys);
    assert.deepEqual(handle1.filteredKeys, ["a", "b", "c"]);
    assert.equal(counter.count, 2);

    handle1.set(["b", "c", "d"]);
    assert.deepEqual(handle1.filteredKeys, handle2.filteredKeys);
    assert.deepEqual(handle1.filteredKeys, ["b", "c"]);
    assert.equal(counter.count, 3);

    handle2.close();
    assert.deepEqual(handle2.filteredKeys, null);
    assert.deepEqual(handle1.filteredKeys, ["b", "c", "d"]);
    assert.equal(counter.count, 4);
  });

  it("unsubscribes on close", () => {
    let handle3 = new FilterHandle("bar");

    handle1.close();
    assert.equal(handle1._filterVar, null);
    assert.equal(handle1._filterSet, null);
    assert.equal(handle1.filteredKeys, null);

    handle3.set(["qux"]);

    assert.equal(handle1.filteredKeys, null);
    assert.equal(counter.count, 4);

    handle3.close();
  });

});
