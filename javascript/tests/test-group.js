import assert from "assert";
import group from "../src/group";

describe("group", () => {
  const name = "My interesting group name!";
  let grp = group(name);

  it("accepts different forms of names", () => {
    assert(grp);
    assert(grp === group(grp));
    assert(grp === group([name]));
  });

  it("rejects invalid name types", () => {
    function ensureInvalid(name) {
      assert.throws(() => {
        group(name);
      });
    }

    ensureInvalid(null);
    ensureInvalid(void 0);
    ensureInvalid("");
    ensureInvalid(false);
    ensureInvalid(true);
    ensureInvalid(1);
    ensureInvalid({"foo": "bar"});
    ensureInvalid({});
    ensureInvalid([]);
    ensureInvalid(["a", "b"]);
  });

  it("differentiates between different names", () => {
    assert.notEqual(grp, group("This is a different name. ∆"));
  });

  it("treats vars as singletons", () => {
    assert(grp.var("my var") === grp.var("my var"));
    assert(grp.has("my var"));
    assert(!grp.has("my var 1"));
  });

  it("rejects invalid var names", () => {
    assert.throws(() => { grp.var(1); });
    assert.throws(() => { grp.var(null); });
    assert.throws(() => { grp.var(""); });
    assert.throws(() => { grp.has(1); });
    assert.throws(() => { grp.has(null); });
    assert.throws(() => { grp.has(""); });
  });
});
