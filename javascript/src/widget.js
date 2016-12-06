import * as util from "./util";
import { FilterHandle } from "./filter";
import { SelectionHandle } from "./selection";

/**
 * A convenience base class for implementing Crosstalk-compatible HTML widgets.
 *
 * HTML widget implementers can extend it either by calling its constructor with
 * overriding methods in an object, or, by instantiating it without any
 * arguments and simply assigning methods to the object by name.
 *
 * @example
 * // Without Crosstalk
 * factory: function(el, width, height) {
 *   return {
 *     renderValue: function(value) {
 *       // Rendering logic
 *     }
 *   };
 * }
 *
 * // With Crosstalk, style 1
 * factory: function(el, width, height) {
 *   return new crosstalk.Widget({
 *     renderValue: function(value) {
 *       // Rendering logic
 *     },
 *     applySelection: function(e) {
 *       // Highlighting logic
 *     },
 *     applyFilter: function(e) {
 *       // Filtering logic
 *     }
 *   });
 * }
 *
 * // With Crosstalk, style 2
 * factory: function(el, width, height) {
 *   var instance = new crosstalk.Widget();
 *
 *   instance.renderValue = function(value) {
 *     // Rendering logic
 *   };
 *   instance.applySelection = function(e) {
 *     // Highlighting logic
 *   };
 *   instance.applyFilter = function(e) {
 *     // Filtering logic
 *   };
 *
 *   return instance;
 * }
 */
export class Widget {
  constructor(methods) {
    util.extend(this, methods);
  }

  /**
   * Should be overridden with custom behavior that highlights data
   * corresponding to the keys in `e.value`.
   *
   * If `e.value` is falsy, then no selection is active, and all data points
   * should be displayed with the same level of prominence.
   *
   * Some implementations may want to distinguish between selections that
   * originate from a user action on "this" widget instance, versus any other
   * widget instance in the Crosstalk group. (For instance, if the user has
   * performed a brushing operation on a different widget instance, and a
   * visible brush exists on this instance, then this instance's brush should
   * be cleared.) You can determine this using `e.sender === this`, which will
   * evaluate to true if and only if the selection belongs to this instance.
   *
   * @param {SelectionHandle#change} e - The event object.
   */
  applySelection(e) {
  }

  /**
   * Should be overridden with custom behavior that filters out all data except
   * for those data points that correspond to the keys in `e.value`.
   *
   * If `e.value` is falsy, then no filter is active, and all data points should
   * be displayed.
   *
   * @param {FilterHandle#change} e - The event object.
   */
  applyFilter(e) {
  }

  /**
   * Should be overridden with custom behavior, as is usual for htmlwidget
   * instances. During the course of rendering, be sure to call
   * `this.setCrosstalkGroup(group)`.
   *
   * @param {object} value - The value to render.
   */
  renderValue(value) {
  }

  /**
   * Call from renderValue to set or modify the Crosstalk group name. This
   * will register event handlers so that `this.applySelection` and
   * `this.applyFilter` are called at the appropriate times. It will also
   * unregister existing event handlers if this instance previously belonged
   * to a different group.
   *
   * @param {string} group - The name of the Crosstalk group that should be
   *   used, or a falsy value (like `null` or undefined) if none.
   * @param {boolean} runCallbacks - If true, and the group has changed since
   *   the last time `setCrosstalkGroup` was called, then invoke
   *   `this.applySelection` and `this.applyFilter` before returning.
   */
  setCrosstalkGroup(group, runCallbacks = false) {
    // Has nothing changed? Then just return. Don't even run callbacks.
    if (this._crosstalk_group === group)
      return;
    if (!this._crosstalk_group && !group)
      return;

    this._crosstalk_group = group;

    // If existing handles exist, close them. This unregisters event handlers.
    if (this._crosstalk_selection) {
      this._crosstalk_selection.close();
      this._crosstalk_selection = null;
    }
    if (this._crosstalk_filter) {
      this._crosstalk_filter.close();
      this._crosstalk_filter = null;
    }

    if (group) {
      // Create and save new handles, listen for events.
      this._crosstalk_selection = new SelectionHandle(group, {sender: this});
      this._crosstalk_selection.on("change", e => {
        this.applySelection(e);
      });
      this._crosstalk_filter = new FilterHandle(group, {sender: this});
      this._crosstalk_filter.on("change", e => {
        this.applyFilter(e);
      });
    }

    if (runCallbacks) {
      // Immediate callbacks are desired
      this.applySelection({ value: this.selection, sender: this });
      this.applyFilter({ value: this.filteredKeys, sender: this });
    }
  }

  /**
   * The set of selected keys for the current Crosstalk group (if any group is
   * assigned). Setting this property will cause Crosstalk events to fire.
   * A falsy value means that nothing is selected.
   *
   * @type {string[]|null}
   */
  set selection(keys) {
    if (this._crosstalk_selection) {
      this._crosstalk_selection.set(keys);
    }
  }

  get selection() {
    return this._crosstalk_selection ? this._crosstalk_selection.value : null;
  }

  /**
   * Set the `filter` property to a set of keys that should be made visible; all
   * other keys will be considered filtered out. Or, set to `null` to permit all
   * data to be visible. This is a write-only property; to retrieve the final
   * array of keys that should be displayed, use the `filteredKeys` property,
   * which takes into account all active filters in the Crosstalk group.
   *
   * @type {string[]|null}
   */
  set filter(keys) {
    if (this._crosstalk_filter) {
      if (keys) {
        this._crosstalk_filter.set(keys);
      } else {
        this._crosstalk_filter.clear();
      }
    }
  }

  /**
   * Retrieves the set of keys that should be displayed (not filtered out). If
   * falsy, then no filter is active and all available data should be displayed.
   *
   * @type {string[]|null}
   */
  get filteredKeys() {
    return this._crosstalk_filter ? (this._crosstalk_filter.filteredKeys || null) : null;
  }
}
