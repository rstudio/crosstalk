import assert from "assert";
import { SelectionHandle } from "../src/selection";
import * as test_common from "./test-common";

describe("SelectionHandle#setGroup", () => {

  let counter = test_common.createInvokeCounter();
  let handle1 = new SelectionHandle();

  it("no-ops on non-group", () => {
    assert.equal(handle1.value, null);

    handle1.on("change", counter);
    assert.equal(counter.count, 0);

    handle1.set(["test0"]);

    // Should be ignored because no difference
    handle1.setGroup(null);
    handle1.setGroup(void 0);
    handle1.setGroup(false);

    // Should be ignored because no group is assigned
    handle1.set(["test1"]);
    handle1.clear();
    assert.equal(handle1.value, null);
    assert.equal(counter.count, 0);
  });

  it("accepts real group assignment", () => {
    handle1.setGroup("foo");
    assert.equal(handle1.value, null);

    handle1.set(["test"]);
    assert.deepEqual(handle1.value, ["test"]);
    assert.equal(counter.count, 1);
  });

  it("no-ops on spurious group assignment", () => {
    let oldsub = handle1._varOnChangeSub;
    handle1.setGroup("foo");
    assert.equal(oldsub, handle1._varOnChangeSub);
  });

  it("unsubscribes from previous group", () => {
    handle1.setGroup("bar");
    assert.equal(handle1.value, null);
    assert.equal(counter.count, 1);

    // Now that we've changed group to "bar", let's update "foo" and make sure
    // handle1 doesn't care/notice
    let handle2 = new SelectionHandle("foo");

    handle2.set(["baz"]);
    assert.equal(handle1.value, null);
    assert.equal(counter.count, 1);

    handle2.clear();
    handle2.close();
  });

  it("unsubscribes on close", () => {
    let handle3 = new SelectionHandle("bar");

    handle1.close();
    assert.equal(handle1._var, null);
    assert.equal(handle1.value, null);

    handle3.set(["qux"]);

    assert.equal(handle1.value, null);
    assert.equal(counter.count, 1);

    handle3.clear();
    handle3.close();
  });
});
