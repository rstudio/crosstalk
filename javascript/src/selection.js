import Events from "./events";
import grp from "./group";
import * as util from "./util";

export class SelectionHandle {

  /**
   * Use this class to read and write (and listen for changes to) the selection
   * for a Crosstalk group. This is intended to be used for linked brushing.
   *
   * If two (or more) `SelectionHandle` instances in the same webpage share the
   * same group name, they will share the same state. Setting the selection using
   * one `SelectionHandle` instance will result in the `value` property instantly
   * changing across the others, and `"change"` event listeners on all instances
   * (including the one that initiated the sending) will fire.
   *
   * @param {string} [group] - The name of the Crosstalk group, or if none,
   *   null or undefined (or any other falsy value). This can be changed later
   *   via the @{link SelectionHandle#setGroup} method.
   * @param {Object} [extraInfo] - An object whose properties will be copied to
   *   the event object whenever an event is emitted.
   */
  constructor(group, extraInfo = null) {
    this._eventRelay = new Events();
    this._emitter = new util.SubscriptionTracker(this._eventRelay);

    // Name of the group we're currently tracking, if any. Can change over time.
    this._group = null;
    // The Var we're currently tracking, if any. Can change over time.
    this._var = null;
    // The event handler subscription we currently have on var.on("change").
    this._varOnChangeSub = null;

    this._extraInfo = util.extend({ sender: this }, extraInfo);

    this.setGroup(group);
  }

  /**
   * Changes the Crosstalk group membership of this SelectionHandle. The group
   * being switched away from (if any) will not have its selection value
   * modified as a result of calling `setGroup`, even if this handle was the
   * most recent handle to set the selection of the group.
   *
   * The group being switched to (if any) will also not have its selection value
   * modified as a result of calling `setGroup`. If you want to set the
   * selection value of the new group, call `set` explicitly.
   *
   * @param {string} group - The name of the Crosstalk group, or null (or
   *   undefined) to clear the group.
   */
  setGroup(group) {
    // If group is unchanged, do nothing
    if (this._group === group)
      return;
    // Treat null, undefined, and other falsy values the same
    if (!this._group && !group)
      return;

    if (this._var) {
      this._var.off("change", this._varOnChangeSub);
      this._var = null;
      this._varOnChangeSub = null;
    }

    this._group = group;

    if (group) {
      this._var = grp(group).var("selection");
      let sub = this._var.on("change", (e) => {
        this._eventRelay.trigger("change", e, this);
      });
      this._varOnChangeSub = sub;
    }
  }

  /**
   * Retrieves the current selection for the group represented by this
   * `SelectionHandle`.
   *
   * - If no selection is active, then this value will be falsy.
   * - If a selection is active, but no data points are selected, then this
   *   value will be an empty array.
   * - If a selection is active, and data points are selected, then the keys
   *   of the selected data points will be present in the array.
   */
  get value() {
    return this._var ? this._var.get() : null;
  }

  /**
   * Combines the given `extraInfo` (if any) with the handle's default
   * `_extraInfo` (if any).
   * @private
   */
  _mergeExtraInfo(extraInfo) {
    // Important incidental effect: shallow clone is returned
    return util.extend({},
      this._extraInfo ? this._extraInfo : null,
      extraInfo ? extraInfo : null);
  }

  /**
   * Overwrites the current selection for the group, and raises the `"change"`
   * event among all of the group's '`SelectionHandle` instances (including
   * this one).
   *
   * @fires SelectionHandle#change
   * @param {string[]} selectedKeys - Falsy, empty array, or array of keys (see
   *   {@link SelectionHandle#value}).
   * @param {Object} [extraInfo] - Extra properties to be included on the event
   *   object that's passed to listeners (in addition to any options that were
   *   passed into the `SelectionHandle` constructor).
   */
  set(selectedKeys, extraInfo) {
    if (this._var)
      this._var.set(selectedKeys, this._mergeExtraInfo(extraInfo));
  }

  /**
   * Overwrites the current selection for the group, and raises the `"change"`
   * event among all of the group's '`SelectionHandle` instances (including
   * this one).
   *
   * @fires SelectionHandle#change
   * @param {Object} [extraInfo] - Extra properties to be included on the event
   *   object that's passed to listeners (in addition to any that were passed
   *   into the `SelectionHandle` constructor).
   */
  clear(extraInfo) {
    if (this._var)
      this.set(void 0, this._mergeExtraInfo(extraInfo));
  }

  /**
   * Subscribes to events on this `SelectionHandle`.
   *
   * @param {string} eventType - Indicates the type of events to listen to.
   *   Currently, only `"change"` is supported.
   * @param {SelectionHandle~listener} listener - The callback function that
   *   will be invoked when the event occurs.
   * @return {string} - A token to pass to {@link SelectionHandle#off} to cancel
   *   this subscription.
   */
  on(eventType, listener) {
    return this._emitter.on(eventType, listener);
  }

  /**
   * Cancels event subscriptions created by {@link SelectionHandle#on}.
   *
   * @param {string} eventType - The type of event to unsubscribe.
   * @param {string|SelectionHandle~listener} listener - Either the callback
   *   function previously passed into {@link SelectionHandle#on}, or the
   *   string that was returned from {@link SelectionHandle#on}.
   */
  off(eventType, listener) {
    return this._emitter.off(eventType, listener);
  }

  /**
   * Shuts down the `SelectionHandle` object.
   *
   * Removes all event listeners that were added through this handle.
   */
  close() {
    this._emitter.removeAllListeners();
    this.setGroup(null);
  }

  /**
   * @callback SelectionHandle~listener
   * @param {Object} event - An object containing details of the event. For
   *   `"change"` events, this includes the properties `value` (the new
   *   value of the selection, or `undefined` if no selection is active),
   *   `oldValue` (the previous value of the selection), and `sender` (the
   *   `SelectionHandle` instance that made the change).
   */

  /**
   * @event SelectionHandle#change
   * @type {object}
   * @property {object} value - The new value of the selection, or `undefined`
   *   if no selection is active.
   * @property {object} oldValue - The previous value of the selection.
   * @property {SelectionHandle} sender - The `SelectionHandle` instance that
   *   changed the value.
   */
}
