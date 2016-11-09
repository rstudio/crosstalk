import assert from "assert";
import * as util from "./util";

describe("util.extend", () => {
  let target = {a: 1, b: 2};
  let result = util.extend(target, null, void 0,
    {a: 3, c: 4, d: 5},
    {a: 6, c: null}
  );

  it("returns the target object", () => {
    assert(target === result);
  });
  it("leaves unchanged properties alone", () => {
    assert(result.b === 2);
  });
  it("uses the correct order on name collisions", () => {
    assert(result.a === 6);
  });
  it("misc test", () => {
    assert.deepEqual(result, {
      a: 6, b: 2, c: null, d: 5
    });
  });
});

describe("util.diffSortedLists", () => {
  it("detects basic differences", () => {
    let a = ["a", "b", "c"];
    let b = ["b", "d"];

    let diff = util.diffSortedLists(a, b);
    assert.deepEqual(diff, {
      added: ["d"],
      removed: ["a", "c"]
    });
  });

  it("is case sensitive", () => {
    let a = ["Aa", "aa", "Bb"];
    a.sort();
    let b = ["aa", "bb"];

    let diff = util.diffSortedLists(a, b);
    assert.deepEqual(diff, {
      added: ["bb"],
      removed: ["Aa", "Bb"]
    });
  });

  it("works with numbers", () => {
    let diff = util.diffSortedLists([1, 2, 3, 11], [1, 3, 4]);
    assert.deepEqual(diff, {
      added: [4],
      removed: [2, 11]
    });
  });

  it("handles empty lists", () => {
    let diff = util.diffSortedLists([], [1,2,3]);
    assert.deepEqual(diff, {added: [1,2,3], removed: []});

    let diff2 = util.diffSortedLists([1,2,3], []);
    assert.deepEqual(diff2, {added: [], removed: [1,2,3]});

    let diff3 = util.diffSortedLists([1,2,3], [1,2,3]);
    assert.deepEqual(diff3, {added: [], removed: []});

    let diff4 = util.diffSortedLists([], []);
    assert.deepEqual(diff4, {added: [], removed: []});
  });

  it("checks that arguments are sorted, deduped", function() {
    assert.throws(() => {
      util.diffSortedLists(["a", "a", "b"], []);
    });
    assert.throws(() => {
      util.diffSortedLists(["b", "a"], []);
    });
    assert.throws(() => {
      util.diffSortedLists(["a", "a"], [1, 2]);
    });
    assert.throws(() => {
      util.diffSortedLists([1, 2], ["a", "a"]);
    });
  });
});
