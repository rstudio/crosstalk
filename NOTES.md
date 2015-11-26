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


## Low-level shared variable API
Shared variables have an identifier (name) and a value. They belong to a group (one of which is the `"default"` group).

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


## Shared variable definitions

The existence of a shared variable API doesn't add much value unless we attach some semantics to particular variables, and ask widget authors to follow those semantics.

So far we are just defining a single variable: `selection`. It can be used for linked brushing over discrete data points/observations (as opposed to over continuous ranges).

### `'selection'`: Discrete selection/brushing

The first variable we will define is `'selection'`. This variable will hold either `null` (no selection/brush is active) or an array of **keys** of the rows/observations that are currently selected.

A **key** is a string that uniquely identifies a single row/observation among the other rows/observations in the data set it's a member of. If the data set (data frame) has a column that can be used for this purpose, then that is ideal; otherwise, the row numbers (coerced to strings) can be used for this purpose.

The nice thing about using a natural key (like employee ID, zip code, country name, gene symbol, etc.) instead of a row number, is that natural keys can be used to create nice transitions as the data set changes; whereas row numbers are only sensible in the face of data set changes if the rows don't change their position in the data set.

In general, it's not possible for general purpose widgets to "know" what column (if any) should be used as the key. This information generally needs to be provided by the user of the widget. It's essential that the user use the same underlying data, and the same key, for each widget in a crosstalk group (though each widget can show different dimensions of the data).

#### Helper functions [TODO]

The `keys` argument in the following functions can be either a single key (string) or an array of keys.

- `crosstalk.select.add(group, keys)` - add the keys to the selection
- `crosstalk.select.remove(group, keys)` - remove the keys from the selection
- `crosstalk.select.toggle(group, keys)` - any keys that are selected should be unselected, and vice versa. Useful for click-point-to-(un)select types of interaction.

Setting/getting the selection, and listening for changes, is done via the `Var` interface of `group.var("selection")`. (Q: Should we facade those operations behind `crosstalk.select` functions, too?)
