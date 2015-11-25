# Crosstalk

Provides low-level abstractions to support coordinated visualizations, initially designed for use with htmlwidgets and/or Shiny (but potentially extensible to other frameworks--RCloud? Bokeh.js? Plotly?).

## Goals

- Allow easy, or even automatic, orchestration between htmlwidgets on the same page, without Shiny. No JavaScript should need to be written by user. The definition of "orchestration" is going to be pretty constrained though, we're not talking about arbitrary behavior here, but coordinating behaviors that are hard coded into the htmlwidgets.

- Allow easy orchestration between htmlwidgets and Shiny reactivity. Linked brushing between JavaScript widgets and ggplot2, for example.

- Widget authors will need custom code in their widget JS to work with crosstalk--this won't just magically work with existing widgets. Risk: If the JS library behind a widget doesn't have notions of selection, opacity, etc., this may be quite difficult without deep knowledge of JS and the library code in question.

- Crosstalk will provide a communication layer, but in order for the messages to be useful, the widgets all have to agree on what they mean. We'll promote an "official" vocabulary of messages, complete with guidelines for widget authors, and also allow arbitrary messages. Over time, the official list can grow.

Concrete goals:

- Linked brushing demos (this is basically just a "selected points" message).

- Ad-hoc messaging demo (i.e. Ramnath decides three of his widgets should communicate in a certain way).


## Low-level shared value API
Shared values have an identifier (name) and a value.

```javascript
// Use variables in the "default"" group
crosstalk.var("myvar1").get()
crosstalk.var("myvar1").set(value)
crosstalk.var("myvar1").on("change", function(e) {
  // Access e.value and e.oldValue properties
});
crosstalk.var("myvar1").off("change", callback);
```

### Event handling

The `off()` method can take either the callback object that was passed into `on()`, or the return value of `on()`.

Note that there is no provision for tracking changes to a collection (onItemAdded, onItemRemoved, etc.), only for wholesale setting of a variable.

The `Var.set` method normally takes just a value, but you can also add a second argument `event`, which can be an object whose properties will be copied to the event that is triggered as a result of the set. (By default, the event object only contains `value` and `oldValue` properties.) These properties won't be available via `Var.get`--they are only included in the object that's passed to the event handler callbacks. One possible use for this is for a widget to ignore events that are a result of its own `set()` calls. For example:

### Scoping with groups

You can scope variables using groups. This allows us to have distinct groups of widgets that only link within their group.

```r
var group1 = crosstalk.group("group1");
group1.var("myvar1").get()
```

All calls to `crosstalk.group(name)` with the same name argument, will return the exact same object. The same is true of `crosstalk.var(name)` and `group.var(name)`.

```r
// Example widget initialization code

// Listen for when a d3 brush changes
brush.on("brush", function(e) {
  crosstalk.var("selection").set(e.getSelectedPoints(), {
    // Attach a sender property to the event
    sender: el
  });
});

crosstalk.var("selection").on("change", function(e) {
  if (e.sender === el) {
    // We were the ones who made this change to selection.
    // We don't need to update ourselves, so just return.
    return;
  }
  updateSelection(e.value);
});
```

### Communication with Shiny via ClientValue

Shiny applications can access Crosstalk variables using an R object API: `cv <- crosstalk::ClientValue$new(name, group)`. (Hmmm, should this be `ClientVar`? Ugh, names are hard.) The `ClientValue` class has `get()` and `sendUpdate(value)` methods. Notice that it's `sendUpdate(value)`, not `set(value)`; this is intended to emphasize that the value is serialized and sent to the client to update the "master" copy in the browser first, which will then send the value back to the server.

The `ClientValue$get()` method is a reactive operation; that is, you'll get an error if it's not performed within an observer, reactive expression, output, isolate, etc. This is the same behavior as reading a normal reactive value or reactive expression.

## High-level discrete selection/brushing API [TODO]

- Selection is scoped to a Crosstalk group.
- Within a group, the selection is kept in the Crosstalk var named `selection`.
- Selections are sets of discrete rows/observations, as opposed to e.g. a range specification.

### Manipulation [TODO]
- A data point was clicked, toggle its selection
- A set of data points was selected, use it to set (P0) or add/remove to (P2) or xor (P3) selection
- Clear the selection

### Linking
- Tell me when the selection changes
  - Tell me who made the changes

