import FilterSet from "./filterset";
import grp from "./group";
import * as util from "./util";

function getFilterSet(group) {
  let fsVar = group.var("filterset");
  let result = fsVar.get();
  if (!result) {
    result = new FilterSet();
    fsVar.set(result);
  }
  return result;
}

let id = 1;
function nextId() {
  return id++;
}

export class FilterHandle {
  /**
   * Use this class to contribute to, and listen for changes to, the filter set
   * for the given group of widgets. Filter input controls should create one
   * `FilterHandle` and only call {@link FilterHandle#set}. Output widgets that
   * wish to displayed filtered data should create one `FilterHandle` and use
   * the {@link FilterHandle#filteredKeys} property and listen for change
   * events.
   *
   * If two (or more) `FilterHandle` instances in the same webpage share the
   * same group name, they will contribute to a single "filter set". Each
   * `FilterHandle` starts out with a `null` value, which means they take
   * nothing away from the set of data that should be shown. To make a
   * `FilterHandle` actually remove data from the filter set, set its value to
   * an array of keys which should be displayed. Crosstalk will aggregate the
   * various key arrays by finding their intersection; only keys that are
   * present in all non-null filter handles are considered part of the filter
   * set.
   *
   * @param {string} group - The name of the crosstalk group.
   * @param {Object} [extraInfo] - An object whose properties will be copied to
   *   the event object whenever an event is emitted.
   */
  constructor(group, extraInfo) {
    group = grp(group);
    this._filterSet = getFilterSet(group);
    this._filterVar = group.var("filter");
    this._emitter = new util.SubscriptionTracker(this._filterVar);
    this._id = "filter" + nextId();

    this._extraInfo = util.extend({ sender: this }, extraInfo);
  }

  /**
   * Combine the given `extraInfo` (if any) with the handle's default
   * `_extraInfo` (if any).
   * @private
   */
  _mergeExtraInfo(extraInfo) {
    if (!this._extraInfo)
      return extraInfo;
    else if (!extraInfo)
      return this._extraInfo;
    else
      return util.extend({}, this._extraInfo, extraInfo);
  }

  /**
   * Close the handle. This clears this handle's contribution to the filter set,
   * and unsubscribes all event listeners.
   */
  close() {
    this._emitter.removeAllListeners();
    this.clear();
  }

  /**
   * Clear this handle's contribution to the filter set.
   *
   * @param {Object} [extraInfo] - Extra properties to be included on the event
   *   object that's passed to listeners (in addition to any options that were
   *   passed into the `FilterHandle` constructor).
   */
  clear(extraInfo) {
    this._filterSet.clear(this._id);
    this._onChange(extraInfo);
  }

  /**
   * Set this handle's contribution to the filter set. This array should consist
   * of the keys of the rows that _should_ be displayed; any keys that are not
   * present in the array will be considered _filtered out_. Note that multiple
   * `FilterHandle` instances in the group may each contribute an array of keys,
   * and only those keys that appear in _all_ of the arrays make it through the
   * filter.
   *
   * @param {string[]} keys - Empty array, or array of keys. To clear the
   *   filter, don't pass an empty array; instead, use the
   *   {@link FilterHandle#clear} method.
   * @param {Object} [extraInfo] - Extra properties to be included on the event
   *   object that's passed to listeners (in addition to any options that were
   *   passed into the `FilterHandle` constructor).
   */
  set(keys, extraInfo) {
    this._filterSet.update(this._id, keys);
    this._onChange(extraInfo);
  }

  /**
   * @return {string[]|null} - Either: 1) an array of keys that made it through
   *   all of the `FilterHandle` instances, or, 2) `null`, which means no filter
   *   is being applied (all data should be displayed).
   */
  get filteredKeys() {
    return this._filterSet.value;
  }

  /**
   * Subscribe to events on this `FilterHandle`.
   *
   * @param {string} eventType - Indicates the type of events to listen to.
   *   Currently, only `"change"` is supported.
   * @param {FilterHandle~listener} listener - The callback function that
   *   will be invoked when the event occurs.
   * @return {string} - A token to pass to {@link FilterHandle#off} to cancel
   *   this subscription.
   */
  on(eventType, listener) {
    return this._emitter.on(eventType, listener);
  }

  /**
   * Cancel event subscriptions created by {@link FilterHandle#on}.
   *
   * @param {string} eventType - The type of event to unsubscribe.
   * @param {string|FilterHandle~listener} listener - Either the callback
   *   function previously passed into {@link FilterHandle#on}, or the
   *   string that was returned from {@link FilterHandle#on}.
   */
  off(eventType, listener) {
    return this._emitter.off(eventType, listener);
  }

  _onChange(extraInfo) {
    this._filterVar.set(this._filterSet.value, this._mergeExtraInfo(extraInfo));
  }

  /**
   * @callback FilterHandle~listener
   * @param {Object} event - An object containing details of the event. For
   *   `"change"` events, this includes the properties `value` (the new
   *   value of the filter set, or `null` if no filter set is active),
   *   `oldValue` (the previous value of the filter set), and `sender` (the
   *   `FilterHandle` instance that made the change).
   */

  /**
   * @event FilterHandle#change
   * @type {object}
   * @property {object} value - The new value of the filter set, or `null`
   *   if no filter set is active.
   * @property {object} oldValue - The previous value of the filter set.
   * @property {FilterHandle} sender - The `FilterHandle` instance that
   *   changed the value.
   */
}
