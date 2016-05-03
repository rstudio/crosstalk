import assert from "assert";
import { diffSortedLists } from "./util";

describe("diffSortedLists", () => {
  it("detects basic differences", function() {
    let a = ["a", "b", "c"];
    let b = ["b", "d"];

    let diff = diffSortedLists(a, b);
    assert.deepEqual(diff, {
      added: ["d"],
      removed: ["a", "c"]
    });
  });

  it("is case sensitive", () => {
    let a = ["Aa", "aa", "Bb"];
    a.sort();
    let b = ["aa", "bb"];

    let diff = diffSortedLists(a, b);
    assert.deepEqual(diff, {
      added: ["bb"],
      removed: ["Aa", "Bb"]
    });
  });

  it("works with numbers", () => {
    let diff = diffSortedLists([1, 2, 3, 11], [1, 3, 4]);
    assert.deepEqual(diff, {
      added: [4],
      removed: [2, 11]
    });
  });

  it("handles empty lists", () => {
    let diff = diffSortedLists([], [1,2,3]);
    assert.deepEqual(diff, {added: [1,2,3], removed: []});

    let diff2 = diffSortedLists([1,2,3], []);
    assert.deepEqual(diff2, {added: [], removed: [1,2,3]});

    let diff3 = diffSortedLists([1,2,3], [1,2,3]);
    assert.deepEqual(diff3, {added: [], removed: []});

    let diff4 = diffSortedLists([], []);
    assert.deepEqual(diff4, {added: [], removed: []});
  });

  it("checks that arguments are sorted, deduped", function() {
    assert.throws(() => {
      diffSortedLists(["a", "a", "b"], []);
    });
    assert.throws(() => {
      diffSortedLists(["b", "a"], []);
    });
    assert.throws(() => {
      diffSortedLists(["a", "a"], [1, 2]);
    });
    assert.throws(() => {
      diffSortedLists([1, 2], ["a", "a"]);
    });
  });
});
