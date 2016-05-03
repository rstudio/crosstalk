"use strict";

import assert from "assert";
import FilterSet, { diffSortedLists } from "./filterset";


describe("FilterSet", () => {
  let fs = new FilterSet();

  // Null .value means no filter is being applied.
  it("defaults to null value", () => {
    assert.equal(fs.value, null);
  });

  it("handles initial update call", () => {
    fs.update("foo", [3,5,7]);
    assert.deepEqual(fs.value, [3,5,7]);
  });

  it("handles mutation via update", () => {
    fs.update("foo", [3,5,7,9]);
    assert.deepEqual(fs.value, [3,5,7,9]);
  });

  it("uses AND relation between multiple handles", () => {
    fs.update("bar", [5,7,9,11]);
    assert.deepEqual(fs.value, [5,7,9]);

    fs.update("bar", [9,11,13]);
    assert.deepEqual(fs.value, [9]);
  });

  it("empty set is different than no set", () => {
    fs.update("bar", []);
    assert.deepEqual(fs.value, []);

    fs.clear("bar");
    assert.deepEqual(fs.value, [3,5,7,9]);
  });

  it("can totally reset", () => {
    fs.reset();
    assert.equal(fs.value, null);
  });
});
