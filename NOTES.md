# Crosstalk

A testing ground for ideas about cross-widget communication that should eventually make their way into htmlwidgets and Shiny (probably).

Abstract goals:

- Allow easy, or even automatic, orchestration between htmlwidgets on the same page, without Shiny. No JavaScript should need to be written by user. The definition of "orchestration" is going to be pretty constrained though, we're not talking about arbitrary behavior here, but coordinating behaviors that are hard coded into the htmlwidgets.

- Allow easy orchestration between htmlwidgets and Shiny reactivity.

- Widget authors will need custom code in their widget JS to work with crosstalk--this won't just magically work with existing widgets.

- Crosstalk will provide a communication layer, but in order for the messages to be useful, the widgets all have to agree on what they mean.

- We'll promote an "official" vocabulary of messages, complete with guidelines for widget authors, and also allow arbitrary messages. Over time, the official list can grow.

Concrete goals:

- Linked brushing demos (this is basically just a "selected points" message).

- Ad-hoc messaging demo (i.e. Ramnath decides three of his widgets should communicate in a certain way).


## Low-level shared value API
Shared values have an identifier (name) and a value. (Should namespaces be a first-class property of a shared value, or make them convention-based like in Shiny?)

```javascript
crosstalk.var("myvar1").get()
crosstalk.var("myvar1").set(value)
crosstalk.var("myvar1").onChange(callback)

// One of these two alternatives for scoping?
crosstalk.var("scope1.myvar1").get()
crosstalk.scope("scope1").var("myvar1").get()
```

Note that there is no provision for tracking changes to a collection (onItemAdded, onItemRemoved, etc.), only for wholesale setting of a variable.

I'd kind of like to add a way for participating widgets to know whether a changed-event they receive is due to something they did, or someone else; i.e. for each event to indicate who made the change. (The notion of identity for htmlwidgets can come from the HTML element that the widget is rendering on, for example. It's less clear what to do for Shiny reactive participants--maybe nothing?)


## Target-Action binding API

Very speculative!

- A widget can advertise (via docs) what unique events it emits.
- A widget can advertise (via docs) what "actions" (methods) on it can be called.
- You can specify that certain events can be routed to certain actions.

Example:

A slider widget emits an event when its value changes.
A temporal-spatial choropleth widget has a `setYear(year)` action.
`bind(source = "slider.onValueChanged", target = "choropleth.setYear")`
  (or maybe `bind(srcObj = slider, srcEvent = "changed", destObj = choropleth, destAction = "setYear")`)
will basically result in
```javascript
slider.on("changed", function(e) {
  choropleth.setYear(e.value);
});
```
more or less. Will need to have built in support for simple transformations like the `e => e.value` in this case.

Does this actually solve any nontrivial problems?
Can we be sure that at the time that this bind() call runs, both slider and choropleth exist, and we can get references to them? Do they even have IDs or handles that we can use??


## High-level discrete selection API
Selection is scoped to a group.  
"Discrete" as opposed to a range-selection.

### Manipulation
- A data point was clicked, toggle its selection
- A set of data points was selected, use it to set (P0) or add/remove to (P2) or xor (P3) selection
- Clear the selection

### Linking
- Tell me when the selection changes
  - Tell me who made the changes

